import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // GET - list lessons
    if (req.method === 'GET') {
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const lessons = await db.execute({
        sql: 'SELECT * FROM lessons ORDER BY order_index LIMIT ? OFFSET ?',
        args: [String(limit), String(offset)],
      });

      const totalResult = await db.execute('SELECT COUNT(*) as count FROM lessons');
      const total = totalResult.rows[0].count as number;

      res.json({
        data: lessons.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          hasMore: offset + lessons.rows.length < total,
        },
      });
      return;
    }

    // POST - create lesson (admin only)
    if (req.method === 'POST') {
      // Check admin
      const adminResult = await db.execute({
        sql: 'SELECT id FROM admin_users WHERE user_id = ?',
        args: [String(userId)],
      });

      if (adminResult.rows.length === 0) {
        res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
        return;
      }

      const { title, description, notes, difficulty, xp_reward, order_index, level } = req.body;
      let finalOrderIndex = order_index;

      // Handle empty string, null, undefined or NaN
      if (!finalOrderIndex && finalOrderIndex !== 0) {
        const maxResult = await db.execute('SELECT MAX(order_index) as max_idx FROM lessons');
        const maxIdx = (maxResult.rows[0] as any).max_idx;
        finalOrderIndex = (maxIdx !== null && maxIdx !== undefined) ? (Number(maxIdx) + 1) : 1;
      } else {
        // Explicit order index provided, shift others
        await db.execute({
          sql: 'UPDATE lessons SET order_index = order_index + 1 WHERE order_index >= ?',
          args: [Number(finalOrderIndex)]
        });
      }

      // Ensure notes is a string
      let notesStr = '';
      if (typeof notes === 'string') {
        notesStr = notes;
      } else {
        notesStr = JSON.stringify(notes || []);
      }

      const result = await db.execute({
        sql: `INSERT INTO lessons (title, description, notes, difficulty, xp_reward, order_index, level)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          String(title || 'Untitled'),
          String(description || ''),
          notesStr,
          Number(difficulty || 1),
          Number(xp_reward || 10),
          Number(finalOrderIndex),
          Number(level || 1)
        ],
      });

      const lessonId = Number(result.lastInsertRowid);

      const lesson = await db.execute({
        sql: 'SELECT * FROM lessons WHERE id = ?',
        args: [String(lessonId)],
      });

      res.status(201).json(lesson.rows[0]);
      return;
    }

    res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to process request', code: 'SERVER_ERROR' });
  }
}

export default function lessonsIndex(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}