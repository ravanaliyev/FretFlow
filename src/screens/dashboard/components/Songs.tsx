import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowLeft, Play, Mic } from 'lucide-react';
import type { Song } from '../Dashboard';

/**
 * SongLibrary Props Yapısı
 * @property songs - Seviye 4 kapsamında çalınabilir olan şarkı dizisi.
 * @property onSelect - Kullanıcı listeden bir şarkı kartına tıkladığında tetiklenen geri çağırım.
 */
export interface SongLibraryProps {
  songs: Song[];
  onSelect: (song: Song) => void;
}

/**
 * SongLibrary (Şarkı Seçim Listesi) Bileşeni
 * 
 * Seviye 4 şarkı kütüphanesindeki tüm parçaları grid kart düzeninde görüntüler.
 * Kartların üzerinde; şarkı ismi, sanatçı, zorluk derecesi, tamamlandığında kazanılacak XP
 * ve eğer daha önce çalınmışsa kullanıcının kırdığı Kişisel En İyi Skor yer alır.
 */
export const SongLibrary: React.FC<SongLibraryProps> = ({ songs, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {songs && Array.isArray(songs) && songs.map(song => (
        <motion.div
          key={song.id}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSelect(song)}
          className="glass-panel p-6 rounded-[2rem] cursor-pointer group relative overflow-hidden bg-white/[0.02] border-white/5"
        >
          {/* Arka planda duran şık yarı saydam dekoratif nota ikonu */}
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Music size={80} />
          </div>
          
          <div className="relative z-10">
            {/* Şarkı Başlığı ve Sanatçı Bilgisi */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Music size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-primary-500 transition-colors">{song.title}</h3>
                <p className="text-xs text-gray-500 font-medium">{song.artist}</p>
              </div>
            </div>

            {/* Zorluk Rozeti ve XP Kazanımı */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className={`px-2 py-1 rounded-lg ${song.difficulty === 1 ? 'bg-green-500/10 text-green-500' :
                song.difficulty === 2 ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                {song.difficulty === 1 ? 'Kolay' : song.difficulty === 2 ? 'Orta' : 'Zor'}
              </span>
              <span className="text-gray-500">{song.xp_reward} XP</span>
            </div>

            {/* Varsa Daha Önce Kazanılmış Kişisel En Yüksek Skor Kartı */}
            {song.best_score !== undefined && song.best_score !== null && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-bold uppercase">En İyi Skor</span>
                <span className="text-sm font-black text-primary-500">{song.best_score}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * SongPlayer Props Yapısı
 * @property song - Oynatılmakta olan aktif şarkı nesnesi.
 * @property currentPitch - Mikrofon işlemcisinden gelen anlık gitar nota ismi (Örn: "D3").
 * @property notationStyle - Nota gösterim stili (scientific/syllabic).
 * @property formatNoteName - Notayı ayarlanan gösterim stiline dönüştüren yardımcı fonksiyon.
 * @property onComplete - Şarkı bittiğinde nihai skoru ve doğruluk yüzdesini raporlayan geri çağırım.
 * @property onExit - Şarkı çalma ekranından çıkıp kütüphaneye dönmeyi tetikleyen fonksiyon.
 */
export interface SongPlayerProps {
  song: Song;
  currentPitch: string;
  notationStyle: 'scientific' | 'syllabic';
  formatNoteName: (note: string, style: 'scientific' | 'syllabic') => string;
  onComplete: (score: number, accuracy: number) => void;
  onExit: () => void;
}

/**
 * SongPlayer (Ritim Oyunu Çalma Ekranı) Bileşeni
 * 
 * Gitar Kahramanı (Guitar Hero) tarzında, notaların sağdan sola aktığı interaktif bir oyun paneli sunar.
 * - Şarkının nota zamanlamalarını içeren JSON string'ini ayrıştırır.
 * - Ekran yenileme hızına (60 FPS) duyarlı akıcı animasyonlar için `requestAnimationFrame` döngüsü kullanır.
 * - **Çarpışma Algoritması (Collision Detection):** Notalar ekrandaki dikey hedef çizgisinden (Playhead) geçerken,
 *   kullanıcı fiziksel gitarında doğru notayı çalarsa (mikrofondan yakalanır) `PERFECT` (+100 puan) sayar,
 *   çalmadan geçerse `MISS` (Kaçırdın) hata mesajı yazdırır.
 */
export const SongPlayer: React.FC<SongPlayerProps> = ({
  song,
  currentPitch,
  notationStyle,
  formatNoteName,
  onComplete,
  onExit
}) => {
  // Oyun ve Skor Durumları
  const [isPlaying, setIsPlaying] = useState(false); // Oyunun aktif olarak oynanıp oynanmadığı
  const [currentTime, setCurrentTime] = useState(0); // Şarkının başladığı andan itibaren geçen saniye
  const [score, setScore] = useState(0);             // Kullanıcının güncel puanı
  const [hits, setHits] = useState<Set<number>>(new Set());       // Doğru çalınan notaların indeks numaraları
  const [misses, setMisses] = useState<Set<number>>(new Set());     // Kaçırılan (çalınamayan) notaların indeksleri
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null); // Ekranda anlık beliren PERFECT/MISS yazısı

  // Oyun Döngüsü ve Zamanlama Referansları
  const requestRef = useRef<number | null>(null); // requestAnimationFrame ID'si (Döngüyü durdurup başlatmak için)
  const startTimeRef = useRef<number>(0);         // Şarkının başladığı mutlak milisaniye zaman damgası
  const songData = useRef<any[]>([]);            // Ayrıştırılmış şarkı nota dizisi

  // Şarkı değiştiğinde veya yüklendiğinde notaların JSON şablonunu ayrıştırır
  useEffect(() => {
    try {
      songData.current = JSON.parse(song.notes);
    } catch (e) {
      console.error("Geçersiz şarkı notaları JSON formatı", e);
      songData.current = [];
    }
  }, [song]);

  // Kaydırma ve Çarpışma Sabitleri
  const PIXELS_PER_SECOND = 250; // Notaların ekranda saniyede kaç piksel sola doğru kayacağı (Hız)
  const TARGET_X = 120;          // Dikey tetikleyici çarpışma çizgisinin (Playhead) X koordinatı

  /**
   * update - Ana Oyun Ritim Döngüsü (Game Loop)
   * 
   * Ekran kartı yenileme hızıyla senkronize çalışarak sürekli geçen süreyi hesaplar,
   * notaların yeni koordinatlarını çizer ve anlık çarpışma kontrollerini gerçekleştirir.
   */
  const update = (time: number) => {
    if (!isPlaying) return;

    // İlk başlangıç zaman damgasını sabitle
    if (startTimeRef.current === 0) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000; // Geçen süreyi saniyeye çevir
    setCurrentTime(elapsed);

    // Çarpışma Algılama Denetimi (Collision Detection)
    songData.current.forEach((note, idx) => {
      // Nota zaten başarılı çalınmış veya kaçırılmışsa es geç
      if (hits.has(idx) || misses.has(idx)) return;

      const diff = Math.abs(elapsed - note.t); // Notaların Playhead çizgisine olan zaman mesafesi
      const isWindowOpen = diff < 0.25; // 250ms'lik vuruş tolerans penceresi (Timing Window)

      if (isWindowOpen) {
        // Tolerans süresi içindeyken mikrofondan algılanan ses nota ismi şarkıdaki nota ile eşleşirse:
        if (currentPitch === note.n) {
          setHits(prev => new Set([...prev, idx]));
          setScore(s => s + 100);
          setFeedback({ text: 'PERFECT', color: 'text-primary-500' });
          setTimeout(() => setFeedback(null), 500); // 500ms sonra ekrandaki yazıyı temizler
        }
      } else if (elapsed > note.t + 0.3) {
        // Nota çizgiyi 300 milisaniye geçtiği halde çalınmadıysa KAÇIRILDI (MISS) olarak işaretle
        setMisses(prev => new Set([...prev, idx]));
        setFeedback({ text: 'MISS', color: 'text-rose-500' });
        setTimeout(() => setFeedback(null), 500);
      }
    });

    // Şarkının bitip bitmediğini denetler (Son notadan 2 saniye sonra şarkıyı bitirir)
    const lastNote = songData.current[songData.current.length - 1];
    if (lastNote && elapsed > lastNote.t + 2) {
      const accuracy = Math.round((hits.size / songData.current.length) * 100); // Başarı doğruluk yüzdesini hesaplar
      onComplete(score, accuracy);
      setIsPlaying(false);
    }

    // Bir sonraki ekran karesini çizmek için döngüyü kuyruğa ekle
    requestRef.current = requestAnimationFrame(update);
  };

  // Mikrofon nota girişi ve çalma durumuna göre animasyon döngüsünü günceller/temizler
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, currentPitch]);

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* Üst Bilgi Paneli */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Geri Dön Butonu */}
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter">{song.title}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{song.artist}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Puan</p>
            <p className="text-3xl font-black text-primary-500">{score.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Ritmik Nota Akış Ekranı */}
      <div className="glass-panel h-64 rounded-[3rem] relative overflow-hidden bg-dark-950/50 border-white/5 shadow-inner">
        
        {/* Dikey Çarpışma Hedef Çizgisi (Playhead) */}
        <div className="absolute top-0 bottom-0 w-1 bg-primary-500/30 z-20 shadow-[0_0_15px_rgba(57,255,20,0.4)]" style={{ left: TARGET_X }}>
          {/* Çarpışma anında parlayan neon halka halka dalga animasyonu */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-primary-500/50 bg-primary-500/10 animate-ping" />
        </div>

        {/* Yatayda Sağdan Sola Kayan Nota Baloncukları Alanı */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {songData.current.map((note, idx) => {
            // Geçen süreye göre nota balonunun yatay X pozisyonunun hesaplanması
            const x = (note.t - currentTime) * PIXELS_PER_SECOND + TARGET_X;
            // Ekran dışında kalan görünmeyen balonları render etmeyerek performansı optimize eder (Viewport Culling)
            if (x < -100 || x > 1200) return null;

            return (
              <motion.div
                key={idx}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
                style={{ left: x }}
              >
                {/* Nota Balonu (Çalınma durumuna göre Yeşil/Kırmızı/Beyaz renk alır) */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all shadow-xl ${hits.has(idx) ? 'bg-primary-500 text-dark-900 scale-110' : // Tam vuruşta yeşil
                  misses.has(idx) ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : // Kaçırınca soluk kırmızı
                    'bg-white/10 text-white border border-white/20' // Bekleme modunda beyaz çerçeveli
                  }`}>
                  {formatNoteName(note.n, notationStyle)}
                </div>
                {!hits.has(idx) && !misses.has(idx) && (
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Anlık timing sonucu görsel bildirim (PERFECT / MISS animasyonu) */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={`absolute top-12 left-[120px] -translate-x-1/2 font-black text-2xl italic tracking-tighter z-30 ${feedback.color}`}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Şarkı Başlatma ve Aktif Nota Algılama Paneli */}
      <div className="flex justify-center">
        {!isPlaying ? (
          <button
            onClick={() => {
              setIsPlaying(true);
              startTimeRef.current = 0;
              setHits(new Set());
              setMisses(new Set());
              setScore(0);
            }}
            className="bg-primary-500 text-dark-900 px-12 py-5 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl shadow-primary-500/30 flex items-center gap-4"
          >
            <Play size={24} fill="currentColor" /> ŞARKIYI BAŞLAT
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Canlı frekans algılama takip göstergesi */}
            <div className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 flex items-center gap-3">
              <Mic className="text-primary-500 animate-pulse" size={16} />
              Algılanan Nota: <span className="text-white font-black text-sm">{formatNoteName(currentPitch, notationStyle) || '--'}</span>
            </div>
            <button
              onClick={() => setIsPlaying(false)}
              className="text-gray-500 hover:text-white font-bold uppercase tracking-widest text-xs"
            >
              Şarkıyı Durdur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
