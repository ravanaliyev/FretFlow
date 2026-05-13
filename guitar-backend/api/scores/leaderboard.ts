import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.xp_total, u.level, u.avatar_url,
                   MAX(ss.score) as best_score,
                   COUNT(ss.id) as songs_completed
            FROM users u
            LEFT JOIN song_scores ss ON u.id = ss.user_id
            GROUP BY u.id
            ORDER BY u.xp_total DESC
            LIMIT ? OFFSET ?`,
      args: [String(limit), String(offset)],
    });

    const totalResult = await db.execute('SELECT COUNT(*) as count FROM users');
    const total = totalResult.rows[0].count as number;

    res.json({
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard', code: 'SERVER_ERROR' });
  }
}

export default function getLeaderboard(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}