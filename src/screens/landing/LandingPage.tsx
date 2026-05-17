import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import LandingHero from './LandingHero';
import FeaturesSection from './FeaturesSection';
import GamificationShowcase from './GamificationShowcase';
import Footer from './Footer';

/**
 * LandingPage Component
 * The main orchestrator file for the public-facing homepage screen.
 * Seamlessly compiles the ambient visual background, navigation bar, hero banner,
 * features grids, gamification showcases, and footer components into a unified responsive wrapper.
 */
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden font-sans text-white relative">
      {/* Dynamic ambient backdrop animation layer */}
      <AnimatedBackground />
      
      {/* Shared Header Navigation bar */}
      <Navbar />
      
      {/* Large promotional banner and button triggers */}
      <LandingHero />
      
      {/* 3-column features presentation section */}
      <FeaturesSection />
      
      {/* Mock Quests gamification display */}
      <GamificationShowcase />
      
      {/* Standard global footer section */}
      <Footer />
    </div>
  );
};

export default LandingPage;
