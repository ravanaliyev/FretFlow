import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { LeaderboardItem } from '../Dashboard';

/**
 * Properties for the LeaderboardComponent.
 * @property data - List of all scores recorded in the system.
 * @property currentUser - Username of the currently authenticated active user.
 * @property userScore - Personal best score/XP of the currently authenticated active user.
 */
export interface LeaderboardComponentProps {
  data: LeaderboardItem[];
  currentUser?: string;
  userScore?: number;
}

/**
 * LeaderboardComponent
 * Renders a highly polished high-scores board containing:
 * - A premium 3D Olympic-style podium for the Top 3 players with staggered entrance animations.
 * - Flat glassmorphic rows for rankings 4 through 10.
 * - An exclusive sticky banner at the bottom highlighting the active user's current standing/rank.
 */
const LeaderboardComponent: React.FC<LeaderboardComponentProps> = ({ data, currentUser }) => {
  // Sort list descending by score and select top 10 players
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top10 = sorted.slice(0, 10);

  // Extract Top 3 players to position on the 3D Podium
  const first = top10[0];
  const second = top10[1];
  const third = top10[2];
  
  // Players ranked 4th and below
  const remainder = top10.slice(3);

  return (
    <div className="w-full mt-12 pb-12 text-left">
      {/* Title / Section Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <Trophy size={18} className="text-primary-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Hall of Fame</h3>
      </div>

      {/* 3D Olympic-Style Podium with Seamless Stepped Base Pedestal */}
      <div className="grid grid-cols-3 gap-0 items-end mb-8 mt-8 w-full relative">
        
        {/* Second Place Column (Left Side of Podium) */}
        {second ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Floating Player Card */}
            <div className="w-[calc(100%-12px)] md:w-[calc(100%-24px)] mx-auto relative group flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-3 text-center hover:bg-white/10 transition-all hover:border-slate-400/30 shadow-lg mb-3 shrink-0">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl" title="2nd Place">🥈</span>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 flex items-center justify-center text-dark-900 font-black text-base shadow-md mb-2 shrink-0">
                {second.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-[11px] font-black text-white truncate w-full mb-1">{second.name}</h4>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{second.score} pts</span>
            </div>
            
            {/* Seamless Pedestal Step (Left - bg-white/[0.04]) */}
            <div className="w-full h-11 bg-white/[0.04] border-t border-b border-l border-white/10 rounded-l-[1.5rem] flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              2nd
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* First Place Column (Taller Center Podium) */}
        {first ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Floating Player Card with continuous hovering bounce animation */}
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
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{first.score} pts</span>
            </motion.div>
            
            {/* Seamless Pedestal Step (Center - Taller block) */}
            <div className="w-full h-16 bg-white/[0.04] border-t border-b border-white/10 rounded-t-[1.25rem] flex items-center justify-center text-xs font-black text-white/90 uppercase tracking-widest relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white/[0.01] to-transparent pointer-events-none rounded-t-[1.25rem]" />
              1st
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* Third Place Column (Right Side of Podium) */}
        {third ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center w-full"
          >
            {/* Floating Player Card */}
            <div className="w-[calc(100%-12px)] md:w-[calc(100%-24px)] mx-auto relative group flex flex-col items-center bg-white/5 border border-white/10 rounded-[2rem] p-3 text-center hover:bg-white/10 transition-all hover:border-amber-700/30 shadow-lg mb-3 shrink-0">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl" title="3rd Place">🥉</span>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-dark-900 font-black text-base shadow-md mb-2 shrink-0">
                {third.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-[11px] font-black text-white truncate w-full mb-1">{third.name}</h4>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{third.score} pts</span>
            </div>
            
            {/* Seamless Pedestal Step (Right - bg-white/[0.04]) */}
            <div className="w-full h-8 bg-white/[0.04] border-t border-b border-r border-white/10 rounded-r-[1.5rem] flex items-center justify-center text-[9px] font-black text-amber-500 uppercase tracking-widest">
              3rd
            </div>
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Ranks 4 to 10 list (Sleek horizontal grid rows) */}
      <div className="space-y-2.5 mt-6">
        {remainder.map((item, i) => {
          const rankIndex = i + 4;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                item.name === currentUser
                  ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_15px_rgba(57,255,20,0.15)]'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Ranking Position Badge */}
                <span className="w-6 text-center text-xs font-black text-gray-500">
                  {rankIndex}
                </span>
                {/* Avatar Initials Placeholder */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-gray-300">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                {/* Username */}
                <span className="font-bold text-xs text-white">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                {/* Date Achieved */}
                <span className="text-[9px] text-gray-500 font-bold uppercase">{item.date}</span>
                {/* Final Score */}
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
