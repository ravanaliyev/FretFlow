import { apiClient } from './client';
import type { LessonProgress } from '../types/api';

interface ProgressResponse {
  data: Array<LessonProgress & {
    title: string;
    description: string;
    difficulty: number;
  }>;
}

interface SubmitProgressResponse {
  success: boolean;
  is_completed: boolean;
  xp_earned: number;
  accuracy: number;
}

export const progressApi = {
  getLessonProgress: () =>
    apiClient.get<ProgressResponse>('/api/progress/lessons'),

  submitProgress: (lessonId: number, accuracy: number, notesPlayed: string[]) =>
    apiClient.post<SubmitProgressResponse>('/api/progress/lessons', {
      lesson_id: lessonId,
      accuracy,
      notes_played: notesPlayed,
    }),
};