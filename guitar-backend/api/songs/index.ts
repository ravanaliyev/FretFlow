import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  // Handle POST - Create new song (check for title in body instead of method)
  if (req.body && req.body.title) {
    try {
      const userId = (req as any).userId;
      const { title, artist, difficulty, xp_reward, notes } = req.body;

      if (!title || !artist) {
        res.status(400).json({ error: 'Title and artist are required', code: 'VALIDATION_ERROR' });
        return;
      }

      const result = await db.execute({
        sql: 'INSERT INTO songs (title, artist, difficulty, xp_reward, notes) VALUES (?, ?, ?, ?, ?)',
        args: [title, artist, difficulty || 1, xp_reward || 50, notes || '[]'],
      });

      const insertId = Number(result.lastInsertRowid);

      res.status(201).json({
        success: true,
        id: insertId,
        message: 'Song created successfully',
      });
    } catch (error: any) {
      console.error('Create song error:', error);
      res.status(500).json({ error: 'Failed to create song', code: 'SERVER_ERROR' });
    }
    return;
  }

  // Handle GET - List songs
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await db.execute({
      sql: 'SELECT * FROM songs ORDER BY difficulty, title LIMIT ? OFFSET ?',
      args: [String(limit), String(offset)],
    });

    const totalResult = await db.execute('SELECT COUNT(*) as count FROM songs');
    const total = totalResult.rows[0].count as number;

    // Get user's best scores for each song
    const scoresResult = await db.execute({
      sql: `SELECT song_id, MAX(score) as best_score FROM song_scores WHERE user_id = ? GROUP BY song_id`,
      args: [userId],
    });

    const bestScores = new Map();
    for (const row of scoresResult.rows) {
      const score = row as any;
      bestScores.set(score.song_id, score.best_score);
    }

    const songsWithScores = result.rows.map((song: any) => ({
      ...song,
      best_score: bestScores.get(song.id) || null,
    }));

    res.json({
      data: songsWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs', code: 'SERVER_ERROR' });
  }
}

export default function getSongs(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}