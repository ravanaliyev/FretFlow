import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
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
  User,
  Edit2,
  Trophy,
  Star,
  LogOut,
  HelpCircle,
  Settings2,
  Flag,
  Bell,
  Sun,
  Moon,
  Mail,
  Copy,
  ChevronUp,
  ChevronDown,
  Minus,
  Play,
  RotateCcw,
  Music
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Duel } from '../../types/api';
import { AudioProcessor } from '../../utils/PitchProcessor';
import { lessonsApi } from '../../api/lessons';
import { progressApi } from '../../api/progress';
import { gamificationApi } from '../../api/gamification';
import { statsApi } from '../../api/stats';
import { scoresApi } from '../../api/scores';
import { duelsApi } from '../../api/duels';
import { adminApi } from '../../api/admin';
import { usersApi } from '../../api/users';
import { historyApi } from '../../api/history';
import { songsApi } from '../../api/songs';
import { useAuth } from '../../hooks/useAuth';
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
  order_index?: number;
}

interface HistoryItem {
  id: number;
  title: string;
  date: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'welcome' | 'achievement' | 'info';
  timestamp: string;
  read: boolean;
}

interface LeaderboardItem {
  id: number;
  name: string;
  score: number;
  date: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  difficulty: number;
  notes: string; // JSON string
  xp_reward: number;
  best_score?: number | null;
}




const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const FRET_COUNT = 12;

const QUOTES = [
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Sometimes you want to give up the guitar, you'll hate it. But if you stick with it, you'll be rewarded.", author: "Jimi Hendrix" },
  { text: "Your talent is your art. It is your gift to yourself.", author: "Slash" },
  { text: "I just play. I don't think. I just play.", author: "B.B. King" }
];



const SCI_TO_SYL: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Reb',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab',
  'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
  'B': 'Si'
};

const formatNoteName = (note: string, style: 'scientific' | 'syllabic') => {
  if (!note || style === 'scientific') return note;
  // Handle notes like E2, G#3
  const pitch = note.replace(/[0-9]/g, '');
  const octave = note.replace(/[^0-9]/g, '');
  const syllabic = SCI_TO_SYL[pitch] || pitch;
  return `${syllabic}${octave}`;
};

// --- Sub-Components ---

// --- Guitar Tuner Component ---
const GuitarTuner: React.FC<{ currentPitch: string; frequency: number; notationStyle: 'scientific' | 'syllabic' }> = ({ frequency, notationStyle }) => {
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

// --- Metronome Component ---
const Metronome: React.FC = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatRef = useRef(0);

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Higher pitch for the first beat
    osc.frequency.value = beatNumber === 0 ? 1000 : 500;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.05);

    // Sync visual beat state with audio time
    const diff = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, Math.max(0, diff));
  };

  const scheduler = () => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTime.current);
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % timeSignature;
    }
    timerID.current = window.setTimeout(scheduler, 25);
  };

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerID.current) window.clearTimeout(timerID.current);
      setIsPlaying(false);
      setCurrentBeat(-1);
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerID.current) window.clearTimeout(timerID.current);
    };
  }, []);

  return (
    <div className="glass-panel w-full max-w-3xl p-5 sm:p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-white/10 bg-dark-900/40 backdrop-blur-3xl relative overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-primary-500/5 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10 w-full flex flex-col items-center">
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6 sm:mb-8 md:mb-12">Rhythm Master</h4>

        {/* Visual Beats Grid */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 sm:mb-10 md:mb-16">
          {Array.from({ length: timeSignature }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: currentBeat === i ? 1.2 : 1,
                backgroundColor: currentBeat === i ? 'var(--color-primary-500)' : 'rgba(255,255,255,0.05)',
                boxShadow: currentBeat === i ? '0 0 20px var(--color-primary-500)' : 'none'
              }}
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-white/10"
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="relative mb-10 sm:mb-12 w-full max-w-[18rem]">
          <motion.div
            animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 60 / bpm, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
            className="w-full aspect-square rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative bg-white/5 backdrop-blur-md shadow-2xl"
          >
            <span className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 sm:mb-2">BPM</span>
            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none">{bpm}</span>
            <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-3xl -z-10 opacity-50" />
          </motion.div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-md space-y-6 sm:space-y-8 md:space-y-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 5))}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <Minus size={18} />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 5))}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[3, 4, 6].map(sig => (
              <button
                key={sig}
                onClick={() => {
                  setTimeSignature(sig);
                  if (isPlaying) {
                    beatRef.current = 0;
                  }
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${timeSignature === sig ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                {sig}/4
              </button>
            ))}
          </div>
          <button
            onClick={toggleMetronome}
            className={`w-full py-3 sm:py-4 rounded-[1.5rem] font-black text-base sm:text-lg tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 ${isPlaying
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-primary-500 text-dark-900 shadow-primary-500/20 hover:scale-[1.02]'
              }`}
          >
            {isPlaying ? (
              <><X size={22} /> STOP</>
            ) : (
              <><Play size={22} className="fill-current" /> START</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Song Mode Components ---

const SongLibrary: React.FC<{
  songs: Song[],
  onSelect: (song: Song) => void
}> = ({ songs, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {songs && Array.isArray(songs) && songs.map(song => (
        <motion.div
          key={song.id}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onSelect(song)}
          className="glass-panel p-6 rounded-[2rem] cursor-pointer group relative overflow-hidden bg-white/[0.02] border-white/5"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Music size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Music size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-primary-500 transition-colors">{song.title}</h3>
                <p className="text-xs text-gray-500 font-medium">{song.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className={`px-2 py-1 rounded-lg ${song.difficulty === 1 ? 'bg-green-500/10 text-green-500' :
                song.difficulty === 2 ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                {song.difficulty === 1 ? 'Easy' : song.difficulty === 2 ? 'Medium' : 'Hard'}
              </span>
              <span className="text-gray-500">{song.xp_reward} XP</span>
            </div>

            {song.best_score !== undefined && song.best_score !== null && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-bold uppercase">Best Score</span>
                <span className="text-sm font-black text-primary-500">{song.best_score}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
const SongPlayer: React.FC<{
  song: Song,
  currentPitch: string,
  notationStyle: 'scientific' | 'syllabic',
  formatNoteName: (note: string, style: 'scientific' | 'syllabic') => string,
  onComplete: (score: number, accuracy: number) => void,
  onExit: () => void
}> = ({ song, currentPitch, notationStyle, formatNoteName, onComplete, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const songData = useRef<any[]>([]);

  useEffect(() => {
    try {
      songData.current = JSON.parse(song.notes);
    } catch (e) {
      console.error("Invalid song notes JSON", e);
      songData.current = [];
    }
  }, [song]);

  const PIXELS_PER_SECOND = 250;
  const TARGET_X = 120;

  const update = (time: number) => {
    if (!isPlaying) return;

    if (startTimeRef.current === 0) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    setCurrentTime(elapsed);

    // Collision Detection
    songData.current.forEach((note, idx) => {
      if (hits.has(idx) || misses.has(idx)) return;

      const diff = Math.abs(elapsed - note.t);
      const isWindowOpen = diff < 0.25;

      if (isWindowOpen) {
        if (currentPitch === note.n) {
          setHits(prev => new Set([...prev, idx]));
          setScore(s => s + 100);
          setFeedback({ text: 'PERFECT', color: 'text-primary-500' });
          setTimeout(() => setFeedback(null), 500);
        }
      } else if (elapsed > note.t + 0.3) {
        setMisses(prev => new Set([...prev, idx]));
        setFeedback({ text: 'MISS', color: 'text-rose-500' });
        setTimeout(() => setFeedback(null), 500);
      }
    });

    const lastNote = songData.current[songData.current.length - 1];
    if (lastNote && elapsed > lastNote.t + 2) {
      const accuracy = Math.round((hits.size / songData.current.length) * 100);
      onComplete(score, accuracy);
      setIsPlaying(false);
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, currentPitch]);

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter">{song.title}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{song.artist}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Score</p>
            <p className="text-3xl font-black text-primary-500">{score.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel h-64 rounded-[3rem] relative overflow-hidden bg-dark-950/50 border-white/5 shadow-inner">
        {/* Playhead / Target Line */}
        <div className="absolute top-0 bottom-0 w-1 bg-primary-500/30 z-20 shadow-[0_0_15px_rgba(57,255,20,0.4)]" style={{ left: TARGET_X }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-primary-500/50 bg-primary-500/10 animate-ping" />
        </div>

        {/* Scrolling Notes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {songData.current.map((note, idx) => {
            const x = (note.t - currentTime) * PIXELS_PER_SECOND + TARGET_X;
            if (x < -100 || x > 1200) return null;

            return (
              <motion.div
                key={idx}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
                style={{ left: x }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all shadow-xl ${hits.has(idx) ? 'bg-primary-500 text-dark-900 scale-110' :
                  misses.has(idx) ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                    'bg-white/10 text-white border border-white/20'
                  }`}>
                  {formatNoteName(note.n, notationStyle)}
                </div>
                {!hits.has(idx) && !misses.has(idx) && (
                  <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={`absolute top-12 left-[120px] -translate-x-1/2 font-black text-2xl italic tracking-tighter z-30 ${feedback.color}`}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center">
        {!isPlaying ? (
          <button
            onClick={() => {
              setIsPlaying(true);
              startTimeRef.current = 0;
              setHits(new Set());
              setMisses(new Set());
              setScore(0);
            }}
            className="bg-primary-500 text-dark-900 px-12 py-5 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl shadow-primary-500/30 flex items-center gap-4"
          >
            <Play size={24} fill="currentColor" /> START SONG
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 flex items-center gap-3">
              <Mic className="text-primary-500 animate-pulse" size={16} />
              Detecting: <span className="text-white font-black text-sm">{formatNoteName(currentPitch, notationStyle) || '--'}</span>
            </div>
            <button
              onClick={() => setIsPlaying(false)}
              className="text-gray-500 hover:text-white font-bold uppercase tracking-widest text-xs"
            >
              Stop Session
            </button>
          </div>
        )}
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

const EarTrainingGame: React.FC<{ onComplete?: (score: number, total: number) => void }> = ({ onComplete }) => {
  const strings = [
    { name: 'E2', midi: 40 },
    { name: 'A2', midi: 45 },
    { name: 'D3', midi: 50 },
    { name: 'G3', midi: 55 },
    { name: 'B3', midi: 59 },
    { name: 'E4', midi: 64 },
  ];

  const availableNotes = [
    'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3',
    'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4'
  ] as const;

  const noteValues = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const;

  const noteToMidi = (note: string) => {
    const match = note.match(/^([A-G])(#?)(\d)$/);
    if (!match) return null;
    const [, letter, sharp, octave] = match;
    const base = noteValues[letter as keyof typeof noteValues];
    return base + (sharp ? 1 : 0) + 12 * (Number(octave) + 1);
  };

  const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

  const playNote = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi), audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  };

  const getPositions = (note: string) => {
    const midi = noteToMidi(note);
    if (midi === null) return [];
    return strings
      .map((string) => ({ string: string.name, fret: midi - string.midi }))
      .filter((pos) => pos.fret >= 0 && pos.fret <= 12);
  };

  const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);

  const [currentNote, setCurrentNote] = useState<string>('E2');
  const [correctPosition, setCorrectPosition] = useState<{ string: string; fret: number } | null>(null);
  const [options, setOptions] = useState<Array<{ string: string; fret: number }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [correctCount, setCorrectCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);

  const buildQuestion = () => {
    const note = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    const positions = getPositions(note);
    if (positions.length === 0) {
      return buildQuestion();
    }
    const correct = positions[Math.floor(Math.random() * positions.length)];
    const allPositions = strings.flatMap((string) =>
      Array.from({ length: 13 }, (_, idx) => ({ string: string.name, fret: idx }))
    );
    const wrongOptions = shuffle(allPositions.filter((pos) => pos.string !== correct.string || pos.fret !== correct.fret)).slice(0, 3);

    setCurrentNote(note);
    setCorrectPosition(correct);
    setOptions(shuffle([correct, ...wrongOptions]));
    setSelectedId(null);
    setFeedback('');
    playNote(note);
  };

  useEffect(() => {
    buildQuestion();
  }, []);

  const handleAnswer = (option: { string: string; fret: number }) => {
    setSelectedId(`${option.string}-${option.fret}`);
    const isCorrect = correctPosition && option.string === correctPosition.string && option.fret === correctPosition.fret;
    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong — the right answer was ${correctPosition?.string} fret ${correctPosition?.fret}.`);
    }
    setRoundCount((count) => count + 1);

    // Check for victory condition
    if (isCorrect && correctCount + 1 >= 10) {
      if (onComplete) {
        onComplete(correctCount + 1, roundCount + 1);
      }
    } else {
      setTimeout(buildQuestion, 1600);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-dark-950/70 shadow-2xl shadow-black/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Ear Training Practice</p>
            <h3 className="text-lg font-black text-white">Hear the note. Match the fretboard.</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Score</p>
            <p className="text-lg font-black text-primary-500">{correctCount}/{Math.max(roundCount, 1)}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
          <div className="rounded-3xl bg-white/5 p-4 border border-white/10">
            <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">A note is played without showing its name. Choose the correct string and fret.</p>
            <div className="text-3xl font-black text-white mb-1">♪</div>
          </div>
          <button
            onClick={() => currentNote && playNote(currentNote)}
            className="py-3 px-5 rounded-2xl bg-primary-500 text-dark-900 font-black uppercase tracking-widest hover:bg-primary-400 transition-all text-sm"
          >
            Play Note Again
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-8">
          {options.map((option) => {
            const optionId = `${option.string}-${option.fret}`;
            return (
              <button
                key={optionId}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedId}
                className={`p-4 rounded-2xl text-left font-bold transition-all border ${selectedId === optionId ? 'border-primary-500 bg-primary-500/20 text-white' : 'bg-dark-900 border-white/10 hover:border-primary-500/30 hover:bg-dark-800 text-gray-200'} ${selectedId ? 'cursor-not-allowed opacity-90' : 'active:scale-95 shadow-lg shadow-black/20'}`}
              >
                <div className="flex items-center justify-around py-1">
                  <div className="text-center min-w-[70px]">
                    <span className="block text-[8px] text-gray-500 uppercase tracking-[0.2em] mb-1">String</span>
                    <span className="text-lg font-black text-white leading-none">{option.string}</span>
                  </div>
                  <div className="w-px h-10 bg-white/10 mx-2" />
                  <div className="text-center min-w-[70px]">
                    <span className="block text-[8px] text-gray-500 uppercase tracking-[0.2em] mb-1">Fret</span>
                    <span className="text-lg font-black text-white leading-none">{option.fret}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="mt-6 rounded-3xl bg-white/5 p-4 border border-white/10 text-sm text-gray-200">
            {feedback}
          </div>
        )}
      </div>
    </div>
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

const LevelRoadmap: React.FC<{ currentXp: number }> = ({ currentXp }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const location = useLocation();
  const shouldFlash = location.state?.flashRank;

  useEffect(() => {
    if (shouldFlash) {
      window.history.replaceState({}, document.title);
    }
  }, [shouldFlash]);

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

  const currentLevelIndex = levels.findIndex(l => currentXp < l.xp) === -1
    ? levels.length - 1
    : levels.findIndex(l => currentXp < l.xp) - 1;

  const displayLevels = isExpanded ? levels : [levels[currentLevelIndex]];

  return (
    <motion.div
      animate={shouldFlash ? {
        boxShadow: ['0 0 0px rgba(57,255,20,0)', '0 0 30px rgba(57,255,20,0.4)', '0 0 0px rgba(57,255,20,0)'],
        borderColor: ['rgba(255,255,255,0.05)', 'rgba(57,255,20,0.5)', 'rgba(255,255,255,0.05)']
      } : {}}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="glass-panel p-6 rounded-3xl bg-white/[0.02] border border-white/5 mb-8"
    >
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
                <div className={`flex items-center justify-between p-3 rounded-2xl border ${isCurrent ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]' : isUnlocked ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-40'} transition-all`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isCurrent ? 'bg-primary-500 text-dark-900' : isUnlocked ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600'}`}>
                      {l.level}
                    </div>
                    <div>
                      <p className={`font-bold whitespace-nowrap ${isCurrent ? 'text-primary-400' : isUnlocked ? 'text-white' : 'text-gray-500'}`}>{l.title}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">{l.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
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
            )
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

const LeaderboardComponent: React.FC<{ data: LeaderboardItem[], currentUser?: string, userScore?: number }> = ({ data, currentUser, userScore = 0 }) => {
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 font-mono text-xs whitespace-pre-wrap">{this.state.error?.stack}</div>;
    }
    return this.props.children;
  }
}

const BadgesSection: React.FC<{ lessons: Lesson[]; streak: number; achievements?: Array<{ id: number; name: string; description: string; icon: string; earned: boolean }> }> = ({ lessons: _lessons, streak: _streak, achievements: apiAchievements }) => {
  const [showAll, setShowAll] = React.useState(false);

  // Use API achievements exclusively
  const displayBadges = (apiAchievements || []).map(a => ({
    id: String(a.id),
    name: a.name,
    icon: a.icon,
    desc: a.description,
    color: 'from-primary-400 to-primary-600',
    category: 'Achievement',
    earned: a.earned,
  }));

  const getProgress = (_id: string): { current: number; max: number } | null => {
    return null; // API achievements are binary (earned or not)
  };

  const unlockedBadges = displayBadges.filter(b => b.earned);
  const unlockedCount = unlockedBadges.length;
  const categories = ['Lessons', 'Streak', 'Mastery', 'Achievement'];

  return (
    <>
      {/* Compact unlocked-only view */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Achievements</h3>
            <span className="text-[10px] font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full">
              {unlockedCount}/{displayBadges.length}
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
                  <p className="text-xs text-gray-500 mt-1">{unlockedCount} of {displayBadges.length} unlocked</p>
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
                  style={{ width: `${(unlockedCount / Math.max(displayBadges.length, 1)) * 100}%` }}
                />
              </div>

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
                );
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const ProfileDropdown: React.FC<{
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onUpdate: (data: { username?: string; avatar_url?: string; password?: string }) => Promise<void>;
}> = ({ user, onClose, onLogout, onOpenHelp, onOpenSettings, onOpenSupport, onUpdate }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'edit'>('main');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <>
      <motion.div
        ref={dropdownRef}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="fixed top-20 right-6 z-[2001] glass-panel p-6 rounded-3xl w-72 border-white/10 shadow-2xl shadow-black/50"
      >
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center text-primary-500 overflow-hidden">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-none mb-1">{user?.username}</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Lv.{user?.level} Student</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setView('edit')}
                  className="w-full py-3 bg-primary-500 text-dark-900 text-xs font-black rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button
                  onClick={() => { onClose(); onOpenSettings(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Settings2 size={14} /> Settings
                </button>
                <button
                  onClick={() => { onClose(); onOpenSupport(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Flag size={14} /> Support / Report Bug
                </button>
                <button
                  onClick={() => { onClose(); onOpenHelp(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <HelpCircle size={14} /> Help Center
                </button>
                <button
                  onClick={onLogout}
                  className="w-full py-3 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setView('main')} className="text-gray-500 hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Edit Profile</h3>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white font-medium focus:border-primary-500/50 transition-all outline-none"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white font-medium focus:border-primary-500/50 transition-all outline-none"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <button
                onClick={async () => {
                  setIsSaving(true);
                  await onUpdate({ username, ...(password ? { password } : {}) });
                  setIsSaving(false);
                  setPassword('');
                  setView('main');
                }}
                disabled={isSaving}
                className="w-full py-3 bg-primary-500 text-dark-900 text-sm font-black rounded-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const LevelMenu: React.FC<{ navigate: any }> = ({ navigate }) => (
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
  userRole: string;
  onAdd: () => void;
  onEdit: (lesson: Lesson) => void;
  onReorder: (lessonId: number, direction: 'up' | 'down') => void;
  lessons: Lesson[];
}

const LessonGrid: React.FC<LessonGridProps> = ({
  navigate,
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  filteredLessons,
  startPractice,
  userRole,
  onAdd,
  onEdit,
  onReorder,
  lessons
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
          className={`glass-panel p-6 rounded-3xl flex flex-col group transition-all duration-300 relative overflow-hidden ${lesson.status === 'locked' ? 'opacity-50 grayscale' : 'hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5'}`}
        >
          {lesson.level === 4 && (
            <div className="absolute top-[43%] -translate-y-1/2 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Music size={80} />
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${lesson.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
              lesson.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
              }`}>
              {lesson.difficulty}
            </span>
            <div className="flex items-center gap-2">
              {userRole === 'ADMIN' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(lesson.id, 'up'); }}
                    disabled={lessons.findIndex(l => l.id === lesson.id) === 0}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReorder(lesson.id, 'down'); }}
                    disabled={lessons.findIndex(l => l.id === lesson.id) === lessons.length - 1}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
                    className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center justify-center"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="text-primary-500">
                {lesson.status === 'completed' ? <CheckCircle size={20} className="drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]" /> :
                  lesson.status === 'locked' ? <Lock size={20} className="text-gray-500" /> : <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />}
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors flex items-center gap-2">
            {lesson.level === 4 && <Music size={18} className="text-primary-500/70" />}
            {lesson.title}
          </h3>
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
      {userRole === 'ADMIN' && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          onClick={onAdd}
          className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-all mb-4">
            <Plus size={24} />
          </div>
          <p className="font-bold text-gray-500 group-hover:text-primary-500 transition-colors uppercase tracking-widest text-xs">Add New Lesson</p>
        </motion.div>
      )}
    </motion.div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const userRole = user?.role || 'STUDENT';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Parse view and IDs from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  // Expected: ['dashboard'] or ['dashboard', 'lessons', '1'] or ['dashboard', 'practice', '1']
  const urlView = pathParts[1] || 'levels';
  const urlLevelId = pathParts[2] ? parseInt(pathParts[2]) : null;
  const urlLessonId = pathParts[2] ? parseInt(pathParts[2]) : null;
  const urlInviteCode = pathParts[2] || '';
  const currentView = urlView;
  const [isTunerOpen] = useState(false);

  const [showHistoryClearModal, setShowHistoryClearModal] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter] = useState('all');
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState('--');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('fretflow_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('fretflow_theme') === 'light' ? 'light' : 'dark'));
  const [notationStyle, setNotationStyle] = useState<'scientific' | 'syllabic'>(
    () => (localStorage.getItem('fretflow_notation') === 'syllabic' ? 'syllabic' : 'scientific')
  );
  const [isLefty, setIsLefty] = useState<boolean>(
    () => localStorage.getItem('fretflow_is_lefty') === 'true'
  );
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('fretflow_notifications', JSON.stringify(notifications));
  }, [notifications]);
  const achievementsInitializedRef = useRef(false);
  const previousEarnedAchievementsRef = useRef<number[]>([]);
  const [, setAdminTab] = useState<'Add New' | 'Manage'>('Add New');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Game States
  const [gamePhase, setGamePhase] = useState<'idle' | 'countdown' | 'playing' | 'result'>('idle');
  const [gameTimeLeft, setGameTimeLeft] = useState(30);
  const [gameScore, setGameScore] = useState(0);
  const [gameTargetNote, setGameTargetNote] = useState('');
  const [gameHighScore, setGameHighScore] = useState(() => Number(localStorage.getItem('fretflow_highscore') || 0));
  const [gameCountdown, setGameCountdown] = useState(3);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [duelCodeInput, setDuelCodeInput] = useState('');
  const [duelScore, setDuelScore] = useState(0);
  const [duelAccuracy, setDuelAccuracy] = useState(0);
  const [duelMessage, setDuelMessage] = useState<string | null>(null);
  const [duelError, setDuelError] = useState<string | null>(null);
  const [duelReadyInProgress, setDuelReadyInProgress] = useState(false);

  const isDuelParticipant = Boolean(duel && user && (user.id === duel.host_user_id || user.id === duel.guest_user_id));
  const isDuelHost = Boolean(duel && user?.id === duel.host_user_id);
  const userIsReady = Boolean(duel && (isDuelHost ? duel.host_ready : duel?.guest_ready));
  const opponentIsReady = Boolean(duel && (isDuelHost ? duel?.guest_ready : duel?.host_ready));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('fretflow_theme', theme);
  }, [theme]);

  // Sync state with user profile from DB
  useEffect(() => {
    if (user) {
      if (user.notation_style) setNotationStyle(user.notation_style);
      if (user.is_lefty !== undefined) setIsLefty(!!user.is_lefty);
    }
  }, [user]);

  const handleUpdateNotation = async (style: 'scientific' | 'syllabic') => {
    setNotationStyle(style);
    localStorage.setItem('fretflow_notation', style);
    if (isAuthenticated) {
      try {
        const updated = await usersApi.updateMe({ notation_style: style });
        updateUser(updated);
      } catch (err) {
        console.error('Failed to save notation preference:', err);
      }
    }
  };

  const handleUpdateLefty = async (val: boolean) => {
    setIsLefty(val);
    localStorage.setItem('fretflow_is_lefty', val.toString());
    if (isAuthenticated) {
      try {
        const updated = await usersApi.updateMe({ is_lefty: val });
        updateUser(updated);
      } catch (err) {
        console.error('Failed to save lefty preference:', err);
      }
    }
  };

  useEffect(() => {
    const welcomeSeen = localStorage.getItem('fretflow_welcome_seen') === 'true';
    if (!welcomeSeen) {
      setNotifications(prev => [
        {
          id: Date.now(),
          title: 'Welcome!',
          message: 'After logging into FretFlow, we\'ll keep you updated with new notifications here.',
          type: 'welcome',
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          read: false,
        },
        ...prev,
      ]);
      localStorage.setItem('fretflow_welcome_seen', 'true');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target) &&
        !(target instanceof Element && target.closest('[data-notification-button]'))
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    scoresApi.getLeaderboard().then(res => {
      const mapped = res.data.map((item: any) => ({
        id: item.id,
        name: item.username,
        score: item.best_score ?? item.xp_total,
        date: ''
      }));
      setLeaderboard(mapped);
    }).catch(err => {
      console.error('Failed to fetch leaderboard:', err);
    });
  }, []);

  const fetchDuel = async (inviteCode: string) => {
    if (!inviteCode) return;
    try {
      const res = await duelsApi.getDuel(inviteCode);
      setDuel(res.data);
      setDuelError(null);
    } catch (err: any) {
      setDuelError('Could not load duel. Check the code or try again.');
      console.error('Failed to load duel:', err);
    }
  };

  const createDuel = async () => {
    try {
      const res = await duelsApi.createDuel();
      setDuel(res.data);
      navigate(`/dashboard/duel/${res.data.invite_code}`);
      setDuelError(null);
      setDuelMessage('Duel created! Share the link with a friend.');
    } catch (err: any) {
      console.error('Failed to create duel:', err);
      setDuelError('Unable to create duel room right now.');
    }
  };

  const joinDuel = async () => {
    if (!urlInviteCode) {
      setDuelError('Enter a duel code to join.');
      return;
    }
    try {
      const res = await duelsApi.joinDuel(urlInviteCode);
      setDuel(res.data);
      setDuelError(null);
      setDuelMessage('You joined the duel! Click ready when you are set.');
    } catch (err: any) {
      console.error('Failed to join duel:', err);
      setDuelError('Unable to join the duel. It may already be full or invalid.');
    }
  };

  const readyDuel = async () => {
    if (!urlInviteCode) {
      setDuelError('No duel code available.');
      return;
    }

    setDuelReadyInProgress(true);
    try {
      const res = await duelsApi.readyDuel(urlInviteCode);
      setDuel(res.data);
      setDuelMessage('You are ready! Waiting for your opponent...');

      // If we're already started, ensure we're in idle to trigger the challenge
      if (res.data.status === 'started' && gamePhase !== 'idle') {
        setGamePhase('idle');
      }
      setDuelError(null);
    } catch (err: any) {
      console.error('Failed to ready duel:', err);
      setDuelError('Could not set ready state. Try again.');
    } finally {
      setDuelReadyInProgress(false);
    }
  };

  const submitDuelResult = async () => {
    if (!urlInviteCode) {
      setDuelError('No duel code available.');
      return;
    }
    try {
      const res = await duelsApi.finishDuel(urlInviteCode, duelScore, duelAccuracy);
      setDuel(res.data);
      // setDuelMessage('Your duel score is registered.');
      setDuelError(null);
    } catch (err: any) {
      console.error('Failed to submit duel result:', err);
      setDuelError('Failed to submit duel score. Make sure you are joined to the duel.');
    }
  };

  useEffect(() => {
    if (currentView === 'duel') {
      setDuel(null); // Clear previous duel data immediately
      setGamePhase('idle');
      setGameTimeLeft(30);
      setGameScore(0);
      setGameCountdown(3);
      setDuelMessage(null);
      setDuelError(null);
      setDuelAccuracy(0);
      setGameScore(0); // Reset score for new duel
      setGameTimeLeft(30); // Reset timer for new duel
    }
  }, [urlInviteCode, currentView]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (currentView === 'duel' && urlInviteCode) {
      fetchDuel(urlInviteCode);
      interval = setInterval(() => fetchDuel(urlInviteCode), 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, urlInviteCode]);

  useEffect(() => {
    if (currentView === 'duel' && duel?.status === 'started' && gamePhase === 'idle') {
      setDuelMessage('Both players are ready. Your 30-second duel challenge begins now.');
      startChallenge();
    }
  }, [currentView, duel?.status, gamePhase]);

  const [isVictory, setIsVictory] = useState(false);
  const [lastPlayedLessonId, setLastPlayedLessonId] = useState<number | null>(() => {
    const saved = localStorage.getItem('fretflow_last_lesson');
    return saved ? parseInt(saved) : null;
  });

  const [practiceStats, setPracticeStats] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fretflow_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse practice stats:', e);
    }

    // Generate realistic mock data if empty to show the chart working
    const mockData: Record<string, number> = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = new Date().getDay();
    days.forEach((day, idx) => {
      if (idx < (todayIdx === 0 ? 6 : todayIdx - 1)) {
        mockData[day] = Math.floor(Math.random() * 30) + 15;
      }
    });
    return mockData;
  });

  const practiceStartTimeRef = useRef<number | null>(null);

  const isAllCompleted = lessons.every(l => l.status === 'completed');
  const lastPlayedLesson = lessons.find(l => l.id === lastPlayedLessonId);
  const lastCompletedIndex = [...lessons].reverse().findIndex(l => l.status === 'completed');
  const actualLastIndex = lastCompletedIndex !== -1 ? (lessons.length - 1 - lastCompletedIndex) : -1;

  const suggestedLesson = isAllCompleted
    ? (lastPlayedLesson || lessons[0])
    : (lessons.find(l => l.status === 'available') ||
      (actualLastIndex !== -1 && actualLastIndex < lessons.length - 1 ? lessons[actualLastIndex + 1] : lessons[0]));

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

  const generateStreakHistory = (count: number): ('completed' | 'frozen' | 'empty')[] => {
    const hist: ('completed' | 'frozen' | 'empty')[] = Array(7).fill('empty');
    const completedDays = Math.min(count, 7);
    for (let i = 0; i < completedDays; i++) {
      hist[6 - i] = 'completed';
    }
    return hist;
  };

  const rollingDays = getLastSevenDays();
  const [streakData, setStreakData] = useState(() => {
    const saved = localStorage.getItem('fretflow_streak');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, history: generateStreakHistory(parsed.count) };
    }
    return {
      count: 0,
      isFrozen: false,
      lastUpdated: new Date().toDateString(),
      history: generateStreakHistory(0)
    };
  });

  useEffect(() => {
    localStorage.setItem('fretflow_streak', JSON.stringify(streakData));
  }, [streakData]);

  const DAYS = rollingDays;

  const processorRef = useRef<AudioProcessor | null>(null);
  if (!processorRef.current) {
    processorRef.current = new AudioProcessor();
  }
  const lastMatchTimeRef = useRef<number>(0);

  const refreshData = async () => {
    try {
      const [lessonsRes, progressRes, profileRes, historyRes, achievementsRes, songsRes] = await Promise.all([
        lessonsApi.getAll(),
        progressApi.getLessonProgress(),
        gamificationApi.getProfile(),
        historyApi.getAll(),
        gamificationApi.getAchievements(),
        songsApi.getAll(),
      ]);

      const progressMap = new Map<number, any>(
        progressRes.data.map((p: any) => [p.lesson_id, p])
      );

      const mapped: Lesson[] = lessonsRes.data.map((l: any, idx: number) => {
        const progress = progressMap.get(l.id);
        let status: Lesson['status'] = 'available';
        if (progress?.is_completed) {
          status = 'completed';
        } else if (idx > 0) {
          const prevProgress = progressMap.get(lessonsRes.data[idx - 1]?.id);
          if (!prevProgress?.is_completed) {
            status = 'locked';
          }
        }

        const parsedNotes = JSON.parse(l.notes || '[]');
        const sequence = Array.isArray(parsedNotes)
          ? parsedNotes.map((n: any) => typeof n === 'string' ? n : (n.note || ''))
          : [];

        return {
          id: l.id,
          title: l.title,
          level: l.level || 1,
          difficulty: (['easy', 'medium', 'hard'] as const)[l.difficulty - 1] || 'easy',
          status,
          sequence,
          desc: l.description,
          order_index: l.order_index,
        };
      });

      setLessons(mapped);
      // De-duplicate achievements by name before setting state
      const rawAchievements = achievementsRes.data || [];
      const uniqueAchievements = rawAchievements.filter((v: any, i: number, a: any[]) =>
        a.findIndex(t => t.name === v.name) === i
      );
      setAchievements(uniqueAchievements);
      if (songsRes && songsRes.data) {
        setSongs(songsRes.data);
      }

      // Update streak data from API profile
      if (profileRes && profileRes.streak) {
        const count = profileRes.streak.current || 0;
        setStreakData((prev: any) => ({
          ...prev,
          count: count,
          isFrozen: false,
          lastUpdated: profileRes.streak.last_practice || new Date().toDateString(),
          history: generateStreakHistory(count)
        }));
      }

      if (profileRes) {
        setUserXp(profileRes.xp_total || 0);
        setUserLevel(profileRes.level || 1);

        // Sync High Score
        if (profileRes.best_score !== undefined) {
          setGameHighScore(profileRes.best_score);
        }

        const mappedHistory: HistoryItem[] = (historyRes || []).map((h: any) => ({
          id: h.id,
          title: h.lesson_title || h.title,
          date: h.completed_at ? new Date(h.completed_at).toLocaleDateString() : 'Recent'
        }));
        setHistory(mappedHistory);
      }

    } catch (err) {
      console.error('Failed to load API data:', err);
    }
  };

  // --- API Data Loading ---
  useEffect(() => {
    refreshData();
  }, []);

  const [achievements, setAchievements] = useState<Array<Achievement>>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Map songs into Lesson-like objects for Level 4 display
  const songsAsLessons: Lesson[] = useMemo(() => {
    return songs.map((s, idx) => {
      const isCompleted = (s.best_score || 0) > 0;
      let status: Lesson['status'] = isCompleted ? 'completed' : 'available';

      if (status !== 'completed') {
        if (idx > 0) {
          const prevSong = songs[idx - 1];
          const isPrevCompleted = (prevSong.best_score || 0) > 0;
          if (!isPrevCompleted) {
            status = 'locked';
          }
        } else {
          // First song of Level 4 - check if previous level (Level 3) is completed
          const level3Lessons = lessons.filter(l => l.level === 3);
          if (level3Lessons.length > 0) {
            const allLevel3Completed = level3Lessons.every(l => l.status === 'completed');
            if (!allLevel3Completed) {
              status = 'locked';
            }
          }
        }
      }

      return {
        id: -Math.abs(s.id),
        title: s.title,
        level: 4,
        difficulty: s.difficulty === 1 ? 'easy' : s.difficulty === 2 ? 'medium' : 'hard',
        status,
        sequence: (() => {
          try {
            const parsed = JSON.parse(s.notes || '[]');
            return Array.isArray(parsed) ? parsed.map((n: any) => (typeof n === 'string' ? n : (n.note || ''))) : [];
          } catch (e) { return []; }
        })(),
        desc: s.artist || ''
      };
    });
  }, [songs, lessons]);

  useEffect(() => {
    if (achievements.length === 0) return;

    if (!achievementsInitializedRef.current) {
      achievementsInitializedRef.current = true;
      previousEarnedAchievementsRef.current = achievements.filter(a => a.earned).map(a => a.id);
      return;
    }

    const newlyEarned = achievements.filter(a => a.earned && !previousEarnedAchievementsRef.current.includes(a.id));
    if (newlyEarned.length > 0) {
      setNotifications(prev => [
        ...newlyEarned.map(a => ({
          id: Date.now() + a.id,
          title: 'You earned a new achievement!',
          message: `${a.name}: ${a.description}`,
          type: 'achievement' as const,
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          read: false,
        })),
        ...prev,
      ]);
      previousEarnedAchievementsRef.current = achievements.filter(a => a.earned).map(a => a.id);
    }
  }, [achievements]);

  // --- Fetch Stats from API ---
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsRes = await statsApi.getPractice('week');
        // Transform API response to match Dashboard's expected format
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const transformed: Record<string, number> = {};
        statsRes.data?.forEach((dayStat) => {
          const date = new Date(dayStat.date);
          const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
          transformed[dayName] = Math.round((dayStat.total_practice_seconds || 0) / 60);
        });
        if (Object.keys(transformed).length > 0) {
          setPracticeStats(transformed);
        }
      } catch (err) {
        console.error('Failed to load stats from API:', err);
      }
    };

    loadStats();
  }, []);

  // --- Audio Logic Sync with Route ---
  const activeLesson = useMemo(() => {
    if (currentView !== 'practice' && currentView !== 'victory') return null;

    // 1. Try regular lessons
    let lesson = lessons.find(l => l.id === urlLessonId);
    if (lesson) return lesson;

    // 2. Try Level 4 songs (they have negative IDs)
    const songLesson = songsAsLessons.find(l => l.id === urlLessonId);
    if (songLesson) return songLesson;

    // 3. Special case for Level 5 Ear Training
    if (urlLessonId === 5 || (currentView as string) === 'ear-training') {
      return {
        id: 5,
        title: "Ear Training",
        level: 5,
        difficulty: "medium",
        status: "completed",
        sequence: [],
        desc: "Note identification"
      } as Lesson;
    }

    return null;
  }, [currentView, lessons, urlLessonId, songsAsLessons]);



  const pickRandomNote = () => {
    const notes = ['E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'];
    let next;
    do {
      next = notes[Math.floor(Math.random() * notes.length)];
    } while (next === gameTargetNote);
    setGameTargetNote(next);
  };

  const startChallenge = () => {
    setGamePhase('countdown');
    setGameCountdown(3);
    setGameScore(0);
    setGameTimeLeft(30);
  };

  // Game Timers
  useEffect(() => {
    let timer: any;
    if (gamePhase === 'countdown') {
      timer = setInterval(() => {
        setGameCountdown(prev => {
          if (prev <= 1) {
            setGamePhase('playing');
            pickRandomNote();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gamePhase === 'playing') {
      timer = setInterval(() => {
        setGameTimeLeft(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gamePhase]);

  // Handle Game End Logic Safely (Avoid Stale Closures)
  useEffect(() => {
    if (gamePhase === 'playing' && gameTimeLeft === 0) {
      setGamePhase('result');

      if (currentView === 'duel' && duel?.status === 'started') {
        setDuelScore(gameScore);
        setDuelAccuracy(prev => (prev > 0 ? prev : 100));
        submitDuelResult().catch(err => {
          console.error('Failed to submit duel result:', err);
          setDuelError('Unable to submit duel result automatically. Please try again.');
        });
        // setDuelMessage('Duel finished. Your score was submitted. Waiting for your opponent.');
      } else {
        if (gameScore > gameHighScore) {
          setGameHighScore(gameScore);
          localStorage.setItem('fretflow_highscore', gameScore.toString());

          // Sync to backend
          scoresApi.submitChallengeScore(gameScore).catch(err => {
            console.error('Failed to sync high score:', err);
          });
        }

        // Add to leaderboard visually
        if (gameScore > 0) {
          const currentUserIdentifier = user?.username || 'You';
          const newItem: LeaderboardItem = {
            id: Date.now(),
            name: currentUserIdentifier,
            score: gameScore,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
          setLeaderboard(prev => {
            const filtered = prev.filter(item => item.name !== currentUserIdentifier && item.name !== 'You');
            return [...filtered, newItem].sort((a, b) => b.score - a.score).slice(0, 50);
          });
        }
      }
    }
  }, [gameTimeLeft, gamePhase, gameScore, gameHighScore, user?.username, currentView, duel?.status]);

  // Game Note Detection
  useEffect(() => {
    if (gamePhase === 'playing' && currentPitch === gameTargetNote) {
      setGameScore(prev => prev + 30);
      pickRandomNote();
    }
  }, [currentPitch, gamePhase, gameTargetNote]);

  useEffect(() => {
    const isUIBlocked = showAdminModal || showStreakModal || showHistoryDrawer || showHistoryClearModal;
    const isDuelListening = currentView === 'duel' && duel?.status === 'started' && gamePhase === 'playing';
    const shouldListen = ((currentView === 'practice' && activeLesson) || currentView === 'tuner' || gamePhase === 'playing' || isDuelListening) && !isVictory && !isUIBlocked;

    if (shouldListen && processorRef.current) {
      processorRef.current.onNoteDetected = (freq, note) => {
        setCurrentPitch(note);
        setCurrentFrequency(freq);

        if (!isVictory && currentView === 'practice' && activeLesson && note === activeLesson.sequence[currentSequenceIndex]) {
          handleMatch();
        }
      };

      if (!isListening) {
        processorRef.current.start().then(() => setIsListening(true));
      }
    } else {
      if (processorRef.current && isListening) {
        processorRef.current.stop();
      }
      setIsListening(false);
      setCurrentPitch('--');
      setCurrentFrequency(0);
    }

    return () => {
      if (processorRef.current && isListening) {
        processorRef.current.stop();
      }
      updatePracticeTime();
    };
  }, [currentView, activeLesson, isVictory, showAdminModal, showStreakModal, showHistoryDrawer, showHistoryClearModal, gamePhase, currentSequenceIndex]);


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
    const now = Date.now();
    if (now - lastMatchTimeRef.current < 1000) return; // 1 second cooldown
    lastMatchTimeRef.current = now;

    setCurrentSequenceIndex(prev => {
      const next = prev + 1;
      if (activeLesson && next >= activeLesson.sequence.length) {
        playSuccessSound();
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // since particles fall down, start a bit higher than random
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#39FF14', '#ffffff', '#FFD700'], shapes: ['star', 'circle'] });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#39FF14', '#ffffff', '#FFD700'], shapes: ['star', 'circle'] });
        }, 250);

        setLessons(prevLessons => {
          const currentIndex = prevLessons.findIndex(l => l.id === activeLesson.id);
          const nextLesson = prevLessons[currentIndex + 1];

          const updated = prevLessons.map(l => {
            if (l.id === activeLesson.id) return { ...l, status: 'completed' as const };
            if (nextLesson && l.id === nextLesson.id && l.status === 'locked') return { ...l, status: 'available' as const };
            return l;
          });
          if (nextLesson) {
            localStorage.setItem('fretflow_last_lesson', nextLesson.id.toString());
            setLastPlayedLessonId(nextLesson.id);
          }
          return updated;
        });

        setHistory(prev => {
          if (prev.length > 0 && prev[0].title === activeLesson.title) return prev;
          return [
            { id: Date.now(), title: activeLesson.title, date: new Date().toLocaleDateString() },
            ...prev
          ];
        });

        // Sync to backend history
        historyApi.add(activeLesson.id, activeLesson.title, 0).catch(console.error);

        setIsVictory(true);

        // Sync progress to backend
        progressApi.submitProgress(activeLesson.id, 100, activeLesson.sequence).catch(console.error);

        // Update Streak
        setStreakData((prev: { count: number; isFrozen: boolean; lastUpdated: string; history: string[] }) => {
          const today = new Date().toDateString();
          if (prev.lastUpdated === today && !prev.isFrozen) return prev;

          const newHistory = [...prev.history];
          newHistory[newHistory.length - 1] = 'completed';

          return {
            ...prev,
            count: prev.count + 1,
            isFrozen: false,
            lastUpdated: today,
            history: newHistory
          };
        });

        return prev;
      }
      return next;
    });
  };

  const closePractice = () => {
    navigate(`/dashboard/lessons/${activeLesson?.level || 1}`);
    // Clean up any temporary song-as-lesson entries (negative ids)
    if (lastPlayedLessonId && lastPlayedLessonId < 0) {
      setLessons(prev => prev.filter(l => l.id !== lastPlayedLessonId));
      setLastPlayedLessonId(null);
      localStorage.removeItem('fretflow_last_lesson');
    }
  };

  const startSongAsLesson = (song: Song) => {
    let parsed: any = [];
    try {
      parsed = JSON.parse(song.notes || '[]');
    } catch (e) {
      parsed = [];
    }
    const sequence = Array.isArray(parsed) ? parsed.map((n: any) => (typeof n === 'string' ? n : (n.note || ''))) : [];
    const tempLesson: Lesson = {
      id: -Math.abs(song.id),
      title: song.title,
      level: 4,
      difficulty: song.difficulty === 1 ? 'easy' : song.difficulty === 2 ? 'medium' : 'hard',
      status: 'available',
      sequence,
      desc: song.artist || ''
    };
    setLessons(prev => [tempLesson, ...prev]);
    startPractice(tempLesson);
  };

  const startPracticeFromLesson = (lesson: Lesson) => {
    // If lesson corresponds to a song (negative id), find the song and start as song-lesson
    if (lesson.id < 0) {
      const songId = Math.abs(lesson.id);
      const song = songs.find(s => s.id === songId);
      if (song) return startSongAsLesson(song);
    }
    // otherwise, start normal practice
    return startPractice(lesson);
  };



  const filteredLessons = lessons.filter(l => {
    const matchesLevel = Number(l.level) === Number(urlLevelId);
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'all' || l.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesLevel && matchesSearch && matchesDiff && matchesStatus;
  });

  const progressPercentage = Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100);

  const handleReorder = async (lessonId: number, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const lesson1 = lessons[currentIndex];
    const lesson2 = lessons[targetIndex];

    try {
      await adminApi.reorderLessons(lesson1.id, lesson2.id);
      await refreshData();
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
    }
  };



  const PracticeView = () => {
    // If this is a song-based lesson (temporary negative id), render SongPlayer UI
    if (activeLesson && activeLesson.id < 0) {
      const songId = Math.abs(activeLesson.id);
      const song = songs.find(s => s.id === songId);
      if (!song) return (
        <div className="fixed inset-0 z-[100] bg-dark-950 flex items-center justify-center">Missing song data</div>
      );

      const onCompleteSong = (_score: number, _accuracy: number) => {
        // Mark lesson completed and unlock next, similar to handleMatch completion
        setLessons(prevLessons => {
          const currentIndex = prevLessons.findIndex(l => l.id === activeLesson.id);
          const nextLesson = prevLessons[currentIndex + 1];

          const updated = prevLessons.map(l => {
            if (l.id === activeLesson.id) return { ...l, status: 'completed' as const };
            if (nextLesson && l.id === nextLesson.id && l.status === 'locked') return { ...l, status: 'available' as const };
            return l;
          });
          if (nextLesson) {
            localStorage.setItem('fretflow_last_lesson', nextLesson.id.toString());
            setLastPlayedLessonId(nextLesson.id);
          }
          return updated;
        });

        setHistory(prev => {
          if (prev.length > 0 && prev[0].title === activeLesson.title) return prev;
          return [
            { id: Date.now(), title: activeLesson.title, date: new Date().toLocaleDateString() },
            ...prev
          ];
        });

        // Sync to backend
        historyApi.add(activeLesson.id, activeLesson.title, 0).catch(console.error);
        progressApi.submitProgress(activeLesson.id, 100, activeLesson.sequence).catch(console.error);

        setIsVictory(true);
      };

      return (
        <div className="fixed inset-0 z-[100] bg-dark-950 flex flex-col items-center justify-start md:justify-center p-4 md:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-12 mt-16 md:mt-0">
            <SongPlayer
              song={song}
              currentPitch={currentPitch}
              notationStyle={notationStyle}
              formatNoteName={formatNoteName}
              onComplete={onCompleteSong}
              onExit={closePractice}
            />
          </div>
        </div>
      );
    }

    return (
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
            <div className="glass-panel p-6 md:p-8 rounded-3xl min-w-full w-full relative border-white/5 bg-gradient-to-b from-dark-800 to-dark-900">
              {STRINGS.map((string, sIdx) => (
                <div key={string} className="h-10 flex items-center relative group">
                  {/* String line */}
                  <div
                    className="absolute w-full bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10"
                    style={{ height: `${0.5 + sIdx * 0.4}px`, opacity: 0.8 }}
                  />

                  {/* Frets */}
                  <div className={`flex w-full h-full ${isLefty ? 'flex-row-reverse' : ''}`}>
                    {Array.from({ length: FRET_COUNT + 1 }).map((_, fIdx) => (
                      <div
                        key={fIdx}
                        className={`h-full flex items-center justify-center relative border-white/20 last:border-0 
                          ${isLefty ? 'border-l' : 'border-r'} 
                          ${fIdx === 0 ? (isLefty ? 'border-l-[6px] border-l-gray-300/20' : 'border-r-[6px] border-r-gray-300/20') : ''}`}
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
                          {activeLesson && activeLesson.sequence && activeLesson.sequence[currentSequenceIndex] === getNoteAt(string, fIdx) && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 shadow-[0_0_20px_rgba(57,255,20,0.8)] z-20 flex items-center justify-center text-[10px] font-black text-dark-900"
                            >
                              {formatNoteName(getNoteAt(string, fIdx), notationStyle).replace(/\d/, '')}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
            <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar w-full justify-center py-2">
              {activeLesson && activeLesson.sequence && activeLesson.sequence.map((_, i) => (
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
                {activeLesson && activeLesson.sequence ? formatNoteName(activeLesson.sequence[currentSequenceIndex] || '', notationStyle) : '--'}
              </h2>
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-4">
              <button
                onClick={() => {
                  if (!isListening && processorRef.current) {
                    processorRef.current.start().then(() => setIsListening(true)).catch(err => {
                      console.error('Manual mic start failed:', err);
                      alert('Could not access microphone. Please ensure you have given permission in browser settings.');
                    });
                  }
                }}
                className="glass-panel px-4 md:px-6 py-2 md:py-3 rounded-2xl flex items-center gap-2 md:gap-3 text-[10px] md:text-sm hover:bg-white/10 transition-all active:scale-95 group"
              >
                {isListening ? (
                  <><Mic className="text-green-500 animate-pulse" size={16} /> <span className="text-green-500/80 font-medium tracking-wide">Listening...</span></>
                ) : (
                  <><MicOff className="text-red-500 group-hover:text-primary-500 transition-colors" size={16} /> <span className="text-red-500/80 group-hover:text-primary-500 transition-colors">Microphone Off (Click to enable)</span></>
                )}
              </button>
              <div className="text-2xl md:text-4xl font-mono font-bold text-white/50">{formatNoteName(currentPitch, notationStyle)}</div>
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
                const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
                const nextLesson = lessons[currentIndex + 1];

                setIsVictory(false);
                setCurrentSequenceIndex(0);
                if (nextLesson) {
                  navigate(`/dashboard/practice/${nextLesson.id}`);
                } else {
                  navigate('/dashboard');
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans overflow-x-hidden pb-20 md:pb-0">
      {/* Header */}
      <header className={`sticky top-0 z-[1000] bg-dark-900/80 backdrop-blur-xl border-b border-white/5 ${currentView === 'practice' && !(activeLesson && activeLesson.id < 0) ? 'hidden' : ''}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-12">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent shrink-0">
              <span className="md:hidden">FF</span>
              <span className="hidden md:inline">FRETFLOW</span>
            </h1>
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate('/dashboard')}
                className={`text-sm font-semibold transition-colors ${urlView === 'levels' || urlView === 'lessons' || urlView === 'ear-training' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Curriculum
              </button>
              <button
                onClick={() => navigate('/dashboard/activity')}
                className={`text-sm font-semibold transition-colors ${urlView === 'activity' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Activity
              </button>
              <button
                onClick={() => navigate('/dashboard/challenge')}
                className={`text-sm font-semibold transition-colors ${urlView === 'challenge' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Challenge
              </button>
              <button
                onClick={() => navigate('/dashboard/duel')}
                className={`text-sm font-semibold transition-colors ${urlView === 'duel' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Duel
              </button>
              <button
                onClick={() => navigate('/dashboard/tuner')}
                className={`text-sm font-semibold transition-colors ${urlView === 'tuner' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Tuner
              </button>
              <button
                onClick={() => navigate('/dashboard/metronome')}
                className={`text-sm font-semibold transition-colors ${urlView === 'metronome' ? 'text-white border-b-2 border-primary-500 pb-1' : 'text-gray-400 hover:text-white'}`}
              >
                Metronome
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Streak Component */}
            <div
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all cursor-pointer group"
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
              <span className={`text-sm font-black transition-colors ${streakData.isFrozen ? 'text-cyan-400 group-hover:text-cyan-300' :
                streakData.count > 0 ? 'text-primary-500 group-hover:text-primary-300' : 'text-gray-500 group-hover:text-primary-400'
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
            <button
              onClick={() => navigate('/dashboard/activity', { state: { flashRank: true } })}
              title="View Achievements & History"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all active:scale-95 group"
            >
              <span className="text-[10px] text-gray-400 font-bold uppercase group-hover:text-primary-300 transition-colors">Lv.{userLevel}</span>
              <span className="text-xs font-black text-primary-400 group-hover:text-primary-300 transition-colors">{userXp.toLocaleString()} XP</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((value) => !value)}
                data-notification-button
                className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all active:scale-95 group"
                aria-label="Notifications"
              >
                <Bell size={20} className="group-hover:text-primary-400 transition-colors" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white px-[6px]">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationsRef}
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="absolute right-0 top-full mt-3 w-80 max-w-xs rounded-3xl border border-white/10 bg-dark-950 shadow-2xl shadow-black/50 overflow-hidden z-[2000] backdrop-blur-none"
                  >
                    <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <button
                        onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                        className="text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400">No new notifications.</div>
                      ) : (
                        notifications.map((note) => (
                          <div key={note.id} className={`px-4 py-3 border-b border-white/5 flex items-start justify-between gap-3 ${note.read ? 'bg-transparent' : 'bg-white/5'}`}>
                            <div className="flex-1">
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">{note.type === 'achievement' ? 'Achievement' : note.type === 'welcome' ? 'Welcome' : 'Info'}</p>
                              <p className="text-sm font-bold text-white">{note.title}</p>
                              <p className="text-sm text-gray-400 mt-1">{note.message}</p>
                              <p className="text-[10px] text-gray-500 mt-2">{note.timestamp}</p>
                            </div>
                            <button
                              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== note.id))}
                              className="text-gray-500 hover:text-rose-500 transition-colors pt-1 flex-shrink-0"
                              title="Delete notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="w-10 h-10 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center text-primary-500 overflow-hidden hover:border-primary-500/60 transition-all active:scale-95"
              >
                <User size={20} />
              </button>



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
            className="fixed top-20 left-4 right-4 z-[250] w-full max-w-sm sm:left-auto sm:right-6 sm:w-auto"
          >
            <GuitarTuner currentPitch={currentPitch} frequency={currentFrequency} notationStyle={notationStyle} />
          </motion.div>
        )}
      </AnimatePresence>


      <div className={`container mx-auto py-12 px-6 max-w-5xl ${currentView === 'practice' && !(activeLesson && activeLesson.id < 0) ? 'hidden' : ''}`}>
        {/* Main Content - Full Width */}
        <main className="w-full">
          {(currentView === 'levels' || currentView === 'lessons') && (
            <div className="mb-12">
              <h2 className="text-4xl font-bold mb-3 text-white">
                {isAllCompleted ? "Master of the Strings! 🏆" : "Welcome back, Rock Star! 🎸"}
              </h2>
              <div className="text-gray-400">
                {isAllCompleted
                  ? "You've conquered every lesson. Time to refine your skills or start a review!"
                  : <MotivationQuote />
                }
              </div>
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
                <QuickResume lesson={suggestedLesson || null} onResume={startPractice} />
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
                {Number(urlLevelId) === 4 ? (
                  <>

                    <LessonGrid
                      navigate={navigate}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      difficultyFilter={difficultyFilter}
                      setDifficultyFilter={setDifficultyFilter}
                      filteredLessons={songsAsLessons}
                      startPractice={startPracticeFromLesson}
                      userRole={userRole}
                      onAdd={() => { }}
                      onEdit={() => { }}
                      onReorder={() => { }}
                      lessons={songsAsLessons}
                    />
                  </>
                ) : (
                  <LessonGrid
                    navigate={navigate}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    difficultyFilter={difficultyFilter}
                    setDifficultyFilter={setDifficultyFilter}
                    filteredLessons={filteredLessons}
                    startPractice={startPractice}
                    userRole={userRole}
                    onAdd={() => { setEditingLesson(null); setAdminTab('Add New'); setShowAdminModal(true); }}
                    onEdit={(lesson) => {
                      setEditingLesson(lesson);
                      setAdminTab('Add New');
                      setShowAdminModal(true);
                    }}
                    onReorder={handleReorder}
                    lessons={lessons}
                  />
                )}
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
                <ErrorBoundary>
                  <AnalyticsChart stats={practiceStats} />
                  <LevelRoadmap currentXp={userXp} />
                  <BadgesSection lessons={lessons} streak={streakData.count} achievements={achievements} />
                </ErrorBoundary>
                <div className="pt-10 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                        <Activity size={18} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Practice History</h4>
                    </div>
                    <button
                      onClick={() => setShowHistoryClearModal(true)}
                      className="text-[10px] font-bold text-gray-700 hover:text-rose-500 bg-white/5 px-3 py-1 rounded transition-colors uppercase tracking-widest"
                    >
                      Clear All ({history.length})
                    </button>
                  </div>

                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <PlayCircle className="text-gray-600" size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No history yet.</p>
                      </div>
                    ) : (
                      history.slice(0, 5).map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-primary-500/30 transition-all bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                              <CheckCircle className="text-green-500" size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-primary-500 transition-colors">{item.title}</p>
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.date}</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase text-gray-600">
                            Done
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
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
                  <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">PRECISION TUNER 🎯</h2>
                  <p className="text-gray-500 font-medium">Get your strings perfectly in sync before you play.</p>
                </div>
                <GuitarTuner currentPitch={currentPitch} frequency={currentFrequency} notationStyle={notationStyle} />
              </motion.div>
            )}

            {currentView === 'challenge' && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold mb-3 text-white">Speed Challenge</h2>
                  <p className="text-gray-400 text-lg">Play as many notes as you can in 30 seconds!</p>
                </div>

                <div className="glass-panel p-12 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[450px]">
                  {gamePhase === 'idle' && (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Trophy size={48} />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">High Score</p>
                      <h4 className="text-6xl font-black text-white mb-10">{gameHighScore}</h4>
                      <button
                        onClick={startChallenge}
                        className="bg-primary-500 text-dark-900 px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl shadow-primary-500/20"
                      >
                        START GAME
                      </button>
                    </div>
                  )}

                  {gamePhase === 'countdown' && (
                    <>
                      <motion.div
                        key={gameCountdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-9xl font-black text-primary-500"
                      >
                        {gameCountdown}
                      </motion.div>
                      <button
                        onClick={() => setGamePhase('idle')}
                        className="absolute bottom-8 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {gamePhase === 'playing' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="flex justify-between w-full mb-12">
                        <div className="text-left">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Time Left</p>
                          <h4 className={`text-3xl font-black ${gameTimeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{gameTimeLeft}s</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Score</p>
                          <h4 className="text-3xl font-black text-primary-500">{gameScore}</h4>
                        </div>
                      </div>

                      <div className="relative mb-12">
                        <motion.div
                          key={gameTargetNote}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-48 h-48 bg-white/5 rounded-[2.5rem] border-2 border-primary-500/20 flex items-center justify-center"
                        >
                          <span className="text-8xl font-black text-white">{formatNoteName(gameTargetNote, notationStyle)}</span>
                        </motion.div>
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary-500 text-dark-900 rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                          !
                        </div>
                      </div>

                      <p className="text-gray-500 font-medium italic animate-bounce">Play this note now!</p>

                      <div className="mt-8 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-bold">
                        Detecting: <span className="text-primary-500">{formatNoteName(currentPitch, notationStyle) || '--'}</span>
                      </div>

                      <div className="mt-8 flex flex-col gap-3 w-full sm:w-auto">
                        <button
                          onClick={pickRandomNote}
                          className="px-8 py-4 rounded-3xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                        >
                          Skip Note
                        </button>
                        <button
                          onClick={() => setGamePhase('idle')}
                          className="text-gray-500 hover:text-rose-500 transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 justify-center"
                        >
                          <X size={14} /> Stop Challenge
                        </button>
                      </div>
                    </div>
                  )}

                  {gamePhase === 'idle' && (
                    <LeaderboardComponent data={leaderboard} currentUser={user?.username} userScore={gameHighScore} />
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'duel' && (
              <motion.div
                key="duel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black mb-3 text-white">Duel Arena</h2>
                  <p className="text-gray-400 text-lg">Create a duel room, share the code, and compete with a friend.</p>
                </div>

                <div className="glass-panel p-8 rounded-[3rem] bg-white/5 border border-white/10">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">Quick Start</h3>
                      <p className="text-gray-400">Create a duel room and send the invite link to someone you want to race.</p>
                      <button
                        onClick={createDuel}
                        className="w-full py-4 rounded-3xl bg-primary-500 text-dark-900 font-black hover:bg-primary-400 transition-all"
                      >
                        Create Duel Room
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">Join with a code</h3>
                      <p className="text-gray-400">Enter the code your friend shared and jump into the duel.</p>
                      <div className="flex gap-3">
                        <input
                          value={duelCodeInput}
                          onChange={(event) => setDuelCodeInput(event.target.value.toUpperCase())}
                          placeholder="ABC123"
                          className="w-full rounded-3xl border border-white/10 bg-dark-950 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-primary-500"
                        />
                        <button
                          onClick={() => {
                            if (duelCodeInput.trim()) {
                              navigate(`/dashboard/duel/${duelCodeInput.trim().toUpperCase()}`);
                            }
                          }}
                          className="px-4 py-3 rounded-3xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>

                  {duelMessage && (
                    <div className="mt-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-200">
                      {duelMessage}
                    </div>
                  )}

                  {duelError && (
                    <div className="mt-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-200">
                      {duelError}
                    </div>
                  )}

                  {urlInviteCode && (
                    <div className="mt-8 space-y-6">
                      <div className="rounded-3xl bg-dark-950 border border-white/10 p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Invite Code</p>
                              <p className="text-2xl font-black text-white">{urlInviteCode}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (duel?.invite_url) {
                                  const url = `${window.location.origin}${duel.invite_url}`;
                                  navigator.clipboard.writeText(url);
                                  setDuelMessage('Invite link copied to clipboard.');
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
                            >
                              <Copy size={16} /> Copy Link
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl bg-white/5 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Host</p>
                              <p className="mt-2 text-lg font-bold text-white">{duel?.host_username || 'Waiting...'}</p>
                              {/* Removed score display as requested */}
                            </div>
                            <div className="rounded-3xl bg-white/5 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Guest</p>
                              <p className="mt-2 text-lg font-bold text-white">{duel?.guest_username || 'Waiting for guest'}</p>
                              {/* Removed score display as requested */}
                            </div>
                          </div>

                          <div className="rounded-3xl bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                            <p className="mt-2 text-lg font-bold text-white">{duel?.status || 'waiting'}</p>
                          </div>
                        </div>
                      </div>

                      {duel?.status !== 'finished' && isDuelParticipant && (
                        <div className="rounded-3xl bg-white/5 p-5 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl bg-dark-950 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Your status</p>
                              <p className="mt-2 text-lg font-bold text-white">{userIsReady ? 'Ready' : 'Not ready'}</p>
                            </div>
                            <div className="rounded-3xl bg-dark-950 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Opponent status</p>
                              <p className="mt-2 text-lg font-bold text-white">{opponentIsReady ? 'Ready' : 'Waiting'}</p>
                            </div>
                          </div>

                          {duel?.status !== 'started' && (
                            <button
                              onClick={readyDuel}
                              disabled={duelReadyInProgress || userIsReady}
                              className="w-full rounded-3xl bg-primary-500 px-6 py-4 text-base font-black text-dark-900 hover:bg-primary-400 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {userIsReady ? 'Waiting for opponent' : 'Ready to Duel'}
                            </button>
                          )}

                          {duel?.status === 'started' && (
                            <div className="rounded-3xl bg-dark-950 p-5 text-center border border-primary-500/20">
                              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Duel challenge</p>
                              <p className="mt-3 text-lg font-bold text-white">30-second match is live</p>
                              <p className="text-gray-400 mt-2">Follow the note prompts and your result will be submitted automatically.</p>
                              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-3xl bg-white/5 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Time</p>
                                  <p className="mt-2 text-2xl font-black text-white">{gameTimeLeft}s</p>
                                </div>
                                <div className="rounded-3xl bg-white/5 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Score</p>
                                  <p className="mt-2 text-2xl font-black text-white">{gameScore}</p>
                                </div>
                                <div className="rounded-3xl bg-white/5 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Current note</p>
                                  <p className="mt-2 text-2xl font-black text-white">{gameTargetNote || '—'}</p>
                                </div>
                              </div>
                              <div className="mt-8 flex flex-col gap-3 w-full sm:w-auto">
                                <button
                                  onClick={pickRandomNote}
                                  className="px-8 py-4 rounded-3xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                                >
                                  Skip Note
                                </button>
                              </div>
                              {gamePhase === 'countdown' && (
                                <p className="mt-4 text-3xl font-black text-primary-400">Starts in {gameCountdown}</p>
                              )}
                              {/* Removed result message as requested */}
                            </div>
                          )}
                        </div>
                      )}

                      {duel && duel.status !== 'finished' && !duel.guest_user_id && user?.id !== duel.host_user_id && (
                        <button
                          onClick={joinDuel}
                          className="w-full rounded-3xl bg-primary-500 px-6 py-4 text-base font-black text-dark-900 hover:bg-primary-400 transition-all"
                        >
                          Join Duel
                        </button>
                      )}

                      {duel?.status === 'finished' && (
                        <div className="rounded-3xl bg-white/5 p-6 border border-primary-500/20 text-center space-y-6">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Result</p>
                            <p className="mt-3 text-2xl font-black text-white">
                              {(() => {
                                // Explicitly check user ID against host/guest to be sure
                                const isHost = duel.host_user_id === user?.id;
                                const isGuest = duel.guest_user_id === user?.id;

                                // Cast to Number to avoid lexicographical string comparison issues
                                const hScore = Number(duel.host_score || 0);
                                const gScore = Number(duel.guest_score || 0);

                                if (duel.winner_user_id === user?.id) return `You won the duel! (${hScore} vs ${gScore}) 🏆`;

                                if (duel.winner_user_id !== null && duel.winner_user_id !== user?.id) {
                                  const winnerName = duel.host_user_id === duel.winner_user_id ? duel.host_username : (duel.guest_username || 'Opponent');
                                  return `${winnerName} won (${hScore} vs ${gScore}) 🎸`;
                                }

                                // Fallback check if winner_user_id is null or backend logic failed
                                if (hScore !== gScore) {
                                  if (hScore > gScore) {
                                    return isHost ? `You won the duel! (${hScore} vs ${gScore}) 🏆` : `${duel.host_username} won (${hScore} vs ${gScore}) 🎸`;
                                  } else {
                                    return isGuest ? `You won the duel! (${gScore} vs ${hScore}) 🏆` : `${duel.guest_username || 'Opponent'} won (${gScore} vs ${hScore}) 🎸`;
                                  }
                                }
                                return `It’s a tie! (${hScore} - ${gScore}) 🤝`;
                              })()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setDuel(null);
                              createDuel();
                            }}
                            className="w-full rounded-3xl bg-primary-500 px-6 py-4 text-base font-black text-dark-900 hover:bg-primary-400 transition-all flex items-center justify-center gap-2"
                          >
                            <RotateCcw size={20} /> Rematch
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'metronome' && (
              <motion.div
                key="metronome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">METRONOME ⏱️</h2>
                  <p className="text-gray-500 font-medium">Keep your rhythm tight and your timing perfect.</p>
                </div>
                <Metronome />
              </motion.div>
            )}

            {currentView === 'songs' && (
              <motion.div
                key="songs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                {!currentSong ? (
                  <>
                    <div className="text-center mb-12">
                      <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">SONG LIBRARY 🎵</h2>
                      <p className="text-gray-500 font-medium">Play along with classic riffs and songs.</p>
                    </div>
                    <SongLibrary songs={songs} onSelect={(song) => setCurrentSong(song)} />
                  </>
                ) : (
                  <SongPlayer
                    song={currentSong}
                    currentPitch={currentPitch}
                    notationStyle={notationStyle}
                    formatNoteName={formatNoteName}
                    onComplete={async (score, accuracy) => {
                      try {
                        await songsApi.submitScore(currentSong.id, {
                          score,
                          accuracy_percent: accuracy,
                          xp_earned: currentSong.xp_reward
                        });
                        alert(`Song Complete! Score: ${score} - Accuracy: ${accuracy}%\nYou earned ${currentSong.xp_reward} XP!`);
                        setCurrentSong(null);
                        const res = await songsApi.getAll();
                        if (res && res.data) {
                          setSongs(res.data);
                        }
                      } catch (e) {
                        console.error('Failed to submit song score', e);
                      }
                    }}
                    onExit={() => setCurrentSong(null)}
                  />
                )}
              </motion.div>
            )}
            {currentView === 'ear-training' && (
              <motion.div
                key="ear-training"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-5xl mx-auto space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="glass-panel inline-flex items-center justify-center px-5 py-3 rounded-2xl text-gray-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline ml-2 font-semibold">Back to Levels</span>
                  </button>

                </div>
                <EarTrainingGame
                  onComplete={() => {
                    playSuccessSound();
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
                    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                    const interval: any = setInterval(function () {
                      const timeLeft = animationEnd - Date.now();
                      if (timeLeft <= 0) return clearInterval(interval);
                      const particleCount = 50 * (timeLeft / duration);
                      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#39FF14', '#ffffff', '#FFD700'], shapes: ['star', 'circle'] });
                      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#39FF14', '#ffffff', '#FFD700'], shapes: ['star', 'circle'] });
                    }, 250);

                    historyApi.add(5, "Ear Training", 0).catch(console.error);
                    progressApi.submitProgress(5, 100, []).catch(console.error);
                    navigate('/dashboard/victory/5');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-dark-950/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between pb-8 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${currentView === 'practice' && !(activeLesson && activeLesson.id < 0) ? 'hidden' : ''}`}>
        <button
          onClick={() => navigate('/dashboard/activity')}
          className={`flex flex-col items-center gap-1 ${urlView === 'activity' ? 'text-primary-500' : 'text-gray-500'}`}
        >
          <Trophy size={20} />
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button
          onClick={() => navigate('/dashboard/challenge')}
          className={`flex flex-col items-center gap-1 ${urlView === 'challenge' ? 'text-primary-500' : 'text-gray-500'}`}
        >
          <Star size={20} />
          <span className="text-[10px] font-bold uppercase">Play</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-1 transition-all ${urlView === 'levels' || urlView === 'lessons' ? 'text-primary-500' : 'text-gray-500'}`}
        >
          <div className={`p-3 rounded-2xl -mt-8 mb-1 border-t border-x border-white/10 shadow-lg transition-all ${urlView === 'levels' || urlView === 'lessons' ? 'bg-primary-500 text-dark-900 shadow-primary-500/20' : 'bg-dark-900 text-gray-500'}`}>
            <Activity size={24} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Learn</span>
        </button>
        <button
          onClick={() => navigate('/dashboard/duel')}
          className={`flex flex-col items-center gap-1 ${urlView === 'duel' ? 'text-primary-500' : 'text-gray-500'}`}
        >
          <Copy size={20} />
          <span className="text-[10px] font-bold uppercase">Duel</span>
        </button>
        <button
          onClick={() => navigate('/dashboard/tuner')}
          className={`flex flex-col items-center gap-1 ${urlView === 'tuner' ? 'text-primary-500' : 'text-gray-500'}`}
        >
          <Settings2 size={20} />
          <span className="text-[10px] font-bold uppercase">Tuner</span>
        </button>
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

      {/* History Clear Confirmation Modal */}
      <AnimatePresence>
        {showHistoryClearModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-dark-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-8 rounded-[2rem] max-w-sm w-full text-center border-rose-500/20 shadow-2xl shadow-rose-500/10"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Clear History?</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">This will permanently delete all your practice logs. This action cannot be undone.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    try {
                      await historyApi.clearAll();
                    } catch (err) {
                      console.error('Failed to clear history from API:', err);
                    }
                    setHistory([]);
                    setShowHistoryClearModal(false);
                  }}
                  className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowHistoryClearModal(false)}
                  className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin FAB removed - integrated into grid */}






      {/* Profile Dropdown (Fixed at root to avoid stacking issues) */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileDropdown
            user={user}
            onClose={() => setShowProfileModal(false)}
            onLogout={() => {
              logout();
              navigate('/login');
            }}
            onOpenHelp={() => setShowHelpModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenSupport={() => setShowSupportModal(true)}
            onUpdate={async (data) => {
              try {
                const updatedUser = await usersApi.updateMe(data);
                updateUser(updatedUser);
              } catch (err) {
                console.error('Failed to update profile:', err);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
              onClick={() => { setShowAdminModal(false); setEditingLesson(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-lg p-8 rounded-3xl relative z-10 max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
                <button
                  onClick={() => { setShowAdminModal(false); setEditingLesson(null); }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const sequenceRaw = formData.get('sequence') as string;
                  const sequence = sequenceRaw.split(',').map(s => s.trim().toUpperCase());

                  // Validation: Check if notes are valid (e.g. E2, G#3, A4)
                  const noteRegex = /^[A-G][#]?[0-9]$/;
                  const invalidNotes = sequence.filter(n => !noteRegex.test(n));

                  if (invalidNotes.length > 0) {
                    setFormError(`Invalid notes: ${invalidNotes.join(', ')}`);
                    return;
                  }
                  setFormError(null);

                  const difficultyMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

                  const levelValue = parseInt(formData.get('level') as string) || 1;
                  const orderIndexRaw = (formData.get('order_index') as string)?.trim();
                  const hasOrderIndexInput = orderIndexRaw !== undefined && orderIndexRaw !== '';
                  const orderIndexValue = hasOrderIndexInput ? parseInt(orderIndexRaw, 10) : undefined;
                  const defaultOrderIndex = Math.max(
                    -1,
                    ...lessons.filter((lesson) => lesson.level === levelValue).map((lesson) => lesson.order_index ?? -1)
                  ) + 1;
                  const computedOrderIndex = editingLesson
                    ? hasOrderIndexInput
                      ? parseInt(orderIndexRaw, 10)
                      : editingLesson.order_index ?? defaultOrderIndex
                    : orderIndexValue !== undefined
                      ? orderIndexValue
                      : defaultOrderIndex;

                  const apiLessonData = {
                    title: formData.get('title') as string,
                    description: formData.get('desc') as string,
                    notes: JSON.stringify(sequence.map(n => ({ note: n, time: 0 }))),
                    difficulty: difficultyMap[formData.get('difficulty') as string] || 1,
                    xp_reward: 10,
                    level: levelValue,
                    order_index: computedOrderIndex,
                  };

                  try {
                    if (editingLesson) {
                      await adminApi.updateLesson(editingLesson.id, apiLessonData);
                    } else {
                      await adminApi.createLesson(apiLessonData);
                    }
                    // REFRESH DATA FROM SERVER
                    await refreshData();
                    setShowAdminModal(false);
                    setEditingLesson(null);
                  } catch (err: any) {
                    console.error('Failed to sync lesson to server:', err);
                    alert('Hata: ' + (err.response?.data?.error || err.message || 'Bilinmeyen hata'));
                  }
                }}>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Title</label>
                    <input name="title" required defaultValue={editingLesson?.title} className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Blues Riff" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Level</label>
                    <input type="number" name="level" required defaultValue={editingLesson?.level || urlLevelId || 1} className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Difficulty</label>
                    <select name="difficulty" defaultValue={editingLesson?.difficulty} className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Sequence (comma separated)</label>
                    <input
                      name="sequence"
                      required
                      defaultValue={editingLesson?.sequence.join(', ')}
                      onChange={() => setFormError(null)}
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm mb-1"
                      placeholder="e.g. E2, G3, A3"
                    />
                    <p className="text-[10px] text-gray-600 font-medium">Supported: E2, A2, D3, G3, B3, E4 (and sharps like C#3, G#3)</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                    <textarea name="desc" defaultValue={editingLesson?.desc} className="glass-input w-full px-4 py-3 rounded-xl text-sm" rows={3} placeholder="What will they learn?" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Order Index (Optional)</label>
                    <input type="number" name="order_index" defaultValue={editingLesson?.order_index} className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Leave empty for auto-last" />
                    <p className="text-[10px] text-gray-600 mt-1 italic">Controls the sequence of lessons. Higher numbers appear later.</p>
                  </div>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2 mb-2"
                    >
                      <Activity size={14} />
                      {formError}
                    </motion.div>
                  )}
                  <div className="flex gap-3 mt-4">
                    {editingLesson && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 bg-rose-500/10 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                        title="Delete Lesson"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button type="submit" className="flex-1 bg-primary-500 text-dark-900 font-bold py-4 rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all">
                      {editingLesson ? 'Save Changes' : 'Create Lesson'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && editingLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-950/90 backdrop-blur-md"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-sm p-8 rounded-[2.5rem] relative z-10 text-center overflow-hidden border-rose-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-8">
                You are about to delete <span className="text-white font-bold">"{editingLesson.title}"</span>. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await adminApi.deleteLesson(editingLesson.id);
                      await refreshData();
                    } catch (err) {
                      console.error('Failed to delete lesson from server:', err);
                    }
                    setShowDeleteConfirm(false);
                    setShowAdminModal(false);
                    setEditingLesson(null);
                  }}
                  className="py-4 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Delete
                </button>
              </div>
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
                  <BadgesSection lessons={lessons} streak={streakData.count} achievements={achievements} />
                </section>

                <section className="pt-10 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                        <Activity size={18} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Practice History</h4>
                    </div>
                    <button
                      onClick={() => setShowHistoryClearModal(true)}
                      className="text-[10px] font-bold text-gray-700 hover:text-rose-500 bg-white/5 px-3 py-1 rounded transition-colors uppercase tracking-widest"
                    >
                      Clear All ({history.length})
                    </button>
                  </div>

                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <PlayCircle className="text-gray-600" size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No history yet.</p>
                      </div>
                    ) : (
                      history.slice(0, 5).map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-primary-500/30 transition-all bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                              <CheckCircle className="text-green-500" size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-primary-500 transition-colors">{item.title}</p>
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.date}</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase text-gray-600">
                            Done
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
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
      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-dark-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-[2.5rem] max-w-2xl w-full relative border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Help Center</h2>
                <p className="text-gray-400">Everything you need to know about FretFlow</p>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-primary-500 font-bold uppercase tracking-widest text-xs mb-4">Microphone & Pitch Detection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Mic size={16} className="text-primary-500" /> Quiet Environment
                      </h4>
                      <p className="text-sm text-gray-400">Background noise can interfere with detection. Try practicing in a quiet room.</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <CheckCircle size={16} className="text-primary-500" /> Clear Notes
                      </h4>
                      <p className="text-sm text-gray-400">Pluck the strings clearly and let them ring out. Avoid muting strings with your palm.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-primary-500 font-bold uppercase tracking-widest text-xs mb-4">Common Questions</h3>
                  <div className="space-y-4">
                    {[
                      { q: "How do I earn XP?", a: "Complete lessons, practice daily, and maintain your streak to earn XP and level up." },
                      { q: "How does the streak work?", a: "Practice for at least 5 minutes every day to keep your streak alive. If you miss a day, it resets!" },
                      { q: "Can I use an electric guitar?", a: "Yes! FretFlow works with acoustic, electric (unplugged or through speakers), and even bass guitars." }
                    ].map((item, i) => (
                      <div key={i} className="border-b border-white/5 pb-4 last:border-0">
                        <h4 className="text-white font-bold mb-1">{item.q}</h4>
                        <p className="text-sm text-gray-400">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-4">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-dark-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-[2.5rem] max-w-2xl w-full relative border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Settings & Preferences</h2>
                <p className="text-gray-400">Control theme and your experience.</p>
              </div>

              <div className="space-y-6">
                <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings2 size={18} className="text-primary-500" />
                    <h3 className="text-white font-bold">Theme</h3>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${theme === 'dark' ? 'bg-primary-500 text-dark-900' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      <Moon size={16} className="inline-block mr-2" /> Dark
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${theme === 'light' ? 'bg-primary-500 text-dark-900' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      <Sun size={16} className="inline-block mr-2" /> Light
                    </button>
                  </div>
                </section>

                <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity size={18} className="text-primary-500" />
                    <h3 className="text-white font-bold">Notation Style</h3>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateNotation('scientific')}
                      className={`flex-1 py-3 rounded-2xl text-[10px] md:text-xs font-bold transition-all ${notationStyle === 'scientific' ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      Scientific (C, D, E)
                    </button>
                    <button
                      onClick={() => handleUpdateNotation('syllabic')}
                      className={`flex-1 py-3 rounded-2xl text-[10px] md:text-xs font-bold transition-all ${notationStyle === 'syllabic' ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      Syllabic (Do, Re, Mi)
                    </button>
                  </div>
                </section>

                <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                        <ArrowLeft size={20} className={isLefty ? 'rotate-180' : ''} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">Left-Handed Mode</h3>
                        <p className="text-xs text-gray-500">Flipping the fretboard UI</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateLefty(!isLefty)}
                      className={`w-14 h-8 rounded-full transition-all relative ${isLefty ? 'bg-primary-500' : 'bg-white/10'}`}
                    >
                      <motion.div
                        animate={{ x: isLefty ? 24 : 0 }}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>
                </section>

                <div className="pt-4">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="w-full py-4 bg-primary-500 text-dark-900 font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-400 transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-dark-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-8 rounded-[2.5rem] max-w-2xl w-full relative border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Support / Report Bug</h2>
                <p className="text-gray-400">Send feedback or report a problem directly from the app.</p>
              </div>

              <div className="space-y-6">
                <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail size={18} className="text-primary-500" />
                    <h3 className="text-white font-bold">Need help?</h3>
                  </div>
                  <p className="text-sm text-gray-400">Use this form for quick bug reports, feature requests, or support questions.</p>
                </section>

                {supportSubmitted ? (
                  <div className="bg-primary-500/10 p-6 rounded-3xl border border-primary-500/20 text-white">
                    <p className="font-bold text-white mb-2">Thanks for reporting!</p>
                    <p className="text-sm text-gray-300">Your message has been received. We’ll review it and improve the app.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={5}
                      placeholder="Describe the issue or request..."
                      className="w-full bg-dark-900 border border-white/10 rounded-3xl p-4 text-sm text-white outline-none placeholder:text-gray-500"
                    />
                    <button
                      onClick={() => {
                        if (!supportMessage.trim()) return;
                        setSupportSubmitted(true);
                        setSupportMessage('');
                      }}
                      disabled={!supportMessage.trim()}
                      className="w-full py-4 bg-primary-500 text-dark-900 font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-400 transition-all disabled:opacity-40"
                    >
                      Send Report
                    </button>
                  </div>
                )}
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
