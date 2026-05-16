import { apiClient } from './client';
import type { Song, PaginatedResponse } from '../types/api';

export const songsApi = {
  getAll: (page = 1, limit = 20) => 
    apiClient.get<PaginatedResponse<Song>>(`/api/songs?page=${page}&limit=${limit}`),
  
  getById: (id: number) => 
    apiClient.get<Song>(`/api/songs/${id}`),
  
  submitScore: (songId: number, data: { score: number; accuracy_percent: number; xp_earned: number }) =>
    apiClient.post(`/api/scores`, { songId, ...data }),
};
