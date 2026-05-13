import { apiClient } from './client';
import type { PracticeStats, StatsSummary } from '../types/api';

export const statsApi = {
  getPractice: (period: 'today' | 'week' | 'month' | 'all' = 'week') =>
    apiClient.get<PracticeStats>('/api/stats/practice', { params: { period } }),

  getAccuracy: () => apiClient.get<{ data: Array<{ date: string; avg_accuracy: number }> }>('/api/stats/accuracy'),

  getActivity: () => apiClient.get<{ data: unknown[] }>('/api/stats/activity'),

  getSummary: () => apiClient.get<StatsSummary>('/api/stats/summary'),
};