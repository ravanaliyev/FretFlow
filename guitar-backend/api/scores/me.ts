import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await db.execute({
      sql: `SELECT ss.*, s.title as song_title, s.artist
            FROM song_scores ss
            JOIN songs s ON ss.song_id = s.id
            WHERE ss.user_id = ?
            ORDER BY ss.played_at DESC
            LIMIT ? OFFSET ?`,
      args: [userId, String(limit), String(offset)],
    });

    const totalResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
      args: [userId],
    });
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
    res.status(500).json({ error: 'Failed to fetch scores', code: 'SERVER_ERROR' });
  }
}

export default function getMyScores(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}