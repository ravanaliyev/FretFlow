/* eslint-disable react-hooks/purity, react-hooks/refs */
import { useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedBackground (Giriş Ekranı Canlı Arka Plan) Bileşeni
 * 
 * Giriş ve kayıt ekranları için yüksek kaliteli atmosfer arka planını yönetir.
 * - Performans ve Kararlılık Kilidi: Rastgele üretilen partiküllerin koordinatlarını 
 *   ve sürelerini bir `useRef` önbelleğinde (cache) kilitler.
 * - Bu sayede kullanıcı kullanıcı adı veya şifresini yazarken sayfanın her render döngüsünde 
 *   partiküllerin yerinin değişmesini (layout thrashing ve titreşme hataları) engeller.
 */
const AnimatedBackground: React.FC = () => {
  // Rastgele üretilen süzülme parametrelerini kalıcı olarak hafızada tutan referans önbellek
  const particlesRef = useRef<Array<{
    duration: number;
    delay: number;
    x: number;
    opacity: number;
    offset: number;
  }> | null>(null);

  // Sayfa ilk yüklendiğinde partikülleri tam 1 kere üretir ve önbelleğe kilitler
  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: 20 }, () => ({
      duration: 10 + Math.random() * 10, // Süzülme hızı (10-20 saniye arası)
      delay: Math.random() * 10, // Rastgele gecikme süresi
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), // Ekrandaki yatay başlangıç konumu
      opacity: Math.random() * 0.5 + 0.2, // Şeffaflık yüzdesi
      offset: Math.random() * 100 - 50 // Süzülürken yapacağı sağa-sola kayma miktarı
    }));
  }

  const particles = particlesRef.current;

  return (
    // Tıklamaları engellemek ve arka planda durmasını sağlamak için pointer-events-none ve z-0 eklenmiştir
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Koyu renk taban arka plan katmanı */}
      <div className="absolute inset-0 bg-dark-900" />
      
      {/* Sol üst köşede yumuşakça büyüyüp küçülen parlayan degrade aurası */}
      <motion.div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ambient-500/20 blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Sağ alt köşede yumuşakça parıldayan FretFlow yeşili aurası */}
      <motion.div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/10 blur-[150px]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Titreşen Neon Gitar Telleri (Gitar sapı hissi için 12 derece eğik yerleştirilmiştir) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 transform -rotate-12 scale-150">
        {[1, 2, 3, 4, 5, 6].map((string) => (
          <motion.div
            key={string}
            className="w-full h-[1px] bg-white/20 mx-4 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            animate={{
              boxShadow: ['0 0 10px rgba(57,255,20,0)', '0 0 20px rgba(57,255,20,0.5)', '0 0 10px rgba(57,255,20,0)']
            }}
            transition={{
              duration: 3 + (string * 0.3),
              repeat: Infinity,
              delay: string * 0.2
            }}
          />
        ))}
      </div>

      {/* Önbelleğe alınmış kararlı koordinat parametreleriyle yükselen partiküller */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          initial={{
            x: particle.x,
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
            opacity: particle.opacity
          }}
          animate={{
            y: -100,
            x: `+=${particle.offset}`,
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
