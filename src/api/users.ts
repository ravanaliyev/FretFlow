import { apiClient } from './client';
import type { User } from '../types/api';

export const usersApi = {
  getMe: () => apiClient.get<User>('/api/users/me'),
  updateMe: (data: { username?: string; avatar_url?: string; notation_style?: string; is_lefty?: boolean }) => 
    apiClient.put<User>('/api/users/me', data),
};
