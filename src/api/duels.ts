import { apiClient } from './client';
import type { Duel } from '../types/api';

/**
 * Düello Veri Paketi Cevap Arayüzü (DuelResponse)
 */
interface DuelResponse {
  data: Duel;
}

/**
 * Yeni Düello Odası Oluşturma Parametre Arayüzü (CreateDuelPayload)
 */
interface CreateDuelPayload {
  song_id?: number; // Düellonun hangi şarkı üzerinde yapılacağını belirten isteğe bağlı şarkı ID'si
}

/**
 * Çevrimiçi Düellolar (Duels) API Uç Noktaları
 * 
 * Bu dosya, gitaristlerin oda davet kodu (invite-code) sistemi üzerinden eşleşerek
 * gerçek zamanlı gitar çalma yarışmaları (düellolar) düzenlemesini sağlar. Lobi kurma,
 * lobiye katılma, hazır durumunu bildirme ve bitiş skorlarını kaydetme işlemlerini yönetir.
 */
export const duelsApi = {
  /**
   * createDuel - Yeni bir multiplayer düello odası (lobi) oluşturur ve benzersiz davet kodu üretir.
   * @param payload - Odanın kurulacağı şarkı ID'sini içeren parametre nesnesi (CreateDuelPayload)
   */
  createDuel: (payload?: CreateDuelPayload) =>
    apiClient.post<DuelResponse>('/api/duels', payload),

  /**
   * getDuel - Davet kodu girilen düello odasının anlık durumunu (bağlı oyuncular, hazır durumları) sunucudan sorgular.
   * @param inviteCode - Lobiye ait 6 haneli benzersiz davet kodu
   */
  getDuel: (inviteCode: string) =>
    apiClient.get<DuelResponse>(`/api/duels/${inviteCode}`),

  /**
   * joinDuel - İkinci oyuncu (Rakip) olarak davet kodu girilen düello odasına giriş yapar.
   * @param inviteCode - Katılınmak istenen lobinin davet kodu
   */
  joinDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/join`),

  /**
   * readyDuel - Lobideki aktif oyuncuyu "HAZIR" (Ready) konumuna getirir. İki oyuncu da hazır olduğunda maç başlar.
   * @param inviteCode - Hazır durumunun bildirileceği lobi kodu
   */
  readyDuel: (inviteCode: string) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/ready`),

  /**
   * finishDuel - Düello şarkısı bittiğinde elde edilen toplam puanı ve doğruluk yüzdesini sunucuya gönderir.
   * @param inviteCode - Düellonun yapıldığı oda kodu
   * @param score - Oyuncunun elde ettiği başarı skoru (Örn: 24500)
   * @param accuracyPercent - Oyuncunun vuruş doğruluk yüzdesi (Örn: 94.5)
   */
  finishDuel: (inviteCode: string, score: number, accuracyPercent?: number) =>
    apiClient.post<DuelResponse>(`/api/duels/${inviteCode}/finish`, {
      score,
      accuracy_percent: accuracyPercent,
    }),
};
