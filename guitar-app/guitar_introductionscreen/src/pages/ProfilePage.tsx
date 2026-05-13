import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Trophy, Flame, Star, Music, BookOpen, Loader2 } from 'lucide-react';
import { useGamification, getXPProgress, getLevelName } from '../context/GamificationContext';
import { getAchievements } from '../api/client';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
}

const ProfilePage: React.FC = () => {
  const { user, xpToNextLevel, currentLevelXp } = useGamification();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await getAchievements();
        setAchievements(data.data || []);
      } catch (err) {
        console.error('Failed to load achievements');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const xpProgress = user ? getXPProgress(user.xp_total, user.level) : 0;
  const levelName = user ? getLevelName(user.level) : 'Beginner';

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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-400">Your guitar journey at a glance</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-primary-500/20 flex items-center justify-center border-4 border-primary-500">
              <span className="text-5xl font-bold text-primary-500">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">{user?.username || 'Guitarist'}</h2>
              <p className="text-gray-400 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-4 h-4" />
                {user?.email || 'email@example.com'}
              </p>

              {/* Level Badge */}
              <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-500">{levelName}</span>
                <span className="text-gray-400">Level {user?.level || 1}</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="w-full md:w-64">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">XP Progress</span>
                <span className="font-bold text-primary-500">{user?.xp_total?.toLocaleString() || 0} XP</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {currentLevelXp} / {xpToNextLevel} to next level
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-panel rounded-2xl p-5 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{user?.streak?.current || 0}</p>
            <p className="text-sm text-gray-400">Day Streak</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{user?.streak?.longest || 0}</p>
            <p className="text-sm text-gray-400">Best Streak</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-center">
            <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {achievements.filter(a => a.earned).length}
            </p>
            <p className="text-sm text-gray-400">Lessons Done</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-center">
            <Music className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {achievements.filter(a => a.earned).length * 3}
            </p>
            <p className="text-sm text-gray-400">Songs Played</p>
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Achievements
            </h3>
            <span className="text-sm text-gray-400">
              {achievements.filter(a => a.earned).length} / {achievements.length} earned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border ${
                  achievement.earned
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.earned ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        achievement.earned ? 'text-yellow-500' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{achievement.name}</h4>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    {achievement.earned && achievement.earned_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Earned {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-primary-500 font-bold">+{achievement.xp_reward}</span>
                    <p className="text-xs text-gray-500">XP</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Milestones Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Milestones
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                (user?.level || 0) >= 5 ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Star className={`w-5 h-5 ${(user?.level || 0) >= 5 ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Reach Level 5</h4>
                <p className="text-sm text-gray-400">Reach level 5</p>
              </div>
              {(user?.level || 0) >= 5 ? (
                <span className="text-green-500 font-bold">Achieved!</span>
              ) : (
                <span className="text-gray-500">Level {user?.level || 1}/5</span>
              )}
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                (user?.streak?.longest || 0) >= 30 ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Flame className={`w-5 h-5 ${(user?.streak?.longest || 0) >= 30 ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">30 Day Streak</h4>
                <p className="text-sm text-gray-400">Practice for 30 days in a row</p>
              </div>
              {(user?.streak?.longest || 0) >= 30 ? (
                <span className="text-green-500 font-bold">Achieved!</span>
              ) : (
                <span className="text-gray-500">{user?.streak?.longest || 0}/30 days</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;