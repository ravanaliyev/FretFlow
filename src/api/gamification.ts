import { apiClient } from './client';
import type { GamificationProfile, Quest, Achievement } from '../types/api';

/**
 * Oyunlaştırma (Gamification) API Uç Noktaları
 * 
 * Bu dosya, FretFlow'un oyunlaştırma altyapısını yönetir. Kullanıcının seviyesi (level), 
 * biriken toplam XP'si, günlük ders çalışma alışkanlığı serisi (streak), aktif günlük görevleri (quests),
 * başarı rozetleri (achievements) ve kilit taşı hedefleri (milestones) bu servis aracılığıyla sunucudan çekilir.
 */
export const gamificationApi = {
  /**
   * getProfile - Oyuncunun seviye, tecrübe puanı (XP), günlük pratik streak'i gibi detaylı oyun istatistiklerini çeker.
   */
  getProfile: () => apiClient.get<GamificationProfile>('/api/gamification/profile'),

  /**
   * getQuests - Kullanıcının tamamlaması gereken günlük ve haftalık aktif görevleri (Daily Quests) çeker.
   */
  getQuests: () => apiClient.get<{ data: Quest[] }>('/api/gamification/quests'),

  /**
   * claimQuest - Tamamlanan bir görevin ödülünü (XP ve rozet ödülleri) talep eder ve hesaba işler.
   * @param questId - Ödülü talep edilecek görevin benzersiz ID'si
   */
  claimQuest: (questId: number) =>
    apiClient.post<{ success: boolean; xp_earned: number; quest_id: number }>(
      `/api/gamification/quests/${questId}/claim`,
      {}
    ),

  /**
   * getAchievements - Kullanıcının kazandığı (kilidini açtığı) ve henüz açamadığı başarı rozetlerini (Badges) getirir.
   */
  getAchievements: () =>
    apiClient.get<{ data: Achievement[] }>('/api/gamification/achievements'),

  /**
   * getMilestones - Kullanıcının gelecekteki hedeflerini gösteren kilit taşı eşiklerini (Milestones) listeler.
   */
  getMilestones: () => apiClient.get<{ data: unknown[] }>('/api/gamification/milestones'),
};