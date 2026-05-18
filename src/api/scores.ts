import { apiClient } from './client';

/**
 * Global Sıralama Podyumu Kullanıcı Veri Arayüzü (LeaderboardEntry)
 */
interface LeaderboardEntry {
  id: number;
  username: string;
  xp_total: number;
  level: number;
  avatar_url: string | null;
  best_score: number | null;
  songs_completed: number;
}

/**
 * Sayfalanmış (Paginated) Sıralama Listesi Sunucu Cevap Arayüzü (LeaderboardResponse)
 */
interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Skorlar ve Sıralamalar (Scores & Leaderboard) API Uç Noktaları
 * 
 * Bu dosya, küresel liderlik tablosunu (leaderboard) sayfa sayfa çekmek, kullanıcının kişisel 
 * en iyi performanslarını almak ve çalınan şarkı veya günlük meydan okuma (daily challenge) 
 * sonuçlarını veritabanına işlemek için kullanılır.
 */
export const scoresApi = {
  /**
   * getLeaderboard - Genel tecrübe puanına (XP) göre sıralanmış küresel sıralama tablosunu çeker.
   * @param page - İstenecek olan sayfa numarası (Boş bırakılırsa varsayılan: 1)
   * @param limit - Sayfa başına listelenecek maksimum kullanıcı sayısı (Boş bırakılırsa varsayılan: 20)
   */
  getLeaderboard: (page?: number, limit?: number) =>
    apiClient.get<LeaderboardResponse>('/api/scores/leaderboard', { params: { page: page ?? 1, limit: limit ?? 20 } }),

  /**
   * getMyScores - Aktif kullanıcının bugüne kadar çaldığı şarkıların detaylı skor geçmişini listeler.
   */
  getMyScores: () =>
    apiClient.get<{ data: unknown[]; pagination: unknown }>('/api/scores/me'),

  /**
   * submitScore - Seviye 4 şarkısı tamamlandığında başarı skorunu ve doğruluk yüzdesini kaydeder.
   * @param songId - Çalınan şarkının ID numarası
   * @param score - Elde edilen başarı skoru
   * @param accuracyPercent - Vuruşların doğruluk yüzdesi (Örn: 98.5)
   */
  submitScore: (songId: number, score: number, accuracyPercent?: number) =>
    apiClient.post<{ success: boolean; score: number; xp_earned: number; accuracy_percent: number }>(
      '/api/scores',
      { song_id: songId, score, accuracy_percent: accuracyPercent }
    ),

  /**
   * submitChallengeScore - Günlük meydan okuma (Daily Challenge) skorunu sunucuya gönderir ve yeni rekor kırılıp kırılmadığını raporlar.
   * @param score - Meydan okumadan elde edilen nihai skor değeri
   */
  submitChallengeScore: (score: number) =>
    apiClient.post<{ success: boolean; best_score: number; new_record: boolean }>(
      '/api/scores/challenge',
      { score }
    ),
};