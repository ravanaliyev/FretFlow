import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Clock, Target, Loader2, ArrowLeft } from 'lucide-react';
import { getPracticeStats } from '../api/client';

interface PracticeStats {
  period: string;
  total_practice_seconds: number;
  sessions_count: number;
  lessons_completed: number;
  songs_completed: number;
  xp_earned: number;
  avg_accuracy: number;
  accuracy_trend: { date: string; accuracy: number }[];
  most_played_notes: { note: string; count: number }[];
}

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await getPracticeStats(period);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const maxAccuracy = stats?.accuracy_trend?.length
    ? Math.max(...stats.accuracy_trend.map((a) => a.accuracy))
    : 100;

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
            <h1 className="text-3xl font-bold mb-2">Practice Statistics</h1>
            <p className="text-gray-400">Track your progress over time</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8"
        >
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                period === p
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Practice Time</span>
            </div>
            <p className="text-3xl font-bold">
              {formatTime(stats?.total_practice_seconds || 0)}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Avg Accuracy</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(stats?.avg_accuracy || 0)}%</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-400">XP Earned</span>
            </div>
            <p className="text-3xl font-bold">+{stats?.xp_earned || 0}</p>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-400">Sessions</span>
            </div>
            <p className="text-3xl font-bold">{stats?.sessions_count || 0}</p>
          </div>
        </motion.div>

        {/* Accuracy Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Accuracy Trend
          </h3>

          {stats?.accuracy_trend && stats.accuracy_trend.length > 0 ? (
            <div className="flex items-end gap-2 h-40">
              {stats.accuracy_trend.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-400"
                    style={{
                      height: `${(day.accuracy / maxAccuracy) * 100}%`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No accuracy data yet. Start practicing!
            </div>
          )}
        </motion.div>

        {/* Most Played Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold mb-4">Most Played Notes</h3>

          {stats?.most_played_notes && stats.most_played_notes.length > 0 ? (
            <div className="space-y-3">
              {stats.most_played_notes.slice(0, 6).map((note, index) => {
                const maxCount = stats.most_played_notes[0]?.count || 1;
                return (
                  <div key={note.note} className="flex items-center gap-4">
                    <span className="w-12 text-lg font-bold text-primary-500">
                      #{index + 1}
                    </span>
                    <div className="w-16 text-center bg-primary-500/20 py-2 rounded-lg">
                      <span className="font-bold">{note.note}</span>
                    </div>
                    <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(note.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-16 text-right">
                      {note.count}x
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No notes played yet. Start a lesson!
            </div>
          )}
        </motion.div>

        {/* Recent Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-2 gap-4"
        >
          <div className="glass-panel rounded-2xl p-5 text-center">
            <p className="text-4xl font-bold text-green-500 mb-1">
              {stats?.lessons_completed || 0}
            </p>
            <p className="text-sm text-gray-400">Lessons Completed</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 text-center">
            <p className="text-4xl font-bold text-purple-500 mb-1">
              {stats?.songs_completed || 0}
            </p>
            <p className="text-sm text-gray-400">Songs Completed</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatsPage;