import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { period = 'week' } = req.query;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.toDateString());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    const startDateStr = startDate.toISOString();

    const result = await db.execute({
      sql: `SELECT
              date,
              total_practice_seconds,
              sessions_count,
              lessons_completed,
              songs_completed,
              xp_earned
            FROM daily_stats
            WHERE user_id = ? AND date >= ?
            ORDER BY date DESC`,
      args: [userId, startDateStr],
    });

    // Aggregate totals
    const totals = {
      total_practice_seconds: 0,
      sessions_count: 0,
      lessons_completed: 0,
      songs_completed: 0,
      xp_earned: 0,
    };

    for (const row of result.rows) {
      const stat = row as any;
      totals.total_practice_seconds += stat.total_practice_seconds || 0;
      totals.sessions_count += stat.sessions_count || 0;
      totals.lessons_completed += stat.lessons_completed || 0;
      totals.songs_completed += stat.songs_completed || 0;
      totals.xp_earned += stat.xp_earned || 0;
    }

    res.json({
      period,
      ...totals,
      daily: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch practice stats', code: 'SERVER_ERROR' });
  }
}

export default function getPracticeStats(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}