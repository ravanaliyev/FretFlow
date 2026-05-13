import AnimatedBackground from './AnimatedBackground';
import Navbar from './Navbar';
import LandingHero from './LandingHero';
import FeaturesSection from './FeaturesSection';
import GamificationShowcase from './GamificationShowcase';
import Footer from './Footer';

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
