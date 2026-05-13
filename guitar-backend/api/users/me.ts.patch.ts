import type { Request, Response } from 'express';
import { authenticate } from '../../src/middleware/auth.js';
import * as authService from '../../src/services/auth.service.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const { username, avatar_url } = req.body;

    const user = await authService.updateUser(userId, { username, avatar_url });

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(user);
  } catch (_error) {
    const message = _error instanceof Error ? _error.message : 'Failed to update user';
    res.status(400).json({ error: message, code: 'UPDATE_FAILED' });
  }
}

export default function patchMe(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}