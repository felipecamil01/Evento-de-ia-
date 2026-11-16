import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { processBriefingWithAI } from '../services/aiService';
import { AIProviderConfigurationError, AIProviderUnavailableError } from '../services/aiResilience';
import { layoutSchema } from '../services/inputSchemas';
const prisma=new PrismaClient();
// In-memory guard for the MVP: one generation per user and a bounded global concurrency.
// For deployments with multiple Node instances, move these limits to Redis/a shared queue.
const activeBriefingUsers = new Set<string>();
const getMaxConcurrentBriefings = () => {
  const parsed = Number.parseInt(process.env.AI_MAX_CONCURRENT_GENERATIONS || '2', 10);
  return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 10) : 2;
};
const requestSchema=layoutSchema.extend({eventId:z.string(),rawText:z.string().trim().min(10).max(14000),mode:z.enum(['new','improve']).default('new')});
export const processBriefing=async(req:any,res:Response)=>{
  const parsed=requestSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:'Revise o briefing e as dimensões do salão.'});
  const userId = String(req.user?.userId || '');
  if (!userId) return res.status(401).json({ error: 'Faça login novamente para gerar um layout.' });
  if (activeBriefingUsers.has(userId)) {
    res.setHeader('Retry-After', '10');
    return res.status(409).json({
      error: 'Você já tem uma geração em andamento. Aguarde a resposta antes de enviar outro pedido.',
      code: 'AI_GENERATION_ALREADY_RUNNING', retryable: true,
    });
  }
  if (activeBriefingUsers.size >= getMaxConcurrentBriefings()) {
    res.setHeader('Retry-After', '10');
    return res.status(429).json({
      error: 'A IA está ocupada processando outras solicitações. Aguarde alguns segundos e tente novamente.',
      code: 'AI_SERVER_BUSY', retryable: true,
    });
  }

  activeBriefingUsers.add(userId);
  try {
    const event=await prisma.event.findFirst({where:{id:parsed.data.eventId,userId}});
    if(!event) return res.status(404).json({error:'Evento não encontrado.'});
    if(event.type!=='WEDDING'||event.guestCount<30||event.guestCount>150) return res.status(400).json({error:'Este protótipo atende casamentos com 30 a 150 convidados.'});
    if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:'Configure GEMINI_API_KEY no servidor para usar a IA.'});
    const response=await processBriefingWithAI(parsed.data.rawText,{...parsed.data,guestCount:event.guestCount});
    const briefing=await prisma.briefing.create({data:{eventId:event.id,rawText:parsed.data.rawText,
      structured:response.structured as any,processingTimeMs:response.processingTimeMs,aiModel:response.modelName}});
    res.json({briefingId:briefing.id,...response});
  } catch (error: any) {
    if (error instanceof AIProviderUnavailableError) {
      console.warn('[IA] O provedor continuou indisponível após as tentativas configuradas.', {
        attemptedModels: error.attemptedModels, attempts: error.attempts,
      });
      res.setHeader('Retry-After', '15');
      return res.status(503).json({
        error: 'O Gemini está temporariamente sobrecarregado. Aguarde alguns segundos e tente gerar o layout novamente. Sua edição atual foi preservada.',
        code: error.code, retryable: true,
      });
    }
    if (error instanceof AIProviderConfigurationError) {
      console.error('[IA] Configuração do provedor recusada:', error.message);
      return res.status(502).json({
        error: 'A configuração da IA foi recusada. Confira GEMINI_API_KEY e GEMINI_TEXT_MODEL no arquivo backend/.env.',
        code: error.code, retryable: false,
      });
    }
    console.error('[IA] Falha ao processar briefing:', error);
    return res.status(502).json({
      error: 'Não foi possível gerar o layout. Confira a chave e o modelo configurados e tente novamente.',
      code: 'AI_PROVIDER_ERROR', retryable: false,
    });
  } finally {
    activeBriefingUsers.delete(userId);
  }
};
