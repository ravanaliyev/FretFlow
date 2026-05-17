import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Lesson } from '../Dashboard';

/**
 * Properties for the BadgesSection component.
 * @property lessons - Array of all curriculum lessons to inspect progress if needed.
 * @property streak - Current daily active practice streak count.
 * @property achievements - Optional array of achievement objects fetched from the gamification API.
 */
export interface BadgesSectionProps {
  lessons: Lesson[];
  streak: number;
  achievements?: Array<{ id: number; name: string; description: string; icon: string; earned: boolean }>;
}

/**
 * BadgesSection Component
 * Displays the user's earned achievement badges in a clean, horizontal list and
 * launches a detailed overlay modal featuring all available achievements (both locked
 * and unlocked) mapped into distinct difficulty categories.
 */
const BadgesSection: React.FC<BadgesSectionProps> = ({ achievements }) => {
  // Modal visibility state
  const [showAll, setShowAll] = React.useState(false);

  // Map API achievements into standardized visual badge structures
  const displayBadges = (achievements || []).map(a => ({
    id: String(a.id),
    name: a.name,
    icon: a.icon,
    desc: a.description,
    color: 'from-primary-400 to-primary-600', // Standard aesthetic green gradient
    category: 'Achievement',
    earned: a.earned,
  }));

  // Auxiliary progress tracker (returns null since achievements are currently binary unlocked state)
  const getProgress = (_id: string): { current: number; max: number } | null => {
    return null;
  };

  // Filter list to separate earned achievements
  const unlockedBadges = displayBadges.filter(b => b.earned);
  const unlockedCount = unlockedBadges.length;
  const categories = ['Lessons', 'Streak', 'Mastery', 'Achievement'];

  return (
    <>
      {/* Compact unlocked-only summary view */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Achievements</h3>
            {/* Unlocked / Total Fraction Pill */}
            <span className="text-[10px] font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full">
              {unlockedCount}/{displayBadges.length}
            </span>
          </div>
          {/* Action button to open detailed dialog */}
          <button
            onClick={() => setShowAll(true)}
            className="text-[11px] font-bold text-gray-500 hover:text-primary-400 transition-colors uppercase tracking-wider"
          >
            View All →
          </button>
        </div>

        {/* Informative placeholder if no achievements have been unlocked yet */}
        {unlockedCount === 0 ? (
          <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
            <p className="text-gray-600 text-sm font-bold">No achievements yet.</p>
            <p className="text-[11px] text-gray-700 mt-1">Complete your first lesson to earn one!</p>
          </div>
        ) : (
          /* Inline horizontal display of earned badges */
          <div className="flex flex-wrap gap-3">
            {unlockedBadges.map(badge => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ y: -3 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${badge.color} bg-opacity-10 border border-white/10 group cursor-default`}
                title={badge.name}
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-xs font-bold text-white">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* All Achievements Modal Popup overlay */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            {/* Dark backing overlay that dismisses modal on tap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowAll(false)}
            />
            {/* Modal Body card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 relative z-10 no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">All Achievements</h2>
                  <p className="text-xs text-gray-500 mt-1">{unlockedCount} of {displayBadges.length} unlocked</p>
                </div>
                {/* Dismiss X button */}
                <button
                  onClick={() => setShowAll(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Graphical linear progress bar representing overall unlock percentage */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-10">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                  style={{ width: `${(unlockedCount / Math.max(displayBadges.length, 1)) * 100}%` }}
                />
              </div>

              {/* Grouped lists segmented by difficulty categories */}
              {categories.map(cat => {
                const badgesInCategory = displayBadges.filter(b => b.category === cat);
                if (badgesInCategory.length === 0) return null;
                return (
                  <div key={cat} className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">{cat}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {badgesInCategory.map(badge => {
                        const unlocked = badge.earned;
                        const progress = getProgress(badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 relative overflow-hidden ${unlocked ? 'bg-white/[0.04]' : 'opacity-50'
                              }`}
                          >
                            {/* Visual background gradient tint for unlocked achievements */}
                            {unlocked && <div className={`absolute inset-0 bg-gradient-to-r ${badge.color} opacity-5`} />}
                            
                            {/* Large icon block (grayscaled if locked) */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${unlocked ? `bg-gradient-to-br ${badge.color}` : 'bg-white/5 grayscale'
                              }`}>
                              {badge.icon}
                            </div>
                            
                            {/* Achievement text info */}
                            <div className="flex-1 min-w-0 relative z-10">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-500'}`}>{badge.name}</h4>
                                {unlocked && <span className="text-[9px] font-black text-primary-500 uppercase bg-primary-500/10 px-2 py-0.5 rounded-full">✓ Unlocked</span>}
                              </div>
                              <p className="text-[11px] text-gray-600 mt-0.5">{badge.desc}</p>
                              
                              {/* Inline progress bar for locked progressive achievements (if available) */}
                              {!unlocked && progress && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary-500/40 transition-all duration-500"
                                      style={{ width: `${(progress.current / progress.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-gray-700 font-bold shrink-0">{progress.current}/{progress.max}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BadgesSection;
