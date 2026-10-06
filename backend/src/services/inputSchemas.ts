import { z } from 'zod';
export const elementSchema = z.object({
  id: z.string().max(100).optional(),
  type: z.enum(['mesa_redonda','mesa_retangular','palco','pista_danca','buffet','cadeira','bar','dj','decoracao','entrada','banheiro','iluminacao']),
  label: z.string().min(1).max(120), x: z.number().finite(), y: z.number().finite(),
  w: z.number().finite().positive().max(4000), h: z.number().finite().positive().max(4000),
  rotation: z.number().finite().min(-360).max(360).default(0),
  layer: z.enum(['chao','mobiliario','teto']), color: z.string().max(30).nullable().optional(),
  order: z.number().int().min(0).default(0)
});
export const layoutSchema = z.object({
  canvasW: z.number().int().min(200).max(4000), canvasH: z.number().int().min(200).max(4000),
  elements: z.array(elementSchema).max(300)
});
export const previewSchema = layoutSchema.extend({
  planImage: z.string().max(5500000).regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/),
  style: z.enum(['classico','rustico','moderno']),
  lighting: z.enum(['dia','aconchegante','noturna'])
});
