/**
 * ==========================================================================================
 *                            FRETFLOW GLOBAL API TIP TANIMLAMALARI (types/api.ts)
 * ==========================================================================================
 * 
 * CORE PURPOSE (Ana Amaç):
 * Bu dosya, ön yüz (React/Vite) ile arka yüz (Express/Nest/PostgreSQL) arasındaki tüm 
 * REST API veri transfer nesnelerini (DTO - Data Transfer Objects) ve veri modellerini 
 * TypeScript tip güvenliği (Type Safety) altında tanımlar.
 * 
 * Sunucudan gelen JSON yanıtlarının hangi yapıda olacağını belirleyerek runtime (çalışma zamanı)
 * null pointer hatalarını ve tanımsız (undefined) nesne erişimlerini tamamen engeller.
 * ==========================================================================================
 */

/**
 * User - Sistemdeki aktif kullanıcının profil ve ayar bilgilerini temsil eden arayüz.
 */
export interface User {
  id: number;                                 // Kullanıcının veritabanındaki benzersiz birincil anahtarı (Primary Key)
  email: string;                              // Kullanıcının kayıtlı e-posta adresi
  username: string;                           // Ekranda gösterilen kullanıcı adı
  avatar_url: string | null;                  // Profil resmi URL'i (Profil resmi yüklenmemişse null döner)
  xp_total: number;                           // Kullanıcının kazandığı toplam tecrübe puanı (XP)
  level: number;                              // Kullanıcının mevcut gitar seviyesi
  best_score: number;                         // Pratiklerde yaptığı en yüksek skor
  notation_style?: 'scientific' | 'syllabic'; // Nota stili tercihi: Scientific (A, B, C) veya Syllabic (La, Si, Do)
  is_lefty?: boolean;                         // Solak gitaristler için gitar klavye görünümü (Lefty Mode) tercihi
  role?: 'ADMIN' | 'STUDENT';                 // Kullanıcı yetki rolü: Ders yönetim paneli için ADMIN veya normal STUDENT
}

/**
 * AuthTokens - JWT (JSON Web Token) tabanlı oturum yönetimi için kullanılan jetonlar.
 */
export interface AuthTokens {
  accessToken: string;                        // Kısa süreli istek yetkilendirme jetonu (Header'da yollanır)
  refreshToken: string;                       // Uzun süreli sessiz jeton yenileme (Session Rotation) jetonu
}

/**
 * AuthResponse - Başarılı Giriş Yap (Login) veya Kayıt Ol (Register) isteklerinde dönen gövde.
 */
export interface AuthResponse {
  user: User;                                 // Kimliği doğrulanan kullanıcının bilgileri
  accessToken: string;                        // İstek yetkilendirme jetonu
  refreshToken: string;                       // Jeton yenileme jetonu
}

/**
 * ApiError - Sunucudan dönen hata yanıtlarının standartlaştırılmış hata yapısı.
 */
export interface ApiError {
  error: string;                              // Hata açıklama mesajı (Örn: "Şifre hatalı!")
  code: string;                               // Hata kategorisi kodu (Örn: "AUTH_FAILED")
  details?: Record<string, unknown>;          // Opsiyonel ek hata detay nesnesi (Örn: Form girdi doğrulama detayları)
}

/**
 * PaginatedResponse - Sayfalanmış (Pagination) listeleri sarmalayan jenerik (Generic) arayüz.
 * Bu sayede Liderlik Tablosu veya Ders listesi gibi büyük veriler sayfa sayfa (chunk) çekilir.
 */
export interface PaginatedResponse<T> {
  data: T[];                                  // Sayfaya ait gerçek veri dizisi (Jenerik T tipinde)
  pagination: {
    page: number;                             // Çekilen mevcut sayfa numarası
    limit: number;                            // Sayfa başına çekilen maksimum eleman sayısı
    total: number;                            // Veritabanındaki toplam kayıt sayısı
    hasMore: boolean;                         // Arkadan gelecek başka sayfa olup olmadığını belirten bayrak
  };
}

/**
 * Lesson - Yönetim paneli ve müfredat akışı için ham ders verisi modeli.
 */
export interface Lesson {
  id: number;                                 // Dersin benzersiz ID'si
  title: string;                              // Dersin başlığı (Örn: "Temel A Akoru")
  description: string;                        // Dersin ne öğrettiğini anlatan açıklama
  notes: string;                              // Dersin notasının harf dizilimi (Örn: "A A B C")
  difficulty: number;                         // Zorluk derecesi (1-5 arası tam sayı)
  xp_reward: number;                          // Ders tamamlandığında kazanılacak XP ödülü
  order_index: number;                        // Müfredattaki sıralama sırası (Reordering işlemlerini belirler)
  level?: number;                             // Dersin ait olduğu kilitli seviye grubu
}

/**
 * DashboardLesson - Ana sayfadaki (Dashboard) ders kartlarının görsel durumlarını tutan arayüz.
 */
export interface DashboardLesson {
  id: number;                                 // Ders ID'si
  title: string;                              // Dersin Başlığı
  level: number;                              // Dersin Seviyesi
  difficulty: 'easy' | 'medium' | 'hard';     // Görsel zorluk etiket sınıfı
  status: 'available' | 'locked' | 'completed'; // Dersin kilit durumları (Açık, Kilitli veya Tamamlanmış)
  sequence: string[];                         // Dersin nota dizilimi (Dizi formatına dönüştürülmüş hali)
  desc: string;                               // Ders açıklaması
}

/**
 * Progress - Bir kullanıcının belirli bir dersteki ilerleme ve başarı geçmişi.
 */
export interface Progress {
  id: number;                                 // İlerleme kaydının benzersiz ID'si
  user_id: number;                            // İlerlemenin ait olduğu kullanıcı ID'si
  lesson_id: number;                          // İlerlemenin ait olduğu ders ID'si
  is_completed: boolean;                      // Dersin başarıyla tamamlanıp tamamlanmadığı
  attempts: number;                           // Kullanıcının bu dersi toplam deneme sayısı
  best_accuracy: number | null;               // Bu derste yaptığı en yüksek nota doğruluk yüzdesi (%0 - %100)
  last_attempt_result: string | null;         // Son denemesinin detaylı log çıktısı
  completed_at: string | null;                // Dersin ilk tamamlandığı tarih damgası
}

/**
 * GamificationProfile - Profil sekmesinde ve başarı istatistiklerinde kullanılan zenginleştirilmiş profil modeli.
 */
export interface GamificationProfile {
  id: number;                                 // Kullanıcı ID'si
  username: string;                           // Kullanıcı adı
  email: string;                              // E-posta
  avatar_url: string | null;                  // Profil Resmi URL'i
  xp_total: number;                           // Kazanılan Toplam XP
  level: number;                              // Seviye derecesi
  level_name: string;                         // Seviye unvanı (Örn: "Gitar Virtüözü")
  streak: {
    current: number;                          // Aktif peş peşe gün çalma serisi (Streak)
    longest: number;                          // Tarih boyu kırdığı en uzun seri rekoru
    last_practice: string | null;             // Son pratik yaptığı tarih damgası
  };
  lessons_completed: number;                  // Başarıyla bitirdiği ders sayısı
  songs_completed: number;                    // Başarıyla bitirdiği şarkı sayısı
  best_score: number;                         // Pratiklerdeki en yüksek başarı puanı
}

/**
 * Quest - Kullanıcının günlük olarak tamamlayıp XP toplayabileceği "Günlük Görevler" modeli.
 */
export interface Quest {
  id: number;                                 // Görev ID'si
  user_id: number;                            // Görevin ait olduğu kullanıcı ID'si
  title: string;                              // Görev başlığı (Örn: "3 Güç Akoru Çal")
  description: string;                        // Görevin açıklaması
  quest_type: string;                         // Görev tipi (Örn: "practice_time" veya "lesson_count")
  target_value: number;                       // Görevin tamamlanması için gereken hedef miktar (Örn: 3)
  current_value: number;                      // Kullanıcının şu ana kadar ulaştığı mevcut miktar (Örn: 2)
  xp_reward: number;                          // Görev bittiğinde kazanılacak XP ödülü
  is_completed: boolean;                      // Görevin tamamlanıp tamamlanmadığı
  is_claimed: boolean;                        // Kazanılan XP ödülünün kullanıcı tarafından talep edilip edilmediği
  expires_at: string;                         // Görevin süresinin dolacağı (sıfırlanacağı) son tarih damgası
}

/**
 * Achievement - Başarı sekmesinde kilitleri açılan başarı rozetleri (Achievements).
 */
export interface Achievement {
  id: number;                                 // Başarı ID'si
  name: string;                               // Başarı adı (Örn: "İlk Akor")
  description: string;                        // Başarı açıklaması (Örn: "İlk dersini başarıyla tamamla")
  icon: string;                               // Gösterilecek emoji veya ikon kodu (Örn: "🏆")
  xp_reward: number;                          // Başarı kazanıldığında verilecek XP ödülü
  earned: boolean;                            // Başarının kazanılıp kazanılmadığı (Kilit durumu)
  earned_at: string | null;                   // Başarının kazanıldığı tam tarih damgası
}

/**
 * PracticeStats - Analitik grafiklerin (Activity Chart) çizilmesi için gün gün gruplanmış pratik istatistikleri.
 */
export interface PracticeStats {
  data: Array<{
    date: string;                             // İstatistiğin ait olduğu gün (YYYY-MM-DD formatında)
    total_practice_seconds: number;           // O gün toplam çalınan süre (saniye cinsinden)
    sessions_count: number;                   // O gün başlatılan pratik seansı sayısı
    lessons_completed: number;                // O gün tamamlanan ders sayısı
    songs_completed: number;                  // O gün tamamlanan şarkı sayısı
    xp_earned: number;                        // O gün kazanılan toplam tecrübe puanı
    avg_accuracy: number | null;              // O günkü pratiklerin ortalama doğruluk yüzdesi
  }>;
  total_sessions: number;                     // Toplam seans sayısı
  total_minutes: number;                      // Toplam pratik yapılan dakika
  current_streak: number;                     // Aktif günlük çalışma serisi
  lessons_completed: number;                  // Toplam bitirilen ders sayısı
}

/**
 * StatsSummary - Profil kartı ve genel özet tabloları için hızlı istatistik özeti.
 */
export interface StatsSummary {
  total_xp: number;                           // Kullanıcının toplam XP'si
  level: number;                              // Mevcut Seviye
  level_name: string;                         // Seviye Unvanı
  streak_current: number;                     // Mevcut Streak serisi
  streak_longest: number;                     // En uzun Streak serisi rekoru
  lessons_completed: number;                  // Bitirilen Toplam Ders
  songs_completed: number;                    // Bitirilen Toplam Şarkı
  today_practice_seconds: number;             // Bugün çalınan toplam saniye
  today_xp: number;                           // Bugün kazanılan toplam XP
}

/**
 * LeaderboardEntry - Küresel liderlik tablosundaki (Leaderboard) bir satır veriyi temsil eder.
 */
export interface LeaderboardEntry {
  id: number;                                 // Kullanıcı ID'si
  username: string;                           // Kullanıcı adı
  score: number;                              // Sıralamaya esas olan en yüksek skor veya toplam XP derecesi
  last_updated: string;                       // Skorun son güncellendiği tarih
}

/**
 * DuelParticipant - Düelloya dahil olan rakip veya ev sahibi oyuncunun temel bilgileri.
 */
export interface DuelParticipant {
  id: number;                                 // Oyuncu ID'si
  username: string;                           // Oyuncu kullanıcı adı
}

/**
 * Duel - Gerçek zamanlı çok oyunculu düello (Multiplayer Duel Arena) lobi ve maç verisi modeli.
 */
export interface Duel {
  id: number;                                 // Düello lobisinin benzersiz ID'si
  invite_code: string;                        // Odaya başkalarının girmesi için üretilen 6 haneli davet kodu
  invite_url: string;                         // Arkadaşlarla paylaşılabilen doğrudan bağlantı URL'i
  status: 'waiting' | 'active' | 'started' | 'finished'; // Lobi durumu (Bekliyor, Aktif, Başladı, Bitti)
  host_user_id: number;                       // Lobiyi kuran ev sahibinin kullanıcı ID'si
  host_username: string;                      // Ev sahibinin kullanıcı adı
  guest_user_id: number | null;               // Odaya katılan misafirin (rakibin) kullanıcı ID'si (Lobi boşsa null)
  guest_username: string | null;              // Misafirin kullanıcı adı (Lobi boşsa null)
  song_id: number | null;                     // Düelloda çalınacak şarkının ID'si
  host_score: number | null;                  // Ev sahibinin düelloda elde ettiği skor
  host_accuracy: number | null;               // Ev sahibinin düellodaki nota doğruluk yüzdesi
  guest_score: number | null;                 // Misafirin düelloda elde ettiği skor
  guest_accuracy: number | null;              // Misafirin düellodaki nota doğruluk yüzdesi
  winner_user_id: number | null;              // Düelloyu kazanan şampiyonun kullanıcı ID'si (Berabere veya bitmediyse null)
  host_ready?: boolean;                       // Ev sahibinin hazır (ready) tuşuna basıp basmadığı
  guest_ready?: boolean;                      // Misafirin hazır (ready) tuşuna basıp basmadığı
  started_at?: string | null;                 // Düello maçının fiilen başladığı zaman damgası
}

/**
 * Song - Ritim oyunu ve nota akış penceresinde çalınacak şarkı modeli.
 */
export interface Song {
  id: number;                                 // Şarkının benzersiz ID'si
  title: string;                              // Şarkının başlığı (Örn: "Hotel California")
  artist: string;                             // Şarkıyı seslendiren sanatçı (Örn: "Eagles")
  difficulty: number;                         // Şarkının zorluk seviyesi (1-5 arası)
  notes: string;                              // Şarkının nota frekansları ve milisaniye tabanlı zaman damgalarını içeren JSON dizisi
  xp_reward: number;                          // Şarkı başarıyla çalındığında kazanılacak XP ödülü
  best_score?: number | null;                 // Kullanıcının bu şarkıda yaptığı en yüksek kişisel skor
}