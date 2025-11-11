import { Router } from 'express';
import authRoutes from './auth.routes';
import questionsRoutes from './questions.routes';
import applicationsRoutes from './applications.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/users', usersRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
