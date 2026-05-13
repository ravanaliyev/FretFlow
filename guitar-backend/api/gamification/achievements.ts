import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // Get all achievements
    const achievementsResult = await db.execute('SELECT * FROM achievements');

    // Get user's earned achievements
    const userAchievementsResult = await db.execute({
      sql: 'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?',
      args: [userId],
    });

    const earnedIds = new Set(userAchievementsResult.rows.map((ua: any) => ua.achievement_id));
    const earnedMap = new Map(userAchievementsResult.rows.map((ua: any) => [ua.achievement_id, ua.earned_at]));

    const achievements = achievementsResult.rows.map((a: any) => ({
      ...a,
      earned: earnedIds.has(a.id),
      earned_at: earnedMap.get(a.id) || null,
    }));

    res.json({ data: achievements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch achievements', code: 'SERVER_ERROR' });
  }
}

export default function getAchievements(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}