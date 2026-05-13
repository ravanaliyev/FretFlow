import type { Request, Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Get quest
    const questResult = await db.execute({
      sql: 'SELECT * FROM quests WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (questResult.rows.length === 0) {
      res.status(404).json({ error: 'Quest not found', code: 'NOT_FOUND' });
      return;
    }

    const quest = questResult.rows[0] as any;

    if (quest.is_claimed) {
      res.status(400).json({ error: 'Quest already claimed', code: 'ALREADY_CLAIMED' });
      return;
    }

    if (!quest.is_completed) {
      res.status(400).json({ error: 'Quest not completed', code: 'NOT_COMPLETED' });
      return;
    }

    // Mark as claimed
    await db.execute({
      sql: 'UPDATE quests SET is_claimed = 1 WHERE id = ?',
      args: [id],
    });

    // Award XP
    const userResult = await db.execute({
      sql: 'SELECT xp_total, level FROM users WHERE id = ?',
      args: [userId],
    });

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0] as any;
      const newXP = user.xp_total + quest.xp_reward;
      const newLevel = Math.floor(newXP / 1000) + 1;

      await db.execute({
        sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
        args: [newXP, newLevel, userId],
      });
    }

    res.json({
      success: true,
      xp_earned: quest.xp_reward,
      quest_id: id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to claim quest', code: 'SERVER_ERROR' });
  }
}

export default function claimQuest(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}