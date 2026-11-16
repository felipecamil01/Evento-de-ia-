import { Response } from 'express';
import { previewSchema } from '../services/inputSchemas';
import { validateLayout } from '../services/validationService';
import { generatePreview, PreviewProviderError } from '../services/previewService';
const requests=new Map<string,number>();
const activeRequests=new Set<string>();
export const createPreview=async(req:any,res:Response)=>{
  const parsed=previewSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:'A planta enviada é inválida.'});
  const check=validateLayout(parsed.data.elements,parsed.data.canvasW,parsed.data.canvasH);
  if(!check.passed) return res.status(422).json({error:'Corrija a planta antes de gerar a prévia.',issues:check.issues});
  if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:'Configure GEMINI_API_KEY no servidor para gerar imagens.'});
  const now=Date.now();
  for(const [key,time] of requests) if(now-time>120000) requests.delete(key);
  if(requests.has(req.user.userId)) return res.status(429).json({error:'Aguarde dois minutos entre gerações de imagem.'});
  if(activeRequests.has(req.user.userId)) return res.status(409).json({error:'Já existe uma geração de imagem em andamento para este usuário.'});
  activeRequests.add(req.user.userId);
  try {
    const result=await generatePreview(parsed.data);
    requests.set(req.user.userId,Date.now());
    res.json(result);
  } catch(error) {
    if(error instanceof PreviewProviderError) {
      console.error('[IA] Falha ao gerar prévia:',{status:error.status,providerStatus:error.providerStatus,message:error.message});
      if(error.status===429 || error.providerStatus==='RESOURCE_EXHAUSTED') {
        const freeTierLimit=/(?:free.?tier|limit:\s*0|quota exceeded)/i.test(error.message);
        return res.status(429).json({
          code:'AI_IMAGE_QUOTA_EXCEEDED',
          error:freeTierLimit
            ? 'O Gemini não liberou cota de imagens para este projeto no plano Free (limite atual: 0). Ative o faturamento ou um plano com cota de imagens no projeto associado à chave e confira GEMINI_IMAGE_MODEL no backend/.env.'
            : 'A cota do Gemini para imagens foi atingida. Aguarde a renovação da cota ou habilite um plano com mais capacidade.',
        });
      }
      if(error.status===400 || error.status===403 || error.status===404) {
        return res.status(502).json({
          code:'AI_IMAGE_CONFIGURATION_ERROR',
          error:'O Gemini recusou o modelo ou a configuração de imagens. Confira se GEMINI_IMAGE_MODEL existe e se o projeto da chave tem acesso à Gemini API.',
        });
      }
      return res.status(502).json({
        code:'AI_IMAGE_PROVIDER_ERROR',
        error:'O serviço de imagens do Gemini está temporariamente indisponível. Tente novamente mais tarde.',
      });
    }
    console.error('[IA] Falha ao processar prévia de imagem:',error);
    return res.status(502).json({code:'AI_IMAGE_PROVIDER_ERROR',error:'Não foi possível gerar a imagem. Confira a conexão com a Gemini API e tente novamente.'});
  } finally {
    activeRequests.delete(req.user.userId);
  }
};
