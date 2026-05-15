import { apiClient } from './client';
import type { User } from '../types/api';

export const usersApi = {
  getMe: () => apiClient.get<User>('/api/users/me'),
  updateMe: (data: { username?: string; avatar_url?: string }) => 
    apiClient.put<User>('/api/users/me', data),
};
