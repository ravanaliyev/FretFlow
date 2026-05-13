import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { limit = 10 } = req.query;

    // Get recent practice sessions and aggregate notes
    const result = await db.execute({
      sql: `SELECT notes_played
            FROM practice_sessions
            WHERE user_id = ? AND notes_played != '[]'
            ORDER BY started_at DESC
            LIMIT 50`,
      args: [userId],
    });

    // Count note occurrences
    const noteCounts: Record<string, number> = {};

    for (const row of result.rows) {
      const session = row as any;
      try {
        const notes = JSON.parse(session.notes_played || '[]');
        for (const note of notes) {
          noteCounts[note] = (noteCounts[note] || 0) + 1;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Sort by count and take top N
    const topNotes = Object.entries(noteCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Number(limit))
      .map(([note, count]) => ({ note, count }));

    res.json({
      most_played_notes: topNotes,
      total_unique_notes: Object.keys(noteCounts).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity stats', code: 'SERVER_ERROR' });
  }
}

export default function getActivityStats(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}