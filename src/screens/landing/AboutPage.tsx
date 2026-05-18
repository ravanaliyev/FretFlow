import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * AboutPage (Hakkımızda Sayfası) Bileşeni
 * 
 * Bu sayfa, FretFlow projesinin amacını, misyonunu, vizyonunu ve kurucularını (co-founders) 
 * detaylıca tanıtan premium tasarımlı statik bir bilgilendirme ekranıdır.
 * Kurucu üyelerin Linkedin ve Github bağlantılarını içeren animasyonlu kartları barındırır.
 */
const AboutPage: React.FC = () => {
  return (
    // Sayfanın genel arka planı ve yerleşimi
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      {/* Arka plandaki parlayan aura efektli animasyonlu gökyüzü */}
      <AnimatedBackground />
      
      {/* Üst navigasyon barı */}
      <Navbar />

      {/* Ana İçerik Bloğu (z-index 10 ile arka planın üzerinde yer alır) */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow">
        {/* Hakkımızda Kartı - Glassmorphism ve hover efektleri uygulanmıştır */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          
          {/* Hover yapıldığında parlayan arka plan aurası */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Sayfa Ana Başlığı */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
            About Us
          </h1>

          {/* Misyon & Vizyon Açıklama Yazıları */}
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed relative z-10">
            <p className="text-xl font-medium text-white/90">
              Music is more than just sound—it is emotion, passion, and self-expression. Our platform was created to teach people guitar in a modern, simple, and inspiring way.
            </p>

            <p>
              Whether you are picking up a guitar for the first time or leveling up your skills, we provide lessons, practice tools, and interactive content designed to make learning fun and effective.
            </p>

            <p>
              We believe that with the right guidance, consistency, and motivation, anyone can learn to play. That's why we focus on creating a seamless educational experience for beginners and music lovers alike.
            </p>

            <p>
              From basic chords to advanced techniques, our goal is to help you grow step by step, enjoying every moment of your musical journey.
            </p>

            {/* Alıntı Bloğu / Slogan Banner */}
            <div className="py-8 my-10 border-y border-white/10 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-primary-500 rounded-full"></div>
              <p className="text-2xl md:text-3xl font-bold text-white text-center italic tracking-wide">
                "Pick up your guitar. Start playing. <span className="text-primary-400">Create your own sound.</span>"
              </p>
            </div>

            {/* Kurucu Ekip Kartları (Co-Founders Team deck) */}
            <div className="mt-16 pt-10 border-t border-white/5">
              <h3 className="text-center text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mb-10">Visionaries & Developers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { name: "Ravan Aliyev", role: "Co-Founder", initial: "R", link: "https://www.linkedin.com/in/ravanaliyev01/" },
                  { name: "Emirhan Alptekin", role: "Co-Founder", initial: "E", link: "https://github.com/Emirhan156" },
                  { name: "Hüseyin Poyraz Küçükarslan", role: "Co-Founder", initial: "H", link: "https://github.com/poyrazK" }
                ].map((creator, i) => (
                  <motion.a 
                    key={i}
                    href={creator.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2 }}
                    className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group flex items-center gap-4 cursor-pointer block"
                  >
                    {/* Daire profil baş harfi ikonu */}
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-lg font-medium text-gray-400 group-hover:border-primary-500/30 group-hover:text-primary-400 transition-all shrink-0">
                      {creator.initial}
                    </div>
                    {/* Kurucu Profil Bilgileri */}
                    <div>
                      <h4 className="text-base font-bold text-white/80 group-hover:text-white transition-colors">{creator.name}</h4>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{creator.role}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alt bilgi alanı */}
      <Footer />
    </div>
  );
};

export default AboutPage;
