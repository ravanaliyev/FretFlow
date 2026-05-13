import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      <AnimatedBackground />
      <Navbar />
      
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
          
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
            
            <div className="py-8 my-10 border-y border-white/10 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-primary-500 rounded-full"></div>
              <p className="text-2xl md:text-3xl font-bold text-white text-center italic tracking-wide">
                "Pick up your guitar. Start playing. <span className="text-primary-400">Create your sound.</span>"
              </p>
            </div>
            
            <div className="mt-12 flex flex-col md:flex-row items-center justify-between bg-dark-900/60 rounded-2xl p-6 border border-white/5 backdrop-blur-md">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-primary-500 font-bold mb-2">Visionaries & Creators</h3>
                <p className="text-xl font-semibold text-white">Emirhan Alptekin & Ravan Aliyev</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
