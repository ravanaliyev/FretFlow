import { motion } from 'framer-motion';

/**
 * HeroSection Component (Login Screen Variation)
 * Renders the aesthetic, motivational text card on the left side of the desktop split-pane login layout.
 * Leverages smooth entry slide animations and a dark glass-panel overlay backdrop.
 */
const HeroSection: React.FC = () => {
  return (
    <div className="relative z-10 flex flex-col justify-center h-full p-2 sm:p-6 lg:p-24 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-dark-900/30 backdrop-blur-sm p-4 sm:p-6 lg:p-10 rounded-3xl border border-white/5 shadow-2xl"
      >
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-7xl font-bold tracking-tight mb-2 md:mb-6 leading-tight drop-shadow-lg">
          Every <span className="text-primary-500 neon-text-green">Guitar Legend</span><br />
          Started Somewhere.
        </h1>
        {/* Informative text */}
        <p className="text-lg lg:text-xl text-gray-200 max-w-xl mb-6 leading-relaxed drop-shadow-md font-medium hidden md:block">
          Build daily streaks, unlock interactive lessons, and become the guitarist you always wanted to be. Your journey to mastery starts tonight.
        </p>
      </motion.div>
    </div>
  );
};

export default HeroSection;
