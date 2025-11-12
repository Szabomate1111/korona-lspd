import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthPayload } from '../types';

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided', code: 'NO_TOKEN' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
};

export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (req.user.role !== 'owner' && req.user.role !== 'rendszergazda') {
    return res.status(403).json({ error: 'Owner access required', code: 'FORBIDDEN' });
  }

  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const allowedRoles = ['owner', 'admin', 'rendszergazda', 'leader', 'al-leader'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
  }

  next();
};

// Leader+ roles (can manage categories and questions)
export const requireLeader = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const allowedRoles = ['rendszergazda', 'leader', 'owner'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Leader access required', code: 'FORBIDDEN' });
  }

  next();
};

// Rendszergazda only
export const requireRendszergazda = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (req.user.role !== 'rendszergazda' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'System admin access required', code: 'FORBIDDEN' });
  }

  next();
};
