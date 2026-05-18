import React from 'react';

/**
 * GamificationShowcase (Oyunlaştırma Tanıtımı) Bileşeni
 * 
 * FretFlow'un oyun benzeri ödül mekanizmalarını ve günlük görev yapısını öne çıkaran 
 * yüksek etkileşimli bir tanıtım alanıdır.
 * - Sol tarafta, grafiksel ilerleme çubukları içeren örnek bir "Daily Quests" (Günlük Görevler) kartı gösterir.
 * - Sağ tarafta ise XP kazanımı, lig sıralamaları ve arkadaş yarışları hakkında pazarlama metni sunar.
 */
const GamificationShowcase: React.FC = () => {
  return (
    // Üst kenarlık (border-t) ile Hero bölümünden estetik olarak ayrılmış ana gövde
    <div className="relative z-10 py-32 px-4 max-w-6xl mx-auto border-t-2 border-dark-700">
      <div className="flex flex-col md:flex-row items-center gap-16">
        
        {/* Sol Taraf: Günlük Görevler Arayüz Kartı Mock-up'ı (Duo-Card stili) */}
        <div className="md:w-1/2 w-full flex justify-center">
           <div className="w-full max-w-md duo-card p-0 overflow-hidden border-b-8">
             
             {/* Görev Kartı Üst Başlığı (Kalan süreyi gösterir) */}
             <div className="bg-dark-700/50 p-6 flex justify-between items-center border-b-2 border-dark-700">
               <h4 className="font-extrabold text-2xl text-white">Günlük Görevler</h4>
               <span className="text-accent-500 font-bold">12 saat kaldı</span>
             </div>
             
             {/* Aktif Örnek Görev Listesi */}
             <div className="p-8 space-y-8">
                 
                 {/* Örnek Görev 1: Akor Pratiği (Gitar emojili, turuncu renkli ilerleme çubuğu) */}
                 <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                     <span className="text-4xl">🎸</span>
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between mb-2">
                       <h5 className="font-extrabold text-white text-lg">3 adet güç akoru çal</h5>
                       <span className="text-orange-500 font-bold">2 / 3</span>
                     </div>
                     {/* Yatay İlerleme Çubuğu */}
                     <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden">
                       <div className="w-2/3 h-full bg-orange-500 rounded-full"></div>
                     </div>
                   </div>
                 </div>

                 {/* Örnek Görev 2: Nota Doğruluk Yüzdesi (Hedef emojili, FretFlow yeşili ilerleme çubuğu) */}
                 <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
                     <span className="text-4xl">🎯</span>
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between mb-2">
                       <h5 className="font-extrabold text-white text-lg">%90 doğruluk oranına ulaş</h5>
                       <span className="text-primary-500 font-bold">0 / 1</span>
                     </div>
                     {/* Yatay İlerleme Çubuğu */}
                     <div className="w-full h-5 bg-dark-700 rounded-full overflow-hidden">
                       <div className="w-1/3 h-full bg-primary-500 rounded-full"></div>
                     </div>
                   </div>
                 </div>
             </div>
           </div>
         </div>

        {/* Sağ Taraf: Oyunlaştırma Detaylarının Anlatıldığı Metin Bloğu */}
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white">
            Gitar becerilerini <br/>
            <span className="text-primary-500">oyunla geliştir.</span>
          </h2>
          <p className="text-2xl text-gray-400 mb-10 font-bold max-w-lg">
            Oyunlaştırılmış eğitim yöntemimizle çok daha hızlı ilerleme kaydedin. XP kazanın, günlük görevleri tamamlayın ve liderlik tablosunda arkadaşlarınızla yarışın.
          </p>
        </div>

      </div>
    </div>
  );
};

export default GamificationShowcase;
