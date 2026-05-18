import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

/**
 * Navbar (Navigasyon Çubuğu) Bileşeni
 * 
 * Bu bileşen, sitenin tüm halka açık (public) sayfalarında (Ana Sayfa, Hakkımızda, 
 * Kullanım Şartları vb.) en üstte yer alan gezinme çubuğunu render eder.
 * Kullanıcıyı ana sayfaya yönlendiren logoyu ve giriş/kayıt sayfalarına yönlendiren
 * butonları içerir.
 */
const Navbar: React.FC = () => {
  return (
    // Navigasyon barının dış sarmalayıcısı (z-index 50 ile tüm elementlerin üzerinde durur)
    <nav className="relative z-50 w-full py-5 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto">
      
      {/* Marka Logosu - Tıklanıldığında kullanıcıyı ana sayfaya ("/") yönlendirir */}
      <Link to="/" className="flex items-center gap-2">
        {/* Alev (Flame) ikonu - FretFlow turuncusu/yeşili tonlarında */}
        <Flame className="w-8 h-8 text-primary-500" />
        <span className="text-2xl font-black text-white tracking-tighter">
          Fret<span className="text-primary-500">Flow</span>
        </span>
      </Link>
      
      {/* Giriş ve Üye Ol buton sarmalayıcısı (Sadece tablet ve masaüstü ekranlarda görünür) */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Giriş Yap butonu - mode=login parametresiyle auth sayfasına yönlendirir */}
        <Link to="/login?mode=login" className="btn-duo btn-duo-secondary py-3 px-6 text-sm">
          GİRİŞ YAP
        </Link>
        {/* Üye Ol butonu - mode=signup parametresiyle auth sayfasına yönlendirir */}
        <Link to="/login?mode=signup" className="btn-duo btn-duo-primary py-3 px-6 text-sm">
          HEMEN BAŞLA
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
