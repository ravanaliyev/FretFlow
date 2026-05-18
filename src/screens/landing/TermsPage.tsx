import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * TermsPage (Kullanım Koşulları Sayfası) Bileşeni
 * 
 * Bu sayfa, FretFlow platformunun yasal kullanım koşullarını, fikri mülkiyet haklarını,
 * kullanıcı sorumluluklarını ve kurucu ortakların yasal haklarını belirten glassmorphism
 * tasarımlı statik bir dokümantasyon ekranıdır.
 */
const TermsPage: React.FC = () => {
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
            Kullanım Koşulları
          </h1>

          {/* Koşul Maddeleri Metin İçeriği */}
          <div className="space-y-6 text-base text-gray-300 leading-relaxed relative z-10">
            <p className="text-gray-400 text-xs">Son güncelleme: 18 Mayıs 2026</p>
            
            <h2 className="text-xl font-bold text-white mt-8">1. Koşulların Kabulü</h2>
            <p>
              FretFlow'a ("biz", "bizim", "bize") hoş geldiniz. Web sitemize, hizmetlerimize, derslerimize, interaktif oyun modlarımıza ve araçlarımıza (topluca "Platform") erişerek veya bunları kullanarak, bu Kullanım Koşullarına bağlı kalmayı kabul etmiş olursunuz. Bu koşulların herhangi bir kısmını kabul etmiyorsanız, Platformu kullanmayı derhal sonlandırmalısınız.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">2. Fikri Mülkiyet Hakları</h2>
            <p>
              Platform ve onun tüm içeriği, özellikleri ve işlevselliği — kaynak kodları, yazılımları, algoritmaları, ders müfredatları, nota tablaları, tasarımları, sesleri, animasyonları, logoları ve grafikleri dahil ancak bunlarla sınırlı olmamak üzere — kurucu ortaklar: Ravan Aliyev, Emirhan Alptekin ve Hüseyin Poyraz Küçükarslan'ın özel fikri mülkiyetindedir. Uluslararası telif hakkı, ticari marka, patent, ticari sır ve diğer fikri mülkiyet yasalarıyla korunmaktadır. Önceden yazılı izin alınmaksızın Platformun hiçbir parçası kopyalanamaz, değiştirilemez, dağıtılamaz veya yeniden yayınlanamaz.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">3. Kullanıcı Hesapları</h2>
            <p>
              Gelişim takibi, düellolar ve liderlik tabloları dahil olmak üzere Platformun belirli özelliklerine erişmek için bir hesap oluşturmalısınız. Kayıt sırasında doğru, güncel ve eksiksiz bilgiler vermeyi kabul edersiniz. Şifrenizin gizliliğini korumaktan ve hesabınız altında gerçekleşen tüm faaliyetlerden yalnızca siz sorumlusunuz. Bu koşulları ihlal eden hesapları askıya alma veya sonlandırma hakkını saklı tutarız.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Kabul Edilebilir Kullanım</h2>
            <p>
              Platformu yalnızca yasal amaçlarla kullanmayı kabul edersiniz. Şunları yapmamalısınız:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Web içeriğimizi izlemek veya kopyalamak için herhangi bir otomatik cihaz, komut dosyası, örümcek veya manuel işlem kullanmak.</li>
              <li>Sisteme virüs, truva atı, solucan, mantık bombası veya teknolojik olarak zararlı diğer materyalleri dahil etmek.</li>
              <li>Platformun herhangi bir bölümüne veya barındırıcı veritabanına yetkisiz erişim sağlamaya, müdahale etmeye veya bunları bozmaya çalışmak.</li>
              <li>Hesabınızı veya müfredat erişiminizi alt lisanslamak, kiralamak, satmak veya ticari olarak kötüye kullanmak.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">5. Garantilerin Reddi</h2>
            <p>
              Platform "olduğu gibi" ve "mevcut olduğu sürece" esasıyla sunulmaktadır. Sunulan hizmetlerin, ses algoritmalarının veya materyallerin doğruluğu, eksiksizliği, kullanılabilirliği, güvenliği veya güvenilirliği konusunda açık veya zımni hiçbir garanti vermemekteyiz.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Sorumluluğun Sınırlandırılması</h2>
            <p>
              Yürürlükteki yasaların izin verdiği azami ölçüde, FretFlow, kurucuları veya bağlı kuruluşları, Platformu kullanmanızdan veya kullanamamanızdan kaynaklanan hiçbir dolaylı, arızi, özel veya cezai zarardan sorumlu tutulamaz.
            </p>
          </div>
        </div>
      </main>

      {/* Alt bilgi alanı */}
      <Footer />
    </div>
  );
};

export default TermsPage;
