export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  role?: 'ADMIN' | 'STUDENT';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

export interface Progress {
  lesson_id: number;
  is_completed: boolean;
  attempts: number;
  best_accuracy: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface GamificationProfile {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  level_name: string;
  streak: {
    current: number;
    longest: number;
    last_practice: string | null;
  };
  lessons_completed: number;
  songs_completed: number;
}

export interface Quest {
  id: number;
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

export interface PracticeStats {
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  lessons_completed: number;
}

export interface StatsSummary {
  total_xp: number;
  level: number;
  lessons_completed: number;
  songs_completed: number;
  total_practice_minutes: number;
  current_streak: number;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  last_updated: string;
}