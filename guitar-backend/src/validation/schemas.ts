import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(30, 'Username must be at most 30 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Lesson schemas
export const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  notes: z.string().min(1, 'Notes are required'),
  difficulty: z.number().int().min(1).max(10).optional(),
  xp_reward: z.number().int().min(0).max(1000).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  notes: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).optional(),
  xp_reward: z.number().int().min(0).max(1000).optional(),
  order_index: z.number().int().min(0).optional(),
}).strict();

export const lessonQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Score schemas
export const submitScoreSchema = z.object({
  song_id: z.number().int().positive('song_id must be a positive integer'),
  score: z.number().int().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100'),
  accuracy_percent: z.number().min(0).max(100).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ID param schema
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number),
});

// Progress schemas
export const progressSchema = z.object({
  lesson_id: z.number().int().positive(),
  completed: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
  accuracy: z.number().min(0).max(100).optional(),
});

// Song schemas
export const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  difficulty: z.number().int().min(1).max(10).optional(),
  duration_seconds: z.number().int().positive().optional(),
});

// History schemas
export const historySchema = z.object({
  lesson_id: z.number().int().positive(),
  lesson_title: z.string().min(1).max(200),
  date: z.string().datetime({ message: 'Invalid date format' }),
  duration_seconds: z.number().int().min(0).optional(),
});

// Practice session schemas
export const practiceSessionSchema = z.object({
  duration_seconds: z.number().int().positive(),
  lesson_id: z.number().int().positive().optional(),
  notes_played: z.array(z.string()).optional(),
  started_at: z.string().datetime({ message: 'Invalid datetime format' }).optional(),
});

// Stats query schemas
export const statsPeriodSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
});

export const statsLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});