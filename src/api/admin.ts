import { apiClient } from './client';

/**
 * Interface representing incoming new lesson payloads.
 */
interface LessonInput {
  title: string;
  description: string;
  notes: string;       // JSON string of guitar tabs
  difficulty: number;  // 1 = Easy, 2 = Medium, 3 = Hard
  xp_reward: number;   // XP points awarded on completion
  order_index: number; // Curricular ordering sort value
}

/**
 * Interface representing standard registered lesson objects from SQLite.
 */
interface Lesson {
  id: number;
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

/**
 * Admin API Client Endpoints
 * Orchestrates administrative operations: creating, updating, deleting,
 * and reordering curriculum lessons in the database.
 */
export const adminApi = {
  /**
   * Registers a brand new lesson in the database.
   */
  createLesson: (lesson: LessonInput) =>
    apiClient.post<Lesson>('/api/lessons', lesson),

  /**
   * Modifies an existing lesson's metadata by its ID.
   */
  updateLesson: (id: number, lesson: Partial<LessonInput>) =>
    apiClient.put<Lesson>(`/api/lessons/${id}`, lesson),

  /**
   * Deletes a lesson by its ID.
   */
  deleteLesson: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/api/lessons/${id}`),

  /**
   * Swaps the curriculum ordering positions of two lessons.
   */
  reorderLessons: (lessonId1: number, lessonId2: number) =>
    apiClient.post<{ success: boolean }>('/api/admin/lessons/reorder', { lessonId1, lessonId2 }),
};