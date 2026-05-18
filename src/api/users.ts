import { apiClient } from './client';
import type { User } from '../types/api';

/**
 * Kullanıcı Tercihleri ve Profil (Users) API Uç Noktaları
 * 
 * Bu dosya, kullanıcının kendi profil detaylarını almasını ve solak gitar çalma ayarı (is_lefty),
 * nota gösterim stili (notation_style - hece/bilimsel) gibi kişisel arayüz tercihlerini 
 * sunucuda güncellemesini sağlayan API çağrılarını barındırır.
 */
export const usersApi = {
  /**
   * getMe - Giriş yapmış kullanıcının profil bilgilerini (kullanıcı adı, avatar, solaklık durumu vb.) çeker.
   */
  getMe: () => apiClient.get<User>('/api/users/me'),
  
  /**
   * updateMe - Kullanıcının profil bilgilerini veya kişiselleştirilmiş site tercihlerini günceller.
   * @param data - Güncellenecek profil alanları (username, avatar_url, notation_style, is_lefty)
   */
  updateMe: (data: { username?: string; avatar_url?: string; notation_style?: string; is_lefty?: boolean }) => 
    apiClient.put<User>('/api/users/me', data),
};
