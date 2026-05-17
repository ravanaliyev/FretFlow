import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Hardcoded array of inspiring quotes by legendary guitarists
const QUOTES = [
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Sometimes you want to give up the guitar, you'll hate it. But if you stick with it, you'll be rewarded.", author: "Jimi Hendrix" },
  { text: "Your talent is your art. It is your gift to yourself.", author: "Slash" },
  { text: "I just play. I don't think. I just play.", author: "B.B. King" }
];

/**
 * MotivationQuote Component
 * Renders a simple, elegant animated text card displaying a randomized, inspiring guitar quote on component mount.
 */
const MotivationQuote: React.FC = () => {
  // Use lazy state initialization to choose a random quote exactly once during component mount
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-8 p-0 italic text-gray-400 text-sm md:text-base max-w-2xl"
    >
      "{quote.text}" — <span className="text-primary-500/70 font-bold not-italic">{quote.author}</span>
    </motion.div>
  );
};

export default MotivationQuote;
