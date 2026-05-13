import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const lessons = await db.execute({
      sql: 'SELECT * FROM lessons ORDER BY order_index LIMIT ? OFFSET ?',
      args: [String(limit), String(offset)],
    });

    const totalResult = await db.execute('SELECT COUNT(*) as count FROM lessons');
    const total = totalResult.rows[0].count as number;

    res.json({
      data: lessons.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: offset + lessons.rows.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons', code: 'SERVER_ERROR' });
  }
}

export default function getLessons(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}