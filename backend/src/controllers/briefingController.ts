import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { processBriefingWithAI } from '../services/aiService';
import { layoutSchema } from '../services/inputSchemas';
const prisma=new PrismaClient();
const requestSchema=layoutSchema.extend({eventId:z.string(),rawText:z.string().trim().min(10).max(14000),mode:z.enum(['new','improve']).default('new'),autoRepair:z.boolean().default(false)});
export const processBriefing=async(req:any,res:Response)=>{
  const parsed=requestSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:'Revise o briefing e as dimensões do salão.'});
  try {
    const event=await prisma.event.findFirst({where:{id:parsed.data.eventId,userId:req.user.userId}});
    if(!event) return res.status(404).json({error:'Evento não encontrado.'});
    if(event.type!=='WEDDING'||event.guestCount<30||event.guestCount>150) return res.status(400).json({error:'Este protótipo atende casamentos com 30 a 150 convidados.'});
    if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:'Configure GEMINI_API_KEY no servidor para usar a IA.'});
    const response=await processBriefingWithAI(parsed.data.rawText,{...parsed.data,guestCount:event.guestCount});
    const briefing=await prisma.briefing.create({data:{eventId:event.id,rawText:parsed.data.rawText,
      structured:response.structured as any,processingTimeMs:response.processingTimeMs,aiModel:response.modelName}});
    res.json({briefingId:briefing.id,...response});
  } catch {
    res.status(502).json({error:'A IA não retornou uma proposta válida. Seu layout foi preservado. Tente novamente.'});
  }
};
