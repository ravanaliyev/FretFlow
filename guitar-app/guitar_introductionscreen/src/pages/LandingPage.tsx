import React from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/landing/Navbar';
import LandingHero from '../components/landing/LandingHero';
import FeaturesSection from '../components/landing/FeaturesSection';
import GamificationShowcase from '../components/landing/GamificationShowcase';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative">
      <AnimatedBackground />
      <Navbar />
      <LandingHero />
      <FeaturesSection />
      <GamificationShowcase />
      <Footer />
    </div>
  );
};

export default LandingPage;
