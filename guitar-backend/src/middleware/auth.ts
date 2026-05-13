import type { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { verifyAccessToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  isAdmin?: boolean;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  req.userId = payload.sub;
  req.userEmail = payload.email;
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  authenticate(req, res, async () => {
    if (!req.userId) return;

    try {
      const result = await db.execute({
        sql: 'SELECT id FROM admin_users WHERE user_id = ?',
        args: [String(req.userId)],
      });

      if (result.rows.length === 0) {
        res.status(403).json({
          error: 'Admin access required',
          code: 'FORBIDDEN',
        });
        return;
      }

      req.isAdmin = true;
      next();
    } catch (_error) {
      res.status(500).json({
        error: 'Authorization check failed',
        code: 'SERVER_ERROR',
      });
    }
  });
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload) {
      req.userId = payload.sub;
      req.userEmail = payload.email;
    }
  }

  next();
}