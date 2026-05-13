import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
      return;
    }

    const lesson = result.rows[0] as any;
    // Extract target_note from notes JSON array
    try {
      const notesArray = JSON.parse(lesson.notes || '[]');
      if (notesArray.length > 0) {
        lesson.target_note = notesArray[0].note;
      }
    } catch {
      lesson.target_note = null;
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lesson', code: 'SERVER_ERROR' });
  }
}

export default function getLesson(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}