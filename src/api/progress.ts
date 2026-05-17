import { apiClient } from './client';
import type { Progress } from '../types/api';

/**
 * Interface representing backend lists of lesson progress metadata.
 */
interface ProgressResponse {
  data: Array<Progress & {
    title: string;
    description: string;
    difficulty: number;
  }>;
}

/**
 * Interface representing successful lesson completion reports.
 */
interface SubmitProgressResponse {
  success: boolean;
  is_completed: boolean;
  xp_earned: number;      // Calculated XP reward based on lesson difficulty and accuracy
  accuracy: number;       // Average hit accuracy (percentage)
}

/**
 * Progress API Client Endpoints
 * Bridges progress checks: retrieves all user lesson progress records
 * and submits finished lesson scores, accuracy, and note attempts.
 */
export const progressApi = {
  /**
   * Retrieves all completed or in-progress lesson records for the authenticated user.
   */
  getLessonProgress: () =>
    apiClient.get<ProgressResponse>('/api/progress/lessons'),

  /**
   * Submits lesson results (accuracy rates and recorded notes played) to calculate
   * completion parameters, award XP bonuses, and unlock subsequent levels.
   */
  submitProgress: (lessonId: number, accuracy: number, notesPlayed: string[]) =>
    apiClient.post<SubmitProgressResponse>('/api/progress/lessons', {
      lesson_id: lessonId,
      accuracy,
      notes_played: notesPlayed,
    }),
};