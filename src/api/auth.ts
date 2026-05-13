import { apiClient } from './client';
import type { AuthResponse } from '../types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/login', { email, password }),

  register: (email: string, password: string, username: string) =>
    apiClient.post<AuthResponse>('/api/auth/register', { email, password, username }),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/api/auth/logout', {}),

  me: () => apiClient.get<AuthResponse['user']>('/api/auth/me'),
};