import { Router } from 'express';
import { getLayout, createLayout, updateLayout, validateLayoutEndpoint, exportLayout } from '../controllers/layoutController';
import { authMiddleware } from '../middlewares/authMiddleware';

import { layoutOwner } from '../middlewares/layoutOwner';
import { createPreview } from '../controllers/previewController';
const router = Router();

router.use(authMiddleware);

router.get('/:eventId', layoutOwner, getLayout);
router.post('/', layoutOwner, createLayout);
router.put('/:id', layoutOwner, updateLayout);
router.post('/:id/validate', layoutOwner, validateLayoutEndpoint);
router.get('/:id/export', layoutOwner, exportLayout);

router.post('/:id/preview', layoutOwner, createPreview);
export default router;
