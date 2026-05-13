import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { limit = 30 } = req.query;

    // Get accuracy from lesson progress
    const result = await db.execute({
      sql: `SELECT
              DATE(completed_at) as date,
              AVG(best_accuracy) as avg_accuracy
            FROM lesson_progress
            WHERE user_id = ? AND is_completed = 1 AND completed_at IS NOT NULL
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
            LIMIT ?`,
      args: [userId, String(limit)],
    });

    res.json({
      data: result.rows,
      trend: result.rows.reverse(),
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch accuracy stats', code: 'SERVER_ERROR' });
  }
}

export default function getAccuracyStats(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}