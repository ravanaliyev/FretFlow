import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

/**
 * Navbar Component
 * Renders the top navigation header bar displayed across all public screens (Home, About, Privacy, etc.).
 * Includes brand logotypes and action triggers linking to sign-in / registration screens.
 */
const Navbar: React.FC = () => {
  return (
    <nav className="relative z-50 w-full py-5 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto">
      
      {/* Brand Logotype linking back to home root */}
      <Link to="/" className="flex items-center gap-2">
        <Flame className="w-8 h-8 text-primary-500" />
        <span className="text-2xl font-black text-white tracking-tighter uppercase">fretflow</span>
      </Link>
      
      {/* Navigation action buttons (Login vs Register signup modes) */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to="/login?mode=login" className="btn-duo btn-duo-secondary py-2 px-4 sm:py-3 sm:px-6 text-xs sm:text-sm hidden sm:flex">
          LOG IN
        </Link>
        <Link to="/login?mode=signup" className="btn-duo btn-duo-primary py-2 px-4 sm:py-3 sm:px-6 text-xs sm:text-sm">
          GET STARTED
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
