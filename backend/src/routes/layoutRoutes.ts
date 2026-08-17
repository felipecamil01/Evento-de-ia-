import { Router } from 'express';
import { getLayout, createLayout, updateLayout, validateLayoutEndpoint, exportLayout } from '../controllers/layoutController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/:eventId', getLayout);
router.post('/', createLayout);
router.put('/:id', updateLayout);
router.post('/:id/validate', validateLayoutEndpoint);
router.get('/:id/export', exportLayout);

export default router;
