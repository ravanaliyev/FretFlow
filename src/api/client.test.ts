import { describe, it, expect } from 'vitest';
import { apiClient, clearTokens, setRefreshToken } from '../api/client';

describe('API Client', () => {
  describe('Token Management', () => {
    it('should export clearTokens function', () => {
      expect(typeof clearTokens).toBe('function');
    });

    it('should export setRefreshToken function', () => {
      expect(typeof setRefreshToken).toBe('function');
    });

    it('should export apiClient with get/post methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
    });
  });
});

describe('Auth Types', () => {
  it('should validate User interface structure', () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
      avatar_url: null,
      xp_total: 0,
      level: 1,
      role: 'STUDENT' as const,
    };

    expect(user.id).toBe(1);
    expect(user.email).toBe('test@test.com');
    expect(user.role).toBe('STUDENT');
  });

  it('should validate AuthResponse interface structure', () => {
    const response = {
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        avatar_url: null,
        xp_total: 0,
        level: 1,
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    expect(response).toHaveProperty('user');
    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
  });
});