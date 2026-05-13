
import { Flame } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-dark-900/80 backdrop-blur-md pt-16 pb-8 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500/20 p-2 rounded-lg">
            <Flame className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Guitar<span className="text-primary-500">Legend</span></span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 font-medium">
          <a href="#" className="hover:text-primary-500 transition-colors">About</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Methodology</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Careers</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
        </div>
        
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} GuitarLegend. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
