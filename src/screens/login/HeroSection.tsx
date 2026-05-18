import { motion } from 'framer-motion';

/**
 * HeroSection (Giriş Ekranı Slogan/Tanıtım Bölümü) Bileşeni
 * 
 * Giriş ve kayıt ekranlarında (split-pane yerleşiminde) sol tarafta yer alan 
 * estetik, motivasyonel slogan kartını render eder.
 * - Yumuşak giriş kaydırma animasyonlarına (framer-motion) sahiptir.
 * - Yarı saydam koyu bir cam panel (glass-panel) ve parlayan neon yazı efektleri barındırır.
 */
const HeroSection: React.FC = () => {
  return (
    // Z-index 10 ile arka plan animasyonlarının önünde yer alır
    <div className="relative z-10 flex flex-col justify-center h-full p-2 sm:p-6 lg:p-24 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }} // Başlangıçta görünmez ve 30px aşağıda durur
        animate={{ opacity: 1, y: 0 }}  // Sayfa yüklendiğinde yukarı kayarak belirir
        transition={{ duration: 0.8, delay: 0.2 }} // 0.8 saniye süren yumuşak geçiş efekti
        className="bg-dark-900/30 backdrop-blur-sm p-4 sm:p-6 lg:p-10 rounded-3xl border border-white/5 shadow-2xl"
      >
        {/* Ana Slogan Başlığı - Parlayan yeşil neon efektiyle zenginleştirilmiştir */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-7xl font-bold tracking-tight mb-2 md:mb-6 leading-tight drop-shadow-lg">
          Every <span className="text-primary-500 neon-text-green">Guitar Legend</span><br />
          Started Somewhere.
        </h1>
        
        {/* Destekleyici Açıklama Metni (Mobilde ekran alanından tasarruf etmek için gizlenir) */}
        <p className="text-lg lg:text-xl text-gray-200 max-w-xl mb-6 leading-relaxed drop-shadow-md font-medium hidden md:block">
          Build daily streaks, unlock interactive lessons, and become the guitarist you always wanted to be. Your journey to mastery starts tonight.
        </p>
      </motion.div>
    </div>
  );
};

export default HeroSection;
