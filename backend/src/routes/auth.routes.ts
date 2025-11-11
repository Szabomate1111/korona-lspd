import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/discord', AuthController.getAuthUrl);
router.get('/callback', AuthController.callback);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
