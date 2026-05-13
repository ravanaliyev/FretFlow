import type { Request, Response } from 'express';
import * as authService from '../../src/services/auth.service.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        details: { required: ['email', 'password'] },
      });
      return;
    }

    const result = await authService.login(email, password);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (_error) {
    res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }
}