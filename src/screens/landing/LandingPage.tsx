import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import LandingHero from './LandingHero';
import FeaturesSection from './FeaturesSection';
import GamificationShowcase from './GamificationShowcase';
import Footer from './Footer';

/**
 * LandingPage (Ana Tanıtım Sayfası) Bileşeni
 * 
 * FretFlow projesinin ziyaretçileri karşılayan ana giriş ekranı orkestratörüdür.
 * Tüm alt bölümleri (Animasyonlu Arka Plan, Navigasyon Barı, Kahraman Slogan Alanı,
 * Özellikler Listesi, Oyunlaştırma Paneli ve Alt Bilgi Alanı) tek bir duyarlı (responsive) 
 * gövde içerisinde bir araya getirir.
 */
const LandingPage: React.FC = () => {
  return (
    // Yatay taşmaları önlemek için overflow-x-hidden ve koyu tema rengi için bg-dark-900 uygulanmıştır
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative">
      
      {/* Dalgalanan aura efektli gökyüzü animasyonu arka planı */}
      <AnimatedBackground />
      
      {/* Üst menü çubuğu (Logo, Giriş/Başla butonları) */}
      <Navbar />
      
      {/* Büyük markalama başlığı, sloganı ve akıllı telefon görsel mock-up'ı */}
      <LandingHero />
      
      {/* 3 sütunlu interaktif özellik tanıtım kartları (Perde takibi, kulak egzersizi vb.) */}
      <FeaturesSection />
      
      {/* İlerleme çubuklu günlük görevler ve XP oyunlaştırma vitrini */}
      <GamificationShowcase />
      
      {/* Yasal linkleri içeren küresel sayfa alt bilgisi */}
      <Footer />
    </div>
  );
};

export default LandingPage;
