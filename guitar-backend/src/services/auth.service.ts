import db from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { calculateLevel } from '../utils/xpCalculator.js';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  const result = await db.execute({
    sql: 'SELECT id, email FROM users WHERE id = ?',
    args: [payload.sub],
  });

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0] as { id: number; email: string };

  const newAccessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id);

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