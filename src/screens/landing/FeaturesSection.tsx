import { motion } from 'framer-motion';

// Features array defining FretFlow's three core educational values
const features = [
  {
    title: "Backed by learning science.",
    description: "Our bite-sized lessons are designed to be fun, effective, and perfectly paced to help you remember what you learn.",
    icon: "🧠",
    color: "bg-accent-500",      // Custom blue theme background
    border: "border-[#1899d6]"  // Custom blue bottom border shadow offset
  },
  {
    title: "Stay motivated.",
    description: "We make it easy to form a habit of learning guitar with game-like features, fun challenges, and daily reminders.",
    icon: "🔥",
    color: "bg-ambient-500",     // Custom orange theme background
    border: "border-[#d6a500]"  // Custom orange bottom border shadow offset
  },
  {
    title: "Interactive feedback.",
    description: "Play your real guitar, and our app instantly tells you if you played the right notes at the right time.",
    icon: "⚡",
    color: "bg-primary-500",     // Custom green theme background
    border: "border-[#58a700]"  // Custom green bottom border shadow offset
  }
];

/**
 * FeaturesSection Component
 * Displays a 3-column promotional grid detailing the application's key technical selling points.
 * Leverages scroll-triggered animations (whileInView) to dynamically slide up cards as
 * the user scrolls down the landing page.
 */
const FeaturesSection: React.FC = () => {
  return (
    <div className="relative z-10 py-32 px-4 max-w-6xl mx-auto border-t-2 border-dark-700">
      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            // Trigger animation exactly once when card scrolls into active viewport
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }} // Staggered delays
            className="flex flex-col items-center text-center"
          >
            {/* Feature Icon box with bottom border offset acting as a 3D block */}
            <div className={`w-32 h-32 rounded-[2rem] ${feature.color} border-b-8 ${feature.border} flex items-center justify-center mb-8 transform hover:-translate-y-2 transition-transform shadow-lg`}>
              <span className="text-6xl">{feature.icon}</span>
            </div>
            
            {/* Metadata */}
            <h3 className="text-2xl font-black mb-4 text-white">{feature.title}</h3>
            <p className="text-gray-400 text-lg leading-relaxed font-bold">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
