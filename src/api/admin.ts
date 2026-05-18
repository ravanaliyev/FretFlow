import { apiClient } from './client';

/**
 * Yeni Ders Oluşturma Veri Modeli Arayüzü (LessonInput)
 */
interface LessonInput {
  title: string;       // Dersin başlığı (Örn: "Mi Telinde Egzersiz")
  description: string; // Dersin kısa açıklaması ve yönergesi
  notes: string;       // Gitar perdesi/nota zamanlamalarının JSON string hali
  difficulty: number;  // Zorluk seviyesi (1 = Kolay, 2 = Orta, 3 = Zor)
  xp_reward: number;   // Ders tamamlandığında kazanılacak XP puanı
  order_index: number; // Dersin yol haritasındaki sıralama indeksi
}

/**
 * SQLite Veritabanında Kayıtlı Standart Ders Nesnesi Arayüzü (Lesson)
 */
interface Lesson {
  id: number;          // Dersin veritabanındaki benzersiz ID numarası
  title: string;
  description: string;
  notes: string;
  difficulty: number;
  xp_reward: number;
  order_index: number;
}

/**
 * Yönetici (Admin) API Uç Noktaları
 * 
 * Bu dosya, öğretmen/yönetici yetkisine sahip kullanıcıların müfredat derslerini 
 * eklemesi, düzenlemesi, silmesi ve derslerin sıralama yerlerini (order_index) 
 * pürüzsüzce değiştirmesi için gerekli API isteklerini içerir.
 */
export const adminApi = {
  /**
   * createLesson - Sisteme sıfırdan yepyeni bir müfredat dersi ekler (Admin yetkisi gerekir).
   * @param lesson - Eklenecek olan yeni dersin alanlarını barındıran veri paketi (LessonInput)
   */
  createLesson: (lesson: LessonInput) =>
    apiClient.post<Lesson>('/api/lessons', lesson),

  /**
   * updateLesson - Mevcut bir dersin başlık, açıklama veya zorluk gibi alanlarını günceller (Admin yetkisi gerekir).
   * @param id - Güncellenecek olan dersin benzersiz ID'si
   * @param lesson - Güncellenmek istenen alanların kısmi paketi (Partial<LessonInput>)
   */
  updateLesson: (id: number, lesson: Partial<LessonInput>) =>
    apiClient.put<Lesson>(`/api/lessons/${id}`, lesson),

  /**
   * deleteLesson - Belirtilen bir dersi veritabanından tamamen siler (Admin yetkisi gerekir).
   * @param id - Silinecek olan dersin ID numarası
   */
  deleteLesson: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/api/lessons/${id}`),

  /**
   * reorderLessons - Yol haritasındaki iki dersin kendi arasındaki sıralamasını (order_index) takas eder.
   * @param lessonId1 - Konumu değiştirilecek 1. dersin ID'si
   * @param lessonId2 - Konumu değiştirilecek 2. dersin ID'si
   */
  reorderLessons: (lessonId1: number, lessonId2: number) =>
    apiClient.post<{ success: boolean }>('/api/admin/lessons/reorder', { lessonId1, lessonId2 }),
};