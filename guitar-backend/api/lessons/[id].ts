import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';
import { validateBody, validateParams } from '../../src/middleware/validate.js';
import { updateLessonSchema, idParamSchema } from '../../src/validation/schemas.js';

const ALLOWED_FIELDS = ['title', 'description', 'notes', 'difficulty', 'xp_reward', 'order_index'];

async function handler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (req.method === 'GET') {
    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [String(id)],
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
      return;
    }

    const lesson = result.rows[0] as any;
    try {
      const notesArray = JSON.parse(lesson.notes || '[]');
      if (notesArray.length > 0) {
        lesson.target_note = notesArray[0].note;
      }
    } catch {
      lesson.target_note = null;
    }

    res.json(lesson);
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body as Record<string, unknown>;
    const fields: string[] = [];
    const args: (string | number)[] = [];

    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        fields.push(`${field} = ?`);
        args.push(body[field] as string | number);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
      return;
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`,
      args,
    });

    const lesson = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [String(id)],
    });

    if (lesson.rows.length === 0) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(lesson.rows[0]);
    return;
  }

  if (req.method === 'DELETE') {
    const result = await db.execute({
      sql: 'DELETE FROM lessons WHERE id = ?',
      args: [String(id)],
    });

    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
}

export default function lessonById(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}

export { handler };