import { apiClient } from './client';
import type { AuthResponse } from '../types/api';

/**
 * Kimlik Doğrulama (Authentication) API Uç Noktaları
 * 
 * Bu dosya, kullanıcıların sisteme kaydolması, giriş yapması, sistemden güvenli çıkış yapması
 * ve aktif oturum bilgilerini (kullanıcı detayları, seviye, toplam XP) backend sunucusundan talep etmesi
 * için gerekli API çağrılarını tanımlar.
 */
export const authApi = {
  /**
   * login - Mevcut bir kullanıcıyı e-posta ve şifresi ile sisteme dahil eder (Giriş yapar).
   * @param email - Kullanıcının kayıtlı e-posta adresi
   * @param password - Kullanıcının şifresi
   */
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/auth/login', { email, password }),

  /**
   * register - Sisteme sıfırdan yeni bir kullanıcı kaydeder (Üye olur).
   * @param email - Kaydolacak e-posta adresi
   * @param password - Belirlenen şifre
   * @param username - Benzersiz kullanıcı adı
   */
  register: (email: string, password: string, username: string) =>
    apiClient.post<AuthResponse>('/api/auth/register', { email, password, username }),

  /**
   * refresh - Oturum süresi dolan kullanıcıların sessizce arka planda yeni token almasını sağlar.
   * @param refreshToken - Tarayıcıda saklanan güvenli oturum yenileme token'ı
   */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  /**
   * logout - Aktif kullanıcı oturumunu veritabanından silerek sonlandırır (Çıkış yapar).
   */
  logout: () => apiClient.post('/api/auth/logout', {}),

  /**
   * me - O an giriş yapmış olan aktif kullanıcının profil bilgilerini (XP, seviye, avatar vb.) çeker.
   */
  me: () => apiClient.get<AuthResponse['user']>('/api/auth/me'),
};