import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const userId = (req as any).userId;

    // Check admin
    const adminResult = await db.execute({
      sql: 'SELECT id FROM admin_users WHERE user_id = ?',
      args: [String(userId)],
    });

    if (adminResult.rows.length === 0) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { lessonId1, lessonId2 } = req.body;

    if (!lessonId1 || !lessonId2) {
      res.status(400).json({ error: 'Missing lesson IDs' });
      return;
    }

    // Get both lessons
    const l1Result = await db.execute({ sql: 'SELECT id, order_index FROM lessons WHERE id = ?', args: [String(lessonId1)] });
    const l2Result = await db.execute({ sql: 'SELECT id, order_index FROM lessons WHERE id = ?', args: [String(lessonId2)] });

    if (l1Result.rows.length === 0 || l2Result.rows.length === 0) {
      res.status(404).json({ error: 'One or both lessons not found' });
      return;
    }

    const l1 = l1Result.rows[0] as any;
    const l2 = l2Result.rows[0] as any;

    // Swap order_index
    await db.execute({
      sql: 'UPDATE lessons SET order_index = ? WHERE id = ?',
      args: [l2.order_index, l1.id]
    });

    await db.execute({
      sql: 'UPDATE lessons SET order_index = ? WHERE id = ?',
      args: [l1.order_index, l2.id]
    });

    res.json({ success: true, message: 'Lessons reordered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default function reorderHandler(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}
