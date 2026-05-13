import { apiClient } from './client';

interface LessonInput {
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

export const adminApi = {
  createLesson: (lesson: LessonInput) =>
    apiClient.post<Lesson>('/api/lessons', lesson),

  updateLesson: (id: number, lesson: Partial<LessonInput>) =>
    apiClient.put<Lesson>(`/api/lessons/${id}`, lesson),

  deleteLesson: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/api/lessons/${id}`),
};