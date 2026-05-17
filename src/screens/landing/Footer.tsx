import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 * Renders the primary global footer element shared across the public landing pages.
 * Displays co-branding logotype, links to static informative sections (About, Terms, Privacy),
 * and an auto-adjusting copyright notice based on the current system year.
 */
const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-dark-900/80 backdrop-blur-md pt-16 pb-8 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Visual Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-500/20 p-2 rounded-lg">
            <Flame className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Guitar<span className="text-primary-500">Legend</span></span>
        </div>
        
        {/* Navigation Routing Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 font-medium">
          <Link to="/about" className="hover:text-primary-500 transition-colors">About</Link>
          <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy</Link>
        </div>
        
        {/* Dynamic Copyright stamp */}
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} GuitarLegend. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
