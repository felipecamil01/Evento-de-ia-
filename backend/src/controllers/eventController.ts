import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEvents = async (req: any, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEvent = async (req: any, res: Response) => {
  try {
    const { name, type, description, guestCount, date } = req.body;
    if(typeof name !== 'string' || !name.trim() || name.length>120 || type!=='WEDDING' || !Number.isInteger(guestCount) || guestCount<30 || guestCount>150) return res.status(400).json({error:'Informe nome e casamento com 30 a 150 convidados.'});
    const event = await prisma.event.create({
      data: {
        name,
        type,
        description,
        guestCount,
        date: date ? new Date(date) : null,
        userId: req.user.userId
      }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventById = async (req: any, res: Response) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEvent = async (req: any, res: Response) => {
  try {
    const { name, type, description, guestCount, date, status } = req.body;
    const event = await prisma.event.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { name, type, description, guestCount, date: date ? new Date(date) : null, status }
    });
    if (event.count === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEvent = async (req: any, res: Response) => {
  try {
    const event = await prisma.event.deleteMany({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (event.count === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
