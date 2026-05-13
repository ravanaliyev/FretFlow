import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // Get user info
    const userResult = await db.execute({
      sql: 'SELECT xp_total, level FROM users WHERE id = ?',
      args: [userId],
    });

    // Get streak
    const streakResult = await db.execute({
      sql: 'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?',
      args: [userId],
    });

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStatsResult = await db.execute({
      sql: 'SELECT * FROM daily_stats WHERE user_id = ? AND date = ?',
      args: [userId, today],
    });

    // Get lessons completed
    const lessonsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
      args: [userId],
    });

    // Get songs completed
    const songsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
      args: [userId],
    });

    const user = userResult.rows[0] as any;
    const streak = streakResult.rows[0] as any || { current_streak: 0, longest_streak: 0 };
    const todayStats = todayStatsResult.rows[0] as any || {
      total_practice_seconds: 0,
      sessions_count: 0,
      lessons_completed: 0,
      songs_completed: 0,
      xp_earned: 0,
    };

    res.json({
      xp_total: user?.xp_total || 0,
      level: user?.level || 1,
      streak: streak.current_streak || 0,
      longest_streak: streak.longest_streak || 0,
      today: {
        practice_seconds: todayStats.total_practice_seconds || 0,
        sessions: todayStats.sessions_count || 0,
        lessons_completed: todayStats.lessons_completed || 0,
        songs_completed: todayStats.songs_completed || 0,
        xp_earned: todayStats.xp_earned || 0,
      },
      totals: {
        lessons_completed: lessonsResult.rows[0].count || 0,
        songs_completed: songsResult.rows[0].count || 0,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch summary', code: 'SERVER_ERROR' });
  }
}

export default function getSummary(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}