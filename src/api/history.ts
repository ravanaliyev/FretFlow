import { apiClient } from './client';

export interface HistoryItem {
  id: number;
  lesson_id: number;
  lesson_title: string;
  date: string;
  duration_seconds: number;
}

export const historyApi = {
  getAll: () => 
    apiClient.get<HistoryItem[]>('/api/history'),
    
  add: (lessonId: number, lessonTitle: string, durationSeconds: number = 0) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return apiClient.post<{ success: boolean; id: number }>('/api/history', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      date: today,
      duration_seconds: durationSeconds
    });
  },

  clearAll: () =>
    apiClient.delete<{ success: boolean; message: string }>('/api/history')
};
