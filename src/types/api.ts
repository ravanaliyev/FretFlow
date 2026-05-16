export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  best_score: number;
  notation_style?: 'scientific' | 'syllabic';
  is_lefty?: boolean;
  role?: 'ADMIN' | 'STUDENT';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
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

export interface Lesson {
  id: number;
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
  level?: number;
}

export interface DashboardLesson {
  id: number;
  title: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'available' | 'locked' | 'completed';
  sequence: string[];
  desc: string;
}

export interface Progress {
  id: number;
  user_id: number;
  lesson_id: number;
  is_completed: boolean;
  attempts: number;
  best_accuracy: number | null;
  last_attempt_result: string | null;
  completed_at: string | null;
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
  best_score: number;
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
  earned: boolean;
  earned_at: string | null;
}

export interface PracticeStats {
  data: Array<{
    date: string;
    total_practice_seconds: number;
    sessions_count: number;
    lessons_completed: number;
    songs_completed: number;
    xp_earned: number;
    avg_accuracy: number | null;
  }>;
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  lessons_completed: number;
}

export interface StatsSummary {
  total_xp: number;
  level: number;
  level_name: string;
  streak_current: number;
  streak_longest: number;
  lessons_completed: number;
  songs_completed: number;
  today_practice_seconds: number;
  today_xp: number;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  last_updated: string;
}

export interface DuelParticipant {
  id: number;
  username: string;
}

export interface Duel {
  id: number;
  invite_code: string;
  invite_url: string;
  status: 'waiting' | 'active' | 'started' | 'finished';
  host_user_id: number;
  host_username: string;
  guest_user_id: number | null;
  guest_username: string | null;
  song_id: number | null;
  host_score: number | null;
  host_accuracy: number | null;
  guest_score: number | null;
  guest_accuracy: number | null;
  winner_user_id: number | null;
  host_ready?: boolean;
  guest_ready?: boolean;
  started_at?: string | null;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  difficulty: number;
  notes: string; // JSON string
  xp_reward: number;
  best_score?: number | null;
}