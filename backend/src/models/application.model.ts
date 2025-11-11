import pool from '../config/database';
import { Application } from '../types';

export interface ApplicationFilters {
  status?: string;
  pasted?: boolean;
  q?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const ApplicationModel = {
  async create(data: {
    answers: Record<string, string>;
    paste_meta: Record<string, any>;
    questions_snapshot: any;
    suspicion_score: number;
  }): Promise<Application> {
    const result = await pool.query(
      `INSERT INTO applications (answers, paste_meta, questions_snapshot, suspicion_score, status)
       VALUES ($1, $2, $3, $4, 'new')
       RETURNING *`,
      [
        JSON.stringify(data.answers),
        JSON.stringify(data.paste_meta),
        JSON.stringify(data.questions_snapshot),
        data.suspicion_score,
      ]
    );
    return result.rows[0];
  },

  async getById(id: number): Promise<Application | null> {
    const result = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getAll(filters: ApplicationFilters = {}): Promise<{
    applications: Application[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      status,
      pasted,
      q,
      from,
      to,
      sort = 'created_at_desc',
      page = 1,
      pageSize = 20,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (pasted) {
      whereClause += ` AND paste_meta IS NOT NULL AND paste_meta::text != '{}'`;
    }

    if (from) {
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(from);
      paramCount++;
    }

    if (to) {
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(to);
      paramCount++;
    }

    if (q) {
      whereClause += ` AND answers::text ILIKE $${paramCount}`;
      params.push(`%${q}%`);
      paramCount++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM applications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Order by
    let orderClause = 'ORDER BY ';
    switch (sort) {
      case 'created_at_asc':
        orderClause += 'created_at ASC';
        break;
      case 'created_at_desc':
        orderClause += 'created_at DESC';
        break;
      case 'suspicion_asc':
        orderClause += 'suspicion_score ASC';
        break;
      case 'suspicion_desc':
        orderClause += 'suspicion_score DESC';
        break;
      default:
        orderClause += 'created_at DESC';
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const limitClause = `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(
      `SELECT * FROM applications ${whereClause} ${orderClause} ${limitClause}`,
      params
    );

    return {
      applications: result.rows,
      total,
      page,
      pageSize,
    };
  },

  async updateStatus(
    id: number,
    status: string,
    adminNote?: string,
    reviewedBy?: number
  ): Promise<Application> {
    const result = await pool.query(
      `UPDATE applications
       SET status = $1, admin_note = $2, reviewed_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, adminNote, reviewedBy, id]
    );
    return result.rows[0];
  },

  async getStats(): Promise<{
    total: number;
    new: number;
    review: number;
    accepted: number;
    rejected: number;
    avgSuspicionScore: number;
    pastedCount: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'review') as review,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        AVG(suspicion_score)::INTEGER as avg_suspicion_score,
        COUNT(*) FILTER (WHERE paste_meta IS NOT NULL AND paste_meta::text != '{}') as pasted_count
      FROM applications
    `);

    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      new: parseInt(row.new),
      review: parseInt(row.review),
      accepted: parseInt(row.accepted),
      rejected: parseInt(row.rejected),
      avgSuspicionScore: parseInt(row.avg_suspicion_score) || 0,
      pastedCount: parseInt(row.pasted_count),
    };
  },

  async getRecent(limit: number = 10): Promise<Application[]> {
    const result = await pool.query(
      'SELECT * FROM applications ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
};
