import { apiClient } from './client';
import type { GamificationProfile, Quest, Achievement } from '../types/api';

/**
 * Gamification API Client Endpoints
 * Manages game systems: retrieving player XP profiles, active daily quests,
 * claiming completed quest rewards, achievements collection, and target milestones.
 */
export const gamificationApi = {
  /**
   * Retrieves player stats (level, xp, streaks, active multipliers).
   */
  getProfile: () => apiClient.get<GamificationProfile>('/api/gamification/profile'),

  /**
   * Retrieves active daily or weekly quests.
   */
  getQuests: () => apiClient.get<{ data: Quest[] }>('/api/gamification/quests'),

  /**
   * Claims rewards and XP for a finished quest by its ID.
   */
  claimQuest: (questId: number) =>
    apiClient.post<{ success: boolean; xp_earned: number; quest_id: number }>(
      `/api/gamification/quests/${questId}/claim`,
      {}
    ),

  /**
   * Retrieves unlocked and locked achievements/badges.
   */
  getAchievements: () =>
    apiClient.get<{ data: Achievement[] }>('/api/gamification/achievements'),

  /**
   * Retrieves locked progress milestones thresholds.
   */
  getMilestones: () => apiClient.get<{ data: unknown[] }>('/api/gamification/milestones'),
};