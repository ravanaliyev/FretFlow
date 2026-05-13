
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  // Generate random particles for the music vibe
  const particles = Array.from({ length: 20 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark Base */}
      <div className="absolute inset-0 bg-dark-900" />
      
      {/* Ambient Gradients */}
      <motion.div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ambient-500/20 blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/10 blur-[150px]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Abstract Neon Guitar Strings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 transform -rotate-12 scale-150">
        {[1, 2, 3, 4, 5, 6].map((string) => (
          <motion.div
            key={string}
            className={`w-full h-[1px] bg-white/20 mx-4 shadow-[0_0_15px_rgba(255,255,255,0.5)]`}
            animate={{
              boxShadow: ['0 0 10px rgba(57,255,20,0)', '0 0 20px rgba(57,255,20,0.5)', '0 0 10px rgba(57,255,20,0)']
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: string * 0.2
            }}
          />
        ))}
      </div>

      {/* Floating Music Particles */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            y: -100,
            x: `+=${Math.random() * 100 - 50}`,
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
