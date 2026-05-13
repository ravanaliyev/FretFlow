import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Lock, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLessons } from '../api/client';
import Pagination from '../components/Pagination';

interface LessonProgress {
  is_completed?: boolean;
  best_accuracy?: number;
  attempts?: number;
}

interface LessonWithProgress {
  id: number;
  title: string;
  description: string;
  difficulty: number;
  xp_reward: number;
  progress?: LessonProgress;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface LessonsResponse {
  data: LessonWithProgress[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const LessonsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const response = await getLessons(currentPage);
        const data = response as LessonsResponse;
        setLessons(data.data || []);
        const total = data.pagination?.total || 0;
        const limit = data.pagination?.limit || 20;
        setTotalPages(Math.ceil(total / limit) || 1);
      } catch (err) {
        setError('Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessons();
  }, [currentPage]);

  const handleLessonClick = (lesson: LessonWithProgress) => {
    if (!lesson.isLocked) {
      navigate(`/lessons/${lesson.id}/practice`);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'text-green-400';
      case 2:
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Intermediate';
      default:
        return 'Advanced';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Lessons</h1>
            <p className="text-gray-400">Master the basics, one note at a time</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </motion.div>

        {/* User Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-4 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-400">Your Level</p>
              <p className="text-xl font-bold text-primary-500">{user?.level_name || 'Beginner'}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-sm text-gray-400">Total XP</p>
              <p className="text-xl font-bold">{user?.xp_total?.toLocaleString() || 0}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-xl font-bold">
                {lessons.filter((l) => l.progress?.is_completed).length} / {lessons.length}
              </p>
            </div>
          </div>
          <div className="bg-primary-500/20 px-4 py-2 rounded-full">
            <p className="text-primary-500 font-semibold">Level {user?.level || 1}</p>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="glass-panel rounded-2xl p-4 mb-8 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => handleLessonClick(lesson)}
              className={`glass-panel rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
                lesson.isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/10 hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      lesson.isCompleted
                        ? 'bg-green-500/20'
                        : lesson.isLocked
                        ? 'bg-gray-500/20'
                        : 'bg-primary-500/20'
                    }`}
                  >
                    {lesson.isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : lesson.isLocked ? (
                      <Lock className="w-6 h-6 text-gray-500" />
                    ) : (
                      <Play className="w-6 h-6 text-primary-500" />
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{lesson.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{lesson.description}</p>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-medium ${getDifficultyColor(
                          lesson.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(lesson.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">
                        +{lesson.xp_reward} XP
                      </span>
                      {lesson.progress?.best_accuracy && (
                        <span className="text-xs text-primary-400">
                          Best: {Math.round(lesson.progress.best_accuracy)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                  className={`w-6 h-6 text-gray-500 ${
                    lesson.isLocked ? '' : 'group-hover:text-white'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default LessonsPage;