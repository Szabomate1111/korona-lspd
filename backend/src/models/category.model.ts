import pool from '../config/database';
import { Category } from '../types';

export const CategoryModel = {
  async getAll(): Promise<Category[]> {
    const result = await pool.query('SELECT * FROM categories ORDER BY order_index ASC');
    return result.rows;
  },

  async getActive(): Promise<Category[]> {
    const result = await pool.query(
      'SELECT * FROM categories WHERE active = true ORDER BY order_index ASC'
    );
    return result.rows;
  },

  async getById(id: number): Promise<Category | null> {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    name: string;
    description?: string;
    order_index: number;
  }): Promise<Category> {
    const result = await pool.query(
      `INSERT INTO categories (name, description, order_index, active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [data.name, data.description, data.order_index]
    );
    return result.rows[0];
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      order_index?: number;
      active?: boolean;
    }
  ): Promise<Category> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.order_index !== undefined) {
      updates.push(`order_index = $${paramCount++}`);
      values.push(data.order_index);
    }

    if (data.active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(data.active);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async updateOrder(orderData: Array<{ id: number; order_index: number }>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of orderData) {
        await client.query('UPDATE categories SET order_index = $1 WHERE id = $2', [
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

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  },
};
