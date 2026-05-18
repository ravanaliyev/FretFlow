import { apiClient } from './client';
import type { Progress } from '../types/api';

/**
 * Ders İlerleme Durumu Listeleme Cevap Arayüzü (ProgressResponse)
 */
interface ProgressResponse {
  data: Array<Progress & {
    title: string;
    description: string;
    difficulty: number;
  }>;
}

/**
 * Ders Tamamlama Raporlama Cevap Arayüzü (SubmitProgressResponse)
 */
interface SubmitProgressResponse {
  success: boolean;
  is_completed: boolean;
  xp_earned: number;      // Dersin zorluğuna ve başarı oranına göre kazanılan tecrübe puanı (XP)
  accuracy: number;       // Doğru basılan notaların yüzdelik oranı (Doğruluk oranı)
}

/**
 * Ders İlerleme (Progress) API Uç Noktaları
 * 
 * Bu dosya, kullanıcının hangi dersleri tamamladığını, hangilerinde kaldığını veya 
 * ders başarı performanslarını çeken ve ders tamamlandığında çalınan notaların doğruluk
 * oranını sunucuya raporlayan API fonksiyonlarını barındırır.
 */
export const progressApi = {
  /**
   * getLessonProgress - Giriş yapmış kullanıcının tamamladığı veya çalışmaya devam ettiği tüm derslerin ilerleme kayıtlarını getirir.
   */
  getLessonProgress: () =>
    apiClient.get<ProgressResponse>('/api/progress/lessons'),

  /**
   * submitProgress - Kullanıcının tamamladığı ders seansının detaylarını (doğruluk yüzdesi ve çalınan nota isimleri) sunucuya kaydeder.
   * Sunucu bu verileri işleyerek ders kilit açma durumlarını günceller ve XP ödülü hesaplar.
   * @param lessonId - Tamamlanan dersin benzersiz ID'si
   * @param accuracy - Başarı doğruluk oranı yüzdesi (Örn: 92)
   * @param notesPlayed - Kullanıcı tarafından çalınan notaların isimlerini içeren dizi
   */
  submitProgress: (lessonId: number, accuracy: number, notesPlayed: string[]) =>
    apiClient.post<SubmitProgressResponse>('/api/progress/lessons', {
      lesson_id: lessonId,
      accuracy,
      notes_played: notesPlayed,
    }),
};