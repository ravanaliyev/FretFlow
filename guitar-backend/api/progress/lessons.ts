import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { calculateLessonXP, calculateLevel } from '../../src/utils/xpCalculator.js';

import { authenticate } from '../../src/middleware/auth.js';

async function getProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    const result = await db.execute({
      sql: `SELECT lp.*, l.title, l.description, l.notes, l.difficulty, l.xp_reward
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ?
            ORDER BY l.order_index`,
      args: [userId],
    });

    res.json({ data: result.rows });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch progress', code: 'SERVER_ERROR' });
  }
}

async function submitProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { lesson_id, accuracy, notes_played } = req.body;

    if (!lesson_id) {
      res.status(400).json({ error: 'lesson_id is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Get lesson info
    const lessonResult = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [lesson_id],
    });

    if (lessonResult.rows.length === 0) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
      return;
    }

    const lesson = lessonResult.rows[0] as any;

    // Check if progress already exists
    const existingResult = await db.execute({
      sql: 'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      args: [userId, lesson_id],
    });

    const isCompleted = accuracy >= 80;
    const xpEarned = calculateLessonXP(accuracy || 0, lesson.xp_reward);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0] as any;
      const newAttempts = existing.attempts + 1;
      const bestAccuracy = Math.max(existing.best_accuracy || 0, accuracy || 0);

      await db.execute({
        sql: `UPDATE lesson_progress
              SET attempts = ?, best_accuracy = ?, last_attempt_result = ?,
                  is_completed = ?, completed_at = COALESCE(completed_at, ?)
              WHERE user_id = ? AND lesson_id = ?`,
        args: [
          newAttempts,
          bestAccuracy,
          JSON.stringify({ accuracy, notes_played }),
          isCompleted ? 1 : 0,
          isCompleted ? new Date().toISOString() : null,
          userId,
          lesson_id,
        ],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO lesson_progress
              (user_id, lesson_id, attempts, best_accuracy, last_attempt_result, is_completed, completed_at)
              VALUES (?, ?, 1, ?, ?, ?, ?)`,
        args: [
          userId,
          lesson_id,
          accuracy || 0,
          JSON.stringify({ accuracy, notes_played }),
          isCompleted ? 1 : 0,
          isCompleted ? new Date().toISOString() : null,
        ],
      });
    }

    // Update user XP and level if lesson completed
    if (isCompleted) {
      const userResult = await db.execute({
        sql: 'SELECT xp_total, level FROM users WHERE id = ?',
        args: [userId],
      });

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as any;
        const newXP = user.xp_total + xpEarned;
        const newLevel = calculateLevel(newXP);

        await db.execute({
          sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
          args: [newXP, newLevel, userId],
        });

        // Update streak
        await updateStreak(userId);

        // Check and grant achievements (non-blocking)
        checkAndGrantAchievements(userId).catch(console.error);
      }
    }

    res.json({
      success: true,
      is_completed: isCompleted,
      xp_earned: isCompleted ? xpEarned : 0,
      accuracy: accuracy || 0,
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to submit progress', code: 'SERVER_ERROR' });
  }
}

async function checkAndGrantAchievements(userId: number): Promise<void> {
  // Fetch all achievements
  const allAchievements = await db.execute('SELECT * FROM achievements');

  // Fetch already-earned achievements for this user
  const earnedResult = await db.execute({
    sql: 'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    args: [userId],
  });
  const earnedIds = new Set(earnedResult.rows.map((r: any) => r.achievement_id));

  // Fetch stats
  const lessonsResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
    args: [userId],
  });
  const lessonsCompleted = Number((lessonsResult.rows[0] as any).count);

  const perfectResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND best_accuracy >= 100',
    args: [userId],
  });
  const perfectCount = Number((perfectResult.rows[0] as any).count);

  const streakResult = await db.execute({
    sql: 'SELECT current_streak FROM streaks WHERE user_id = ?',
    args: [userId],
  });
  const currentStreak = Number((streakResult.rows[0] as any)?.current_streak || 0);

  const songsResult = await db.execute({
    sql: 'SELECT COUNT(DISTINCT song_id) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });
  const songsCompleted = Number((songsResult.rows[0] as any).count);

  // Condition map (keyed by achievement name)
  const conditions: Record<string, boolean> = {
    'First Note':     lessonsCompleted >= 1,
    'Perfect Pitch':  perfectCount >= 1,
    'Streak Starter': currentStreak >= 3,
    'Week Warrior':   currentStreak >= 7,
    'Song Master':    songsCompleted >= 10,
    'Lesson Legend':  lessonsCompleted >= 25,
  };

  const now = new Date().toISOString();
  let bonusXP = 0;

  for (const row of allAchievements.rows) {
    const achievement = row as any;
    if (earnedIds.has(achievement.id)) continue;
    if (!conditions[achievement.name]) continue;

    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)',
      args: [userId, achievement.id, now],
    });
    bonusXP += achievement.xp_reward || 0;
  }

  if (bonusXP > 0) {
    const userResult = await db.execute({
      sql: 'SELECT xp_total FROM users WHERE id = ?',
      args: [userId],
    });
    const { calculateLevel } = await import('../../src/utils/xpCalculator.js');
    const currentXP = Number((userResult.rows[0] as any).xp_total || 0);
    const newXP = currentXP + bonusXP;
    const newLevel = calculateLevel(newXP);
    await db.execute({
      sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
      args: [newXP, newLevel, userId],
    });
  }
}

async function updateStreak(userId: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const streakResult = await db.execute({
    sql: 'SELECT * FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  if (streakResult.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO streaks (user_id, current_streak, longest_streak, last_practice_date) VALUES (?, 1, 1, ?)',
      args: [userId, today],
    });
    return;
  }

  const streak = streakResult.rows[0] as any;
  const lastDate = streak.last_practice_date;

  if (lastDate === today) return; // Already practiced today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastDate === yesterdayStr) {
    newStreak = streak.current_streak + 1;
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak);

  await db.execute({
    sql: 'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_practice_date = ? WHERE user_id = ?',
    args: [newStreak, longestStreak, today, userId],
  });
}

async function handler(req: Request, res: Response): Promise<void> {
  if (req.method === 'GET') {
    return getProgress(req, res);
  } else if (req.method === 'POST') {
    return submitProgress(req, res);
  }

  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
}

export default function lessonsProgress(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}