import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * LandingHero Component
 * The top splash section of the FretFlow homepage.
 * - Displays co-branding taglines and large buttons mapping to authentication forms.
 * - Renders a mock 3D card illustrating a guitar with floating badges (Streak count and Level badges)
 *   that bob up and down asynchronously to add dynamic visual depth.
 */
const LandingHero: React.FC = () => {
  return (
    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between min-h-[85vh] px-6 max-w-6xl mx-auto overflow-hidden py-10 gap-16">
      
      {/* Left Column: Heading and Action Buttons */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[55%] text-center lg:text-left flex flex-col items-center lg:items-start"
      >
        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight mb-8 leading-[1.1] text-white">
          The free, fun, and effective way to learn guitar!
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 font-bold max-w-xl">
          Learn chords, master songs, and build a daily habit with bite-sized lessons.
        </p>

        {/* Call to Actions linking directly to signup or sign-in modes */}
        <div className="hidden lg:flex flex-col w-full sm:w-auto gap-4">
          <Link to="/login?mode=signup" className="btn-duo btn-duo-primary w-full lg:w-80 h-16 text-xl flex items-center justify-center text-center">
            GET STARTED
          </Link>
          <Link to="/login?mode=login" className="btn-duo btn-duo-secondary w-full lg:w-80 h-16 text-xl uppercase flex items-center justify-center text-center px-4 leading-tight">
            I ALREADY HAVE AN ACCOUNT
          </Link>
        </div>
      </motion.div>

      {/* Right Column: Dynamic illustrations and floating badges */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full lg:w-[45%] flex justify-center lg:justify-end"
      >
         <div className="relative w-[300px] h-[400px] md:w-[420px] md:h-[500px]">
           {/* Main playful device card */}
           <div className="absolute inset-0 bg-dark-800 rounded-[3rem] border-4 border-dark-700 border-b-8 flex flex-col items-center justify-center p-8 text-center shadow-xl">
             <div className="w-48 h-48 bg-primary-500 rounded-full flex items-center justify-center mb-6 border-b-8 border-primary-600">
                <span className="text-8xl transform -rotate-12">🎸</span>
             </div>
             <h3 className="text-2xl font-black text-white">Rock On!</h3>
           </div>
           
           {/* Floating Badge A: Level Tracker (Oscillates vertically) */}
           <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-accent-500 text-white font-extrabold text-2xl py-3 px-6 rounded-2xl border-b-4 border-[#1899d6] shadow-lg"
           >
             Level 5!
           </motion.div>

           {/* Floating Badge B: Streak Tracker (Oscillates vertically out of sync with Badge A) */}
           <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-6 bg-ambient-500 text-white font-extrabold text-2xl py-3 px-6 rounded-2xl border-b-4 border-[#d6a500] flex items-center gap-2 shadow-lg"
           >
             <span className="text-3xl">🔥</span> 14 Days
           </motion.div>
         </div>
      </motion.div>

    </div>
  );
};

export default LandingHero;
