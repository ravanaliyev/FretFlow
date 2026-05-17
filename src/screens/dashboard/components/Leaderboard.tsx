import React from 'react';
import { Trophy } from 'lucide-react';
import type { LeaderboardItem } from '../Dashboard';

export interface LeaderboardComponentProps {
  data: LeaderboardItem[];
  currentUser?: string;
  userScore?: number;
}

const LeaderboardComponent: React.FC<LeaderboardComponentProps> = ({ data, currentUser, userScore = 0 }) => {
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top10 = sorted.slice(0, 10);

  // To calculate rank, we need to know where the user's best score fits in the global list
  // We'll treat the user's highscore as their entry
  const userRank = sorted.findIndex(item => item.score <= userScore) + 1;

  return (
    <div className="w-full mt-16 pb-12 text-left">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={20} className="text-primary-500" />
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Hall of Fame</h3>
      </div>

      <div className="space-y-3">
        {top10.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${item.name === currentUser ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_15px_rgba(57,255,20,0.2)]' :
              i === 0 ? 'bg-primary-500/10 border-primary-500/30' :
                i === 1 ? 'bg-white/5 border-white/10' :
                  i === 2 ? 'bg-white/[0.03] border-white/5' : 'bg-transparent border-white/5'
              }`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-6 text-xs font-black ${i < 3 ? 'text-primary-500' : 'text-gray-600'}`}>
                {i + 1}
              </span>
              <span className="font-bold text-sm text-white">{item.name}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] text-gray-600 font-bold uppercase">{item.date}</span>
              <span className="text-sm font-black text-primary-500">{item.score}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 mt-10">
        <div className="flex items-center justify-between p-6 rounded-3xl bg-primary-500 text-dark-900 shadow-xl shadow-primary-500/20 transform transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-dark-900/10 flex items-center justify-center font-black text-lg">
              #{userRank > 0 ? userRank : '??'}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Standing</p>
              <h4 className="font-bold">You (Personal Best)</h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{userScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
