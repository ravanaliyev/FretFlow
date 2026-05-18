import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import HeroSection from './HeroSection';
import AuthCard from './AuthCard';

/**
 * LoginPage (Giriş/Kayıt Sayfası) Bileşeni
 * 
 * Kullanıcı kimlik doğrulama (Giriş Yap / Kaydol) işlemlerini yürüten ana sayfa düzenleyicisidir.
 * - Arka plandaki parlayan parçacık akışını (`AnimatedBackground`),
 *   sol taraftaki motivasyonel tanıtım kartını (`HeroSection`) ve
 *   sağ taraftaki etkileşimli form alanını (`AuthCard`)
 *   masaüstü ekranlarda yan yana (split-pane) esnek bir yapıda bir araya getirir.
 */
function LoginPage() {
  return (
    // Esnek dikey yerleşim (flex-col) ve minimum 100vh yükseklik ayarı
    <div className="min-h-screen bg-dark-900 flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      {/* Dalgalanan neon ve aura efektli gökyüzü arka planı */}
      <AnimatedBackground />

      {/* Sadeleştirilmiş Üst Gezinme Başlığı (Navbar) */}
      <header className="relative z-20 w-full py-6 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto shrink-0">
        {/* Tıklanıldığında kullanıcıyı ana sayfaya ("/") yönlendiren logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Flame className="w-8 h-8 text-primary-500" />
          <span className="text-2xl font-black text-white tracking-tighter font-sans">
            Fret<span className="text-primary-500">Flow</span>
          </span>
        </Link>
      </header>
      
      {/* Yan Yana İki Bölmeli Ana Gövde Konteyneri */}
      <div className="container mx-auto px-4 flex-grow max-w-screen-xl flex flex-col lg:flex-row relative z-10 py-10 lg:py-0 gap-8 lg:gap-0 items-center justify-center">
        
        {/* Sol Bölme: Motivasyonel Pazarlama Mesajları ve Tanıtım */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start pt-12 lg:pt-0">
          <HeroSection />
        </div>

        {/* Sağ Bölme: Giriş / Kayıt Formlarının Yer Aldığı Kart Bileşeni */}
        <div className="w-full lg:w-1/2 flex items-center justify-center pb-12 lg:pb-0">
          <AuthCard />
        </div>
      </div>

      {/* Ekran Dengesini Sağlayan Sade Alt Bilgi Alanı */}
      <footer className="relative z-20 w-full py-6 text-center text-[10px] sm:text-xs text-gray-500 tracking-wider uppercase font-bold shrink-0">
        &copy; 2026 FretFlow. All rights reserved.
      </footer>
    </div>
  );
}

export default LoginPage;
