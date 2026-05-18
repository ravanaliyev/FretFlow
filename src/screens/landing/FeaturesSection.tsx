import { motion } from 'framer-motion';

// FretFlow'un 3 temel eğitimsel değerini tanımlayan özellikler dizisi
const features = [
  {
    title: "Science-based learning.",
    description: "Our bite-sized lessons are designed to be fun, effective, and paced perfectly to help you retain what you learn.",
    icon: "🧠",
    color: "bg-accent-500",      // Özel mavi tema arka planı
    border: "border-[#1899d6]"  // Özel mavi alt gölge kenarlığı
  },
  {
    title: "Stay motivated.",
    description: "We make it easy to form a daily habit with game-like features, fun challenges, and friendly reminders.",
    icon: "🔥",
    color: "bg-ambient-500",     // Özel turuncu tema arka planı
    border: "border-[#d6a500]"  // Özel turuncu alt gölge kenarlığı
  },
  {
    title: "Interactive feedback.",
    description: "Play your real guitar while our app listens through the mic to give you instant feedback on your timing and notes.",
    icon: "⚡",
    color: "bg-primary-500",     // Özel yeşil tema arka planı
    border: "border-[#58a700]"  // Özel yeşil alt gölge kenarlığı
  }
];

/**
 * FeaturesSection (Özellikler Bölümü) Bileşeni
 * 
 * Platformun en büyük teknik gücünü ve faydalarını 3 sütunlu interaktif bir grid düzeninde gösterir.
 * Kullanıcı sayfayı aşağı kaydırdıkça kartların aşağıdan yukarıya doğru süzülerek gelmesini sağlayan
 * kaydırma tetiklemeli (scroll-triggered whileInView) animasyonlar içerir.
 */
const FeaturesSection: React.FC = () => {
  return (
    // Üst kenarlık (border-t) ile Hero ve diğer bölümlerden estetik olarak ayrılmış gövde
    <div className="relative z-10 py-32 px-4 max-w-6xl mx-auto border-t-2 border-dark-700">
      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            // Kart ekrana girdiğinde animasyonun yalnızca bir kez tetiklenmesini sağlar
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }} // Kartlar sırayla (staggered) ekrana süzülür
            className="flex flex-col items-center text-center"
          >
            {/* 3D Görünüm Verilmiş İkon Kutusu - Hover edildiğinde yukarı doğru hafifçe esner */}
            <div className={`w-32 h-32 rounded-[2rem] ${feature.color} border-b-8 ${feature.border} flex items-center justify-center mb-8 transform hover:-translate-y-2 transition-transform shadow-lg`}>
              <span className="text-6xl">{feature.icon}</span>
            </div>
            
            {/* Özellik Başlığı ve Açıklaması */}
            <h3 className="text-2xl font-black mb-4 text-white">{feature.title}</h3>
            <p className="text-gray-400 text-lg leading-relaxed font-bold">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
