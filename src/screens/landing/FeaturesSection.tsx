
import { motion } from 'framer-motion';

const features = [
  {
    title: "Backed by learning science.",
    description: "Our bite-sized lessons are designed to be fun, effective, and perfectly paced to help you remember what you learn.",
    icon: "🧠",
    color: "bg-accent-500",
    border: "border-[#1899d6]"
  },
  {
    title: "Stay motivated.",
    description: "We make it easy to form a habit of learning guitar with game-like features, fun challenges, and daily reminders.",
    icon: "🔥",
    color: "bg-ambient-500",
    border: "border-[#d6a500]"
  },
  {
    title: "Interactive feedback.",
    description: "Play your real guitar, and our app instantly tells you if you played the right notes at the right time.",
    icon: "⚡",
    color: "bg-primary-500",
    border: "border-[#58a700]"
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <div className="relative z-10 py-32 px-4 max-w-6xl mx-auto border-t-2 border-dark-700">
      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`w-32 h-32 rounded-[2rem] ${feature.color} border-b-8 ${feature.border} flex items-center justify-center mb-8 transform hover:-translate-y-2 transition-transform shadow-lg`}>
              <span className="text-6xl">{feature.icon}</span>
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">{feature.title}</h3>
            <p className="text-gray-400 text-lg leading-relaxed font-bold">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
