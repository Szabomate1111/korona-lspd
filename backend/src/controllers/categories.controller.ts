import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CategoryModel } from '../models/category.model';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order_index: z.number().int(),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order_index: z.number().int().optional(),
  active: z.boolean().optional(),
});

const UpdateOrderSchema = z.object({
  order: z.array(
    z.object({
      id: z.number().int(),
      order_index: z.number().int(),
    })
  ),
});

export const CategoriesController = {
  // Get all categories (admin only)
  async getAll(req: AuthRequest, res: Response) {
    try {
      const categories = await CategoryModel.getAll();
      res.json({ categories });
    } catch (error) {
      console.error('Get all categories error:', error);
      res.status(500).json({ error: 'Failed to get categories', code: 'GET_CATEGORIES_ERROR' });
    }
  },

  // Get active categories (public)
  async getActive(req: AuthRequest, res: Response) {
    try {
      const categories = await CategoryModel.getActive();
      res.json({ categories });
    } catch (error) {
      console.error('Get active categories error:', error);
      res.status(500).json({ error: 'Failed to get categories', code: 'GET_CATEGORIES_ERROR' });
    }
  },

  // Get category by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const category = await CategoryModel.getById(id);

      if (!category) {
        return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
      }

      res.json({ category });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Failed to get category', code: 'GET_CATEGORY_ERROR' });
    }
  },

  // Create new category (Leader+ only)
  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateCategorySchema.parse(req.body);
      const category = await CategoryModel.create(data);

      res.status(201).json({ category });
    } catch (error: any) {
      console.error('Create category error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to create category', code: 'CREATE_CATEGORY_ERROR' });
    }
  },

  // Update category (Leader+ only)
  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = UpdateCategorySchema.parse(req.body);

      const category = await CategoryModel.update(id, data);

      res.json({ category });
    } catch (error: any) {
      console.error('Update category error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to update category', code: 'UPDATE_CATEGORY_ERROR' });
    }
  },

  // Update category order (Leader+ only)
  async updateOrder(req: AuthRequest, res: Response) {
    try {
      const { order } = UpdateOrderSchema.parse(req.body);

      await CategoryModel.updateOrder(order);

      res.json({ ok: true, message: 'Order updated successfully' });
    } catch (error: any) {
      console.error('Update category order error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to update order', code: 'UPDATE_ORDER_ERROR' });
    }
  },

  // Delete category (Rendszergazda only)
  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // Check if category exists
      const category = await CategoryModel.getById(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
      }

      await CategoryModel.delete(id);

      res.json({ ok: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Failed to delete category', code: 'DELETE_CATEGORY_ERROR' });
    }
  },
};
