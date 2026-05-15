import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { score } = req.body;

    if (score === undefined) {
      res.status(400).json({
        error: 'score is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Get current best score
    const userResult = await db.execute({
      sql: 'SELECT best_score FROM users WHERE id = ?',
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    const currentBest = Number((userResult.rows[0] as any).best_score || 0);

    if (score > currentBest) {
      await db.execute({
        sql: 'UPDATE users SET best_score = ? WHERE id = ?',
        args: [score, userId],
      });
    }

    res.json({
      success: true,
      best_score: Math.max(score, currentBest),
      new_record: score > currentBest
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to submit challenge score', code: 'SERVER_ERROR' });
  }
}

export default function submitChallengeScore(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}
