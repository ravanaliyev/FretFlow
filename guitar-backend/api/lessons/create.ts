import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

export async function createLesson(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, notes, difficulty, xp_reward, order_index } = req.body;

    if (!title || !description || !notes) {
      res.status(400).json({
        error: 'Missing required fields: title, description, notes',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const result = await db.execute({
      sql: `INSERT INTO lessons (title, description, notes, difficulty, xp_reward, order_index)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [title, description, notes, difficulty || 1, xp_reward || 10, order_index || 0],
    });

    const lessonId = Number(result.lastInsertRowid);

    const lesson = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [String(lessonId)],
    });

    res.status(201).json(lesson.rows[0]);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson', code: 'SERVER_ERROR' });
  }
}