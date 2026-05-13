import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Mic, MicOff, Loader2 } from 'lucide-react';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { getLesson, submitLessonProgress } from '../api/client';

interface Lesson {
  id: number;
  title: string;
  description: string;
  target_note: string;
  difficulty: number;
  xp_reward: number;
}

interface LessonProgress {
  is_completed?: boolean;
  best_accuracy?: number;
  attempts?: number;
}

const LessonPracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [targetNote, setTargetNote] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notesPlayed, setNotesPlayed] = useState<string[]>([]);

  // Use ref for stop function to avoid dependency ordering issues
  const stopRef = useRef<() => void>(() => {});
  // Use ref to track if we're in listening mode (avoids stale closure issues)
  const isListeningRef = useRef(false);

  const handleNoteDetected = useCallback((note: string, _freq: number) => {
    // Guard: only process if we're actually in listening mode
    if (!isListeningRef.current) return;
    if (!note || !lesson?.target_note || showSuccess) return;

    console.log('handleNoteDetected called with:', note);

    // STOP LISTENING IMMEDIATELY after first note is detected
    console.log('Calling stopRef.current...');
    stopRef.current();
    console.log('stopRef.current done');
    setIsListening(false);

    const normalizedNote = note.replace(/[0-9]/g, '');
    const normalizedTarget = lesson.target_note.replace(/[0-9]/g, '');

    const isCorrect = normalizedNote === normalizedTarget;
    setLastAttemptCorrect(isCorrect);
    setNotesPlayed((prev) => [...prev, note]);
    setAttempts((prev) => prev + 1);

    console.log('isCorrect:', isCorrect);

    if (isCorrect) {
      setCorrectAttempts((prev) => prev + 1);
      setShowSuccess(true);
      setTimeout(() => {
        submitAndNavigate();
      }, 1500);
    }
    // Don't auto-clear - user sees result until they click Start again to retry
  }, [lesson, showSuccess]);

  const { currentNote, start, stop, detectedNotes } = usePitchDetector({
    onNoteDetected: handleNoteDetected,
  });

  // Keep refs updated with latest values
  stopRef.current = stop;
  isListeningRef.current = isListening;

  const submitAndNavigate = async () => {
    if (!lesson) return;
    setIsSubmitting(true);

    const accuracy = attempts > 0 ? (correctAttempts / attempts) * 100 : 0;

    try {
      await submitLessonProgress(lesson.id, accuracy, notesPlayed);
      navigate('/lessons');
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const lessonData = await getLesson(parseInt(id));
        setLesson(lessonData);
        setProgress((lessonData as any).progress || null);
        setTargetNote(lessonData.target_note);
      } catch (err) {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const toggleListening = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
    setIsListening(!isListening);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-white">Lesson not found</p>
      </div>
    );
  }

  const accuracy = attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lessons</span>
          </button>

          {progress?.is_completed && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span>Completed</span>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-gray-400">{lesson.description}</p>
        </motion.div>

        {/* Target Note Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-3xl p-8 mb-8 text-center"
        >
          <p className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Play this note</p>
          <div className="text-8xl font-bold text-primary-500 neon-text-green mb-4">
            {targetNote}
          </div>
          <p className="text-gray-500">Pluck the string and play the note above</p>
        </motion.div>

        {/* Detection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isListening ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}
              >
                {isListening ? (
                  <Mic className="w-8 h-8 text-red-500" />
                ) : (
                  <MicOff className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isListening ? 'Listening...' : 'Microphone Off'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentNote ? `Detected: ${currentNote}` : 'Play your guitar'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleListening}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? 'Stop' : 'Start'}
            </button>
          </div>

          {/* Real-time Feedback */}
          <div className="flex items-center justify-center h-20">
            {lastAttemptCorrect === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3 text-green-500"
              >
                <CheckCircle className="w-10 h-10" />
                <span className="text-2xl font-bold">Correct!</span>
              </motion.div>
            )}
            {lastAttemptCorrect === false && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3 text-red-500"
              >
                <XCircle className="w-10 h-10" />
                <span className="text-2xl font-bold">Try again!</span>
              </motion.div>
            )}
            {lastAttemptCorrect === null && !isListening && (
              <p className="text-gray-500">Press Start to begin</p>
            )}
            {lastAttemptCorrect === null && isListening && !currentNote && (
              <p className="text-gray-400 animate-pulse">Listening for your note...</p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="glass-panel rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Attempts</p>
            <p className="text-2xl font-bold">{attempts}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Correct</p>
            <p className="text-2xl font-bold text-green-500">{correctAttempts}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-primary-500">{accuracy}%</p>
          </div>
        </motion.div>

        {/* Detected Notes History */}
        {detectedNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-panel rounded-2xl p-4 mb-4"
          >
            <p className="text-sm text-gray-400 mb-2">Notes Played</p>
            <div className="flex flex-wrap gap-2">
              {detectedNotes.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium"
                >
                  {item.note}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="glass-panel rounded-3xl p-8 text-center"
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Lesson Complete!</h2>
              <p className="text-gray-400 mb-4">
                +{lesson.xp_reward} XP earned
              </p>
              <p className="text-lg">
                Accuracy: <span className="text-primary-500 font-bold">{accuracy}%</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LessonPracticePage;