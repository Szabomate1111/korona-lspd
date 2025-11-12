import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller';
import { authenticate, requireLeader, requireRendszergazda } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/active', CategoriesController.getActive);

// Leader+ routes
router.get('/all', authenticate, requireLeader, CategoriesController.getAll);
router.get('/:id', authenticate, requireLeader, CategoriesController.getById);
router.post('/', authenticate, requireLeader, CategoriesController.create);
router.patch('/:id', authenticate, requireLeader, CategoriesController.update);
router.patch('/order/update', authenticate, requireLeader, CategoriesController.updateOrder);

// Rendszergazda only routes
router.delete('/:id', authenticate, requireRendszergazda, CategoriesController.delete);

export default router;
