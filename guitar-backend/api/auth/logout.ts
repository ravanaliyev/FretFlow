import type { Request, Response } from 'express';

export async function logout(req: Request, res: Response): Promise<void> {
  // For serverless, we just return success
  // In production, you'd invalidate the refresh token in the database
  res.json({ message: 'Logged out successfully' });
}