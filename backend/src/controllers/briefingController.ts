import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { processBriefingWithAI } from '../services/aiService';

const prisma = new PrismaClient();

export const processBriefing = async (req: Request, res: Response) => {
  try {
    const { eventId, rawText } = req.body;

    let aiResponse;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSy-COLE_SUA_CHAVE_AQUI') {
      aiResponse = await processBriefingWithAI(rawText);
    } else {
      aiResponse = {
        structured: {
          briefing_estruturado: "Configure o GEMINI_API_KEY no .env para usar a IA real.",
          tipo_evento: "wedding",
          num_convidados: 120,
          elementos: [
            { tipo: "mesa_redonda",  quantidade: 14, prioridade: "alta",  obs: "8 pax por mesa" },
            { tipo: "pista_danca",   quantidade: 1,  prioridade: "alta",  obs: "central" },
            { tipo: "palco",         quantidade: 1,  prioridade: "alta",  obs: "banda ao vivo" },
            { tipo: "buffet",        quantidade: 2,  prioridade: "media", obs: "lateral" },
            { tipo: "bar",           quantidade: 1,  prioridade: "media", obs: "lateral direito" },
            { tipo: "iluminacao",    quantidade: 4,  prioridade: "baixa", obs: "cantos" },
            { tipo: "decoracao",     quantidade: 6,  prioridade: "baixa", obs: "borda superior" }
          ],
          layout_sugerido: "Palco ao fundo, pista central, mesas em círculo ao redor.",
          restricoes_csp: ["Buffet afastado da entrada", "Pista sem sobreposição com mesas"]
        },
        processingTimeMs: 0
      };
    }

    const briefing = await prisma.briefing.create({
      data: { rawText, structured: aiResponse.structured, processingTimeMs: aiResponse.processingTimeMs, eventId }
    });

    res.json({ briefingId: briefing.id, structured: aiResponse.structured, processingTimeMs: aiResponse.processingTimeMs });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};