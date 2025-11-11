import { Router } from 'express';
import { QuestionsController } from '../controllers/questions.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/active', QuestionsController.getActive);

// Admin routes
router.get('/all', authenticate, requireAdmin, QuestionsController.getAll);
router.get('/:id', authenticate, requireAdmin, QuestionsController.getById);
router.post('/', authenticate, requireAdmin, QuestionsController.create);
router.patch('/:id', authenticate, requireAdmin, QuestionsController.update);
router.patch('/:id/activate', authenticate, requireAdmin, QuestionsController.setActive);
router.patch('/order/update', authenticate, requireAdmin, QuestionsController.updateOrder);
router.get('/history/:fieldKey', authenticate, requireAdmin, QuestionsController.getVersionHistory);

export default router;
