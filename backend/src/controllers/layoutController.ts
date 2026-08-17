import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateLayout, LayoutElement } from '../services/validationService';

const prisma = new PrismaClient();

export const getLayout = async (req: Request, res: Response) => {
  try {
    const layout = await prisma.layout.findFirst({
      where: { eventId: req.params.eventId },
      include: { elements: true }
    });
    res.json(layout || {});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLayout = async (req: Request, res: Response) => {
  try {
    const { eventId, canvasW, canvasH } = req.body;
    const layout = await prisma.layout.create({
      data: {
        eventId,
        canvasW: canvasW || 1200,
        canvasH: canvasH || 700
      },
      include: { elements: true }
    });
    res.status(201).json(layout);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLayout = async (req: Request, res: Response) => {
  try {
    const { elements, canvasW, canvasH } = req.body;

    // First clear existing elements
    await prisma.layoutElement.deleteMany({
      where: { layoutId: req.params.id }
    });

    const layout = await prisma.layout.update({
      where: { id: req.params.id },
      data: {
        canvasW,
        canvasH,
        elements: {
          create: elements.map((el: any) => ({
            type: el.type,
            label: el.label,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
            rotation: el.rotation || 0,
            layer: el.layer,
            color: el.color,
            order: el.order || 0
          }))
        }
      },
      include: { elements: true }
    });
    res.json(layout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateLayoutEndpoint = async (req: Request, res: Response) => {
  try {
    const layout = await prisma.layout.findUnique({
      where: { id: req.params.id },
      include: { elements: true }
    });
    if (!layout) return res.status(404).json({ error: 'Layout not found' });

    const result = validateLayout(layout.elements as any, layout.canvasW, layout.canvasH);

    await prisma.validationLog.create({
      data: {
        layoutId: layout.id,
        issues: result.issues,
        passed: result.passed
      }
    });

    await prisma.layout.update({
      where: { id: layout.id },
      data: { isValidated: result.passed }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportLayout = async (req: Request, res: Response) => {
  try {
    const layout = await prisma.layout.findUnique({
      where: { id: req.params.id },
      include: { elements: true }
    });
    if (!layout) return res.status(404).json({ error: 'Layout not found' });
    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
