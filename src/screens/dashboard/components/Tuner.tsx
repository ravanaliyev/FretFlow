import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { formatNoteName } from '../Dashboard';

export interface GuitarTunerProps {
  currentPitch: string;
  frequency: number;
  notationStyle: 'scientific' | 'syllabic';
}

const GuitarTuner: React.FC<GuitarTunerProps> = ({ frequency, notationStyle }) => {
  const STANDARD_TUNING: Record<string, number> = {
    'E2': 82.41,
    'A2': 110.00,
    'D3': 146.83,
    'G3': 196.00,
    'B3': 246.94,
    'E4': 329.63
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
            {formatNoteName(closestNote, notationStyle).replace(/\d/, '')}
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
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Perfect! 🎯</span>
            </>
          ) : (
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
              {cents < 0 ? 'Tighten String ⬆️' : 'Loosen String ⬇️'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuitarTuner;
