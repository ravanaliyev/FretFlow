import { motion } from 'framer-motion';

/**
 * AnimatedBackground (Animasyonlu Arka Plan) Bileşeni
 * 
 * Landing ve giriş ekranları için premium kalitede dinamik bir atmosfer arka planı oluşturur:
 * - Yumuşak hareket eden dairesel parlayan degrade (gradient) alanları sunar.
 * - Gitar temasını yansıtmak amacıyla titreşen 6 adet neon gitar telini simüle eder.
 * - Framer Motion kullanarak ekranın altından yukarıya doğru süzülen 20 adet ışık partikülü üretir.
 */
const AnimatedBackground: React.FC = () => {
  // Yukarı doğru süzülecek ışık partiküllerini temsil eden boş bir dizi oluşturur
  const particles = Array.from({ length: 20 });

  return (
    // Arka planın tıklamaları engellemesi için pointer-events-none ve en arkada durması için z-0 eklenmiştir
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Koyu lacivert/siyah renkli taban arka plan katmanı */}
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

      {/* Soyut Titreşen Gitar Telleri (Gitar sapı hissi için 12 derece eğik yerleştirilmiştir) */}
      {/* 6 adet paralel çizgi, rastgele sürelerde neon yeşil gölge efektiyle titreşerek gitar teli simülasyonu yapar */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 transform -rotate-12 scale-150">
        {[1, 2, 3, 4, 5, 6].map((string) => (
          <motion.div
            key={string}
            className="w-full h-[1px] bg-white/20 mx-4 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            animate={{
              boxShadow: ['0 0 10px rgba(57,255,20,0)', '0 0 20px rgba(57,255,20,0.5)', '0 0 10px rgba(57,255,20,0)']
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: string * 0.2
            }}
          />
        ))}
      </div>

      {/* Aşağıdan yukarı süzülen yüzen müzik partikülleri */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            y: -100, // Ekranın üst sınırının da dışına çıkmasını sağlar
            x: `+=${Math.random() * 100 - 50}`, // Çıkarken hafif sağa sola salınım yapar
            opacity: [0, 0.8, 0] // Yükselirken belirip zirvede kaybolur
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
