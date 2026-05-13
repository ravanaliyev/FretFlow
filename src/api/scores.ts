import { apiClient } from './client';

interface LeaderboardEntry {
  id: number;
  username: string;
  xp_total: number;
  level: number;
  avatar_url: string | null;
  best_score: number | null;
  songs_completed: number;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const scoresApi = {
  getLeaderboard: (page?: number, limit?: number) =>
    apiClient.get<LeaderboardResponse>('/api/scores/leaderboard', { params: { page: page ?? 1, limit: limit ?? 20 } }),

  getMyScores: () =>
    apiClient.get<{ data: unknown[]; pagination: unknown }>('/api/scores/me'),

  submitScore: (songId: number, score: number, accuracyPercent?: number) =>
    apiClient.post<{ success: boolean; score: number; xp_earned: number; accuracy_percent: number }>(
      '/api/scores',
      { song_id: songId, score, accuracy_percent: accuracyPercent }
    ),
};