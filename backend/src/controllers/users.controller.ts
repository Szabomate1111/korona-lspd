import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/user.model';
import { z } from 'zod';

const CreateUserSchema = z.object({
  discord_id: z.string().min(1),
  username: z.string().min(1),
  avatar: z.string().optional(),
  role: z.enum(['owner', 'admin']),
});

export const UsersController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const users = await UserModel.getAll();
      res.json({ users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users', code: 'GET_USERS_ERROR' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateUserSchema.parse(req.body);

      // Check if user already exists
      const existing = await UserModel.findByDiscordId(data.discord_id);
      if (existing) {
        return res.status(409).json({
          error: 'User with this Discord ID already exists',
          code: 'USER_EXISTS',
        });
      }

      const user = await UserModel.create(data);

      res.status(201).json({ user });
    } catch (error: any) {
      console.error('Create user error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to create user', code: 'CREATE_USER_ERROR' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      // Don't allow deleting yourself
      if (id === req.user?.userId) {
        return res.status(403).json({
          error: 'Cannot delete yourself',
          code: 'FORBIDDEN',
        });
      }

      await UserModel.delete(id);

      res.json({ ok: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user', code: 'DELETE_USER_ERROR' });
    }
  },

  async updateRole(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;

      if (!['owner', 'admin'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          code: 'VALIDATION_ERROR',
        });
      }

      // Don't allow changing your own role
      if (id === req.user?.userId) {
        return res.status(403).json({
          error: 'Cannot change your own role',
          code: 'FORBIDDEN',
        });
      }

      const user = await UserModel.updateRole(id, role);

      res.json({ user });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role', code: 'UPDATE_ROLE_ERROR' });
    }
  },
};
