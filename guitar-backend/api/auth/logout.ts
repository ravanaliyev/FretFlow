import type { Request, Response } from 'express';
import { invalidateSession } from '../../src/services/auth.service.js';
import { verifyRefreshToken } from '../../src/utils/jwt.js';

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload && payload.sub) {
        await invalidateSession(payload.sub, refreshToken);
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (_error) {
    res.json({ message: 'Logged out successfully' });
  }
}