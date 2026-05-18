import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { LeaderboardItem } from '../Dashboard';

/**
 * LeaderboardComponent Props Yapısı
 * @property data - Sistemde kayıtlı olan tüm kullanıcı skor/XP verilerini içeren dizi.
 * @property currentUser - O an giriş yapmış aktif kullanıcının kullanıcı adı (Highlight satırı için).
 */
export interface LeaderboardComponentProps {
  data: LeaderboardItem[];
  currentUser?: string;
  userScore?: number;
}

/**
 * LeaderboardComponent (Liderlik Tablosu)
 * En yüksek skora sahip kullanıcıları azalan sırayla listeler:
 * - İlk 3 oyuncuyu interaktif podyum kartlarında (Gold, Silver, Bronze) 3D olimpiyat podyumu şeklinde çizer.
 * - 4 ila 10. sıradaki kullanıcıları ise şık yarı saydam cam (glassmorphism) listesi şeklinde sıralar.
 * - Aktif kullanıcı listedeyse, satırını neon yeşil çerçeveyle parlatır.
 */
const LeaderboardComponent: React.FC<LeaderboardComponentProps> = ({ data, currentUser }) => {
  // Kullanıcı skorlarını büyükten küçüğe sıralar ve ilk 10 kişiyi seçer
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top10 = sorted.slice(0, 10);

  // 3D Podyumda göstereceğimiz ilk 3 oyuncuyu ayıklar
  const first = top10[0];
  const second = top10[1];
  const third = top10[2];
  
  // 4. sıradan sonraki geri kalan kullanıcıları ayıklar
  const remainder = top10.slice(3);

  return (
    <div className="w-full mt-12 pb-12 text-left">
      
      {/* Başlık ve İkon */}
      <div className="flex items-center gap-2.5 mb-8">
        <Trophy size={18} className="text-primary-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Hall of Fame (Şeref Kürsüsü)</h3>
      </div>

      {/* 3D Olimpiyat Podyumu (İlk 3 Oyuncu Görsel Pedestali) */}
      <div className="grid grid-cols-3 gap-0 items-end mb-8 mt-8 w-full relative">
        
        {/* 2. Olan Oyuncunun Sütunu (Sol Taraf) */}
        {second ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Havada Duran Oyuncu Kartı */}
            <div className="w-[calc(100%-12px)] md:w-[calc(100%-24px)] mx-auto relative group flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-3 text-center hover:bg-white/10 transition-all hover:border-slate-400/30 shadow-lg mb-3 shrink-0">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl" title="2nd Place">🥈</span>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 flex items-center justify-center text-dark-900 font-black text-base shadow-md mb-2 shrink-0">
                {second.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-[11px] font-black text-white truncate w-full mb-1">{second.name}</h4>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{second.score} Puan</span>
            </div>
            
            {/* Kürsü Bloğu (Sol Adım) */}
            <div className="w-full h-11 bg-white/[0.04] border-t border-b border-l border-white/10 rounded-l-[1.5rem] flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              2.
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* 1. Olan Oyuncunun Sütunu (Orta ve En Yüksek Blok) */}
        {first ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Sürekli hafifçe aşağı yukarı süzülen (hovering) Şampiyon Kartı */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-[calc(100%-12px)] md:w-[calc(100%-24px)] mx-auto relative group flex flex-col items-center bg-primary-500/10 border-2 border-primary-500 rounded-[2.5rem] p-4 text-center hover:bg-primary-500/15 transition-all shadow-[0_15px_35px_rgba(57,255,20,0.12)] mb-3 shrink-0"
            >
              <span className="absolute -top-4.5 left-1/2 -translate-x-1/2 text-3xl animate-bounce" style={{ animationDuration: '2s' }} title="1st Place">👑</span>
              <div className="w-12.5 h-12.5 rounded-full bg-gradient-to-tr from-primary-500 to-amber-300 flex items-center justify-center text-dark-900 font-black text-lg shadow-lg shadow-primary-500/30 mb-2 shrink-0 border-2 border-primary-500">
                {first.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xs font-black text-white truncate w-full mb-0.5">{first.name}</h4>
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{first.score} Puan</span>
            </motion.div>
            
            {/* Kürsü Bloğu (En yüksek orta adım) */}
            <div className="w-full h-16 bg-white/[0.04] border-t border-b border-white/10 rounded-t-[1.25rem] flex items-center justify-center text-xs font-black text-white/90 uppercase tracking-widest relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white/[0.01] to-transparent pointer-events-none rounded-t-[1.25rem]" />
              1.
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* 3. Olan Oyuncunun Sütunu (Sağ Taraf) */}
        {third ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Havada Duran Oyuncu Kartı */}
            <div className="w-[calc(100%-12px)] md:w-[calc(100%-24px)] mx-auto relative group flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-3 text-center hover:bg-white/10 transition-all hover:border-amber-700/30 shadow-lg mb-3 shrink-0">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl" title="3rd Place">🥉</span>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-dark-900 font-black text-base shadow-md mb-2 shrink-0">
                {third.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-[11px] font-black text-white truncate w-full mb-1">{third.name}</h4>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{third.score} Puan</span>
            </div>
            
            {/* Kürsü Bloğu (Sağ Adım) */}
            <div className="w-full h-8 bg-white/[0.04] border-t border-b border-r border-white/10 rounded-r-[1.5rem] flex items-center justify-center text-[9px] font-black text-amber-500 uppercase tracking-widest">
              3.
            </div>
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* 4. Sıra ile 10. Sıra Arasındaki Oyuncu Listesi (Şık yatay cam satırlar) */}
      <div className="space-y-2.5 mt-6">
        {remainder.map((item, i) => {
          const rankIndex = i + 4;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                item.name === currentUser
                  ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_15px_rgba(57,255,20,0.15)]' // Giriş yapmış aktif kullanıcı yeşil çerçeveyle parlar
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Derece Numarası */}
                <span className="w-6 text-center text-xs font-black text-gray-500">
                  {rankIndex}
                </span>
                {/* İsmin Baş Harfi (Avatar dairesi) */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-gray-300">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                {/* Kullanıcı Adı */}
                <span className="font-bold text-xs text-white">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                {/* Kazanılma Tarihi */}
                <span className="text-[9px] text-gray-500 font-bold uppercase">{item.date}</span>
                {/* Toplam Puan */}
                <span className="text-xs font-black text-primary-500">{item.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardComponent;
