import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HeroSection: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const streak = user?.streak?.current || 0;
  const levelName = user?.level_name || 'Beginner';
  const xp = user?.xp_total || 0;

  return (
    <div className="relative z-10 flex flex-col justify-center h-full p-6 lg:p-24 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-dark-900/30 backdrop-blur-sm p-6 lg:p-10 rounded-3xl border border-white/5 shadow-2xl"
      >
        <h1 className="text-4xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight drop-shadow-lg">
          Every <span className="text-primary-500 neon-text-green">Guitar Legend</span><br />
          Started Somewhere.
        </h1>
        <p className="text-lg lg:text-xl text-gray-200 max-w-xl mb-6 leading-relaxed drop-shadow-md font-medium">
          Build daily streaks, unlock interactive lessons, and become the guitarist you always wanted to be. Your journey to mastery starts tonight.
        </p>
      </motion.div>

      {/* Gamification Preview Widgets */}
      <motion.div
        className="flex flex-wrap gap-4 lg:gap-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {/* Streak Widget */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 w-48 transform hover:scale-105 transition-transform cursor-pointer">
          <div className="bg-orange-500/20 p-3 rounded-full">
            <Flame className="w-6 h-6 text-accent-500 neon-text-orange" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Current Streak</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <p className="text-xl font-bold">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
            )}
          </div>
        </div>

        {/* Level Widget */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 w-48 transform hover:scale-105 transition-transform cursor-pointer">
          <div className="bg-purple-500/20 p-3 rounded-full">
            <Star className="w-6 h-6 text-ambient-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Your Level</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <p className="text-xl font-bold">{levelName}</p>
            )}
          </div>
        </div>

        {/* XP Widget */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 w-48 transform hover:scale-105 transition-transform cursor-pointer hidden md:flex">
          <div className="bg-green-500/20 p-3 rounded-full">
            <Trophy className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total XP</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <p className="text-xl font-bold">{xp.toLocaleString()}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;