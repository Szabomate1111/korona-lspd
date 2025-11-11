import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, requireOwner } from '../middleware/auth';

const router = Router();

// Owner-only routes
router.get('/', authenticate, requireOwner, UsersController.getAll);
router.post('/', authenticate, requireOwner, UsersController.create);
router.delete('/:id', authenticate, requireOwner, UsersController.delete);
router.patch('/:id/role', authenticate, requireOwner, UsersController.updateRole);

export default router;
