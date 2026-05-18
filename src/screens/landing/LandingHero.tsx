import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * LandingHero (Ana Tanıtım Alanı) Bileşeni
 * 
 * FretFlow ana sayfasının en üstünde yer alan ve kullanıcıyı karşılayan karşılama ekranıdır (Hero Section).
 * - Marka sloganını ve kullanıcıyı doğrudan giriş/kayıt sayfalarına yönlendiren büyük butonları barındırır.
 * - Sağ kolonda, arka planda çalan gitar videosunu içeren bir telefon mock-up'ı ve 
 *   asenkron olarak yukarı-aşağı salınan hareketli rozetleri (Streak serisi ve seviye bilgisi) gösterir.
 */
const LandingHero: React.FC = () => {
  return (
    // Esnek düzen (flex-row): Mobilde alt alta, masaüstünde yan yana yerleşim sunar
    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between min-h-[85vh] px-6 max-w-6xl mx-auto overflow-hidden py-10 gap-16">
      
      {/* Sol Sütun: Başlık, Açıklama ve Yönlendirme Butonları */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[55%] text-center lg:text-left flex flex-col items-center lg:items-start"
      >
        {/* Dikkat çekici büyük pazarlama başlığı */}
        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight mb-8 leading-[1.1] text-white">
          Gitar çalmayı öğrenmenin ücretsiz, eğlenceli ve etkili yolu!
        </h1>
        
        {/* Projenin ana değer önerisi dökümü */}
        <p className="text-xl md:text-2xl text-gray-400 mb-12 font-bold max-w-xl">
          Kısa derslerle akorları öğrenin, şarkılarda ustalaşın ve günlük gitar çalma alışkanlığı kazanın.
        </p>

        {/* Auth sayfalarına doğrudan bağlanan Eylem Butonları (Call to Actions) */}
        <div className="flex flex-col w-full sm:w-80 gap-3.5 mt-4">
          {/* Hemen Başla butonu - mode=signup ile yeni üyelik formunu açar */}
          <Link to="/login?mode=signup" className="btn-duo btn-duo-primary w-full h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl flex items-center justify-center text-center">
            HEMEN BAŞLA
          </Link>
          {/* Zaten hesabım var butonu - mode=login ile giriş formunu açar */}
          <Link to="/login?mode=login" className="btn-duo btn-duo-secondary w-full h-12 sm:h-14 lg:h-16 text-sm sm:text-base lg:text-lg uppercase flex items-center justify-center text-center px-4 leading-tight">
            ZATEN BİR HESABIM VAR
          </Link>
        </div>
      </motion.div>

      {/* Sağ Sütun: İnteraktif Akıllı Cihaz Mock-up Tasarımı ve Yüzen Rozetler */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full lg:w-[45%] flex justify-center lg:justify-end"
      >
         <div className="relative w-[300px] md:w-[360px] aspect-[9/16] shrink-0 mx-auto lg:mx-0">
           {/* Telefon Mock-up Gövdesi */}
           <div className="absolute inset-0 bg-dark-900 rounded-[3rem] border-4 border-dark-700 border-b-8 overflow-hidden shadow-xl flex items-center justify-center">
             {/* Gitar çalan elleri gösteren arka plan döngüsel MP4 videosu */}
             <video 
               autoPlay 
               loop 
               muted 
               playsInline 
               className="w-full h-full object-cover transform scale-[1.12]"
             >
               <source src="/videos/hero-guitar.mp4" type="video/mp4" />
             </video>
             
             {/* Videonun üzerindeki karartıcı degrade maske (tasarıma derinlik katar) */}
             <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent pointer-events-none"></div>
           </div>
           
           {/* Hareketli Rozet A: Seviye Rozeti (Dikey eksende asenkron salınım yapar) */}
           <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-accent-500 text-white font-extrabold text-2xl py-3 px-6 rounded-2xl border-b-4 border-[#1899d6] shadow-lg"
           >
             Seviye 5!
           </motion.div>

           {/* Hareketli Rozet B: Günlük Seri Rozeti (Rozet A'dan bağımsız gecikmeyle dikey salınım yapar) */}
           <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-6 bg-ambient-500 text-white font-extrabold text-2xl py-3 px-6 rounded-2xl border-b-4 border-[#d6a500] flex items-center gap-2 shadow-lg"
           >
             <span className="text-3xl">🔥</span> 14 Gün!
           </motion.div>
         </div>
      </motion.div>

    </div>
  );
};

export default LandingHero;
