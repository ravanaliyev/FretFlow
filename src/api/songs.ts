import { apiClient } from './client';
import type { Song, PaginatedResponse } from '../types/api';

/**
 * Şarkı Kütüphanesi (Songs) API Uç Noktaları
 * 
 * Bu dosya, Seviye 4 kapsamında yer alan tüm çalınabilir şarkıların listesini çekmek,
 * tek bir şarkının detaylarını ve nota zamanlama haritalarını (tabs) almak ve
 * şarkı çalındığında elde edilen performansı (skor, doğruluk oranı ve kazanılan XP)
 * sunucuya kaydetmek için kullanılır.
 */
export const songsApi = {
  /**
   * getAll - Şarkı kütüphanesindeki tüm parçaları sayfa sayfa (paginated) talep eder.
   * @param page - Çekilecek aktif sayfa numarası (Varsayılan: 1)
   * @param limit - Sayfa başına getirilecek maksimum şarkı sayısı (Varsayılan: 20)
   */
  getAll: (page = 1, limit = 20) => 
    apiClient.get<PaginatedResponse<Song>>(`/api/songs?page=${page}&limit=${limit}`),
  
  /**
   * getById - Belirli bir şarkıyı benzersiz ID'si üzerinden detaylarıyla çeker.
   * @param id - Detayları ve notaları istenecek olan şarkının ID'si
   */
  getById: (id: number) => 
    apiClient.get<Song>(`/api/songs/${id}`),
  
  /**
   * submitScore - Şarkı tamamlandığında elde edilen başarı skorunu veritabanına kaydeder.
   * @param songId - Çalınan şarkının benzersiz ID'si
   * @param data - Çalma performansı (skor değeri, doğruluk yüzdesi ve kazanılan toplam XP)
   */
  submitScore: (songId: number, data: { score: number; accuracy_percent: number; xp_earned: number }) =>
    apiClient.post(`/api/scores`, { songId, ...data }),
};
