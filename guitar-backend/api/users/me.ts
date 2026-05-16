import type { Request, Response } from 'express';
import { authenticate } from '../../src/middleware/auth.js';
import * as authService from '../../src/services/auth.service.js';

async function handler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    if (req.method === 'GET') {
      const user = await authService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(user);
    } else if (req.method === 'PUT') {
      const { username, avatar_url, password, notation_style, is_lefty } = req.body;
      const updatedUser = await authService.updateUser(userId, { 
        username, 
        avatar_url, 
        password, 
        notation_style, 
        is_lefty 
      });
      res.json(updatedUser);
    }
  } catch (_error) {
    res.status(500).json({ error: 'Failed to process request', code: 'SERVER_ERROR' });
  }
}

export default function me(req: Request, res: Response): void {
  authenticate(req, res, () => handler(req, res));
}