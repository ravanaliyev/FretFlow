/* eslint-disable react-hooks/purity, react-hooks/refs */
import { useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedBackground Component (Login Screen Variation)
 * Renders the beautiful ambient background for the login and registration screen.
 * Implements a strict `useRef` cache for all randomly generated background particles.
 * This guarantees consistent particle coordinates across username/password typing cycles,
 * preventing layout thrashing and pure-render hydrations issues.
 */
const AnimatedBackground: React.FC = () => {
  // Reference cache to hold randomized drift parameters persistently
  const particlesRef = useRef<Array<{
    duration: number;
    delay: number;
    x: number;
    opacity: number;
    offset: number;
  }> | null>(null);

  // Initialize particles strictly once on first component load
  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: 20 }, () => ({
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 10,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      opacity: Math.random() * 0.5 + 0.2,
      offset: Math.random() * 100 - 50
    }));
  }

  const particles = particlesRef.current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base backing */}
      <div className="absolute inset-0 bg-dark-900" />
      
      {/* Neon glowing ambient circles */}
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

      {/* Abstract vibrating neon guitar strings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 transform -rotate-12 scale-150">
        {[1, 2, 3, 4, 5, 6].map((string) => (
          <motion.div
            key={string}
            className="w-full h-[1px] bg-white/20 mx-4 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            animate={{
              boxShadow: ['0 0 10px rgba(57,255,20,0)', '0 0 20px rgba(57,255,20,0.5)', '0 0 10px rgba(57,255,20,0)']
            }}
            transition={{
              duration: 3 + (string * 0.3),
              repeat: Infinity,
              delay: string * 0.2
            }}
          />
        ))}
      </div>

      {/* Floating particles (Rendered persistently from the cached reference) */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          initial={{
            x: particle.x,
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
            opacity: particle.opacity
          }}
          animate={{
            y: -100,
            x: `+=${particle.offset}`,
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
