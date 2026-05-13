export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  created_at: string;
}

export interface Streak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  notes: string; // JSON array
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  is_completed: boolean;
  attempts: number;
  best_accuracy: number | null;
  last_attempt_result: string | null; // JSON
  completed_at: string | null;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  difficulty: number;
  notes: string; // JSON
  xp_reward: number;
}

export interface SongScore {
  id: number;
  user_id: number;
  song_id: number;
  score: number;
  accuracy_percent: number;
  xp_earned: number;
  played_at: string;
}

export interface Quest {
  id: number;
  user_id: number;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  expires_at: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface PracticeSession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  notes_played: string; // JSON array
  lesson_id: number | null;
  song_id: number | null;
  created_at: string;
}

export interface DailyStats {
  id: number;
  user_id: number;
  date: string;
  total_practice_seconds: number;
  sessions_count: number;
  lessons_completed: number;
  songs_completed: number;
  xp_earned: number;
  avg_accuracy: number | null;
}

export interface AdminUser {
  id: number;
  user_id: number;
  permissions: string; // JSON
  created_at: string;
}

export interface AuthPayload {
  sub: number;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}