import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (req.method === 'GET') {
    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [id],
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
    const { title, description, notes, difficulty, xp_reward, order_index } = req.body;
    const fields: string[] = [];
    const args: (string | number)[] = [];

    if (title !== undefined) { fields.push('title = ?'); args.push(title); }
    if (description !== undefined) { fields.push('description = ?'); args.push(description); }
    if (notes !== undefined) { fields.push('notes = ?'); args.push(notes); }
    if (difficulty !== undefined) { fields.push('difficulty = ?'); args.push(difficulty); }
    if (xp_reward !== undefined) { fields.push('xp_reward = ?'); args.push(xp_reward); }
    if (order_index !== undefined) { fields.push('order_index = ?'); args.push(order_index); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update', code: 'VALIDATION_ERROR' });
      return;
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`,
      args,
    });

    const lesson = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [id],
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
      args: [id],
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