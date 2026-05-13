import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const REFRESH_TOKEN_EXPIRES_IN_CONST = REFRESH_TOKEN_EXPIRES_IN;

export interface TokenPayload {
  sub: number;
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
}

export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

export function generateRefreshToken(userId: number): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: userId, type: 'refresh', jti },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}