import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  ArrowLeft,
  Mic,
  MicOff,
  CheckCircle,
  Lock,
  PlayCircle,
  Plus,
  Trash2,
  X,
  Activity,
  User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AudioProcessor } from '../../utils/PitchProcessor';
import confetti from 'canvas-confetti';

// --- Types ---
interface Lesson {
  id: number;
  title: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'available' | 'locked' | 'completed';
  sequence: string[];
  desc: string;
}

interface HistoryItem {
  id: number;
  title: string;
  date: string;
}

const DEFAULT_LESSONS: Lesson[] = [
  // Level 1 — Open String Mastery
  { id: 1,  title: 'The A String',          level: 1, difficulty: 'easy',   status: 'available', sequence: ['A2'],                   desc: 'The 5th string. A fundamental note for many power chords and your first lesson!' },
  { id: 2,  title: 'The D String',          level: 1, difficulty: 'easy',   status: 'locked',    sequence: ['D3'],                   desc: 'The 4th string. Move your pick down to the next string.' },
  { id: 3,  title: 'The G String',          level: 1, difficulty: 'easy',   status: 'locked',    sequence: ['G3'],                   desc: 'The 3rd string. Getting into the higher, melodic territory.' },
  { id: 4,  title: 'The B String',          level: 1, difficulty: 'easy',   status: 'locked',    sequence: ['B3'],                   desc: 'The 2nd string. Very common in lead melodies and solos.' },
  { id: 5,  title: 'The High E String',     level: 1, difficulty: 'easy',   status: 'locked',    sequence: ['E4'],                   desc: 'The thinnest string. Sharp, bright, and easy to snap!' },

  // Level 2 — String Combinations
  { id: 6,  title: 'Middle Duo',            level: 2, difficulty: 'easy',   status: 'locked',    sequence: ['A2', 'D3'],             desc: 'Switch between the La and Re strings.' },
  { id: 7,  title: 'Upper Trio',            level: 2, difficulty: 'medium', status: 'locked',    sequence: ['G3', 'B3', 'E4'],       desc: 'A quick tour of the melody strings.' },
  { id: 8,  title: 'Across the Fretboard',  level: 2, difficulty: 'hard',   status: 'locked',    sequence: ['A2', 'D3', 'G3', 'B3', 'E4'], desc: 'The ultimate open string coordination test.' },

  // Level 3 — First Riffs
  { id: 11, title: 'Simple Rhythm',         level: 3, difficulty: 'medium', status: 'locked',    sequence: ['A2', 'A2', 'A2'],        desc: 'A basic rhythm using the La string.' },
  { id: 12, title: 'Rock Foundation',       level: 3, difficulty: 'medium', status: 'locked',    sequence: ['A2', 'G3', 'A2'],        desc: 'Standard rock progression using open strings.' },
  { id: 13, title: 'The Blues Walk',        level: 3, difficulty: 'hard',   status: 'locked',    sequence: ['A2', 'C3', 'D3', 'E3'],  desc: 'A simple blues walking line starting from A.' },
];

const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const FRET_COUNT = 12;

const QUOTES = [
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Sometimes you want to give up the guitar, you'll hate it. But if you stick with it, you'll be rewarded.", author: "Jimi Hendrix" },
  { text: "Your talent is your art. It is your gift to yourself.", author: "Slash" },
  { text: "I just play. I don't think. I just play.", author: "B.B. King" }
];

const BADGES = [
  // Lesson milestones
  { id: 'first_note', name: 'First Note', icon: '🎵', desc: 'Complete your very first lesson', color: 'from-blue-400 to-blue-600', category: 'Lessons' },
  { id: 'five_done', name: 'High Five', icon: '✋', desc: 'Complete 5 lessons', color: 'from-violet-400 to-violet-600', category: 'Lessons' },
  { id: 'all_done', name: 'Graduate', icon: '🎓', desc: 'Complete all lessons', color: 'from-amber-400 to-amber-600', category: 'Lessons' },
  // Streak milestones
  { id: 'streak_3', name: '3-Day Flame', icon: '🔥', desc: 'Reach a 3-day streak', color: 'from-orange-400 to-red-500', category: 'Streak' },
  { id: 'streak_7', name: '7-Day Warrior', icon: '⚡', desc: 'Reach a 7-day streak', color: 'from-yellow-400 to-orange-500', category: 'Streak' },
  { id: 'streak_30', name: 'Unstoppable', icon: '💎', desc: 'Reach a 30-day streak', color: 'from-cyan-400 to-blue-600', category: 'Streak' },
  // Level mastery
  { id: 'lvl1_master', name: 'String Master', icon: '🎸', desc: 'Complete all Level 1 lessons', color: 'from-primary-400 to-primary-600', category: 'Mastery' },
  { id: 'lvl2_master', name: 'Fret Explorer', icon: '🗺️', desc: 'Complete all Level 2 lessons', color: 'from-emerald-400 to-teal-600', category: 'Mastery' },
  { id: 'lvl3_master', name: 'Riff Legend', icon: '🌟', desc: 'Complete all Level 3 lessons', color: 'from-pink-400 to-rose-600', category: 'Mastery' },
];

// --- Sub-Components ---

// --- Guitar Tuner Component ---
const GuitarTuner: React.FC<{ currentPitch: string; frequency: number }> = ({ currentPitch, frequency }) => {
  const STANDARD_TUNING: Record<string, number> = {
    'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'B3': 246.94, 'E4': 329.63
  };

  const closestNote = Object.keys(STANDARD_TUNING).reduce((prev, curr) =>
    Math.abs(STANDARD_TUNING[curr] - frequency) < Math.abs(STANDARD_TUNING[prev] - frequency) ? curr : prev
    , 'E2');

  const targetFreq = STANDARD_TUNING[closestNote];
  const cents = frequency > 0 ? Math.round(1200 * Math.log2(frequency / targetFreq)) : 0;
  const isPerfect = Math.abs(cents) < 3;

  const rotation = Math.max(-70, Math.min(70, (cents / 50) * 60));

  return (
    <div className="glass-panel p-5 md:p-8 rounded-[32px] md:rounded-[40px] border-white/10 bg-dark-900/60 backdrop-blur-2xl mb-8 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

      <div className="text-center mb-8 md:mb-10 relative z-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Analog Precision</h4>
        <div className="flex items-center justify-center gap-3">
          <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
            {closestNote.replace(/\d/, '')}
            <span className="text-lg md:text-xl text-primary-500/50 ml-1 italic">{closestNote.match(/\d/)}</span>
          </div>
        </div>
        <p className="text-[9px] md:text-[10px] font-mono text-gray-600 mt-2">{frequency.toFixed(2)} Hz</p>
      </div>

      {/* Gauge Container */}
      <div className="relative h-40 md:h-48 flex items-end justify-center mb-4 overflow-hidden">
        {/* The Arc */}
        <div className="absolute bottom-0 w-full max-w-[240px] md:max-w-[280px] aspect-square border-t-2 border-x-2 border-white/5 rounded-full shadow-[inset_0_4px_20px_rgba(255,255,255,0.02)]" />

        {/* Scale Markers (Circular) */}
        {[-50, -25, 0, 25, 50].map(m => {
          const mRotation = (m / 50) * 60;
          return (
            <div
              key={m}
              className="absolute bottom-4 origin-bottom h-28 md:h-32 flex flex-col items-center"
              style={{ transform: `rotate(${mRotation}deg)` }}
            >
              <div className={`w-0.5 h-2 md:h-3 ${m === 0 ? 'bg-primary-500 w-1 h-4 md:h-5 shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-white/20'}`} />
              <span className={`text-[8px] md:text-[9px] mt-1 font-black ${m === 0 ? 'text-primary-500' : 'text-gray-600'}`}>
                {m === 0 ? 'TUNE' : m > 0 ? `+${m}` : m}
              </span>
            </div>
          );
        })}

        {/* The Needle */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 50, damping: 12 }}
          className="absolute bottom-4 w-1 h-28 md:h-32 origin-bottom z-20"
        >
          <div className={`w-full h-full rounded-full shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-colors duration-300 ${isPerfect ? 'bg-primary-500' : 'bg-rose-500'}`} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 md:w-3 h-2 md:h-3 bg-white rounded-full shadow-lg" />
        </motion.div>

        {/* Pivot Point (The Screw) */}
        <div className="absolute bottom-0 w-8 md:w-10 h-8 md:h-10 bg-dark-950 border-4 border-white/10 rounded-full z-30 flex items-center justify-center shadow-2xl">
          <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-white/20 rounded-full" />
        </div>
      </div>

      <div className="mt-6 md:mt-8 text-center relative z-10">
        <div className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 rounded-full border transition-all duration-500 ${frequency === 0 ? 'bg-white/5 border-white/5 text-gray-600' :
            isPerfect ? 'bg-primary-500/10 border-primary-500 text-primary-500 shadow-[0_0_20px_rgba(57,255,20,0.1)]' :
              cents < 0 ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-rose-500/10 border-rose-500/50 text-rose-500'
          }`}>
          {frequency === 0 ? (
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Waiting for input...</span>
          ) : isPerfect ? (
            <>
              <CheckCircle size={12} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Perfect</span>
            </>
          ) : (
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
              {cents < 0 ? 'Tighten String' : 'Loosen String'}
            </span>
          )}
      </div>
      </div>
    </div>
  );
};

// --- Victory Modal ---
const VictoryModal: React.FC<{ lesson: Lesson; onHome: () => void; onNext?: () => void }> = ({ lesson, onHome, onNext }) => {
  const [countdown, setCountdown] = useState(3);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    let timer: any;
    if (onNext) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [onNext, lesson.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-dark-950/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="glass-panel p-10 rounded-[40px] max-w-lg w-full text-center border-primary-500/30 relative overflow-hidden"
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px]" />
        <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(57,255,20,0.4)]">
          <CheckCircle size={48} className="text-dark-900" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2 italic">AWESOME! 🤘</h2>
        <p className="text-gray-400 mb-8">You just mastered <span className="text-white font-bold">{lesson.title}</span>.</p>
        
        <div className="flex flex-col gap-3">
          {onNext && (
            <button 
              onClick={onNext}
              className="w-full py-5 bg-primary-500 text-dark-900 font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-400 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Next Lesson</span>
              <span className="bg-dark-900/20 px-2 py-0.5 rounded-lg text-xs">Starting in {countdown}s</span>
            </button>
          )}
          <button 
            onClick={onHome}
            className="w-full py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
const MotivationQuote: React.FC = () => {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-8 p-0 italic text-gray-400 text-sm md:text-base max-w-2xl"
    >
      "{quote.text}" — <span className="text-primary-500/70 font-bold not-italic">{quote.author}</span>
    </motion.div>
  );
};

const QuickResume: React.FC<{ lesson: Lesson | null; onResume: (l: Lesson) => void }> = ({ lesson, onResume }) => {
  if (!lesson) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.002 }}
      className="glass-panel p-5 rounded-2xl mb-10 bg-gradient-to-r from-primary-500/10 to-transparent border-primary-500/20 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative"
    >
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500">
          <PlayCircle size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-500/70 mb-0.5 block">Quick Resume</span>
          <h3 className="text-lg font-bold text-white leading-tight">{lesson.title}</h3>
        </div>
      </div>
      <button
        onClick={() => onResume(lesson)}
        className="relative z-10 px-6 py-2.5 bg-primary-500 text-dark-900 text-sm font-black rounded-xl shadow-lg shadow-primary-500/10 hover:bg-primary-400 transition-all active:scale-95"
      >
        Resume Now
      </button>
    </motion.div>
  );
};

const AnalyticsChart: React.FC<{ stats: Record<string, number> }> = ({ stats }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = days.map(day => stats[day] || 0);
  const max = Math.max(...data, 60);
  const hasData = data.some(v => v > 0);

  // SVG dimensions
  const width = 500;
  const height = 160;
  const padding = 20;

  // Calculate points for the line
  const points = data.map((val, i) => ({
    x: padding + (i * (width - 2 * padding)) / (days.length - 1),
    y: height - padding - (val / max) * (height - 2 * padding)
  }));

  // Generate path string (simple linear for now, could be curved)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const activeDays = data.filter(v => v > 0).length;
  const totalMins = Math.round(data.reduce((acc, v) => acc + v, 0));
  const avgMins = activeDays > 0 ? Math.round(totalMins / activeDays) : 0;
  const bestDayIdx = data.indexOf(Math.max(...data));
  const bestDayName = data[bestDayIdx] > 0 ? days[bestDayIdx] : 'None';

  return (
    <div className="glass-panel p-6 rounded-3xl bg-white/[0.02] border-white/5 mb-8 relative overflow-hidden group/chart">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Activity size={100} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Practice Momentum</h4>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Performance analytics curve</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Avg/Day</p>
            <p className="text-sm font-bold text-primary-400">{avgMins}m</p>
          </div>
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Weekly</p>
            <p className="text-sm font-bold text-white">{totalMins}m</p>
          </div>
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Peak</p>
            <p className="text-sm font-bold text-amber-500">{bestDayName}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 border border-dashed border-white/5 rounded-2xl">
          <p className="text-gray-600 font-bold text-sm italic">"The secret of getting ahead is getting started."</p>
          <button className="text-[10px] text-primary-500/50 uppercase font-black tracking-widest mt-2 hover:text-primary-500 transition-colors">Begin Training</button>
        </div>
      ) : (
        <div className="relative h-48 w-full">
          {/* SVG Line Chart content remains same... */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 py-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full border-t border-white/20" />
            ))}
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-40 drop-shadow-[0_0_15px_rgba(57,255,20,0.15)]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39FF14" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
              </linearGradient>
            </defs>

            <motion.path
              initial={{ d: `M ${points[0].x} ${height - padding} L ${points[0].x} ${height - padding} Z` }}
              animate={{ d: areaPath }}
              fill="url(#areaGradient)"
              transition={{ duration: 1, ease: "easeOut" }}
            />

            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d={linePath}
              fill="none"
              stroke="#39FF14"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {points.map((p, i) => (
              <g key={i} className="cursor-pointer group/point">
                <motion.circle
                  initial={{ r: 0 }}
                  animate={{ r: 4 }}
                  cx={p.x}
                  cy={p.y}
                  fill="#39FF14"
                  className="group-hover/point:r-6 transition-all"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="transparent"
                  className="pointer-events-auto"
                />
              </g>
            ))}
          </svg>

          <div className="flex justify-between items-center mt-4 px-1">
            {days.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1 group/label">
                <span className={`text-[10px] font-black transition-all ${data[i] > 0 ? 'text-primary-500' : 'text-gray-700'}`}>
                  {day}
                </span>
                {data[i] > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="text-[9px] text-gray-500 font-bold"
                  >
                    {Math.round(data[i])}m
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



const BadgesSection: React.FC<{ lessons: Lesson[]; streak: number }> = ({ lessons, streak }) => {
  const [showAll, setShowAll] = React.useState(false);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const lvl1Done = lessons.filter(l => l.level === 1 && l.status === 'completed').length;
  const lvl1Total = lessons.filter(l => l.level === 1).length;
  const lvl2Done = lessons.filter(l => l.level === 2 && l.status === 'completed').length;
  const lvl2Total = lessons.filter(l => l.level === 2).length;
  const lvl3Done = lessons.filter(l => l.level === 3 && l.status === 'completed').length;
  const lvl3Total = lessons.filter(l => l.level === 3).length;

  const isUnlocked = (id: string): boolean => {
    switch (id) {
      case 'first_note': return completedCount >= 1;
      case 'five_done': return completedCount >= 5;
      case 'all_done': return completedCount >= lessons.length;
      case 'streak_3': return streak >= 3;
      case 'streak_7': return streak >= 7;
      case 'streak_30': return streak >= 30;
      case 'lvl1_master': return lvl1Done === lvl1Total && lvl1Total > 0;
      case 'lvl2_master': return lvl2Done === lvl2Total && lvl2Total > 0;
      case 'lvl3_master': return lvl3Done === lvl3Total && lvl3Total > 0;
      default: return false;
    }
  };

  const getProgress = (id: string): { current: number; max: number } | null => {
    switch (id) {
      case 'five_done': return { current: Math.min(completedCount, 5), max: 5 };
      case 'all_done': return { current: completedCount, max: lessons.length };
      case 'streak_3': return { current: Math.min(streak, 3), max: 3 };
      case 'streak_7': return { current: Math.min(streak, 7), max: 7 };
      case 'streak_30': return { current: Math.min(streak, 30), max: 30 };
      case 'lvl1_master': return { current: lvl1Done, max: lvl1Total };
      case 'lvl2_master': return { current: lvl2Done, max: lvl2Total };
      case 'lvl3_master': return { current: lvl3Done, max: lvl3Total };
      default: return null;
    }
  };

  const unlockedBadges = BADGES.filter(b => isUnlocked(b.id));
  const unlockedCount = unlockedBadges.length;
  const categories = ['Lessons', 'Streak', 'Mastery'];

  return (
    <>
      {/* Compact unlocked-only view */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Achievements</h3>
            <span className="text-[10px] font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full">
              {unlockedCount}/{BADGES.length}
            </span>
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="text-[11px] font-bold text-gray-500 hover:text-primary-400 transition-colors uppercase tracking-wider"
          >
            View All →
          </button>
        </div>

        {unlockedCount === 0 ? (
          <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
            <p className="text-gray-600 text-sm font-bold">No achievements yet.</p>
            <p className="text-[11px] text-gray-700 mt-1">Complete your first lesson to earn one!</p>
          </div>
        ) : (
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

      {/* All Achievements Modal */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            {/* Plain overlay - no backdrop-blur for perf */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowAll(false)}
            />
            {/* Modal - only this animates */}
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
                  <p className="text-xs text-gray-500 mt-1">{unlockedCount} of {BADGES.length} unlocked</p>
                </div>
                <button
                  onClick={() => setShowAll(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress bar — CSS transition, no motion */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-10">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                  style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
                />
              </div>

              {categories.map(cat => (
                <div key={cat} className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">{cat}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {BADGES.filter(b => b.category === cat).map(badge => {
                      const unlocked = isUnlocked(badge.id);
                      const progress = getProgress(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 relative overflow-hidden ${unlocked ? 'bg-white/[0.04]' : 'opacity-50'
                            }`}
                        >
                          {unlocked && <div className={`absolute inset-0 bg-gradient-to-r ${badge.color} opacity-5`} />}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${unlocked ? `bg-gradient-to-br ${badge.color}` : 'bg-white/5 grayscale'
                            }`}>
                            {badge.icon}
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-500'}`}>{badge.name}</h4>
                              {unlocked && <span className="text-[9px] font-black text-primary-500 uppercase bg-primary-500/10 px-2 py-0.5 rounded-full">✓ Unlocked</span>}
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5">{badge.desc}</p>
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
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const LevelMenu: React.FC<{ navigate: any }> = ({ navigate }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
    {[
      { id: 1, name: "The Foundations", desc: "Learn the strings and open notes." },
      { id: 2, name: "Fret Mastery", desc: "Navigate the first 3 frets with ease." },
      { id: 3, name: "Melodies", desc: "Play your first riffs and songs." }
    ].map(level => (
      <motion.div
        key={level.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/dashboard/lessons/${level.id}`)}
        className="glass-panel p-8 rounded-3xl cursor-pointer hover:border-primary-500/50 transition-colors group flex flex-col items-center text-center"
      >
        <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Level {level.id}</span>
        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">{level.name}</h2>
        <p className="text-gray-400 text-sm">{level.desc}</p>
      </motion.div>
    ))}
  </div>
);

interface LessonGridProps {
  navigate: any;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  difficultyFilter: string;
  setDifficultyFilter: (val: string) => void;
  filteredLessons: Lesson[];
  startPractice: (lesson: Lesson) => void;
}

const LessonGrid: React.FC<LessonGridProps> = ({
  navigate,
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  filteredLessons,
  startPractice
}) => (
  <div className="p-6 space-y-6">
    <div className="flex items-center gap-2 mb-8 relative z-20">
      <button
        onClick={() => navigate('/dashboard')}
        className="glass-panel flex items-center justify-center w-12 h-12 md:w-auto md:px-6 rounded-2xl text-gray-400 hover:text-white transition-colors shrink-0"
        title="Back to Levels"
      >
        <ArrowLeft size={18} /> <span className="hidden md:inline ml-2">Back</span>
      </button>

      <div className="flex-1 relative min-w-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input w-full pl-11 pr-4 h-12 rounded-2xl text-xs md:text-sm"
        />
      </div>

      <div className="shrink-0 flex gap-2">
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="glass-panel h-12 px-3 md:px-4 rounded-2xl text-[10px] md:text-sm text-white outline-none cursor-pointer border-white/5 bg-dark-800/50"
        >
          <option value="all" disabled hidden>Difficulty</option>
          <option value="all">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>

    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {filteredLessons.map(lesson => (
        <motion.div
          key={lesson.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          layout
          className={`glass-panel p-6 rounded-3xl flex flex-col group transition-all duration-300 ${lesson.status === 'locked' ? 'opacity-50 grayscale' : 'hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${lesson.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                lesson.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
              }`}>
              {lesson.difficulty}
            </span>
            <div className="text-primary-500">
              {lesson.status === 'completed' ? <CheckCircle size={20} className="drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]" /> :
                lesson.status === 'locked' ? <Lock size={20} className="text-gray-500" /> : <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />}
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">{lesson.title}</h3>
          <p className="text-sm text-gray-400 mb-6 flex-1">{lesson.desc}</p>
          <button
            disabled={lesson.status === 'locked'}
            onClick={() => startPractice(lesson)}
            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${lesson.status === 'locked' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary-500 text-dark-900 hover:bg-primary-600 shadow-lg shadow-primary-500/20'
              }`}
          >
            {lesson.status === 'completed' ? 'Review Lesson' : 'Start Lesson'}
          </button>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse view and IDs from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  // Expected: ['dashboard'] or ['dashboard', 'lessons', '1'] or ['dashboard', 'practice', '1']
  const currentView = pathParts[1] || 'levels';
  const urlLevelId = pathParts[2] ? parseInt(pathParts[2]) : null;
  const urlLessonId = pathParts[2] ? parseInt(pathParts[2]) : null;

  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('fretflow_lessons_v4');
    return saved ? JSON.parse(saved) : DEFAULT_LESSONS;
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('fretflow_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState('--');


  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [isVictory, setIsVictory] = useState(false);
  const [lastPlayedLessonId, setLastPlayedLessonId] = useState<number | null>(() => {
    const saved = localStorage.getItem('fretflow_last_lesson');
    return saved ? parseInt(saved) : null;
  });

  const [practiceStats, setPracticeStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('fretflow_stats');
    if (saved) return JSON.parse(saved);

    // Generate realistic mock data if empty to show the chart working
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const mockData: Record<string, number> = {};

    // Fill previous days with realistic practice times (15-45 mins)
    days.forEach((day, idx) => {
      const dayPos = (idx + 1) % 7; // Map Mon=1...Sun=0
      if (idx < (todayIdx === 0 ? 6 : todayIdx - 1)) {
        mockData[day] = Math.floor(Math.random() * 30) + 15;
      }
    });
    return mockData;
  });

  const practiceStartTimeRef = useRef<number | null>(null);

  const lastPlayedLesson = lessons.find(l => l.id === lastPlayedLessonId);

  // Dynamic streak logic
  // Rolling 7-day logic
  const getLastSevenDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(days[d.getDay()]);
    }
    return result;
  };

  const rollingDays = getLastSevenDays();
  const [streakData, setStreakData] = useState({
    count: 12,
    isFrozen: true,
    // Demo history for the rolling window (Last 7 days):
    // [Completed, Completed, Completed, Completed, Completed, Frozen (Yesterday), Empty (Today)]
    history: ['completed', 'completed', 'completed', 'completed', 'completed', 'frozen', 'empty']
  });

  const DAYS = rollingDays;

  const processorRef = useRef<AudioProcessor | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('fretflow_lessons_v4', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('fretflow_history', JSON.stringify(history));
  }, [history]);

  // --- Audio Logic Sync with Route ---
  const activeLesson = (currentView === 'practice' || currentView === 'victory') ? lessons.find(l => l.id === urlLessonId) : null;

  useEffect(() => {
    const shouldListen = ((currentView === 'practice' && activeLesson) || currentView === 'tuner') && !isVictory;

    if (shouldListen) {
      if (!processorRef.current) {
        processorRef.current = new AudioProcessor();
      }

      processorRef.current.onNoteDetected = (freq, note) => {
        setCurrentPitch(note);
        setCurrentFrequency(freq);

        // Only trigger match logic if NOT in victory mode, NOT in tuner, and note matches
        if (!isVictory && currentView === 'practice' && activeLesson && note === activeLesson.sequence[currentSequenceIndex]) {
          handleMatch();
        }
      };

      processorRef.current.start().then(() => setIsListening(true));
    } else {
      if (processorRef.current) processorRef.current.stop();
      setIsListening(false);
      setCurrentPitch('--');
      setCurrentFrequency(0);
    }

    return () => {
      if (processorRef.current) processorRef.current.stop();
      updatePracticeTime();
    };
  }, [currentView, urlLessonId, currentSequenceIndex, isVictory]);


  const startPractice = (lesson: Lesson) => {
    setLastPlayedLessonId(lesson.id);
    localStorage.setItem('fretflow_last_lesson', lesson.id.toString());
    practiceStartTimeRef.current = Date.now();
    navigate(`/dashboard/practice/${lesson.id}`);
  };

  const updatePracticeTime = () => {
    if (practiceStartTimeRef.current) {
      const durationSec = (Date.now() - practiceStartTimeRef.current) / 1000;
      const durationMin = durationSec / 60; // No rounding here for precision
      if (durationSec >= 1) { // Any practice over 1 second counts
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        setPracticeStats(prev => {
          const updated = { ...prev, [today]: (prev[today] || 0) + durationMin };
          localStorage.setItem('fretflow_stats', JSON.stringify(updated));
          return updated;
        });
      }
      practiceStartTimeRef.current = null;
    }
  };

  const playSuccessSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [440, 554.37, 659.25, 880]; // A major chord
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.05);
      osc.stop(audioCtx.currentTime + 1.5);
    });
  };

  const handleMatch = () => {
    setCurrentSequenceIndex(prev => {
      const next = prev + 1;
      if (activeLesson && next >= activeLesson.sequence.length) {
        playSuccessSound();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#39FF14', '#ffffff', '#1a1a1a']
        });

        setLessons(prevLessons => {
          const nextLessonId = activeLesson.id + 1;
          const updated = prevLessons.map(l => {
            if (l.id === activeLesson.id) return { ...l, status: 'completed' as const };
            if (l.id === nextLessonId && l.status === 'locked') return { ...l, status: 'available' as const };
            return l;
          });
          return updated;
        });

        setHistory(prev => [
          { id: Date.now(), title: activeLesson.title, date: new Date().toLocaleDateString() },
          ...prev
        ]);

        setIsVictory(true);
        return prev;
      }
      return next;
    });
  };

  const closePractice = () => {
    navigate(`/dashboard/lessons/${activeLesson?.level || 1}`);
  };

  const deleteHistory = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const filteredLessons = lessons.filter(l => {
    const matchesLevel = l.level === urlLevelId;
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'all' || l.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesLevel && matchesSearch && matchesDiff && matchesStatus;
  });

  const progressPercentage = Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100);



  const PracticeView = () => (
    <div className="fixed inset-0 z-[100] bg-dark-950 flex flex-col items-center justify-start md:justify-center p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-12 mt-16 md:mt-0">
        <button
          onClick={closePractice}
          className="md:absolute md:top-8 md:left-8 glass-panel px-6 py-3 rounded-2xl text-gray-400 hover:text-white flex items-center gap-2 transition-all self-start mb-4 md:mb-0"
        >
          <ArrowLeft size={18} /> <span className="text-sm font-bold">Back to Dashboard</span>
        </button>

        <div className="text-center">
          <h1 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4">{activeLesson?.title}</h1>
          <p className="text-gray-400 uppercase tracking-widest text-[10px] md:text-sm">Interactive Fretboard Session</p>
        </div>

        {/* Fretboard */}
        <div className="w-full overflow-x-auto pb-4 no-scrollbar">
          <div className="glass-panel p-6 md:p-8 rounded-3xl min-w-[800px] relative border-white/5 bg-gradient-to-b from-dark-800 to-dark-900">
            {STRINGS.map((string, sIdx) => (
              <div key={string} className="h-10 flex items-center relative group">
                {/* String line */}
                <div
                  className="absolute w-full bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10"
                  style={{ height: `${0.5 + sIdx * 0.4}px`, opacity: 0.8 }}
                />

                {/* Frets */}
                {Array.from({ length: FRET_COUNT + 1 }).map((_, fIdx) => (
                  <div
                    key={fIdx}
                    className={`h-full flex items-center justify-center relative border-r border-white/20 last:border-0 ${fIdx === 0 ? 'border-r-[6px] border-r-gray-300/20' : ''}`}
                    style={{
                      flex: Math.pow(0.94, fIdx) * 10,
                    }}
                  >
                    {sIdx === 0 && (
                      <span className="absolute -top-6 text-[10px] text-gray-500 font-mono font-bold">{fIdx}</span>
                    )}

                    {sIdx === 2 && [3, 5, 7, 9].includes(fIdx) && (
                      <div className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white/10 -z-0" />
                    )}
                    {fIdx === 12 && (sIdx === 1 || sIdx === 4) && (
                      <div className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white/10 -z-0" />
                    )}

                    <AnimatePresence>
                      {activeLesson?.sequence[currentSequenceIndex] === getNoteAt(string, fIdx) && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 shadow-[0_0_20px_rgba(57,255,20,0.8)] z-20 flex items-center justify-center text-[10px] font-black text-dark-900"
                        >
                          {getNoteAt(string, fIdx).replace(/\d/, '')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
          <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar w-full justify-center py-2">
            {activeLesson?.sequence.map((note, i) => (
              <div
                key={i}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 transition-all duration-500 ${i < currentSequenceIndex ? 'bg-green-500' :
                    i === currentSequenceIndex ? 'bg-primary-500 animate-pulse scale-125 shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'bg-gray-800'
                  }`}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-[10px] md:text-sm mb-1 md:mb-2 uppercase tracking-widest font-semibold">Target Note</p>
            <h2 className="text-4xl md:text-7xl font-black text-primary-500 drop-shadow-[0_0_20px_rgba(57,255,20,0.4)]">
              {activeLesson?.sequence[currentSequenceIndex]}
            </h2>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="glass-panel px-4 md:px-6 py-2 md:py-3 rounded-2xl flex items-center gap-2 md:gap-3 text-[10px] md:text-sm">
              {isListening ? (
                <><Mic className="text-green-500 animate-pulse" size={16} /> <span className="text-green-500/80 font-medium tracking-wide">Listening...</span></>
              ) : (
                <><MicOff className="text-red-500" size={16} /> <span className="text-red-500/80">Microphone Off</span></>
              )}
            </div>
            <div className="text-2xl md:text-4xl font-mono font-bold text-white/50">{currentPitch}</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isVictory && activeLesson && (
          <VictoryModal 
            lesson={activeLesson} 
            onHome={() => {
              setIsVictory(false);
              navigate('/dashboard');
            }} 
            onNext={() => {
              const nextId = activeLesson.id + 1;
              const hasNext = lessons.some(l => l.id === nextId);
              setIsVictory(false);
              setCurrentSequenceIndex(0);
              if (hasNext) {
                navigate(`/dashboard/practice/${nextId}`);
              } else {
                navigate('/dashboard');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans overflow-x-hidden">
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 ${currentView === 'practice' ? 'hidden' : ''}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">FRETFLOW</h1>
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate('/dashboard')}
                className={`text-sm font-semibold transition-colors ${currentView === 'levels' || currentView === 'lessons' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Practice
              </button>
              <button
                onClick={() => navigate('/dashboard/activity')}
                className={`text-sm font-semibold transition-colors ${currentView === 'activity' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Activity
              </button>
              <button
                onClick={() => navigate('/dashboard/tuner')}
                className={`text-sm font-semibold transition-colors ${currentView === 'tuner' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Tuner
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Streak Component */}
            <div
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <svg
                  viewBox="0 0 26 31"
                  fill="none"
                  className={`w-6 h-6 transition-all duration-500 drop-shadow-[0_0_8px_rgba(var(--streak-color),0.5)] ${streakData.isFrozen ? 'text-cyan-400' :
                      streakData.count > 0 ? 'text-primary-500' : 'text-gray-600'
                    }`}
                  style={{
                    filter: streakData.count > 0 ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                    '--streak-color': streakData.isFrozen ? '34, 211, 238' : '57, 255, 20'
                  } as any}
                >
                  <path
                    d="M13 1C6 1 1 6 1 12C1 19 8 30 13 30C18 30 25 19 25 12C25 6 20 1 13 1Z"
                    fill="currentColor"
                  />
                  {streakData.isFrozen && (
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      d="M13 1C6 1 1 6 1 12L13 30Z"
                      fill="white"
                      fillOpacity="0.3"
                    />
                  )}
                </svg>
              </div>
              <span className={`text-sm font-black ${streakData.isFrozen ? 'text-cyan-400' :
                  streakData.count > 0 ? 'text-primary-500' : 'text-gray-500'
                }`}>
                {streakData.count}
              </span>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Progress</span>
                <span className="text-xs font-black text-primary-500">{progressPercentage}%</span>
              </div>
              <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center text-primary-500">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>


      {/* Floating Tuner Panel */}
      <AnimatePresence>
        {isTunerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-[250] w-full max-w-sm"
          >
            <GuitarTuner currentPitch={currentPitch} frequency={currentFrequency} />
          </motion.div>
        )}
      </AnimatePresence>


      <div className={`container mx-auto py-12 px-6 max-w-5xl ${currentView === 'practice' ? 'hidden' : ''}`}>
        {/* Main Content - Full Width */}
        <main className="w-full">
          {(currentView === 'levels' || currentView === 'lessons') && (
            <div className="mb-12">
              <h2 className="text-4xl font-bold mb-3 text-white">Welcome back, Rock Star! 🎸</h2>
              <MotivationQuote />
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentView === 'levels' && (
              <motion.div
                key="levels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <QuickResume lesson={lastPlayedLesson || null} onResume={startPractice} />
                <div className="space-y-12">
                  <LevelMenu navigate={navigate} />
                </div>
              </motion.div>
            )}
            {currentView === 'lessons' && (
              <motion.div
                key="lessons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LessonGrid
                  navigate={navigate}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  difficultyFilter={difficultyFilter}
                  setDifficultyFilter={setDifficultyFilter}
                  filteredLessons={filteredLessons}
                  startPractice={startPractice}
                />
              </motion.div>
            )}
            {currentView === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12 pb-20"
              >
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Your Activity</h2>
                  <p className="text-gray-400">Track your progress, badges, and practice history.</p>
                </div>
                <AnalyticsChart stats={practiceStats} />
                <BadgesSection lessons={lessons} streak={streakData.count} />
                <div className="pt-10 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Practice History</h4>
                    <span className="text-[10px] font-bold text-gray-700 bg-white/5 px-2 py-1 rounded">{history.length} Lessons</span>
                  </div>
                  {history.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="text-gray-600" size={32} />
                      </div>
                      <p className="text-gray-400 font-bold">No history yet.</p>
                      <p className="text-xs text-gray-600 mt-2">Finish a lesson to see it here!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-primary-500/30 transition-all bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                              <CheckCircle className="text-gray-600 group-hover:text-primary-500" size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-primary-500 transition-colors">{item.title}</p>
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.date}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteHistory(item.id)}
                            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'tuner' && (
              <motion.div
                key="tuner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-white mb-2 italic">PRECISION TUNER 🎯</h2>
                  <p className="text-gray-500">Get your strings perfectly in sync before you play.</p>
                </div>
                <GuitarTuner currentPitch={currentPitch} frequency={currentFrequency} />

                <div className="grid grid-cols-6 gap-3 mt-12">
                  {['A2', 'D3', 'G3', 'B3', 'E4'].map(s => (
                    <div key={s} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-1">
                      <p className="text-xs font-black text-primary-500">{s.replace(/\d/, '')}</p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase">{s.match(/\d/)}th</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Practice View Overlay */}
      <AnimatePresence>
        {currentView === 'practice' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-dark-950"
          >
            <PracticeView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory View Overlay */}
      <AnimatePresence>
        {currentView === 'victory' && activeLesson && (
          <VictoryModal 
            lesson={activeLesson} 
            onHome={() => navigate('/dashboard')} 
            onNext={() => {
              const nextId = activeLesson.id + 1;
              const hasNext = lessons.some(l => l.id === nextId);
              if (hasNext) {
                navigate(`/dashboard/practice/${nextId}`);
              } else {
                navigate('/dashboard');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Admin FAB */}
      <button
        onClick={() => setShowAdminModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-dark-800 border border-white/10 rounded-full flex items-center justify-center text-primary-500 shadow-2xl hover:bg-dark-700 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] px-6 pb-8 pt-4 bg-dark-900/80 backdrop-blur-2xl border-t border-white/5 flex justify-between items-center">
        {[
          { id: 'practice', label: 'Practice', icon: PlayCircle, path: '/dashboard' },
          { id: 'tuner', label: 'Tuner', icon: Mic, path: '/dashboard/tuner' },
          { id: 'activity', label: 'Activity', icon: Activity, path: '/dashboard/activity' },
        ].map((item) => {
          const isActive = (item.id === 'practice' && (currentView === 'levels' || currentView === 'lessons')) || currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-500' : 'text-gray-500'}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && <motion.div layoutId="mobileNav" className="w-1 h-1 bg-primary-500 rounded-full mt-1" />}
            </button>
          );
        })}
      </nav>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => setShowAdminModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-lg p-8 rounded-3xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Custom Lesson</h2>
                <button onClick={() => setShowAdminModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newLesson: Lesson = {
                  id: Date.now(),
                  title: formData.get('title') as string,
                  level: urlLevelId || 1,
                  difficulty: formData.get('difficulty') as any,
                  status: 'available',
                  sequence: (formData.get('sequence') as string).split(',').map(s => s.trim()),
                  desc: formData.get('desc') as string,
                };
                setLessons(prev => [...prev, newLesson]);
                setShowAdminModal(false);
              }}>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Title</label>
                  <input name="title" required className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Blues Riff" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Difficulty</label>
                  <select name="difficulty" className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Sequence (comma separated)</label>
                  <input name="sequence" required className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. E2, G2, A2" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                  <textarea name="desc" className="glass-input w-full px-4 py-3 rounded-xl text-sm" rows={3} placeholder="What will they learn?" />
                </div>
                <button type="submit" className="w-full bg-primary-500 text-dark-900 font-bold py-4 rounded-xl mt-4 shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all">
                  Create Lesson
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Streak Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
              onClick={() => setShowStreakModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-sm p-8 rounded-[2.5rem] relative z-10 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />

              <div className="mb-6 inline-flex p-4 rounded-3xl bg-primary-500/10 border border-primary-500/20">
                <svg viewBox="0 0 26 31" className={`w-12 h-12 ${streakData.isFrozen ? 'text-cyan-400' : 'text-primary-500'}`} fill="currentColor">
                  <path d="M13 1C6 1 1 6 1 12C1 19 8 30 13 30C18 30 25 19 25 12C25 6 20 1 13 1Z" />
                </svg>
              </div>

              <h2 className="text-3xl font-black mb-2">{streakData.count} Day Streak!</h2>
              <p className="text-gray-400 text-sm mb-8">You're doing great. Keep the rhythm going!</p>

              <div className="grid grid-cols-7 gap-2 mb-8">
                {DAYS.map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{day}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${streakData.history[i] === 'completed' ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_rgba(57,255,20,0.3)]' :
                        streakData.history[i] === 'frozen' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' :
                          'bg-white/5 border border-white/10 text-gray-700'
                      }`}>
                      {streakData.history[i] === 'completed' ? <CheckCircle size={16} strokeWidth={3} /> :
                        streakData.history[i] === 'frozen' ? <span className="text-sm">❄️</span> :
                          <div className="w-1 h-1 rounded-full bg-current" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                <p className="text-sm font-bold text-white/90">
                  {streakData.isFrozen ? "❄️ Your streak is frozen! Practice today to keep it alive." : "🔥 Come back tomorrow to continue your streak!"}
                </p>
              </div>

              <button
                onClick={() => setShowStreakModal(false)}
                className="w-full py-4 bg-dark-800 hover:bg-dark-700 text-white font-bold rounded-2xl transition-all active:scale-95 border border-white/5"
              >
                Rock On!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <div className="fixed inset-0 z-[120]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm"
              onClick={() => setShowHistoryDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full md:max-w-xl lg:max-w-2xl bg-dark-900 border-l border-white/10 p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                    <History size={28} className="text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">Activity</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Your Mastery Journey</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 no-scrollbar space-y-12 pb-24">
                <section>
                  <AnalyticsChart stats={practiceStats} />
                </section>

                <section>
                  <BadgesSection lessons={lessons} streak={streakData.count} />
                </section>

                <section className="pt-10 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Practice History</h4>
                    <span className="text-[10px] font-bold text-gray-700 bg-white/5 px-2 py-1 rounded">{history.length} Lessons</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="text-gray-600" size={32} />
                      </div>
                      <p className="text-gray-400 font-bold">No history yet.</p>
                      <p className="text-xs text-gray-600 mt-2">Finish a lesson to see it here!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {history.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-primary-500/30 transition-all bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                              <CheckCircle className="text-gray-600 group-hover:text-primary-500" size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-primary-500 transition-colors">{item.title}</p>
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.date}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteHistory(item.id)}
                            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="glass-panel p-6 rounded-[2rem] bg-gradient-to-r from-primary-500/10 to-transparent border-primary-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-primary-500">Pro Tip</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Consistency is key. Even 5 minutes a day builds muscle memory faster than a single 2-hour session!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Helper Functions ---
function getNoteAt(stringName: string, fret: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const stringMidis: Record<string, number> = { 'E4': 64, 'B3': 59, 'G3': 55, 'D3': 50, 'A2': 45, 'E2': 40 };
  const midi = stringMidis[stringName] + fret;
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return noteNames[noteIndex] + octave;
}

export default Dashboard;
