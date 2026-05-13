import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;

  if (req.method === 'POST') {
    try {
      const { duration_seconds, lesson_id, notes_played, started_at } = req.body;

      if (!duration_seconds) {
        res.status(400).json({ error: 'Missing duration_seconds', code: 'INVALID_INPUT' });
        return;
      }

      const sessionResult = await db.execute({
        sql: `INSERT INTO practice_sessions (user_id, started_at, ended_at, duration_seconds, notes_played, lesson_id)
              VALUES (?, ?, datetime('now'), ?, ?, ?)`,
        args: [userId, started_at || new Date().toISOString(), duration_seconds, JSON.stringify(notes_played || []), lesson_id || null],
      });

      const sessionId = Number(sessionResult.lastInsertRowid);

      // Update daily_stats for today
      const today = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: `INSERT INTO daily_stats (user_id, date, total_practice_seconds, sessions_count)
              VALUES (?, ?, ?, 1)
              ON CONFLICT(user_id, date) DO UPDATE SET
                total_practice_seconds = total_practice_seconds + excluded.total_practice_seconds,
                sessions_count = sessions_count + 1`,
        args: [userId, today, duration_seconds],
      });

      // Update streak
      await updateStreak(userId, today);

      res.json({ success: true, id: sessionId });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to record practice session', code: 'SERVER_ERROR' });
    }
    return;
  }

  if (req.method === 'GET') {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const result = await db.execute({
        sql: `SELECT * FROM practice_sessions
              WHERE user_id = ?
              ORDER BY started_at DESC
              LIMIT ? OFFSET ?`,
        args: [userId, Number(limit), Number(offset)],
      });

      res.json({ data: result.rows });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch practice sessions', code: 'SERVER_ERROR' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
}

async function updateStreak(userId: number, today: string): Promise<void> {
  // Get current streak info
  const streakResult = await db.execute({
    sql: 'SELECT current_streak, longest_streak, last_practice_date FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  if (streakResult.rows.length === 0) {
    // Create streak entry if doesn't exist
    await db.execute({
      sql: 'INSERT INTO streaks (user_id, current_streak, longest_streak, last_practice_date) VALUES (?, 1, 1, ?)',
      args: [userId, today],
    });
    return;
  }

  const streak = streakResult.rows[0] as any;
  const lastDate = streak.last_practice_date;

  if (lastDate === today) {
    // Already practiced today
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastDate === yesterdayStr) {
    // Continue streak
    newStreak = streak.current_streak + 1;
  }

  const newLongest = Math.max(newStreak, streak.longest_streak);

  await db.execute({
    sql: 'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_practice_date = ? WHERE user_id = ?',
    args: [newStreak, newLongest, today, userId],
  });
}

export default function practiceSessions(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}
