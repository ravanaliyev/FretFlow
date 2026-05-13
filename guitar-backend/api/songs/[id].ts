import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await db.execute({
      sql: 'SELECT * FROM songs WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch song', code: 'SERVER_ERROR' });
  }
}

export default function getSong(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}