import React from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import HeroSection from './components/HeroSection';
import AuthCard from './components/AuthCard';

function App() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden relative font-sans">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 min-h-screen flex flex-col lg:flex-row relative z-10 py-12 lg:py-0 gap-8 lg:gap-0">
        {/* Left Side - Hero Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start pt-12 lg:pt-0">
          <HeroSection />
        </div>

        {/* Right Side - Auth Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center pb-12 lg:pb-0">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}

export default App;
