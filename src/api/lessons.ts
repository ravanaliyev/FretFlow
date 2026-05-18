import { apiClient } from './client';
import type { Lesson, PaginatedResponse } from '../types/api';

/**
 * Ders Müfredatı (Lessons) API Uç Noktaları
 * 
 * Bu dosya, gitar eğitim müfredatında yer alan interaktif dersleri (akort dersleri,
 * melodi pratikleri, nota eğitimleri) toplu olarak veya ID bazlı tekil detay olarak
 * backend sunucusundan çekmek için kullanılan fonksiyonları tanımlar.
 */
export const lessonsApi = {
  /**
   * getAll - Müfredattaki tüm derslerin listesini sayfa sayfa (paginated) sunucudan çeker.
   * @param page - İstenecek aktif sayfa numarası (Boş bırakılırsa varsayılan: 1)
   * @param limit - Sayfa başına getirilecek maksimum ders sayısı (Boş bırakılırsa varsayılan: 50)
   */
  getAll: (page?: number, limit?: number) =>
    apiClient.get<PaginatedResponse<Lesson>>('/api/lessons', { params: { page: page ?? 1, limit: limit ?? 50 } }),

  /**
   * getById - Belirli bir dersi benzersiz ID'si üzerinden detaylarıyla (başlık, açıklama, hedef notalar) talep eder.
   * @param id - Detayları çekilecek olan dersin ID'si
   */
  getById: (id: number) =>
    apiClient.get<Lesson>(`/api/lessons/${id}`),
};