import { Response } from 'express';
import { previewSchema } from '../services/inputSchemas';
import { validateLayout } from '../services/validationService';
import { generatePreview } from '../services/previewService';
const requests=new Map<string,number>();
export const createPreview=async(req:any,res:Response)=>{
  const parsed=previewSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:'A planta enviada é inválida.'});
  const check=validateLayout(parsed.data.elements,parsed.data.canvasW,parsed.data.canvasH);
  if(!check.passed) return res.status(422).json({error:'Corrija a planta antes de gerar a prévia.',issues:check.issues});
  if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:'Configure GEMINI_API_KEY no servidor para gerar imagens.'});
  const now=Date.now();
  for(const [key,time] of requests) if(now-time>120000) requests.delete(key);
  if(requests.has(req.user.userId)) return res.status(429).json({error:'Aguarde dois minutos entre gerações de imagem.'});
  requests.set(req.user.userId,now);
  try {res.json(await generatePreview(parsed.data));}
  catch {res.status(502).json({error:'Não foi possível gerar a imagem. Verifique o modelo, a cota e o acesso à API e tente novamente.'});}
};
