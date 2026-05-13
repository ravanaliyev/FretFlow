import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path[0] : path;

  try {
    await initializeTables();

    // Auth routes
    if (pathStr === 'auth/register' && req.method === 'POST') {
      return handleRegister(req, res);
    }
    if (pathStr === 'auth/login' && req.method === 'POST') {
      return handleLogin(req, res);
    }
    if (pathStr === 'auth/refresh' && req.method === 'POST') {
      return handleRefresh(req, res);
    }
    if (pathStr === 'auth/logout' && req.method === 'POST') {
      return handleLogout(req, res);
    }

    // User routes
    if (pathStr === 'users/me' && req.method === 'GET') {
      return handleGetUser(req, res);
    }
    if (pathStr === 'users/me' && req.method === 'PATCH') {
      return handleUpdateUser(req, res);
    }

    // Lessons routes
    if (pathStr === 'lessons' && req.method === 'GET') {
      return handleLessons(req, res);
    }
    if (pathStr === 'lessons' && req.method === 'POST') {
      return handleCreateLesson(req, res);
    }
    if (pathStr?.startsWith('lessons/') && req.method === 'GET') {
      return handleGetLesson(req, res);
    }

    // Progress routes
    if (pathStr === 'progress/lessons') {
      return handleProgress(req, res);
    }

    // Songs routes
    if (pathStr === 'songs' && req.method === 'GET' && !req.query.page) {
      return handleSongs(req, res);
    }
    if (pathStr === 'songs' && req.method === 'POST') {
      return handleCreateSong(req, res);
    }
    if (pathStr?.startsWith('songs/') && req.method === 'GET') {
      return handleGetSong(req, res);
    }

    // Scores routes
    if (pathStr === 'scores' && req.method === 'POST') {
      return handleSubmitScore(req, res);
    }
    if (pathStr === 'scores/me' && req.method === 'GET') {
      return handleMyScores(req, res);
    }
    if (pathStr === 'scores/leaderboard' && req.method === 'GET') {
      return handleLeaderboard(req, res);
    }

    // Gamification routes
    if (pathStr === 'gamification/profile') {
      return handleProfile(req, res);
    }
    if (pathStr === 'gamification/quests') {
      return handleQuests(req, res);
    }
    if (pathStr?.startsWith('gamification/quests/') && pathStr?.endsWith('/claim') && req.method === 'POST') {
      return handleClaimQuest(req, res);
    }
    if (pathStr === 'gamification/achievements') {
      return handleAchievements(req, res);
    }
    if (pathStr === 'gamification/milestones') {
      return handleMilestones(req, res);
    }

    // Stats routes
    if (pathStr === 'stats/summary') {
      return handleStatsSummary(req, res);
    }
    if (pathStr === 'stats/practice') {
      return handlePracticeStats(req, res);
    }

    // Health check
    if (pathStr === 'health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  } catch (_error) {
    console.error(_error);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
}

// ============ DATABASE INITIALIZATION ============

async function initializeTables() {
  // Users
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      username TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      xp_total INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Streaks
  await db.execute(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_practice_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lessons
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '[]',
      difficulty INTEGER DEFAULT 1,
      xp_reward INTEGER DEFAULT 10,
      order_index INTEGER DEFAULT 0
    )
  `);

  // Lesson Progress
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      attempts INTEGER DEFAULT 0,
      best_accuracy REAL,
      last_attempt_result TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lesson_id)
    )
  `);

  // Songs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '[]',
      xp_reward INTEGER DEFAULT 50
    )
  `);

  // Song Scores
  await db.execute(`
    CREATE TABLE IF NOT EXISTS song_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      accuracy_percent REAL,
      xp_earned INTEGER DEFAULT 0,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Achievements
  await db.execute(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER DEFAULT 20
    )
  `);

  // User Achievements
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    )
  `);

  // Practice Sessions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      started_at DATETIME NOT NULL,
      ended_at DATETIME,
      duration_seconds INTEGER DEFAULT 0,
      notes_played TEXT DEFAULT '[]',
      lesson_id INTEGER,
      song_id INTEGER
    )
  `);

  // Daily Stats
  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      total_practice_seconds INTEGER DEFAULT 0,
      sessions_count INTEGER DEFAULT 0,
      lessons_completed INTEGER DEFAULT 0,
      songs_completed INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      avg_accuracy REAL,
      UNIQUE(user_id, date)
    )
  `);

  // Seed achievements
  const achievements = await db.execute('SELECT COUNT(*) as count FROM achievements');
  if (achievements.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO achievements (name, description, icon, xp_reward) VALUES
        ('First Note', 'Complete your first lesson', 'music-note', 20),
        ('Perfect Pitch', '100% accuracy on a lesson', 'star', 25),
        ('Streak Starter', '3 day practice streak', 'fire', 30),
        ('Week Warrior', '7 day practice streak', 'flame', 50),
        ('Song Master', 'Complete 10 songs', 'trophy', 75),
        ('Lesson Legend', 'Complete 25 lessons', 'medal', 100)
    `);
  }

  // Seed lessons
  const lessons = await db.execute('SELECT COUNT(*) as count FROM lessons');
  if (lessons.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO lessons (title, description, notes, difficulty, xp_reward, order_index) VALUES
        ('Play Open E', 'Play the low E string (6th string) open', '[{"note":"E2","time":0}]', 1, 10, 1),
        ('Play Open A', 'Play the A string (5th string) open', '[{"note":"A2","time":0}]', 1, 10, 2),
        ('Play Open D', 'Play the D string (4th string) open', '[{"note":"D3","time":0}]', 1, 10, 3),
        ('Play Open G', 'Play the G string (3rd string) open', '[{"note":"G3","time":0}]', 1, 10, 4),
        ('Play Open B', 'Play the B string (2nd string) open', '[{"note":"B3","time":0}]', 1, 10, 5),
        ('Play High E', 'Play the high E string (1st string) open', '[{"note":"E4","time":0}]', 1, 10, 6)
    `);
  }

  // Seed songs
  const songs = await db.execute('SELECT COUNT(*) as count FROM songs');
  if (songs.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO songs (title, artist, difficulty, notes, xp_reward) VALUES
        ('Twinkle Twinkle', 'Traditional', 1, '[{"note":"C4","time":0},{"note":"C4","time":0.5},{"note":"G4","time":1},{"note":"G4","time":1.5},{"note":"A4","time":2},{"note":"A4","time":2.5},{"note":"G4","time":3}]', 50),
        ('Mary Had a Little Lamb', 'Traditional', 1, '[{"note":"E4","time":0},{"note":"D4","time":0.5},{"note":"C4","time":1},{"note":"D4","time":1.5},{"note":"E4","time":2},{"note":"E4","time":2.5},{"note":"E4","time":3}]', 50)
    `);
  }
}

// ============ HELPERS ============

function getUserId(req: VercelRequest): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'guitar-app-secret-key';
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'access') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function calculateLevel(totalXP: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) return i + 1;
  }
  return 1;
}

function getLevelName(level: number): string {
  const names = ['Beginner', 'Novice', 'Apprentice', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grand Master', 'Legendary', 'Guitar Hero'];
  return names[Math.min(level - 1, names.length - 1)] || 'Beginner';
}

function calculateLessonXP(accuracy: number, baseXP: number): number {
  const multiplier = accuracy === 100 ? 1.5 : accuracy >= 80 ? 1.0 : 0.8;
  return Math.round(baseXP * multiplier);
}

// ============ AUTH ============

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { email, password, username } = req.body || {};

  if (!email || !password || !username) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'VALIDATION_ERROR',
      details: { required: ['email', 'password', 'username'] },
    });
  }

  try {
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: 'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      args: [email, passwordHash, username],
    });

    const userId = result.lastInsertRowid;

    await db.execute({
      sql: 'INSERT INTO streaks (user_id) VALUES (?)',
      args: [String(userId)],
    });

    const JWT_SECRET = process.env.JWT_SECRET || 'guitar-app-secret-key';
    const accessToken = jwt.sign({ sub: userId, email, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: userId, type: 'refresh', jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      user: { id: userId, email, username, xp_total: 0, level: 1, avatar_url: null },
      accessToken,
      refreshToken,
    });
  } catch (_error: any) {
    if (_error.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'User already exists', code: 'REGISTRATION_FAILED' });
    }
    throw _error;
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'VALIDATION_ERROR',
      details: { required: ['email', 'password'] },
    });
  }

  const result = await db.execute({
    sql: 'SELECT id, email, username, avatar_url, xp_total, level, password_hash FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const user = result.rows[0] as any;
  const bcrypt = require('bcrypt');
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'guitar-app-secret-key';
  const accessToken = jwt.sign({ sub: user.id, email: user.email, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '7d' });

  const { password_hash: _, ...userWithoutPassword } = user;
  return res.json({
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  });
}

async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required', code: 'VALIDATION_ERROR' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'guitar-app-secret-key';
    const payload = jwt.verify(refreshToken, JWT_SECRET);

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type', code: 'INVALID_TOKEN' });
    }

    const userResult = await db.execute({
      sql: 'SELECT id, email FROM users WHERE id = ?',
      args: [payload.sub],
    });

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const user = userResult.rows[0] as any;
    const newAccessToken = jwt.sign({ sub: user.id, email: user.email, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  return res.json({ message: 'Logged out successfully' });
}

// ============ USERS ============

async function handleGetUser(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const result = await db.execute({
    sql: 'SELECT id, email, username, avatar_url, xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  return res.json(result.rows[0]);
}

async function handleUpdateUser(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const { username, avatar_url } = req.body || {};

  const updates: string[] = [];
  const args: any[] = [];

  if (username) { updates.push('username = ?'); args.push(username); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); args.push(avatar_url); }

  if (updates.length === 0) {
    return handleGetUser(req, res);
  }

  args.push(userId);
  await db.execute({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return handleGetUser(req, res);
}

// ============ LESSONS ============

async function handleLessons(req: VercelRequest, res: VercelResponse) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.execute({
    sql: 'SELECT * FROM lessons ORDER BY order_index LIMIT ? OFFSET ?',
    args: [String(limit), String(offset)],
  });

  const totalResult = await db.execute('SELECT COUNT(*) as count FROM lessons');
  const total = totalResult.rows[0].count as number;

  // If authenticated, get user's progress
  const userId = getUserId(req);
  const progressMap: Record<number, any> = {};

  if (userId) {
    const progressResult = await db.execute({
      sql: 'SELECT lesson_id, is_completed, best_accuracy, attempts FROM lesson_progress WHERE user_id = ?',
      args: [userId],
    });

    for (const row of progressResult.rows) {
      const p = row as any;
      progressMap[p.lesson_id] = p;
    }
  }

  const lessonsWithProgress = result.rows.map((lesson: any) => ({
    ...lesson,
    progress: progressMap[lesson.id] || null,
  }));

  return res.json({
    data: lessonsWithProgress,
    pagination: { page, limit, total, hasMore: offset + result.rows.length < total },
  });
}

async function handleCreateLesson(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const { title, description, notes, difficulty, xp_reward, order_index } = req.body || {};

  const result = await db.execute({
    sql: 'INSERT INTO lessons (title, description, notes, difficulty, xp_reward, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    args: [title, description, notes || '[]', difficulty || 1, xp_reward || 10, order_index || 0],
  });

  return res.status(201).json({ id: result.lastInsertRowid, title, description, notes, difficulty, xp_reward, order_index });
}

async function handleGetLesson(req: VercelRequest, res: VercelResponse) {
  // Extract ID from path like "lessons/123" -> "123"
  const pathPart = req.query.path?.toString().split('/')[1] || '';
  const lessonId = pathPart;

  if (!lessonId || isNaN(Number(lessonId))) {
    return res.status(400).json({ error: 'Invalid lesson ID', code: 'VALIDATION_ERROR' });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM lessons WHERE id = ?',
    args: [lessonId],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
  }

  const lesson = result.rows[0] as any;

  // Parse notes if stored as JSON string
  if (typeof lesson.notes === 'string') {
    try {
      lesson.notes = JSON.parse(lesson.notes);
    } catch (_e) {
      lesson.notes = [];
    }
  }

  // Get user's progress for this lesson
  const userId = getUserId(req);
  if (userId) {
    const progressResult = await db.execute({
      sql: 'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      args: [userId, lessonId],
    });
    lesson.progress = progressResult.rows[0] || null;
  }

  return res.json(lesson);
}

// ============ PROGRESS ============

async function handleProgress(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  if (req.method === 'GET') {
    const result = await db.execute({
      sql: `SELECT lp.*, l.title, l.description, l.notes, l.difficulty, l.xp_reward
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ?
            ORDER BY l.order_index`,
      args: [userId],
    });
    return res.json({ data: result.rows });
  }

  if (req.method === 'POST') {
    const { lesson_id, accuracy, notes_played } = req.body || {};

    if (!lesson_id) {
      return res.status(400).json({ error: 'lesson_id is required', code: 'VALIDATION_ERROR' });
    }

    // Get lesson
    const lessonResult = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [lesson_id],
    });

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found', code: 'NOT_FOUND' });
    }

    const lesson = lessonResult.rows[0] as any;
    const isCompleted = (accuracy || 0) >= 80;
    const xpEarned = calculateLessonXP(accuracy || 0, lesson.xp_reward);

    // Check existing progress
    const existingResult = await db.execute({
      sql: 'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      args: [userId, lesson_id],
    });

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0] as any;
      await db.execute({
        sql: `UPDATE lesson_progress SET attempts = ?, best_accuracy = MAX(?, best_accuracy), last_attempt_result = ?, is_completed = MAX(?, is_completed), completed_at = COALESCE(completed_at, ?) WHERE user_id = ? AND lesson_id = ?`,
        args: [existing.attempts + 1, accuracy || 0, JSON.stringify({ accuracy, notes_played }), isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null, userId, lesson_id],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO lesson_progress (user_id, lesson_id, attempts, best_accuracy, last_attempt_result, is_completed, completed_at) VALUES (?, ?, 1, ?, ?, ?, ?)',
        args: [userId, lesson_id, accuracy || 0, JSON.stringify({ accuracy, notes_played }), isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null],
      });
    }

    // Update user XP and level if completed
    if (isCompleted) {
      const userResult = await db.execute({
        sql: 'SELECT xp_total, level FROM users WHERE id = ?',
        args: [userId],
      });

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as any;
        const newXP = user.xp_total + xpEarned;
        const newLevel = calculateLevel(newXP);

        await db.execute({
          sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
          args: [newXP, newLevel, userId],
        });

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        const streakResult = await db.execute({
          sql: 'SELECT * FROM streaks WHERE user_id = ?',
          args: [userId],
        });

        if (streakResult.rows.length === 0) {
          await db.execute({
            sql: 'INSERT INTO streaks (user_id, current_streak, longest_streak, last_practice_date) VALUES (?, 1, 1, ?)',
            args: [userId, today],
          });
        } else {
          const streak = streakResult.rows[0] as any;
          if (streak.last_practice_date !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = 1;
            if (streak.last_practice_date === yesterdayStr) {
              newStreak = streak.current_streak + 1;
            }

            await db.execute({
              sql: 'UPDATE streaks SET current_streak = ?, longest_streak = MAX(?, longest_streak), last_practice_date = ? WHERE user_id = ?',
              args: [newStreak, newStreak, today, userId],
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      is_completed: isCompleted,
      xp_earned: isCompleted ? xpEarned : 0,
      accuracy: accuracy || 0,
    });
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
}

// ============ SONGS ============

async function handleSongs(req: VercelRequest, res: VercelResponse) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.execute({
    sql: 'SELECT * FROM songs ORDER BY difficulty, title LIMIT ? OFFSET ?',
    args: [String(limit), String(offset)],
  });

  const totalResult = await db.execute('SELECT COUNT(*) as count FROM songs');
  const total = totalResult.rows[0].count as number;

  // Get user's best scores
  const userId = getUserId(req);
  const bestScores: Record<number, number> = {};

  if (userId) {
    const scoresResult = await db.execute({
      sql: 'SELECT song_id, MAX(score) as best_score FROM song_scores WHERE user_id = ? GROUP BY song_id',
      args: [userId],
    });

    for (const row of scoresResult.rows) {
      const s = row as any;
      bestScores[s.song_id] = s.best_score;
    }
  }

  const songsWithScores = result.rows.map((song: any) => ({
    ...song,
    best_score: bestScores[song.id] || null,
  }));

  return res.json({
    data: songsWithScores,
    pagination: { page, limit, total, hasMore: offset + result.rows.length < total },
  });
}

async function handleGetSong(req: VercelRequest, res: VercelResponse) {
  // Extract ID from path like "songs/123" -> "123"
  const pathPart = req.query.path?.toString().split('/')[1] || '';
  const songId = pathPart;

  if (!songId || isNaN(Number(songId))) {
    return res.status(400).json({ error: 'Invalid song ID', code: 'VALIDATION_ERROR' });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM songs WHERE id = ?',
    args: [songId],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' });
  }

  const song = result.rows[0] as any;

  // Parse notes if stored as JSON string
  if (typeof song.notes === 'string') {
    try {
      song.notes = JSON.parse(song.notes);
    } catch (_e) {
      song.notes = [];
    }
  }

  // Get user's best score for this song
  const userId = getUserId(req);
  if (userId) {
    const scoreResult = await db.execute({
      sql: 'SELECT MAX(score) as best_score FROM song_scores WHERE user_id = ? AND song_id = ?',
      args: [userId, songId],
    });
    song.best_score = (scoreResult.rows[0] as any)?.best_score || null;
  }

  return res.json(song);
}

async function handleCreateSong(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const { title, artist, difficulty, xp_reward, notes } = req.body || {};

  if (!title || !artist) {
    return res.status(400).json({ error: 'title and artist are required', code: 'VALIDATION_ERROR' });
  }

  const result = await db.execute({
    sql: 'INSERT INTO songs (title, artist, difficulty, xp_reward, notes) VALUES (?, ?, ?, ?, ?)',
    args: [title, artist, difficulty || 1, xp_reward || 50, notes || '[]'],
  });

  return res.status(201).json({
    id: result.lastInsertRowid,
    title,
    artist,
    difficulty: difficulty || 1,
    xp_reward: xp_reward || 50,
    notes: notes || '[]',
  });
}

// ============ SCORES ============

async function handleSubmitScore(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const { song_id, score, accuracy_percent } = req.body || {};

  if (!song_id || score === undefined) {
    return res.status(400).json({ error: 'song_id and score are required', code: 'VALIDATION_ERROR' });
  }

  // Get song
  const songResult = await db.execute({
    sql: 'SELECT * FROM songs WHERE id = ?',
    args: [song_id],
  });

  if (songResult.rows.length === 0) {
    return res.status(404).json({ error: 'Song not found', code: 'NOT_FOUND' });
  }

  const song = songResult.rows[0] as any;
  const xpEarned = Math.round(song.xp_reward * (score >= 90 ? 1.5 : score >= 70 ? 1.0 : 0.8));

  await db.execute({
    sql: 'INSERT INTO song_scores (user_id, song_id, score, accuracy_percent, xp_earned) VALUES (?, ?, ?, ?, ?)',
    args: [userId, song_id, score, accuracy_percent || score, xpEarned],
  });

  // Update user XP
  const userResult = await db.execute({
    sql: 'SELECT xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0] as any;
    const newXP = user.xp_total + xpEarned;
    const newLevel = calculateLevel(newXP);

    await db.execute({
      sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
      args: [newXP, newLevel, userId],
    });
  }

  return res.json({ success: true, score, xp_earned: xpEarned, accuracy_percent: accuracy_percent || score });
}

async function handleMyScores(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.execute({
    sql: `SELECT ss.*, s.title as song_title, s.artist
          FROM song_scores ss
          JOIN songs s ON ss.song_id = s.id
          WHERE ss.user_id = ?
          ORDER BY ss.played_at DESC
          LIMIT ? OFFSET ?`,
    args: [userId, String(limit), String(offset)],
  });

  const totalResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });

  return res.json({
    data: result.rows,
    pagination: { page, limit, total: Number(totalResult.rows[0].count), hasMore: offset + result.rows.length < Number(totalResult.rows[0].count) },
  });
}

async function handleLeaderboard(req: VercelRequest, res: VercelResponse) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.execute({
    sql: `SELECT u.id, u.username, u.xp_total, u.level, u.avatar_url,
                 MAX(ss.score) as best_score,
                 COUNT(ss.id) as songs_completed
          FROM users u
          LEFT JOIN song_scores ss ON u.id = ss.user_id
          GROUP BY u.id
          ORDER BY u.xp_total DESC
          LIMIT ? OFFSET ?`,
    args: [String(limit), String(offset)],
  });

  const totalResult = await db.execute('SELECT COUNT(*) as count FROM users');
  const total = totalResult.rows[0].count as number;

  return res.json({
    data: result.rows,
    pagination: { page, limit, total, hasMore: offset + result.rows.length < total },
  });
}

// ============ GAMIFICATION ============

async function handleProfile(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const userResult = await db.execute({
    sql: 'SELECT id, username, email, avatar_url, xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
  }

  const user = userResult.rows[0] as any;

  const streakResult = await db.execute({
    sql: 'SELECT current_streak, longest_streak, last_practice_date FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  const streak = streakResult.rows[0] as any || { current_streak: 0, longest_streak: 0, last_practice_date: null };

  const lessonsCompleted = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
    args: [userId],
  });

  const songsCompleted = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });

  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    xp_total: user.xp_total,
    level: user.level,
    level_name: getLevelName(user.level),
    streak: {
      current: streak.current_streak,
      longest: streak.longest_streak,
      last_practice: streak.last_practice_date,
    },
    lessons_completed: lessonsCompleted.rows[0].count,
    songs_completed: songsCompleted.rows[0].count,
  });
}

async function handleQuests(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  // For now, return daily quests based on user progress
  const today = new Date().toISOString().split('T')[0];

  const streakResult = await db.execute({
    sql: 'SELECT current_streak FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  const streak = (streakResult.rows[0] as any)?.current_streak || 0;

  const quests = [
    {
      id: 1,
      title: 'Practice Daily',
      description: 'Complete 1 lesson today',
      quest_type: 'lessons_complete',
      target_value: 1,
      current_value: 0,
      xp_reward: 25,
      is_completed: false,
      is_claimed: false,
      expires_at: today + 'T23:59:59Z',
    },
    {
      id: 2,
      title: 'Keep the Streak',
      description: `Practice with a ${streak + 1} day streak`,
      quest_type: 'streak',
      target_value: streak + 1,
      current_value: streak,
      xp_reward: 30,
      is_completed: false,
      is_claimed: false,
      expires_at: today + 'T23:59:59Z',
    },
  ];

  return res.json({ data: quests });
}

async function handleClaimQuest(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  // Extract quest ID from path like "gamification/quests/123/claim"
  const pathPart = req.query.path?.toString() || '';
  const match = pathPart.match(/gamification\/quests\/(\d+)\/claim/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid quest ID', code: 'VALIDATION_ERROR' });
  }
  const questId = Number(match[1]);

  // Quest rewards (hardcoded for now, matching handleQuests)
  const questRewards: Record<number, number> = {
    1: 25, // Practice Daily
    2: 30, // Keep the Streak
  };

  const xpReward = questRewards[questId] || 25;

  // Update user's XP and level
  const userResult = await db.execute({
    sql: 'SELECT xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  const user = userResult.rows[0] as any;
  const newXp = (user.xp_total || 0) + xpReward;
  const newLevel = calculateLevel(newXp);

  await db.execute({
    sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
    args: [newXp, newLevel, userId],
  });

  return res.json({
    success: true,
    xp_earned: xpReward,
    new_total_xp: newXp,
    new_level: newLevel,
  });
}

async function handleAchievements(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const achievementsResult = await db.execute('SELECT * FROM achievements');
  const userAchievementsResult = await db.execute({
    sql: 'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?',
    args: [userId],
  });

  const earnedIds = new Set(userAchievementsResult.rows.map((ua: any) => ua.achievement_id));
  const earnedMap = new Map(userAchievementsResult.rows.map((ua: any) => [ua.achievement_id, ua.earned_at]));

  const achievements = achievementsResult.rows.map((a: any) => ({
    ...a,
    earned: earnedIds.has(a.id),
    earned_at: earnedMap.get(a.id) || null,
  }));

  return res.json({ data: achievements });
}

async function handleMilestones(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const userResult = await db.execute({
    sql: 'SELECT xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  const streakResult = await db.execute({
    sql: 'SELECT longest_streak FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  const songCountResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });

  const user = userResult.rows[0] as any;
  const streak = (streakResult.rows[0] as any)?.longest_streak || 0;
  const songCount = (songCountResult.rows[0] as any)?.count || 0;

  const milestones = [
    { id: 'level_5', name: 'Reach Level 5', description: 'Reach level 5', achieved: user.level >= 5, icon: 'star' },
    { id: 'level_10', name: 'Reach Level 10', description: 'Reach level 10', achieved: user.level >= 10, icon: 'trophy' },
    { id: 'streak_30', name: '30 Day Streak', description: 'Practice for 30 days in a row', achieved: streak >= 30, icon: 'fire' },
    { id: 'songs_10', name: '10 Songs', description: 'Complete 10 songs', achieved: songCount >= 10, icon: 'music' },
  ];

  return res.json({ data: milestones });
}

// ============ STATS ============

async function handleStatsSummary(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const userResult = await db.execute({
    sql: 'SELECT xp_total, level FROM users WHERE id = ?',
    args: [userId],
  });

  const streakResult = await db.execute({
    sql: 'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?',
    args: [userId],
  });

  const today = new Date().toISOString().split('T')[0];
  const todayStatsResult = await db.execute({
    sql: 'SELECT * FROM daily_stats WHERE user_id = ? AND date = ?',
    args: [userId, today],
  });

  const lessonsResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
    args: [userId],
  });

  const songsResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });

  const user = userResult.rows[0] as any;
  const streak = streakResult.rows[0] as any || { current_streak: 0, longest_streak: 0 };
  const todayStats = todayStatsResult.rows[0] as any || { total_practice_seconds: 0, sessions_count: 0, lessons_completed: 0, songs_completed: 0, xp_earned: 0 };

  return res.json({
    xp_total: user?.xp_total || 0,
    level: user?.level || 1,
    level_name: getLevelName(user?.level || 1),
    streak: streak.current_streak || 0,
    longest_streak: streak.longest_streak || 0,
    today: {
      practice_seconds: todayStats.total_practice_seconds || 0,
      sessions: todayStats.sessions_count || 0,
      lessons_completed: todayStats.lessons_completed || 0,
      songs_completed: todayStats.songs_completed || 0,
      xp_earned: todayStats.xp_earned || 0,
    },
    totals: {
      lessons_completed: lessonsResult.rows[0].count || 0,
      songs_completed: songsResult.rows[0].count || 0,
    },
  });
}

async function handlePracticeStats(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });

  const period = req.query.period || 'week';
  let startDate: Date;
  const now = new Date();

  if (period === 'today') {
    startDate = new Date(now.toDateString());
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'all') {
    startDate = new Date(0);
  } else {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  }

  const result = await db.execute({
    sql: `SELECT date, total_practice_seconds, sessions_count, lessons_completed, songs_completed, xp_earned
          FROM daily_stats
          WHERE user_id = ? AND date >= ?
          ORDER BY date DESC`,
    args: [userId, startDate.toISOString().split('T')[0]],
  });

  const totals = {
    total_practice_seconds: 0,
    sessions_count: 0,
    lessons_completed: 0,
    songs_completed: 0,
    xp_earned: 0,
  };

  for (const row of result.rows) {
    const s = row as any;
    totals.total_practice_seconds += s.total_practice_seconds || 0;
    totals.sessions_count += s.sessions_count || 0;
    totals.lessons_completed += s.lessons_completed || 0;
    totals.songs_completed += s.songs_completed || 0;
    totals.xp_earned += s.xp_earned || 0;
  }

  return res.json({ period, ...totals, daily: result.rows });
}