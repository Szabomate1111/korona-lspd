import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QuestionModel } from '../models/question.model';
import { z } from 'zod';

const CreateQuestionSchema = z.object({
  question_text: z.string().min(1),
  field_key: z.string().min(1),
  type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox']),
  options: z.array(z.string()).optional(),
  is_required: z.boolean(),
  order_index: z.number().int(),
  category_id: z.number().int().optional(),
});

const UpdateQuestionSchema = z.object({
  question_text: z.string().min(1).optional(),
  type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox']).optional(),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
  order_index: z.number().int().optional(),
  category_id: z.number().int().optional(),
});

export const QuestionsController = {
  async getActive(req: AuthRequest, res: Response) {
    try {
      const questions = await QuestionModel.getActive();

      // Get the current version (highest version among active questions)
      const version = questions.length > 0
        ? Math.max(...questions.map(q => q.version))
        : 1;

      res.json({
        version,
        questions,
      });
    } catch (error) {
      console.error('Get active questions error:', error);
      res.status(500).json({ error: 'Failed to get questions', code: 'GET_QUESTIONS_ERROR' });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const questions = await QuestionModel.getAll();
      res.json({ questions });
    } catch (error) {
      console.error('Get all questions error:', error);
      res.status(500).json({ error: 'Failed to get questions', code: 'GET_QUESTIONS_ERROR' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const question = await QuestionModel.getById(id);

      if (!question) {
        return res.status(404).json({ error: 'Question not found', code: 'QUESTION_NOT_FOUND' });
      }

      res.json({ question });
    } catch (error) {
      console.error('Get question error:', error);
      res.status(500).json({ error: 'Failed to get question', code: 'GET_QUESTION_ERROR' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = CreateQuestionSchema.parse(req.body);
      const question = await QuestionModel.create(data);

      res.status(201).json({ question });
    } catch (error: any) {
      console.error('Create question error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to create question', code: 'CREATE_QUESTION_ERROR' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = UpdateQuestionSchema.parse(req.body);

      const question = await QuestionModel.update(id, data);

      res.json({ question });
    } catch (error: any) {
      console.error('Update question error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      if (error.message === 'Question not found') {
        return res.status(404).json({ error: 'Question not found', code: 'QUESTION_NOT_FOUND' });
      }

      res.status(500).json({ error: 'Failed to update question', code: 'UPDATE_QUESTION_ERROR' });
    }
  },

  async updateOrder(req: AuthRequest, res: Response) {
    try {
      const { order } = req.body;

      if (!Array.isArray(order)) {
        return res.status(400).json({
          error: 'Order must be an array',
          code: 'VALIDATION_ERROR',
        });
      }

      await QuestionModel.updateOrder(order);

      res.json({ ok: true, message: 'Order updated successfully' });
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ error: 'Failed to update order', code: 'UPDATE_ORDER_ERROR' });
    }
  },

  async setActive(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({
          error: 'Active must be a boolean',
          code: 'VALIDATION_ERROR',
        });
      }

      const question = await QuestionModel.setActive(id, active);

      res.json({ question });
    } catch (error) {
      console.error('Set active error:', error);
      res.status(500).json({ error: 'Failed to update question', code: 'UPDATE_QUESTION_ERROR' });
    }
  },

  async getVersionHistory(req: AuthRequest, res: Response) {
    try {
      const { fieldKey } = req.params;
      const versions = await QuestionModel.getVersionHistory(fieldKey);

      res.json({ versions });
    } catch (error) {
      console.error('Get version history error:', error);
      res.status(500).json({
        error: 'Failed to get version history',
        code: 'GET_VERSION_HISTORY_ERROR',
      });
    }
  },
};
