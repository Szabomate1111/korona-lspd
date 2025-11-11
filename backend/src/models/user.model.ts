import pool from '../config/database';
import { User } from '../types';

export const UserModel = {
  async findByDiscordId(discordId: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE discord_id = $1',
      [discordId]
    );
    return result.rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    discord_id: string;
    username: string;
    avatar?: string;
    role: 'owner' | 'admin';
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (discord_id, username, avatar, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.discord_id, data.username, data.avatar, data.role]
    );
    return result.rows[0];
  },

  async getAll(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  },

  async updateRole(id: number, role: 'owner' | 'admin'): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, id]
    );
    return result.rows[0];
  },
};
