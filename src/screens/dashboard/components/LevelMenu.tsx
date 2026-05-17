import React from 'react';
import { motion } from 'framer-motion';

/**
 * Properties for the LevelMenu component.
 * @property navigate - Navigation callback function to redirect the user to specific paths in the application.
 */
export interface LevelMenuProps {
  navigate: (path: string) => void;
}

/**
 * LevelMenu Component
 * Renders the dashboard landing menu featuring standard game levels from Level 1 to Level 5.
 * It presents cards for:
 * - Level 1: The Foundations (Basic open strings)
 * - Level 2: Fret Mastery (First three frets)
 * - Level 3: Melodies (First guitar riffs and tunes)
 * - Level 4: Songs (Whole playable songs)
 * - Level 5: Ear Training (Aural skills practice)
 */
const LevelMenu: React.FC<LevelMenuProps> = ({ navigate }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
    {[
      { id: 1, name: "The Foundations", desc: "Learn the strings and open notes.", path: '/dashboard/lessons/1' },
      { id: 2, name: "Fret Mastery", desc: "Navigate the first 3 frets with ease.", path: '/dashboard/lessons/2' },
      { id: 3, name: "Melodies", desc: "Play your first riffs and songs.", path: '/dashboard/lessons/3' },
      { id: 4, name: "Songs", desc: "Complete a full song as a lesson, just like the earlier levels.", path: '/dashboard/lessons/4' },
      { id: 5, name: "Ear Training", desc: "Identify notes by ear and match them to the fretboard.", path: '/dashboard/ear-training' }
    ].map(level => (
      <motion.div
        key={level.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(level.path)}
        className="glass-panel p-8 rounded-3xl cursor-pointer hover:border-primary-500/50 transition-colors group flex flex-col items-center text-center"
      >
        {/* Level indicator pill */}
        <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
          Level {level.id}
        </span>
        {/* Level Name */}
        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">
          {level.name}
        </h2>
        {/* Level Description */}
        <p className="text-gray-400 text-sm">
          {level.desc}
        </p>
      </motion.div>
    ))}
  </div>
);

export default LevelMenu;
