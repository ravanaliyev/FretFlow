import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';
import { calculateSongXP, calculateLevel } from '../../src/utils/xpCalculator.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { song_id, score, accuracy_percent } = req.body;

    if (!song_id || score === undefined) {
      res.status(400).json({
        error: 'song_id and score are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Get song info
    const songResult = await db.execute({
      sql: 'SELECT * FROM songs WHERE id = ?',
      args: [song_id],
    });

    if (songResult.rows.length === 0) {
      res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' });
      return;
    }

    const song = songResult.rows[0] as any;
    const xpEarned = calculateSongXP(score, song.xp_reward);

    // Insert score
    await db.execute({
      sql: `INSERT INTO song_scores (user_id, song_id, score, accuracy_percent, xp_earned)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, song_id, score, accuracy_percent || score, xpEarned],
    });

    // Update user XP and level
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
    }

    res.json({
      success: true,
      score,
      xp_earned: xpEarned,
      accuracy_percent: accuracy_percent || score,
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to submit score', code: 'SERVER_ERROR' });
  }
}

export default function submitScore(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}