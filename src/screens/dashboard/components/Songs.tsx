import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowLeft, Play, Mic } from 'lucide-react';
import type { Song } from '../Dashboard';

export interface SongLibraryProps {
  songs: Song[];
  onSelect: (song: Song) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({ songs, onSelect }) => {
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

export interface SongPlayerProps {
  song: Song;
  currentPitch: string;
  notationStyle: 'scientific' | 'syllabic';
  formatNoteName: (note: string, style: 'scientific' | 'syllabic') => string;
  onComplete: (score: number, accuracy: number) => void;
  onExit: () => void;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({
  song,
  currentPitch,
  notationStyle,
  formatNoteName,
  onComplete,
  onExit
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

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
