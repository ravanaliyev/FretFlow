import { apiClient } from './client';

/**
 * Interface representing a recorded learning event.
 */
export interface HistoryItem {
  id: number;
  lesson_id: number;
  lesson_title: string;
  date: string;              // "Jan 25" style localized date stamp
  duration_seconds: number;  // Time spent in active practice sessions
}

/**
 * History API Client Endpoints
 * Bridges learning logs: saving session metrics to database records
 * to feed the analytics charts.
 */
export const historyApi = {
  /**
   * Retrieves all logged history item events.
   */
  getAll: () => 
    apiClient.get<HistoryItem[]>('/api/history'),
    
  /**
   * Appends a new learning log to the database.
   * Auto-formats dates to "ShortMonth Day" strings.
   */
  add: (lessonId: number, lessonTitle: string, durationSeconds: number = 0) => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return apiClient.post<{ success: boolean; id: number }>('/api/history', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      date: today,
      duration_seconds: durationSeconds
    });
  },

  /**
   * Deletes all learning logs.
   */
  clearAll: () =>
    apiClient.delete<{ success: boolean; message: string }>('/api/history')
};
