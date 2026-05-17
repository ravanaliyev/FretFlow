import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import HeroSection from './HeroSection';
import AuthCard from './AuthCard';

/**
 * LoginPage Component
 * The main orchestrator file for the authentication screen.
 * Places the cached floating particle background (`AnimatedBackground`),
 * the motivational split banner card (`HeroSection`), and the interactive account forms card (`AuthCard`)
 * in a responsive, desktop-split layout.
 */
function LoginPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Visual background dynamics */}
      <AnimatedBackground />

      {/* Lightweight Navigation Header */}
      <header className="relative z-20 w-full py-6 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Flame className="w-8 h-8 text-primary-500" />
          <span className="text-2xl font-black text-white tracking-tighter font-sans">Fret<span className="text-primary-500">Flow</span></span>
        </Link>
      </header>
      
      {/* Split Pane container */}
      <div className="container mx-auto px-4 flex-grow max-w-screen-xl flex flex-col lg:flex-row relative z-10 py-10 lg:py-0 gap-8 lg:gap-0 items-center justify-center">
        
        {/* Left Pane: Motivational Banner */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start pt-12 lg:pt-0">
          <HeroSection />
        </div>

        {/* Right Pane: Interactive Account Form (Login/Signup toggle) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center pb-12 lg:pb-0">
          <AuthCard />
        </div>
      </div>

      {/* Lightweight Footer to balance height */}
      <footer className="relative z-20 w-full py-6 text-center text-[10px] sm:text-xs text-gray-500 tracking-wider uppercase font-bold shrink-0">
        &copy; 2026 FretFlow. All rights reserved.
      </footer>
    </div>
  );
}

export default LoginPage;
