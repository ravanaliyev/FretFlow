import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="relative z-50 w-full py-5 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto">
      <Link to="/" className="flex items-center gap-2">
        <Flame className="w-8 h-8 text-primary-500" />
        <span className="text-2xl font-black text-white tracking-tighter uppercase">fretflow</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/login" className="btn-duo btn-duo-secondary py-3 px-6 text-sm hidden sm:flex">
          LOG IN
        </Link>
        <Link to="/login" className="btn-duo btn-duo-primary py-3 px-6 text-sm">
          GET STARTED
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
