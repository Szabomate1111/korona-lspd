import pool from '../config/database';
import { Question } from '../types';

export const QuestionModel = {
  async getActive(): Promise<Question[]> {
    const result = await pool.query(
      `SELECT * FROM questions
       WHERE active = true
       ORDER BY order_index ASC`
    );
    return result.rows;
  },

  async getAll(): Promise<Question[]> {
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY order_index ASC, version DESC'
    );
    return result.rows;
  },

  async getById(id: number): Promise<Question | null> {
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    question_text: string;
    field_key: string;
    type: string;
    options?: string[];
    is_required: boolean;
    order_index: number;
    category_id?: number;
  }): Promise<Question> {
    // Check if field_key already exists
    const existing = await pool.query(
      'SELECT MAX(version) as max_version FROM questions WHERE field_key = $1',
      [data.field_key]
    );

    const version = existing.rows[0]?.max_version ? existing.rows[0].max_version + 1 : 1;

    const result = await pool.query(
      `INSERT INTO questions (question_text, field_key, type, options, is_required, order_index, version, active, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING *`,
      [
        data.question_text,
        data.field_key,
        data.type,
        data.options ? JSON.stringify(data.options) : null,
        data.is_required,
        data.order_index,
        version,
        data.category_id || null,
      ]
    );

    return result.rows[0];
  },

  async update(
    id: number,
    data: {
      question_text?: string;
      type?: string;
      options?: string[];
      is_required?: boolean;
      order_index?: number;
      category_id?: number;
    }
  ): Promise<Question> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('Question not found');
    }

    // Create new version
    const newVersion = current.version + 1;

    // Deactivate old version
    await pool.query('UPDATE questions SET active = false WHERE id = $1', [id]);

    // Insert new version
    const result = await pool.query(
      `INSERT INTO questions (question_text, field_key, type, options, is_required, order_index, version, active, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING *`,
      [
        data.question_text || current.question_text,
        current.field_key,
        data.type || current.type,
        data.options ? JSON.stringify(data.options) : current.options,
        data.is_required !== undefined ? data.is_required : current.is_required,
        data.order_index !== undefined ? data.order_index : current.order_index,
        newVersion,
        data.category_id !== undefined ? data.category_id : current.category_id,
      ]
    );

    return result.rows[0];
  },

  async updateOrder(orderData: Array<{ id: number; order_index: number }>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of orderData) {
        await client.query('UPDATE questions SET order_index = $1 WHERE id = $2', [
          item.order_index,
          item.id,
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async setActive(id: number, active: boolean): Promise<Question> {
    const result = await pool.query(
      'UPDATE questions SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [active, id]
    );
    return result.rows[0];
  },

  async getVersionHistory(fieldKey: string): Promise<Question[]> {
    const result = await pool.query(
      'SELECT * FROM questions WHERE field_key = $1 ORDER BY version DESC',
      [fieldKey]
    );
    return result.rows;
  },
};
