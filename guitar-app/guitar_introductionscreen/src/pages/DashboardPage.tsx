import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, BookOpen, Music, TrendingUp, Calendar, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStatsSummary, getQuests } from '../api/client';

interface StatsData {
  total_xp: number;
  level: number;
  level_name: string;
  current_streak: number;
  longest_streak: number;
  lessons_completed: number;
  songs_completed: number;
  total_practice_seconds: number;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, questsData] = await Promise.all([
          getStatsSummary(),
          getQuests(),
        ]);
        setStats(statsData);
        // Handle both {data: [...]} and [...] response formats
        setQuests(questsData?.data || questsData || []);
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressPercent = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {user?.username || 'Guitarist'}!
          </h1>
          <p className="text-gray-400">Ready for today's practice?</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-400">Streak</span>
            </div>
            <p className="text-2xl font-bold">{stats?.current_streak || 0} days</p>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-400">Level</span>
            </div>
            <p className="text-2xl font-bold">{stats?.level_name || 'Beginner'}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400">Total XP</span>
            </div>
            <p className="text-2xl font-bold">{stats?.total_xp?.toLocaleString() || 0}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Practice</span>
            </div>
            <p className="text-2xl font-bold">
              {formatTime(stats?.total_practice_seconds || 0)}
            </p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/lessons')}
            className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
              <BookOpen className="w-6 h-6 text-primary-500" />
            </div>
            <span className="text-sm font-medium">Lessons</span>
          </button>

          <button
            onClick={() => navigate('/songs')}
            className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Music className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium">Songs</span>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-sm font-medium">Rankings</span>
          </button>

          <button
            onClick={() => navigate('/stats')}
            className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium">Stats</span>
          </button>

          <button
            onClick={() => navigate('/admin/songs/new')}
            className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Plus className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm font-medium">New Song</span>
          </button>
        </motion.div>

        {/* Daily Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Daily Quests</h2>
            <span className="text-sm text-gray-400">Reset in 24h</span>
          </div>

          <div className="space-y-4">
            {quests.slice(0, 3).map((quest) => (
              <div key={quest.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{quest.title}</span>
                    <span className="text-sm text-primary-500">+{quest.xp_reward} XP</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{quest.description}</p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{
                        width: `${getProgressPercent(quest.current_value, quest.target_value)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {quest.current_value} / {quest.target_value}
                  </p>
                </div>
              </div>
            ))}

            {quests.length === 0 && (
              <p className="text-center text-gray-500 py-4">No quests available today</p>
            )}
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">This Week</h2>
            <TrendingUp className="w-5 h-5 text-primary-500" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-500">
                {stats?.lessons_completed || 0}
              </p>
              <p className="text-sm text-gray-400">Lessons</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">
                {stats?.songs_completed || 0}
              </p>
              <p className="text-sm text-gray-400">Songs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                {stats?.current_streak || 0}
              </p>
              <p className="text-sm text-gray-400">Day Streak</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;