import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';
import { getLevelName } from '../../src/utils/xpCalculator.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // Get user info
    const userResult = await db.execute({
      sql: 'SELECT id, username, email, avatar_url, xp_total, level, best_score FROM users WHERE id = ?',
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    const user = userResult.rows[0] as any;

    // Get streak info
    const streakResult = await db.execute({
      sql: 'SELECT current_streak, longest_streak, last_practice_date FROM streaks WHERE user_id = ?',
      args: [userId],
    });

    const streak = streakResult.rows.length > 0 ? streakResult.rows[0] as unknown as { current_streak: number; longest_streak: number; last_practice_date: string | null } : { current_streak: 0, longest_streak: 0, last_practice_date: null };

    // Get lesson progress count
    const lessonProgressResult = await db.execute({
      sql: 'SELECT COUNT(*) as completed FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
      args: [userId],
    });

    // Get song scores count
    const songScoresResult = await db.execute({
      sql: 'SELECT COUNT(*) as completed FROM song_scores WHERE user_id = ?',
      args: [userId],
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      xp_total: user.xp_total,
      level: user.level,
      level_name: getLevelName(user.level),
      best_score: user.best_score || 0,
      streak: {
        current: streak.current_streak,
        longest: streak.longest_streak,
        last_practice: streak.last_practice_date,
      },
      lessons_completed: lessonProgressResult.rows[0].completed,
      songs_completed: songScoresResult.rows[0].completed,
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch profile', code: 'SERVER_ERROR' });
  }
}

export default function getProfile(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}