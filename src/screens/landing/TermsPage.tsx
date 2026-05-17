import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * TermsPage Component
 * Renders a static glassmorphic document card containing FretFlow's official service terms and user responsibilities.
 */
const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative flex flex-col">
      {/* Decorative backdrop graphics */}
      <AnimatedBackground />
      
      {/* Global Landing Navbar */}
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20 flex-grow w-full">
        {/* Document Card panel */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-500">
          
          {/* Radiant auroral glow overlay */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

          {/* Page Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
            Terms
          </h1>

          {/* Service terms content */}
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed relative z-10">
            <p>
              By using GuitarLegend, you agree to use the platform responsibly and respectfully. All lessons, designs, and content belong to GuitarLegend. Users are responsible for their own accounts and activities while using the website.
            </p>
          </div>
        </div>
      </main>

      {/* Global Landing Footer */}
      <Footer />
    </div>
  );
};

export default TermsPage;
