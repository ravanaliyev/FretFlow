import type { Request, Response } from 'express';
import * as authService from '../../src/services/auth.service.js';

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Refresh token required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    res.json(tokens);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }
}