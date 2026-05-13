import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="relative z-50 w-full py-5 px-6 lg:px-12 flex justify-between items-center max-w-6xl mx-auto">
      <Link to="/" className="flex items-center gap-2">
        <Flame className="w-8 h-8 text-primary-500" />
        <span className="text-2xl font-extrabold text-white tracking-tight">guitar<span className="text-primary-500">legend</span></span>
      </Link>
      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className="btn-duo btn-duo-secondary py-3 px-6 text-sm hidden sm:flex">
              DASHBOARD
            </Link>
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center hover:bg-primary-500/30 transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5 text-primary-500" />
            </Link>
          </>
        )}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="btn-duo btn-duo-secondary py-3 px-6 text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            LOG OUT
          </button>
        ) : (
          <Link to="/login" className="btn-duo btn-duo-secondary py-3 px-6 text-sm hidden sm:flex">
            LOG IN
          </Link>
        )}
        {!isAuthenticated && (
          <Link to="/login" className="btn-duo btn-duo-primary py-3 px-6 text-sm">
            GET STARTED
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
