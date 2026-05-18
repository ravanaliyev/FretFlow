import { apiClient } from './client';

/**
 * Öğrenim Geçmişi Etkinliği Arayüzü (HistoryItem)
 */
export interface HistoryItem {
  id: number;                // Etkinlik kaydının veritabanındaki benzersiz ID'si
  lesson_id: number;         // Çalışılan dersin ID'si
  lesson_title: string;      // Çalışılan dersin başlığı (Örn: "A Kor Akordu")
  date: string;              // Pratiğin yapıldığı tarih ("May 18" tarzı formatlı)
  duration_seconds: number;  // Bu pratik seansında harcanan aktif süre (saniye cinsinden)
}

/**
 * Pratik Geçmişi (History) API Uç Noktaları
 * 
 * Bu dosya, kullanıcının yaptığı pratiklerin sürelerini ve hangi gün hangi dersi çalıştığını
 * kaydeden geçmiş kaydı API'lerini yönetir. Bu kayıtlar, Dashboard'daki analiz grafiklerini
 * besleyerek kullanıcının pratik sürelerini görselleştirmek için kullanılır.
 */
export const historyApi = {
  /**
   * getAll - Kullanıcının geçmişte yaptığı tüm ders pratiklerinin listesini veritabanından çeker.
   */
  getAll: () => 
    apiClient.get<HistoryItem[]>('/api/history'),
    
  /**
   * add - Yeni bir ders pratik seansı kaydı ekler. Tarihi otomatik olarak "May 18" formatında üretir.
   * @param lessonId - Çalışılan dersin ID numarası
   * @param lessonTitle - Çalışılan dersin başlığı
   * @param durationSeconds - Seansın kaç saniye sürdüğü (Varsayılan: 0)
   */
  add: (lessonId: number, lessonTitle: string, durationSeconds: number = 0) => {
    // Amerika yerel tarih biçimini kullanarak "May 18" gibi şık bir tarih formatı üretir
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return apiClient.post<{ success: boolean; id: number }>('/api/history', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      date: today,
      duration_seconds: durationSeconds
    });
  },

  /**
   * clearAll - Kullanıcının tüm pratik geçmişi kayıtlarını kalıcı olarak siler (Sıfırlar).
   */
  clearAll: () =>
    apiClient.delete<{ success: boolean; message: string }>('/api/history')
};
