import { apiClient } from './client';
import type { User } from '../types/api';

/**
 * Users API Client Endpoints
 * Bridges profile configurations: fetches current user details
 * and synchronizes custom notation or visual layout selections.
 */
export const usersApi = {
  /**
   * Retrieves profile details for the currently logged in session.
   */
  getMe: () => apiClient.get<User>('/api/users/me'),
  
  /**
   * Updates standard user fields or interface preference properties.
   */
  updateMe: (data: { username?: string; avatar_url?: string; notation_style?: string; is_lefty?: boolean }) => 
    apiClient.put<User>('/api/users/me', data),
};
