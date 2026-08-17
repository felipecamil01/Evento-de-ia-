import { Router } from 'express';
import { processBriefing } from '../controllers/briefingController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);
router.post('/process', processBriefing);

export default router;
