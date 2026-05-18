import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Footer (Alt Bilgi Alanı) Bileşeni
 * 
 * Halka açık tüm landing sayfalarında ortak olarak en altta yer alan bilgi çubuğudur.
 * Şirket logosunu, önemli yasal ve kurumsal sayfa linklerini (Hakkımızda, Koşullar, Gizlilik)
 * ve dinamik olarak o anki yılı çeken telif hakkı ibaresini içerir.
 */
const Footer: React.FC = () => {
  return (
    // Alt bilgi alanının dış sarmalayıcısı (blur efekti ve üst kenarlık ile sınırlandırılmıştır)
    <footer className="relative z-10 border-t border-white/5 bg-dark-900/80 backdrop-blur-md pt-16 pb-8 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Görsel Marka Logosu */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-500/20 p-2 rounded-lg">
            <Flame className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">
            Fret<span className="text-primary-500">Flow</span>
          </span>
        </div>
        
        {/* Bilgilendirme ve Hukuki Sayfa Bağlantıları */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 font-medium">
          <Link to="/about" className="hover:text-primary-500 transition-colors">Hakkımızda</Link>
          <Link to="/terms" className="hover:text-primary-500 transition-colors">Kullanım Koşulları</Link>
          <Link to="/privacy" className="hover:text-primary-500 transition-colors">Gizlilik Politikası</Link>
        </div>
        
        {/* Dinamik Telif Hakkı (Copyright) Damgası */}
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} FretFlow. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
