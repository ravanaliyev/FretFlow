import { apiClient } from './client';
import type { Song, PaginatedResponse } from '../types/api';

/**
 * Songs API Client Endpoints
 * Manages song data: fetches the general catalog of songs
 * and single track profiles.
 */
export const songsApi = {
  /**
   * Retrieves a paginated listing of songs inside Level 4 libraries.
   */
  getAll: (page = 1, limit = 20) => 
    apiClient.get<PaginatedResponse<Song>>(`/api/songs?page=${page}&limit=${limit}`),
  
  /**
   * Retrieves full details and scroll tabs for a single song by its ID.
   */
  getById: (id: number) => 
    apiClient.get<Song>(`/api/songs/${id}`),
  
  /**
   * Submits active player score parameters.
   */
  submitScore: (songId: number, data: { score: number; accuracy_percent: number; xp_earned: number }) =>
    apiClient.post(`/api/scores`, { songId, ...data }),
};
