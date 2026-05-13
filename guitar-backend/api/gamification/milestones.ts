import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // Get user stats
    const userResult = await db.execute({
      sql: 'SELECT xp_total, level FROM users WHERE id = ?',
      args: [userId],
    });

    const streakResult = await db.execute({
      sql: 'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?',
      args: [userId],
    });

    const songCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
      args: [userId],
    });

    const lessonCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
      args: [userId],
    });

    const user = userResult.rows[0] as any;
    const streak = streakResult.rows[0] as any || { current_streak: 0, longest_streak: 0 };

    const milestones = [
      {
        id: 'level_5',
        name: 'Reach Level 5',
        description: 'Reach level 5',
        achieved: user.level >= 5,
        icon: 'star',
      },
      {
        id: 'level_10',
        name: 'Reach Level 10',
        description: 'Reach level 10',
        achieved: user.level >= 10,
        icon: 'trophy',
      },
      {
        id: 'streak_30',
        name: '30 Day Streak',
        description: 'Practice for 30 days in a row',
        achieved: streak.longest_streak >= 30,
        icon: 'fire',
      },
      {
        id: 'songs_100',
        name: '100 Songs',
        description: 'Complete 100 songs',
        achieved: (songCountResult.rows[0].count as number) >= 100,
        icon: 'music',
      },
      {
        id: 'lessons_50',
        name: '50 Lessons',
        description: 'Complete 50 lessons',
        achieved: (lessonCountResult.rows[0].count as number) >= 50,
        icon: 'book',
      },
    ];

    res.json({ data: milestones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch milestones', code: 'SERVER_ERROR' });
  }
}

export default function getMilestones(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}