import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PrivacyPage (Gizlilik Politikası Sayfası) Bileşeni
 * 
 * Bu sayfa, FretFlow platformunun kullanıcı verilerini nasıl topladığını, sakladığını, 
 * işlediğini ve koruduğunu belirten, kişisel veri koruma (KVKK/GDPR uyumlu) esaslarını 
 * açıklayan glassmorphism tasarımlı statik bir dokümantasyon ekranıdır.
 */
const PrivacyPage: React.FC = () => {
  return (
    // Sayfanın genel yerleşimi ve arka planı
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      {/* Animasyonlu parlayan gökyüzü arka planı */}
      <AnimatedBackground />
      
      {/* Üst navigasyon barı */}
      <Navbar />

      {/* Ana yasal metin alanı */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow w-full">
        {/* Belge Kartı Paneli */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          
          {/* Hover edildiğinde parlayan yeşil/turuncu arka plan aurası */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Sayfa Ana Başlığı */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
            Gizlilik Politikası
          </h1>

          {/* Gizlilik Politikası Maddeleri */}
          <div className="space-y-6 text-base text-gray-300 leading-relaxed relative z-10">
            <p className="text-gray-400 text-xs">Son güncelleme: 18 Mayıs 2026</p>

            <p>
              FretFlow olarak gizliliğinizi korumaya kararlıyız. Bu Gizlilik Politikası, interaktif gitar eğitimi platformumuzu kullandığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı ve paylaştığımızı açıklar.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">1. Topladığımız Bilgiler</h2>
            <p>
              Tamamen kişiselleştirilmiş bir öğrenme deneyimi sunmak amacıyla şu detayları toplamaktayız:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Hesap Kimlik Bilgileri:</strong> Kimlik doğrulama için kullanılan kullanıcı adınız, e-posta adresiniz ve şifrelenmiş şifreleriniz.</li>
              <li><strong>İlerleme ve Performans Verileri:</strong> Tamamlanan dersler, günlük çalışma serisi (streak) logları, şarkı pratiklerindeki en yüksek skorlar, düello geçmişleri ve liderlik tablosu istatistikleri.</li>
              <li><strong>Teknik Üst Veriler (Metadata):</strong> Yalnızca aktif kullanıcı oturumlarını sürdürmek için kullanılan cihaz parametreleri, temel bağlantı verileri ve tarayıcı çerezleri.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">2. Bilgilerinizi Nasıl Kullanıyoruz?</h2>
            <p>
              Toplanan veriler yalnızca şu amaçlarla kullanılır:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Aktif kimlik bilgilerinizi yönetmek, hesap durumunuzu geri yüklemek ve seviye ilerlemenizi senkronize etmek.</li>
              <li>XP puanınızı hesaplayarak sizi küresel canlı liderlik tablosunda sıralamak.</li>
              <li>Diğer kullanıcılarla gerçek zamanlı rekabetçi gitar düelloları ve eşleşmeler yapmanızı sağlamak.</li>
              <li>Kazanılan rozetler, arkadaşlık istekleri veya sistem güncellemeleri hakkında bildirimler göndermek.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">3. Veri Paylaşımı ve Açıklanması</h2>
            <p>
              Kişisel bilgileriniz tamamen güvendedir. <strong>Verilerinizi üçüncü taraf pazarlama şirketlerine kesinlikle satmayız, kiralamayız, ticaretini yapmayız veya paylaşmayız.</strong> Verileriniz yalnızca yasal olarak zorunlu kılındığında veya veritabanı sistemlerimizi güvenle çalıştırmak için zorunlu olduğunda paylaşılır.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Veri Güvenliği</h2>
            <p>
              Kullanıcı verilerinin yetkisiz erişime, kayba veya manipülasyona karşı korunması amacıyla endüstri standardı güvenlik ve şifreleme protokolleri (örneğin şifre saklama için bcrypt) uygulamaktayız. Ancak hiçbir internet bağlantısı %100 güvenli değildir, bu yüzden güçlü şifre protokolleri kullanmanızı önemle tavsiye ederiz.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">5. Çerezler ve Oturum Depolama</h2>
            <p>
              Yalnızca kimlik doğrulama durumlarını doğrulamak ve sayfa yenilemelerinde ilerlemenizi otomatik olarak geri yüklemek amacıyla tarayıcı localStorage alanını ve çerez benzeri oturum depolarını kullanırız.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Haklarınız</h2>
            <p>
              İstediğiniz zaman hesabınızın silinmesini talep etme ve tüm kayıtlı ders ilerleme ve skor geçmişinizi temizleme hakkına sahipsiniz. Hesap silme işlemini gerçekleştirmek veya veri politikalarımız hakkında soru sormak için profil menüsünde yer alan iletişim formları aracılığıyla kurucu ortaklarımızla iletişime geçebilirsiniz.
            </p>
          </div>
        </div>
      </main>

      {/* Alt bilgi alanı */}
      <Footer />
    </div>
  );
};

export default PrivacyPage;
