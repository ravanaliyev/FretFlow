import { apiClient } from './client';
import type { PracticeStats, StatsSummary } from '../types/api';

/**
 * Stats API Client Endpoints
 * Bridges analytical metrics: fetches weekly/monthly practice charts,
 * accuracy timelines, activity grids, and profile summaries.
 */
export const statsApi = {
  /**
   * Retrieves practice volumes (minutes spent practicing) over a chosen period.
   */
  getPractice: (period: 'today' | 'week' | 'month' | 'all' = 'week') =>
    apiClient.get<PracticeStats>('/api/stats/practice', { params: { period } }),

  /**
   * Retrieves average hit accuracy rates plotted across dates.
   */
  getAccuracy: () => apiClient.get<{ data: Array<{ date: string; avg_accuracy: number }> }>('/api/stats/accuracy'),

  /**
   * Retrieves chronological user event metrics.
   */
  getActivity: () => apiClient.get<{ data: unknown[] }>('/api/stats/activity'),

  /**
   * Retrieves aggregate user dashboard parameters (streak, lessons count, average accuracy, total XP).
   */
  getSummary: () => apiClient.get<StatsSummary>('/api/stats/summary'),
};