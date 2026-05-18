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
            Privacy Policy
          </h1>

          {/* Gizlilik Politikası Maddeleri */}
          <div className="space-y-6 text-base text-gray-300 leading-relaxed relative z-10">
            <p className="text-gray-400 text-xs">Last updated: May 18, 2026</p>

            <p>
              At FretFlow, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our interactive guitar training platform.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">1. Information We Collect</h2>
            <p>
              To provide a personalized learning experience, we collect the following details:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Credentials:</strong> Your username, email address, and encrypted passwords used for authentication.</li>
              <li><strong>Progress and Performance Data:</strong> Completed lessons, daily streak logs, high scores on song practices, duel history, and leaderboard stats.</li>
              <li><strong>Technical Metadata:</strong> Device parameters, connection data, and browser cookies used solely to maintain active user sessions.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">2. How We Use Your Information</h2>
            <p>
              Collected data is used only for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To manage your active credentials, restore your account state, and sync your level progress.</li>
              <li>To calculate your XP points and rank you on the global live leaderboard.</li>
              <li>To allow you to engage in real-time competitive guitar duels and matches with other users.</li>
              <li>To send notifications about earned badges, friend requests, or system updates.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">3. Data Sharing and Disclosure</h2>
            <p>
              Your personal information is secure. <strong>We never sell, rent, trade, or share your data with third-party marketing companies.</strong> Your data is only shared when legally required or essential for safely running our database systems.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Data Security</h2>
            <p>
              We implement industry-standard security and encryption protocols (such as bcrypt for password storage) to protect user data from unauthorized access, loss, or manipulation. However, no internet transmission is 100% secure, so we recommend using strong passwords.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">5. Cookies and Session Storage</h2>
            <p>
              We only use browser localStorage and session storage to verify authentication states and automatically restore your progress upon page refresh.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Your Rights</h2>
            <p>
              You have the right to request the deletion of your account and clear all stored lesson progress and score history at any time. To request deletion or ask questions about our data policies, you can contact the co-founders through the support channels in the profile menu.
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
