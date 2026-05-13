import type { Request, Response } from 'express';
import * as authService from '../../src/services/auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username } = req.body;

    const result = await authService.register(email, password, username);

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (_error) {
    const message = _error instanceof Error ? _error.message : 'Registration failed';
    res.status(400).json({ error: message, code: 'REGISTRATION_FAILED' });
  }
}

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
  } catch (_error) {
    res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  // For serverless, we just return success
  // In a production app, you'd invalidate the refresh token
  res.json({ message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const user = await authService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(user);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to get user', code: 'SERVER_ERROR' });
  }
}