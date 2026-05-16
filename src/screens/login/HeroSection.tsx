import { motion } from 'framer-motion';
import { Flame, Trophy, Star } from 'lucide-react';

const HeroSection: React.FC = () => {
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
    </div>
  );
};

export default HeroSection;
