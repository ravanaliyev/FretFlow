import { apiClient } from './client';
import type { AuthResponse } from '../types/api';

/**
 * Authentication API Client Endpoints
 * Bridges credential logins, accounts registration, session refresh rotations,
 * user logouts, and token verification checks.
 */
export const authApi = {
  /**
   * Logs in a user with email and password.
   */
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/login', { email, password }),

  /**
   * Registers a new user account with email, password, and username.
   */
  register: (email: string, password: string, username: string) =>
    apiClient.post<AuthResponse>('/api/auth/register', { email, password, username }),

  /**
   * Performs silent token rotation by sending a stored refresh token.
   */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  /**
   * Ends the user's active session, purging token listings.
   */
  logout: () => apiClient.post('/api/auth/logout', {}),

  /**
   * Queries profile metadata for the currently logged in user session.
   */
  me: () => apiClient.get<AuthResponse['user']>('/api/auth/me'),
};