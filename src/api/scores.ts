import { apiClient } from './client';

/**
 * Interface representing a player entry on the global podium/leaderboard.
 */
interface LeaderboardEntry {
  id: number;
  username: string;
  xp_total: number;
  level: number;
  avatar_url: string | null;
  best_score: number | null;
  songs_completed: number;
}

/**
 * Interface representing the paginated leaderboard server response.
 */
interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Scores API Client Endpoints
 * Bridges leaderboard metrics: fetches global leaderboards, gets personal scores,
 * submits song performance scores, and registers daily challenge high scores.
 */
export const scoresApi = {
  /**
   * Retrieves the global paginated player leaderboard sorted by total XP.
   */
  getLeaderboard: (page?: number, limit?: number) =>
    apiClient.get<LeaderboardResponse>('/api/scores/leaderboard', { params: { page: page ?? 1, limit: limit ?? 20 } }),

  /**
   * Retrieves list of all personal scores mapped against played songs.
   */
  getMyScores: () =>
    apiClient.get<{ data: unknown[]; pagination: unknown }>('/api/scores/me'),

  /**
   * Submits song performance results (raw score and percentage accuracy),
   * calculating XP boosts and updating personal high scores.
   */
  submitScore: (songId: number, score: number, accuracyPercent?: number) =>
    apiClient.post<{ success: boolean; score: number; xp_earned: number; accuracy_percent: number }>(
      '/api/scores',
      { song_id: songId, score, accuracy_percent: accuracyPercent }
    ),

  /**
   * Submits daily game challenges scores to record potential new personal high score cards.
   */
  submitChallengeScore: (score: number) =>
    apiClient.post<{ success: boolean; best_score: number; new_record: boolean }>(
      '/api/scores/challenge',
      { score }
    ),
};