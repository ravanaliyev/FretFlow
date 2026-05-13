import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    // Get active quests for user (not expired, not claimed)
    const result = await db.execute({
      sql: `SELECT * FROM quests
            WHERE user_id = ? AND expires_at > datetime('now') AND is_claimed = 0
            ORDER BY expires_at ASC`,
      args: [userId],
    });

    res.json({ data: result.rows });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch quests', code: 'SERVER_ERROR' });
  }
}

export default function getQuests(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}