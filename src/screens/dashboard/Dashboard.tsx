/**
 * ==========================================================================================
 *                                    FRETFLOW DASHBOARD ORCHESTRATOR
 * ==========================================================================================
 * 
 * CORE PURPOSE:
 * This is the central hub/dashboard of the FretFlow platform. It acts as a major orchestrator
 * coordinating the gamified learning path, live guitar audio processing, real-time multiplayer
 * duels, and user profile management.
 * 
 * MAIN STATE DOMAINS:
 * 1. USER AUTH & STATS: Exposes authentication data (XP, Levels) and tracks rolling 7-day practice streaks.
 * 2. CURRICULUM PATHWAYS: Handles Standard Levels (1 to 5) including foundational lessons, fret mastery, 
 *    interactive song libraries, and ear training, fetched dynamically from backend APIs.
 * 3. REAL-TIME AUDIO SYNCHRONIZATION: Instantiates the browser pitch detection system (via AudioProcessor)
 *    to analyze microphone frequencies and match them to target guitar notes on the fretboard.
 * 4. MULTIPLAYER DUEL SYSTEM: Manages real-time 30-second challenges against other students with shared
 *    invite codes, live ready states, and automated high-score submissions.
 * 5. PROFILE & PREFERENCES: Allows personalization of settings like Light/Dark theme, Left-Handed mode, 
 *    and Scientific (C, D, E) vs. Syllabic (Do, Re, Mi) musical notation.
 * 
 * NAVIGATION & VIEWS Structure:
 * Subviews are derived dynamically from the URL route segments (e.g. `/dashboard/<view>/<param>`):
 * - "levels": Main roadmap containing level cards (Level 1-5).
 * - "lessons": Displays the specific grid of lessons for the chosen level ID.
 * - "practice": Interactive pitch-matching guitar practice board.
 * - "ear-training": Interactive game to guess played notes by ear.
 * - "duel": Real-time user vs. user note matching competition arena.
 * ==========================================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ArrowLeft,
  Mic,
  MicOff,
  CheckCircle,
  PlayCircle,
  Trash2,
  X,
  Activity,
  User,
  Trophy,
  Star,
  Settings2,
  Bell,
  Sun,
  Moon,
  Mail,
  Copy,
  RotateCcw
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

// --- Imported Modular Components ---
import GuitarTuner from './components/Tuner';
import Metronome from './components/Metronome';
import EarTrainingGame from './components/EarTraining';
import { SongLibrary, SongPlayer } from './components/Songs';
import LevelRoadmap from './components/LevelRoadmap';
import LeaderboardComponent from './components/Leaderboard';
import BadgesSection from './components/BadgesSection';
import AnalyticsChart from './components/AnalyticsChart';
import LevelMenu from './components/LevelMenu';
import LessonGrid from './components/LessonGrid';
import ProfileDropdown from './components/ProfileDropdown';
import QuickResume from './components/QuickResume';
import MotivationQuote from './components/MotivationQuote';

// --- Types ---
export interface Lesson {
  id: number;
  title: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'available' | 'locked' | 'completed';
  sequence: string[];
  desc: string;
  order_index?: number;
}

export interface HistoryItem {
  id: number;
  title: string;
  date: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'welcome' | 'achievement' | 'info';
  timestamp: string;
  read: boolean;
}

export interface LeaderboardItem {
  id: number;
  name: string;
  score: number;
  date: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
}

export interface Song {
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

export const SCI_TO_SYL: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Reb',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab',
  'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
  'B': 'Si'
};

export const formatNoteName = (note: string, style: 'scientific' | 'syllabic') => {
  if (!note || style === 'scientific') return note;
  // Handle notes like E2, G#3
  const pitch = note.replace(/[0-9]/g, '');
  const octave = note.replace(/[^0-9]/g, '');
  const syllabic = SCI_TO_SYL[pitch] || pitch;
  return `${syllabic}${octave}`;
};


// --- Sub-Components ---



// --- Song Mode Components ---


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

  const submitDuelResult = async (scoreToSubmit?: number, accuracyToSubmit?: number) => {
    if (!urlInviteCode) {
      setDuelError('No duel code available.');
      return;
    }
    const finalScore = typeof scoreToSubmit === 'number' ? scoreToSubmit : duelScore;
    const finalAccuracy = typeof accuracyToSubmit === 'number' ? accuracyToSubmit : duelAccuracy;
    try {
      const res = await duelsApi.finishDuel(urlInviteCode, finalScore, finalAccuracy);
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

  // Automatically close all modals and drawers when the URL or view changes
  useEffect(() => {
    setShowStreakModal(false);
    setShowAdminModal(false);
    setShowProfileModal(false);
    setShowHelpModal(false);
    setShowSettingsModal(false);
    setShowSupportModal(false);
    setShowHistoryDrawer(false);
    setShowHistoryClearModal(false);
    setShowNotifications(false);
  }, [location.pathname]);

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
            // Admin users bypass all progress locking mechanisms!
            status = user?.role === 'ADMIN' ? 'available' : 'locked';
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
            status = user?.role === 'ADMIN' ? 'available' : 'locked';
          }
        } else {
          // First song of Level 4 - check if previous level (Level 3) is completed
          const level3Lessons = lessons.filter(l => l.level === 3);
          if (level3Lessons.length > 0) {
            const allLevel3Completed = level3Lessons.every(l => l.status === 'completed');
            if (!allLevel3Completed) {
              status = user?.role === 'ADMIN' ? 'available' : 'locked';
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

  // Game Timers (Strictly single-interval per active phase)
  useEffect(() => {
    if (gamePhase === 'idle' || gamePhase === 'result') return;

    let timer: any;
    if (gamePhase === 'countdown') {
      timer = setInterval(() => {
        setGameCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Safely schedule the gameplay transition on the next tick to prevent stale state issues
            setTimeout(() => {
              setGamePhase('playing');
              setGameTimeLeft(30);
              pickRandomNote();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gamePhase === 'playing') {
      timer = setInterval(() => {
        setGameTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gamePhase]);

  // Handle Game End Logic Safely (Avoid Stale Closures)
  useEffect(() => {
    if (gamePhase === 'playing' && gameTimeLeft === 0) {
      setGamePhase('result');

      if (currentView === 'duel' && duel?.status === 'started') {
        const finalAccuracy = duelAccuracy > 0 ? duelAccuracy : 100;
        setDuelScore(gameScore);
        setDuelAccuracy(finalAccuracy);
        submitDuelResult(gameScore, finalAccuracy).catch(err => {
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

      if (!processorRef.current.isRunning) {
        setIsListening(true);
        processorRef.current.start().catch(err => {
          console.error("Failed to start pitch processor:", err);
          setIsListening(false);
        });
      }
    } else {
      if (processorRef.current && processorRef.current.isRunning) {
        processorRef.current.stop();
      }
      setIsListening(false);
      setCurrentPitch('--');
      setCurrentFrequency(0);
    }

    return () => {
      if (processorRef.current) {
        processorRef.current.stop();
      }
      setIsListening(false);
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all cursor-pointer group"
            >
              <div className="relative">
                <svg
                  viewBox="0 0 26 31"
                  fill="none"
                  className={`w-[18px] h-[18px] transition-all duration-500 drop-shadow-[0_0_6px_rgba(var(--streak-color),0.5)] ${streakData.isFrozen ? 'text-cyan-400' :
                    streakData.count > 0 ? 'text-primary-500' : 'text-gray-600'
                    }`}
                  style={{
                    filter: streakData.count > 0 ? 'drop-shadow(0 0 6px currentColor)' : 'none',
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
              <span className={`text-xs font-black transition-colors ${streakData.isFrozen ? 'text-cyan-400 group-hover:text-cyan-300' :
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
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-pure-white px-[6px]">
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
                    className="absolute right-[-48px] sm:right-0 top-full mt-3 w-80 max-w-xs rounded-3xl border border-white/10 bg-dark-950 shadow-2xl shadow-black/50 overflow-hidden z-[2000] backdrop-blur-none"
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
                data-profile-button
                className="w-10 h-10 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center text-primary-500 overflow-hidden hover:border-primary-500/60 transition-all active:scale-95"
              >
                <User size={20} />
              </button>

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
                    onOpenSupport={() => setShowSupportModal(true)}
                    onUpdate={async (data) => {
                      try {
                        const updatedUser = await usersApi.updateMe(data);
                        updateUser(updatedUser);
                      } catch (err) {
                        console.error('Failed to update profile:', err);
                      }
                    }}
                    theme={theme}
                    setTheme={setTheme}
                    notationStyle={notationStyle}
                    onUpdateNotation={handleUpdateNotation}
                    isLefty={isLefty}
                    onUpdateLefty={handleUpdateLefty}
                  />
                )}
              </AnimatePresence>
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


      <div className={`container mx-auto pt-6 pb-12 md:py-12 px-6 max-w-5xl ${currentView === 'practice' && !(activeLesson && activeLesson.id < 0) ? 'hidden' : ''}`}>
        {/* Main Content - Full Width */}
        <main className="w-full">
          {(currentView === 'levels' || currentView === 'lessons') && (
            <div className="mb-4 md:mb-12 -mt-4 md:mt-0">
              <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-3 text-white">
                {isAllCompleted ? "Master of the Strings! 🏆" : "Welcome back, Rock Star! 🎸"}
              </h2>
              <div className="text-gray-400 text-sm md:text-base">
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
                <div className="mb-4 md:mb-12 -mt-4 md:mt-0">
                  <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-2 text-white">Your Activity</h2>
                  <p className="text-gray-400 text-sm md:text-base">Track your progress, badges, and practice history.</p>
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
                <div className="text-center mb-4 md:mb-12 -mt-4 md:mt-0">
                  <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-3 text-white">Precision Tuner 🎯</h2>
                  <p className="text-gray-400 text-sm md:text-lg">Get your strings perfectly in sync before you play.</p>
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
                <div className="text-center mb-4 md:mb-12 -mt-4 md:mt-0">
                  <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-3 text-white">Speed Challenge</h2>
                  <p className="text-gray-400 text-sm md:text-lg">Play as many notes as you can in 30 seconds!</p>
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
                          <h4 key={gameTimeLeft} className={`text-3xl font-black ${gameTimeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{gameTimeLeft}s</h4>
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

                  {gamePhase === 'result' && (
                    <div className="text-center w-full flex flex-col items-center">
                      <div className="w-24 h-24 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <Trophy size={48} />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">Challenge Finished!</p>

                      {gameScore > gameHighScore ? (
                        <div className="mb-8">
                          <span className="bg-primary-500/20 text-primary-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                            🎉 NEW HIGH SCORE!
                          </span>
                          <h4 className="text-7xl font-black text-white mt-4">{gameScore}</h4>
                        </div>
                      ) : (
                        <div className="mb-8">
                          <h4 className="text-7xl font-black text-white mb-2">{gameScore}</h4>
                          <p className="text-xs text-gray-500 font-bold uppercase">Your High Score: {gameHighScore}</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-6">
                        <button
                          onClick={startChallenge}
                          className="bg-primary-500 text-dark-900 px-8 py-4 rounded-2xl font-black text-base hover:scale-105 transition-all shadow-xl shadow-primary-500/20 shrink-0"
                        >
                          PLAY AGAIN
                        </button>
                        <button
                          onClick={() => setGamePhase('idle')}
                          className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-white/10 transition-all shrink-0"
                        >
                          LEADERBOARD
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
                <div className="text-center mb-4 md:mb-12 -mt-4 md:mt-0">
                  <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-3 text-white">Duel Arena</h2>
                  <p className="text-gray-400 text-sm md:text-lg">Create a duel room, share the code, and compete with a friend.</p>
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
                <div className="text-center mb-4 md:mb-12 -mt-4 md:mt-0">
                  <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-3 text-white">Metronome ⏱️</h2>
                  <p className="text-gray-400 text-sm md:text-lg">Keep your rhythm tight and your timing perfect.</p>
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
                    <div className="text-center mb-4 md:mb-12 -mt-4 md:mt-0">
                      <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-3 text-white">Song Library 🎵</h2>
                      <p className="text-gray-400 text-sm md:text-lg">Play along with classic riffs and songs.</p>
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
                  className="w-full py-4 bg-rose-500 text-pure-white font-bold rounded-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
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
                        className="px-6 bg-rose-500/10 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-pure-white transition-all flex items-center justify-center"
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
                  className="py-4 rounded-2xl bg-rose-500 text-pure-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
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
              className="glass-panel w-full max-w-[22rem] sm:max-w-sm p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative z-10 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />

              <div className="mb-4 sm:mb-6 inline-flex p-3 sm:p-4 rounded-3xl bg-primary-500/10 border border-primary-500/20">
                <svg viewBox="0 0 26 31" className={`w-10 h-10 sm:w-12 sm:h-12 ${streakData.isFrozen ? 'text-cyan-400' : 'text-primary-500'}`} fill="currentColor">
                  <path d="M13 1C6 1 1 6 1 12C1 19 8 30 13 30C18 30 25 19 25 12C25 6 20 1 13 1Z" />
                </svg>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-1.5 sm:mb-2">{streakData.count} Day Streak!</h2>
              <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">You're doing great. Keep the rhythm going!</p>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                {DAYS.map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase">{day}</span>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${streakData.history[i] === 'completed' ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_rgba(57,255,20,0.3)]' :
                      streakData.history[i] === 'frozen' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' :
                        'bg-white/5 border border-white/10 text-gray-700'
                      }`}>
                      {streakData.history[i] === 'completed' ? <CheckCircle size={14} strokeWidth={3} /> :
                        streakData.history[i] === 'frozen' ? <span className="text-xs">❄️</span> :
                          <div className="w-1 h-1 rounded-full bg-current" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5 sm:mb-6">
                <p className="text-xs sm:text-sm font-bold text-white/90">
                  {streakData.isFrozen ? "❄️ Your streak is frozen! Practice today to keep it alive." : "🔥 Come back tomorrow to continue your streak!"}
                </p>
              </div>

              <button
                onClick={() => setShowStreakModal(false)}
                className="w-full py-3 sm:py-4 bg-dark-800 hover:bg-dark-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all active:scale-95 border border-white/5 text-sm sm:text-base"
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
