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
  X
} from 'lucide-react';
import { AudioProcessor } from '../../utils/PitchProcessor';

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
  { id: 1, title: 'The E String (Low)', level: 1, difficulty: 'easy', status: 'available', sequence: ['E2'], desc: 'The thickest string. Pluck it once.' },
  { id: 2, title: 'String Discovery', level: 1, difficulty: 'easy', status: 'locked', sequence: ['E2', 'A2', 'D3'], desc: 'Discover the first three strings.' },
  { id: 3, title: 'First Fret Drill', level: 2, difficulty: 'medium', status: 'locked', sequence: ['F2', 'Bb2', 'Eb3'], desc: 'Press the first fret on three strings.' },
  { id: 4, title: 'The G Major Note', level: 2, difficulty: 'easy', status: 'locked', sequence: ['G2'], desc: 'Find G on the 3rd fret of the E string.' },
  { id: 5, title: 'Classic Rock Riff', level: 3, difficulty: 'hard', status: 'locked', sequence: ['E2', 'G2', 'A2'], desc: 'The beginning of a legend.' },
  { id: 6, title: 'Simple Scale', level: 3, difficulty: 'medium', status: 'locked', sequence: ['C3', 'D3', 'E3', 'F3', 'G3'], desc: 'Your first major scale fragment.' }
];

const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const FRET_COUNT = 12;

const Dashboard: React.FC = () => {
  // --- State ---
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('fretflow_lessons');
    return saved ? JSON.parse(saved) : DEFAULT_LESSONS;
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('fretflow_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'levels' | 'lessons' | 'practice'>('levels');
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPitch, setCurrentPitch] = useState('--');
  const [isListening, setIsListening] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const processorRef = useRef<AudioProcessor | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('fretflow_lessons', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('fretflow_history', JSON.stringify(history));
  }, [history]);

  // --- Audio Cleanup ---
  useEffect(() => {
    return () => {
      if (processorRef.current) processorRef.current.stop();
    };
  }, []);

  // --- Logic ---
  const startPractice = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentSequenceIndex(0);
    setView('practice');
    
    if (!processorRef.current) {
      processorRef.current = new AudioProcessor();
    }
    
    processorRef.current.onNoteDetected = (freq, note) => {
      setCurrentPitch(note);
      if (note === lesson.sequence[currentSequenceIndex]) {
        handleMatch();
      }
    };
    
    processorRef.current.start().then(() => setIsListening(true));
  };

  const handleMatch = () => {
    setCurrentSequenceIndex(prev => {
      const next = prev + 1;
      if (activeLesson && next >= activeLesson.sequence.length) {
        setTimeout(() => completeLesson(), 1000);
        return prev;
      }
      return next;
    });
  };

  const completeLesson = () => {
    if (activeLesson) {
      setLessons(prev => {
        const updated = prev.map(l => {
          if (l.id === activeLesson.id) return { ...l, status: 'completed' as const };
          return l;
        });
        
        // Unlock next lesson
        const currentIndex = updated.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < updated.length - 1 && updated[currentIndex + 1].status === 'locked') {
          updated[currentIndex + 1].status = 'available';
        }
        return updated;
      });

      setHistory(prev => [
        { id: Date.now(), title: activeLesson.title, date: new Date().toLocaleDateString() },
        ...prev
      ]);
    }
    closePractice();
  };

  const closePractice = () => {
    if (processorRef.current) processorRef.current.stop();
    setIsListening(false);
    setView('lessons');
    setActiveLesson(null);
    setCurrentPitch('--');
  };

  const deleteHistory = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const filteredLessons = lessons.filter(l => {
    const matchesLevel = l.level === activeLevel;
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'all' || l.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesLevel && matchesSearch && matchesDiff && matchesStatus;
  });

  const progressPercentage = Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100);

  // --- Components ---
  const LevelMenu = () => (
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
          onClick={() => { setActiveLevel(level.id); setView('lessons'); }}
          className="glass-panel p-8 rounded-3xl cursor-pointer hover:border-primary-500/50 transition-colors group"
        >
          <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-wider">Level {level.id}</span>
          <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">{level.name}</h2>
          <p className="text-gray-400">{level.desc}</p>
        </motion.div>
      ))}
    </div>
  );

  const LessonGrid = () => (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button 
          onClick={() => setView('levels')}
          className="glass-panel flex items-center gap-2 px-6 py-3 rounded-2xl text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm"
          />
        </div>
        <select 
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="glass-panel px-4 py-3 rounded-2xl text-sm text-white"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
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
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                lesson.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
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
              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${
                lesson.status === 'locked' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary-500 text-dark-900 hover:bg-primary-600 shadow-lg shadow-primary-500/20'
              }`}
            >
              {lesson.status === 'completed' ? 'Review Lesson' : 'Start Lesson'}
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

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
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 transition-all duration-500 ${
                  i < currentSequenceIndex ? 'bg-green-500' : 
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
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans overflow-x-hidden">
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 ${view === 'practice' ? 'hidden' : ''}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">FRETFLOW</h1>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-semibold text-white border-b-2 border-primary-500 pb-1">Dashboard</a>
              <a href="#" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Course Library</a>
              <a href="#" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Stats</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
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
            <div className="w-10 h-10 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center text-primary-500 font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <div className={`container mx-auto flex flex-col lg:flex-row gap-8 py-12 px-6 ${view === 'practice' ? 'hidden' : ''}`}>
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center md:text-left">Welcome back, Rock Star! 🎸</h2>
            <p className="text-gray-400 text-center md:text-left">Pick up where you left off and master those strings.</p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'levels' && (
              <motion.div 
                key="levels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LevelMenu />
              </motion.div>
            )}
            {view === 'lessons' && (
              <motion.div 
                key="lessons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LessonGrid />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 space-y-8">
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <History size={20} className="text-primary-500" />
              <h3 className="font-bold text-lg">Practice History</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No sessions yet. Start playing!</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <span className="text-[10px] text-gray-500">{item.date}</span>
                    </div>
                    <button 
                      onClick={() => deleteHistory(item.id)}
                      className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-primary-500/5 border-primary-500/20">
            <h3 className="font-bold mb-2">Daily Streak</h3>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black text-primary-500">7</div>
              <p className="text-sm text-gray-400">Days of consistent practice. Keep it up!</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Practice View Overlay */}
      <AnimatePresence>
        {view === 'practice' && (
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

      {/* Admin FAB */}
      <button 
        onClick={() => setShowAdminModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-dark-800 border border-white/10 rounded-full flex items-center justify-center text-primary-500 shadow-2xl hover:bg-dark-700 transition-all z-40"
      >
        <Plus size={24} />
      </button>

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
                  level: activeLevel || 1,
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
