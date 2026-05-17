import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import type { Lesson } from '../Dashboard';

/**
 * Properties for the QuickResume component.
 * @property lesson - The lesson the user can quickly resume, or null if there isn't one.
 * @property onResume - Callback function triggered when the user clicks the "Resume Now" button.
 */
export interface QuickResumeProps {
  lesson: Lesson | null;
  onResume: (l: Lesson) => void;
}

/**
 * QuickResume Component
 * Renders a visually appealing glassmorphic banner allowing users to immediately resume their
 * last active or recommended lesson. Utilizes Framer Motion for smooth fade-in animations.
 */
const QuickResume: React.FC<QuickResumeProps> = ({ lesson, onResume }) => {
  // If no active or suggested lesson is available, render nothing.
  if (!lesson) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.002 }}
      className="glass-panel p-5 rounded-2xl mb-10 bg-gradient-to-r from-primary-500/10 to-transparent border-primary-500/20 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative"
    >
      {/* Decorative background aura for premium visual styling */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl" />

      {/* Main information area displaying the lesson details */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Play Icon Wrapper */}
        <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500">
          <PlayCircle size={20} />
        </div>
        <div>
          {/* Small tracker header label */}
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-500/70 mb-0.5 block">
            Quick Resume
          </span>
          {/* Suggested Lesson Title */}
          <h3 className="text-lg font-bold text-white leading-tight">
            {lesson.title}
          </h3>
        </div>
      </div>

      {/* Interactive action button to jump directly into the lesson */}
      <button
        onClick={() => onResume(lesson)}
        className="relative z-10 px-6 py-2.5 bg-primary-500 text-dark-900 text-sm font-black rounded-xl shadow-lg shadow-primary-500/10 hover:bg-primary-400 transition-all active:scale-95"
      >
        Resume Now
      </button>
    </motion.div>
  );
};

export default QuickResume;
