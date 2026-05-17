import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * AboutPage Component
 * Renders a premium, static informational page detailing FretFlow's mission, values, and co-founders.
 * Includes interactive cards for creators linking to their professional profiles.
 */
const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      {/* Decorative starry or aura backdrop animation */}
      <AnimatedBackground />
      
      {/* Landing top navigation bar */}
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow">
        {/* Main Content card */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          
          {/* Subtle glowing radial blur overlay */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
            About Us
          </h1>

          <div className="space-y-6 text-lg text-gray-300 leading-relaxed relative z-10">
            <p className="text-xl font-medium text-white/90">
              Music is more than sound — it’s emotion, passion, and expression. Our platform was created to help people learn guitar in a modern, simple, and inspiring way.
            </p>

            <p>
              Whether you're holding a guitar for the first time or improving your skills, we provide lessons, practice tools, and interactive content designed to make learning enjoyable and effective.
            </p>

            <p>
              We believe everyone can learn guitar with the right guidance, consistency, and motivation. That’s why we focus on creating a smooth learning experience for beginners and passionate players alike.
            </p>

            <p>
              From basic chords to advanced techniques, our goal is to help you grow step by step and enjoy every moment of your musical journey.
            </p>

            {/* Injected blockquote styling banner */}
            <div className="py-8 my-10 border-y border-white/10 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-primary-500 rounded-full"></div>
              <p className="text-2xl md:text-3xl font-bold text-white text-center italic tracking-wide">
                "Pick up your guitar. Start playing. <span className="text-primary-400">Create your sound.</span>"
              </p>
            </div>

            {/* Co-Founders Team deck */}
            <div className="mt-16 pt-10 border-t border-white/5">
              <h3 className="text-center text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mb-10">Visionaries & Creators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { name: "Ravan Aliyev", role: "Co-Founder", initial: "R", link: "https://www.linkedin.com/in/ravanaliyev01/" },
                  { name: "Emirhan Alptekin", role: "Co-Founder", initial: "E", link: "https://github.com/Emirhan156" },
                  { name: "Hüseyin Poyraz Küçükarslan", role: "Co-Founder", initial: "H", link: "https://github.com/poyrazK" }
                ].map((creator, i) => (
                  <motion.a 
                    key={i}
                    href={creator.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2 }}
                    className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group flex items-center gap-4 cursor-pointer block"
                  >
                    {/* Circle avatar badge */}
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-lg font-medium text-gray-400 group-hover:border-primary-500/30 group-hover:text-primary-400 transition-all shrink-0">
                      {creator.initial}
                    </div>
                    {/* Creators Profile info */}
                    <div>
                      <h4 className="text-base font-bold text-white/80 group-hover:text-white transition-colors">{creator.name}</h4>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{creator.role}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Landing footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;
