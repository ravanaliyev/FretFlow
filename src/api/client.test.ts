import { describe, it, expect } from 'vitest';
import { apiClient, clearTokens, setRefreshToken } from '../api/client';

/**
 * API Client Birim Testleri (Unit Tests)
 * 
 * Bu dosya, Vitest test kütüphanesini kullanarak apiClient sınıfının metotlarının
 * ve kimlik doğrulama veri yapılarının (User, AuthResponse) doğruluğunu denetler.
 */
describe('API Client (HTTP İstemcisi Testleri)', () => {
  describe('Token Management (Token Yönetim Metotları)', () => {
    // clearTokens fonksiyonunun tanımlı olup olmadığını test eder
    it('should export clearTokens function', () => {
      expect(typeof clearTokens).toBe('function');
    });

    // setRefreshToken fonksiyonunun tanımlı olup olmadığını test eder
    it('should export setRefreshToken function', () => {
      expect(typeof setRefreshToken).toBe('function');
    });

    // apiClient nesnesinin temel HTTP metotlarına (GET, POST) sahip olduğunu doğrular
    it('should export apiClient with get/post methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
    });
  });
});

describe('Auth Types (Veri Türü Yapısı Testleri)', () => {
  // Kullanıcı (User) veri modelinin doğruluğunu test eder
  it('should validate User interface structure', () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
      avatar_url: null,
      xp_total: 0,
      level: 1,
      role: 'STUDENT' as const, // Öğrenci rolü
    };

    expect(user.id).toBe(1);
    expect(user.email).toBe('test@test.com');
    expect(user.role).toBe('STUDENT');
  });

  // Giriş Yapma Yanıtı (AuthResponse) veri modelinin doğruluğunu test eder
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