import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApplicationModel } from '../models/application.model';
import { QuestionModel } from '../models/question.model';
import { analyzePasteData } from '../utils/paste-detection';
import { ApplyRequest } from '../types';
import { z } from 'zod';

const ApplySchema = z.object({
  answers: z.record(z.string()),
  pastes: z.array(
    z.object({
      field: z.string(),
      initialHash: z.string(),
      pasteAt: z.number(),
      initialLength: z.number(),
    })
  ),
  clientMeta: z
    .object({
      ua: z.string().optional(),
      tz: z.string().optional(),
      screenWidth: z.number().optional(),
      screenHeight: z.number().optional(),
    })
    .optional(),
});

export const ApplicationsController = {
  async apply(req: AuthRequest, res: Response) {
    try {
      const data: ApplyRequest = ApplySchema.parse(req.body);

      // Get active questions for snapshot
      const activeQuestions = await QuestionModel.getActive();
      const version = activeQuestions.length > 0
        ? Math.max(...activeQuestions.map(q => q.version))
        : 1;

      const questionsSnapshot = {
        version,
        questions: activeQuestions,
      };

      // Analyze paste data
      const submissionTime = Date.now();
      const { pasteMeta, suspicionScore } = analyzePasteData(
        data.pastes,
        data.answers,
        submissionTime
      );

      // Create application
      const application = await ApplicationModel.create({
        answers: data.answers,
        paste_meta: pasteMeta,
        questions_snapshot: questionsSnapshot,
        suspicion_score: suspicionScore,
      });

      res.status(201).json({
        id: application.id,
        status: application.status,
        message: 'Application submitted successfully',
      });
    } catch (error: any) {
      console.error('Apply error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({ error: 'Failed to submit application', code: 'APPLY_ERROR' });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        pasted: req.query.pasted === 'true',
        q: req.query.q as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        sort: req.query.sort as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
      };

      const result = await ApplicationModel.getAll(filters);

      res.json(result);
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ error: 'Failed to get applications', code: 'GET_APPLICATIONS_ERROR' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const application = await ApplicationModel.getById(id);

      if (!application) {
        return res.status(404).json({
          error: 'Application not found',
          code: 'APPLICATION_NOT_FOUND',
        });
      }

      res.json({ application });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({ error: 'Failed to get application', code: 'GET_APPLICATION_ERROR' });
    }
  },

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status, note } = req.body;

      if (!['new', 'review', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          code: 'VALIDATION_ERROR',
        });
      }

      const reviewedBy = req.user?.userId;

      const application = await ApplicationModel.updateStatus(id, status, note, reviewedBy);

      res.json({ application, ok: true });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status', code: 'UPDATE_STATUS_ERROR' });
    }
  },

  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await ApplicationModel.getStats();
      res.json({ stats });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats', code: 'GET_STATS_ERROR' });
    }
  },

  async getRecent(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const applications = await ApplicationModel.getRecent(limit);

      res.json({ applications });
    } catch (error) {
      console.error('Get recent error:', error);
      res.status(500).json({ error: 'Failed to get recent applications', code: 'GET_RECENT_ERROR' });
    }
  },
};
