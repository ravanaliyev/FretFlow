import { apiClient } from './client';
import type { PracticeStats, StatsSummary } from '../types/api';

/**
 * Kullanıcı Analitik İstatistikleri (Stats) API Uç Noktaları
 * 
 * Bu dosya, kullanıcının çalışma performansını görselleştirmek amacıyla kullanılır.
 * Haftalık/aylık pratik süreleri (dakika), nota basma doğruluk yüzdeleri, kronolojik aktivite
 * dökümleri ve dashboard genel başarı özetleri (özet XP, ders sayıları) bu API'lerden çekilir.
 */
export const statsApi = {
  /**
   * getPractice - Belirli bir zaman aralığında kullanıcının kaç dakika pratik yaptığını çeker.
   * @param period - Analiz zaman aralığı ('today' | 'week' | 'month' | 'all', Varsayılan: 'week')
   */
  getPractice: (period: 'today' | 'week' | 'month' | 'all' = 'week') =>
    apiClient.get<PracticeStats>('/api/stats/practice', { params: { period } }),

  /**
   * getAccuracy - Zaman içerisindeki ortalama nota basma doğruluk oranlarını grafik için çeker.
   */
  getAccuracy: () => apiClient.get<{ data: Array<{ date: string; avg_accuracy: number }> }>('/api/stats/accuracy'),

  /**
   * getActivity - Kullanıcının yaptığı tüm kronolojik hareketleri (öğrenim etkinlikleri) listeler.
   */
  getActivity: () => apiClient.get<{ data: unknown[] }>('/api/stats/activity'),

  /**
   * getSummary - Kullanıcının genel başarı özetini (streak, tamamlanan ders sayısı, ortalama doğruluk, toplam XP) tek seferde getirir.
   */
  getSummary: () => apiClient.get<StatsSummary>('/api/stats/summary'),
};