import { apiClient } from './client';
import type { GamificationProfile, Quest, Achievement } from '../types/api';

export const gamificationApi = {
  getProfile: () => apiClient.get<GamificationProfile>('/api/gamification/profile'),

  getQuests: () => apiClient.get<{ data: Quest[] }>('/api/gamification/quests'),

  claimQuest: (questId: number) =>
    apiClient.post<{ success: boolean; xp_earned: number; quest_id: number }>(
      `/api/gamification/quests/${questId}/claim`,
      {}
    ),

  getAchievements: () =>
    apiClient.get<{ data: Achievement[] }>('/api/gamification/achievements'),

  getMilestones: () => apiClient.get<{ data: unknown[] }>('/api/gamification/milestones'),
};