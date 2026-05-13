import type { Request, Response } from 'express';
import { authenticate } from '../../src/middleware/auth.js';
import * as authService from '../../src/services/auth.service.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const user = await authService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', code: 'SERVER_ERROR' });
  }
}

export default function me(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}