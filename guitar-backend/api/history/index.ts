import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

interface HistoryRow {
  id: number;
  lesson_id: number;
  lesson_title: string;
  date: string;
  duration_seconds: number;
}

async function handler(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;

  if (req.method === 'GET') {
    try {
      const result = await db.execute({
        sql: `SELECT id, lesson_id, lesson_title, date, duration_seconds
              FROM practice_history
              WHERE user_id = ?
              ORDER BY date DESC
              LIMIT 100`,
        args: [userId],
      });

      res.json({ data: result.rows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history', code: 'SERVER_ERROR' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { lesson_id, lesson_title, date, duration_seconds } = req.body;

      if (!lesson_id || !lesson_title || !date) {
        res.status(400).json({ error: 'Missing required fields', code: 'INVALID_INPUT' });
        return;
      }

      const result = await db.execute({
        sql: `INSERT INTO practice_history (user_id, lesson_id, lesson_title, date, duration_seconds)
              VALUES (?, ?, ?, ?, ?)`,
        args: [userId, lesson_id, lesson_title, date, duration_seconds || 0],
      });

      res.json({ success: true, id: Number(result.lastInsertRowid) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save history', code: 'SERVER_ERROR' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
}

export default function history(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}
