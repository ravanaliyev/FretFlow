import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Lock } from 'lucide-react';

/**
 * Properties for the LevelRoadmap component.
 * @property currentXp - The total experience points (XP) accumulated by the user.
 */
export interface LevelRoadmapProps {
  currentXp: number;
}

/**
 * LevelRoadmap Component
 * Displays a progression tracker mapping the user's total XP to 10 distinct guitar mastery ranks.
 * Renders an accordion list that displays only the user's current rank by default,
 * and slides open to showcase all lock/unlock ranks when clicked.
 * Includes a premium pulse highlight animation if the user just achieved a new level rank.
 */
const LevelRoadmap: React.FC<LevelRoadmapProps> = ({ currentXp }) => {
  // Accordion open/close state
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const location = useLocation();
  // Check if router state requests a celebratory flash animation (e.g. on leveling up)
  const shouldFlash = location.state?.flashRank;

  // Clear flash state from browser history once triggered to prevent repetitive pulsing
  useEffect(() => {
    if (shouldFlash) {
      window.history.replaceState({}, document.title);
    }
  }, [shouldFlash]);

  // Threshold mapping definitions for FretFlow's 10-level ranking ladder
  const levels = [
    { level: 1, xp: 0, title: 'Beginner' },
    { level: 2, xp: 100, title: 'Novice' },
    { level: 3, xp: 250, title: 'Apprentice' },
    { level: 4, xp: 500, title: 'Intermediate' },
    { level: 5, xp: 1000, title: 'Advanced' },
    { level: 6, xp: 2000, title: 'Expert' },
    { level: 7, xp: 4000, title: 'Master' },
    { level: 8, xp: 7500, title: 'Grand Master' },
    { level: 9, xp: 12000, title: 'Legendary' },
    { level: 10, xp: 20000, title: 'Guitar Hero 🎸' },
  ];

  // Dynamically calculate the active level rank index based on current XP
  const currentLevelIndex = levels.findIndex(l => currentXp < l.xp) === -1
    ? levels.length - 1 // User is at maximum rank
    : levels.findIndex(l => currentXp < l.xp) - 1;

  // Show only current active level rank when collapsed, else show full catalog
  const displayLevels = isExpanded ? levels : [levels[currentLevelIndex]];

  return (
    <motion.div
      // Celebatory border pulse animations
      animate={shouldFlash ? {
        boxShadow: ['0 0 0px rgba(57,255,20,0)', '0 0 30px rgba(57,255,20,0.4)', '0 0 0px rgba(57,255,20,0)'],
        borderColor: ['rgba(255,255,255,0.05)', 'rgba(57,255,20,0.5)', 'rgba(255,255,255,0.05)']
      } : {}}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="glass-panel p-6 rounded-3xl bg-white/[0.02] border border-white/5 mb-8"
    >
      {/* Clickable Header acting as accordion toggle */}
      <div
        className="flex items-center justify-between mb-6 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
            <Star size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-primary-400 transition-colors">Rank Progression</h4>
            <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Total XP: <span className="text-primary-500">{currentXp.toLocaleString()}</span></p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase bg-white/5 px-3 py-1.5 rounded-full group-hover:bg-primary-500/10 transition-colors">
          {isExpanded ? 'Collapse' : 'Show All Ranks'}
        </div>
      </div>
      
      {/* Sliding Ranks Container */}
      <motion.div layout className="flex flex-col">
        <AnimatePresence initial={false}>
          {displayLevels.map((l) => {
            const globalIdx = levels.findIndex(lvl => lvl.level === l.level);
            const isCurrent = globalIdx === currentLevelIndex;
            const isUnlocked = globalIdx <= currentLevelIndex;
            const isNext = globalIdx === currentLevelIndex + 1;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                key={l.level}
                className="overflow-hidden"
              >
                {/* Level Row Layout Card (Visual style corresponds directly to current, unlocked, or locked status) */}
                <div className={`flex items-center justify-between p-3 rounded-2xl border ${isCurrent ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]' : isUnlocked ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-40'} transition-all`}>
                  <div className="flex items-center gap-4">
                    {/* Circle badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isCurrent ? 'bg-primary-500 text-dark-900' : isUnlocked ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600'}`}>
                      {l.level}
                    </div>
                    {/* Mastery Rank metadata */}
                    <div>
                      <p className={`font-bold whitespace-nowrap ${isCurrent ? 'text-primary-400' : isUnlocked ? 'text-white' : 'text-gray-500'}`}>{l.title}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">{l.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator Badges on right side */}
                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 px-2 py-1 bg-primary-500/10 rounded-lg shrink-0">Current</span>
                  )}
                  {isNext && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">Next Target</span>
                      <span className="text-[9px] text-gray-500 font-bold">{l.xp - currentXp} XP to go</span>
                    </div>
                  )}
                  {isUnlocked && !isCurrent && (
                    <CheckCircle size={16} className="text-green-500/50 shrink-0" />
                  )}
                  {!isUnlocked && !isNext && (
                    <Lock size={16} className="text-gray-600 shrink-0" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default LevelRoadmap;
