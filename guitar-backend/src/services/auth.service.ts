import db from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { calculateLevel } from '../utils/xpCalculator.js';
import { createHash } from 'crypto';

interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
}

interface AuthResult {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: number, token: string, expiresAt: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.execute({
    sql: 'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    args: [userId, tokenHash, expiresAt],
  });
}

export async function validateSession(userId: number, token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: 'SELECT id FROM sessions WHERE user_id = ? AND token_hash = ? AND expires_at > ?',
    args: [userId, tokenHash, now],
  });
  return result.rows.length > 0;
}

export async function invalidateSession(userId: number, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.execute({
    sql: 'DELETE FROM sessions WHERE user_id = ? AND token_hash = ?',
    args: [userId, tokenHash],
  });
}

export async function invalidateAllUserSessions(userId: number): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE user_id = ?',
    args: [userId],
  });
}

export async function register(
  email: string,
  password: string,
  username: string
): Promise<AuthResult> {
  // Check if user exists
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? OR username = ?',
    args: [email, username],
  });

  if (existing.rows.length > 0) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const result = await db.execute({
    sql: `INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)`,
    args: [email, passwordHash, username],
  });

  const userId = Number(result.lastInsertRowid);

  // Create streak entry
  await db.execute({
    sql: 'INSERT INTO streaks (user_id) VALUES (?)',
    args: [userId],
  });

  // Get user
  const userResult = await db.execute({
    sql: 'SELECT id, email, username, avatar_url, xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  const user = userResult.rows[0] as User;

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Create session for refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await createSession(user.id, refreshToken, expiresAt.toISOString());

  return { user, accessToken, refreshToken };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const result = await db.execute({
    sql: 'SELECT id, email, username, avatar_url, xp_total, level, password_hash FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0] as User & { password_hash: string };

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Create session for refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await createSession(user.id, refreshToken, expiresAt.toISOString());

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  // Validate session exists
  const sessionValid = await validateSession(payload.sub, refreshToken);
  if (!sessionValid) {
    throw new Error('Session expired or invalidated');
  }

  const result = await db.execute({
    sql: 'SELECT id, email FROM users WHERE id = ?',
    args: [payload.sub],
  });

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0] as { id: number; email: string };

  // Invalidate old session
  await invalidateSession(user.id, refreshToken);

  // Generate new tokens
  const newAccessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id);

  // Create new session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await createSession(user.id, newRefreshToken, expiresAt.toISOString());

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function getUserById(userId: number): Promise<Omit<User, 'password_hash'> | null> {
  const result = await db.execute({
    sql: 'SELECT id, email, username, avatar_url, xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  return result.rows[0] as Omit<User, 'password_hash'> | null;
}

export async function updateUser(
  userId: number,
  updates: { username?: string; avatar_url?: string }
): Promise<Omit<User, 'password_hash'> | null> {
  const fields: string[] = [];
  const args: (string | number)[] = [];

  if (updates.username) {
    fields.push('username = ?');
    args.push(updates.username);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    args.push(updates.avatar_url);
  }

  if (fields.length === 0) return getUserById(userId);

  args.push(userId);

  await db.execute({
    sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    args,
  });

  return getUserById(userId);
}

export async function addXP(userId: number, xpAmount: number): Promise<{ xp_total: number; level: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const newXP = user.xp_total + xpAmount;
  const newLevel = calculateLevel(newXP);

  await db.execute({
    sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
    args: [newXP, newLevel, userId],
  });

  return { xp_total: newXP, level: newLevel };
}