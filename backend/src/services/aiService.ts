import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { elementSchema, layoutSchema } from './inputSchemas';
import { validateLayout } from './validationService';
import { getTextModelCandidates, withModelFallback } from './aiResilience';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const extraction = z.object({
  briefing_estruturado: z.union([
    z.string(),
    z.record(z.unknown()),
  ]).transform(value => typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? '{}').pipe(z.string().max(4000)),
  num_convidados: z.number().int().min(10).max(500),
  requisitos: z.array(z.string()).max(40),
  pendencias: z.array(z.string()).max(20),
});

const spatial = z.object({
  layout_sugerido: z.string(),
  restricoes_csp: z.array(z.string()),
  elementos: z.array(elementSchema).min(1).max(300),
});

export async function processBriefingWithAI(
  rawText: string,
  context: z.infer<typeof layoutSchema> & { guestCount: number; mode: string },
) {
  const start = Date.now();
  const modelCandidates = getTextModelCandidates();
  const stages: { role: string; durationMs: number; usage: unknown; model: string; attempts: number }[] = [];

  async function run(role: string, instruction: string, data: unknown) {
    console.log(`[IA] Iniciando etapa: ${role}. Modelo principal: ${modelCandidates[0]}`);
    const t = Date.now();
    const generated = await withModelFallback(async (modelName) => {
      const model = ai.getGenerativeModel({
        model: modelName,
        systemInstruction: instruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      });
      return model.generateContent(JSON.stringify(data));
    }, {
      models: modelCandidates,
      maxRetries: Number.parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10),
      baseDelayMs: 1000,
      onRetry: notice => {
        if (notice.nextModel) {
          console.warn(`[IA] Modelo ${notice.model} indisponível (${notice.status ?? 'rede'}); tentando fallback ${notice.nextModel}.`);
        } else {
          console.warn(`[IA] Falha transitória no ${notice.model} (${notice.status ?? 'rede'}); nova tentativa em ${notice.delayMs}ms (${notice.attempt}).`);
        }
      },
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(generated.value.response.text());
    } catch {
      throw new Error(`A etapa ${role} retornou conteúdo que não é JSON válido.`);
    }

    stages.push({
      role,
      durationMs: Date.now() - t,
      usage: generated.value.response.usageMetadata || null,
      model: generated.model,
      attempts: generated.attempts,
    });
    console.log(`[IA] Etapa ${role} concluída em ${Date.now() - t}ms usando ${generated.model} (${generated.attempts} tentativa(s)).`);
    return parsed;
  }

  const instrucaoBriefing = 'Você é um especialista em eventos. Extraia os dados do briefing do usuário e retorne ESTRITAMENTE um JSON válido com briefing_estruturado, num_convidados, requisitos e pendencias. briefing_estruturado deve ser uma string simples em português, nunca um objeto. Exemplo: {"briefing_estruturado":"Casamento para 80 convidados com buffet lateral.","num_convidados":80,"requisitos":["buffet lateral"],"pendencias":[]}';
  const instrucaoLayout = buildLayoutInstruction(context);

  const briefRaw = await run('briefing', instrucaoBriefing, { texto: rawText, contextoSalao: context });
  const brief = parseBriefingExtraction(briefRaw);

  const proposalRaw = await run('layout', instrucaoLayout, buildLayoutRequestData(rawText, brief.briefing_estruturado, context));
  const proposal = spatial.parse(proposalRaw);

  const validation = validateLayout(proposal.elementos, context.canvasW, context.canvasH);
  const usedModels = [...new Set(stages.map(stage => stage.model))];
  return {
    structured: {
      ...brief,
      ...proposal,
      tipo_evento: 'wedding',
      elementos: proposal.elementos.map((element: z.infer<typeof elementSchema>) => ({ ...element, tipo: element.type })),
      validation,
      stages,
      promptVersion: 'real-ai-v2-resilient',
    },
    processingTimeMs: Date.now() - start,
    modelName: usedModels.join(', '),
  };
}

export function parseBriefingExtraction(value: unknown) {
  return extraction.parse(value);
}

export function buildLayoutInstruction(context: { canvasW: number; canvasH: number; mode: string }) {
  const improvement = context.mode === 'improve'
    ? ' MODO MELHORAR: use elementos_atuais como base obrigatória; preserve todos os elementos existentes e seus IDs, mantendo tipo, quantidade e função. Ajuste posições, rotações ou dimensões conforme o pedido do usuário e acrescente elementos somente se forem pedidos. Não recrie o layout do zero nem remova itens existentes.'
    : '';
  return `Você é um sistema de planejamento espacial. Crie um layout 2D para o salão de ${context.canvasW}x${context.canvasH}. Responda ESTRITAMENTE com um objeto JSON contendo layout_sugerido (string), restricoes_csp (array de strings) e elementos (array). Cada item de elementos deve conter type (um de mesa_redonda, mesa_retangular, palco, pista_danca, buffet, cadeira, bar, dj, decoracao, entrada, banheiro, iluminacao), label (string), x, y, w, h (números), layer (um de chao, mobiliario, teto) e rotation (número); em modo melhorar, também preserve o id original. Use coordenadas dentro do salão, dimensões positivas e não sobreponha mobiliário. Inclua uma entrada desobstruída. Não use nomes alternativos para os campos nem coloque explicações fora do JSON. Exemplo de item: {"type":"mesa_redonda","label":"Mesa 1","x":100,"y":100,"w":80,"h":80,"layer":"mobiliario","rotation":0}. Baseie o layout no pedido do usuário e retorne todos os campos mesmo que algum valor deva ser estimado.${improvement}`;
}

export function buildLayoutRequestData(
  rawText: string,
  briefing: string,
  context: { mode: string; elements: z.infer<typeof elementSchema>[] },
) {
  return {
    texto_usuario: rawText,
    briefing_estruturado: briefing,
    ...(context.mode === 'improve'
      ? { elementos_atuais: context.elements.map(element => ({ ...element })) }
      : {}),
  };
}
