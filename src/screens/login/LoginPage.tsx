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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden relative font-sans">
      {/* Visual background dynamics */}
      <AnimatedBackground />
      
      {/* Split Pane container */}
      <div className="container mx-auto px-4 min-h-screen max-w-screen-xl flex flex-col lg:flex-row relative z-10 py-10 lg:py-0 gap-8 lg:gap-0">
        
        {/* Left Pane: Motivational Banner */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start pt-12 lg:pt-0">
          <HeroSection />
        </div>

        {/* Right Pane: Interactive Account Form (Login/Signup toggle) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center pb-12 lg:pb-0">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
