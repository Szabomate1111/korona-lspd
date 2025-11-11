import { Router } from 'express';
import { ApplicationsController } from '../controllers/applications.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import config from '../config';

const router = Router();

// Rate limiter for apply endpoint
const applyLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many applications from this IP, please try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/apply', applyLimiter, ApplicationsController.apply);

// Admin routes
router.get('/', authenticate, requireAdmin, ApplicationsController.getAll);
router.get('/stats', authenticate, requireAdmin, ApplicationsController.getStats);
router.get('/recent', authenticate, requireAdmin, ApplicationsController.getRecent);
router.get('/:id', authenticate, requireAdmin, ApplicationsController.getById);
router.patch('/:id/status', authenticate, requireAdmin, ApplicationsController.updateStatus);

export default router;
