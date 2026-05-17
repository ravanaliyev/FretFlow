import { apiClient } from './client';
import type { Lesson, PaginatedResponse } from '../types/api';

/**
 * Lessons API Client Endpoints
 * Bridges client queries targeting public lessons, returning paginated lists of courses
 * or detail fields for specific courses.
 */
export const lessonsApi = {
  /**
   * Retrieves a paginated list of all active lessons in the curriculum.
   */
  getAll: (page?: number, limit?: number) =>
    apiClient.get<PaginatedResponse<Lesson>>('/api/lessons', { params: { page: page ?? 1, limit: limit ?? 50 } }),

  /**
   * Retrieves single lesson details and note tabs by ID.
   */
  getById: (id: number) =>
    apiClient.get<Lesson>(`/api/lessons/${id}`),
};