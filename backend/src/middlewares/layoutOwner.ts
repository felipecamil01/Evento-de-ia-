import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
export async function layoutOwner(req:any,res:Response,next:NextFunction) {
  try {
    const userId=req.user.userId;
    const ok=req.params.id
      ? await prisma.layout.findFirst({where:{id:req.params.id,event:{userId}}})
      : await prisma.event.findFirst({where:{id:req.params.eventId || req.body.eventId || '',userId}});
    if(!ok) return res.status(404).json({error:'Evento ou layout não encontrado.'});
    next();
  } catch {res.status(500).json({error:'Não foi possível verificar o acesso.'});}
}
