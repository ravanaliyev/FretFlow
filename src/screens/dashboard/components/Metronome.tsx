import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X, Play } from 'lucide-react';

/**
 * Metronome (Metronom) Bileşeni
 * Web Audio API kullanarak milisaniye hassasiyetinde ritim vuruşları üreten profesyonel bir metronomdur.
 * Tarayıcının ana JavaScript iş parçacığı (main thread) yoğun olsa bile ritmin asla gecikmemesi için
 * "Lookahead Double-Queue Scheduling Pattern" (Önceden Planlamalı Çift Kuyruk Zamanlama Deseni) kullanır.
 */
const Metronome: React.FC = () => {
  // Metronom Ayarları
  const [bpm, setBpm] = useState(120);                   // Tempo değeri (Dakikadaki vuruş sayısı - Beats Per Minute)
  const [isPlaying, setIsPlaying] = useState(false);       // Metronomun çalıp çalmama durumu
  const [timeSignature, setTimeSignature] = useState(4); // Ölçü birimi (Örn: 3/4, 4/4, 6/4 vuruşluk ölçüler)
  const [currentBeat, setCurrentBeat] = useState(0);     // Ölçü içindeki aktif vuruşun indeksi (0, 1, 2, 3...)

  // Zamanlayıcı döngüsünün (scheduler) her zaman güncel ayarlara erişebilmesi için React referansları (Ref)
  const bpmRef = useRef(bpm);
  const timeSignatureRef = useRef(timeSignature);

  // Web Audio API Kontrolleri ve Planlayıcı Değişkenleri
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);      // Bir sonraki tık sesinin çalınacağı mutlak zaman damgası (saniye cinsinden)
  const timerID = useRef<number | null>(null); // Planlayıcı döngüsünün Interval (zamanlayıcı) ID'si
  const beatRef = useRef(0);            // Ölçü içindeki vuruş sayacı (modulo işlemine sokularak sıfırlanır)

  // BPM değiştikçe referansı günceller
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Ölçü birimi değiştikçe referansı günceller
  useEffect(() => {
    timeSignatureRef.current = timeSignature;
  }, [timeSignature]);

  /**
   * Belirtilen milisaniyede programatik (sentetik) bir tık sesi çalar.
   * @param beatNumber - Vuruş numarası (Ölçünün ilk vuruşu için farklı ses perdesi üretilir)
   * @param time - Vuruşun çalınacağı mutlak Web Audio zamanı (saniye cinsinden)
   */
  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    // Sesi üretmek için osilatör (Dalga üretici) ve kazanç (Gain/Ses Seviyesi) düğümü oluşturur
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Ölçünün 1. vuruşunu (Downbeat) ayırt edebilmek için 1000 Hz (ince bip), diğer vuruşları 500 Hz (tok bip) yapar
    osc.frequency.setValueAtTime(beatNumber === 0 ? 1000 : 500, time);

    // Tık sesinin "perküsif ve temiz" gelmesi için çok hızlı bir ses seviyesi zarfı (Envelope) uygulanır
    envelope.gain.setValueAtTime(0.001, time);
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.002); // 2ms'de sesi maksimuma çıkar (Attack)
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05); // 50ms'de sesi tamamen kes (Decay)

    // Osilatörü ses seviyesi düğümüne, onu da hoparlöre (destination) bağlar
    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    // Osilatörü belirtilen zaman aralığında çalıştırıp durdurur
    osc.start(time);
    osc.stop(time + 0.05);

    // Görsel yeşil lambaların yanıp sönmesini sesin çıktığı an ile senkronize etmek için gecikmeyi hesaplar
    const diff = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, Math.max(0, diff));
  };

  /**
   * Planlayıcı Döngüsü (Scheduler)
   * Her 25ms'de bir uyanır ve önümüzdeki 100ms'lik zaman penceresinde çalınması gereken 
   * bir ritim vuruşu olup olmadığını kontrol eder. Varsa bunları sıraya (audio queue) ekler.
   */
  const scheduler = () => {
    if (!audioContext.current) return;

    // Tarayıcı sekmesi arka plana alındığında ses birikmesini önleyen koruma
    if (nextNoteTime.current < audioContext.current.currentTime) {
      nextNoteTime.current = audioContext.current.currentTime;
    }

    // Gelecek 100 milisaniyelik pencerede çalınacak notaları planla:
    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTime.current);
      
      const secondsPerBeat = 60.0 / bpmRef.current; // 1 vuruşun saniye cinsinden süresi
      nextNoteTime.current += secondsPerBeat; // Bir sonraki vuruş zamanını ilerlet
      beatRef.current = (beatRef.current + 1) % timeSignatureRef.current; // Vuruş sayacını ölçüye göre sıfırla
    }
    
    // Bir sonraki kontrolü 25ms sonra yapmak üzere planla
    timerID.current = window.setTimeout(scheduler, 25);
  };

  /**
   * Metronomu başlatır veya durdurur. 
   * Tarayıcı güvenlik kuralları gereği, AudioContext ilk kez kullanıcı butona tıkladığında başlatılır.
   */
  const toggleMetronome = async () => {
    if (isPlaying) {
      if (timerID.current) window.clearTimeout(timerID.current);
      setIsPlaying(false);
      setCurrentBeat(-1);
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      // Tarayıcı ses motorunu askıya aldıysa (suspend) uyandır
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }
      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime + 0.05; // 50ms önceden planlamaya başla
      setIsPlaying(true);
      scheduler(); // Zamanlayıcıyı ateşle
    }
  };

  // Bileşen ekrandan kaldırıldığında zamanlayıcıyı temizler ve ses motorunu kapatır (Bellek sızıntısı önleyici)
  useEffect(() => {
    return () => {
      if (timerID.current) window.clearTimeout(timerID.current);
      if (audioContext.current) {
        audioContext.current.close().catch((err: any) => console.error("AudioContext kapatılamadı:", err));
      }
    };
  }, []);

  return (
    <div className="glass-panel w-full max-w-3xl p-5 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-white/10 bg-dark-900/40 backdrop-blur-3xl relative overflow-hidden shadow-2xl flex flex-col items-center">
      
      {/* Metronom çalışırken arkada ritmik olarak parlayan neon aura */}
      <div className={`absolute inset-0 bg-primary-500/5 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10 w-full flex flex-col items-center">
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6 sm:mb-8 md:mb-12">Rhythm Master (Metronom)</h4>

        {/* Görsel Yeşil Işıklar (Ritim çaldıkça sıra sıra yanıp söner) */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 sm:mb-10 md:mb-16">
          {Array.from({ length: timeSignature }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: currentBeat === i ? 1.2 : 1,
                backgroundColor: currentBeat === i ? '#58cc02' : 'rgba(255,255,255,0.05)',
                boxShadow: currentBeat === i ? '0 0 20px #58cc02' : 'none'
              }}
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white/10"
            />
          ))}
        </div>

        {/* BPM Yuvarlak Kadranı (BPM değerine göre her vuruşta hafifçe büyüyüp küçülür - Bounce) */}
        <div className="relative mb-10 sm:mb-12 w-full max-w-[18rem]">
          <motion.div
            animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 60 / bpm, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
            className="w-full aspect-square rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative bg-white/5 backdrop-blur-md shadow-2xl"
          >
            <span className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 sm:mb-2">BPM</span>
            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none">{bpm}</span>
            <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-3xl -z-10 opacity-50" />
          </motion.div>
        </div>

        {/* Ritim Kontrolleri (Sürgü ve İnce Ayar Artı/Eksi Butonları) */}
        <div className="w-full max-w-md space-y-6 sm:space-y-8 md:space-y-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Eksi 5 BPM */}
            <button
              onClick={() => setBpm(Math.max(40, bpm - 5))}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <Minus size={18} />
            </button>
            {/* Hassas Slider Sürgüsü */}
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500"
            />
            {/* Artı 5 BPM */}
            <button
              onClick={() => setBpm(Math.min(240, bpm + 5))}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Ölçü Seçenekleri (3/4, 4/4, 6/4 ritim şablonları) */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[3, 4, 6].map(sig => (
              <button
                key={sig}
                onClick={() => {
                  setTimeSignature(sig);
                  if (isPlaying) {
                    beatRef.current = 0; // Çalışırken basılırsa ritmi 1. vuruştan başlatır
                  }
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${timeSignature === sig ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                {sig}/4
              </button>
            ))}
          </div>
          
          {/* Başlat / Durdur Tetikleyici Butonu */}
          <button
            onClick={toggleMetronome}
            className={`w-full py-3 sm:py-4 rounded-[1.5rem] font-black text-base sm:text-lg tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${isPlaying
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-primary-500 text-dark-900 shadow-primary-500/20 hover:scale-[1.02]'
              }`}
          >
            {isPlaying ? (
              <><X size={22} /> DURDUR</>
            ) : (
              <><Play size={22} className="fill-current" /> BAŞLAT</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Metronome;
