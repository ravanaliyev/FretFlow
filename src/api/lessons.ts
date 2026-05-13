import { apiClient } from './client';
import type { Lesson, PaginatedResponse } from '../types/api';

export const lessonsApi = {
  getAll: (page?: number, limit?: number) =>
    apiClient.get<PaginatedResponse<Lesson>>('/api/lessons', { params: { page: page ?? 1, limit: limit ?? 50 } }),

  getById: (id: number) =>
    apiClient.get<Lesson>(`/api/lessons/${id}`),
};