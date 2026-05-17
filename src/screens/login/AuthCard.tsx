import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * AuthCard Component
 * The primary account authentication form container:
 * - Coordinates both Log In and Sign Up actions.
 * - Synchronizes its active state with the browser URL search parameters (`?mode=login` vs `?mode=signup`).
 * - Validates input fields (username, email, password) and handles submissions to backend auth context hooks.
 * - Shows clear feedback overlays for connection or query errors.
 */
const AuthCard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode');
  
  // Boolean flag controlling form mode (login vs registration signup)
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');

  // Synchronize state if browser URL parameters change (e.g. via navigation links)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') setIsLogin(false);
    else if (mode === 'login') setIsLogin(true);
  }, [searchParams]);

  // Form input fields states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login, register } = useAuth(); // Import authorization methods from custom Auth context hook

  /**
   * Submits form payload to database services.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Authenticate existing user
        await login(email, password);
      } else {
        // Validate and register new user account
        if (!username.trim()) {
          setError('Username is required');
          setIsSubmitting(false);
          return;
        }
        await register(email, password, username);
      }
      // Direct user straight to guitar practice dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md mx-auto">
      <motion.div
        className="glass-panel rounded-3xl p-8 sm:p-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Sliding toggle pill between Log In and Sign Up tabs */}
        <div className="flex bg-white/5 rounded-full p-1 mb-8">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-primary-500 text-dark-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => { setSearchParams({ mode: 'login' }); setIsLogin(true); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-primary-500 text-dark-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => { setSearchParams({ mode: 'signup' }); setIsLogin(false); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Input Form Fields */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Display Username field only during registration/signup */}
          {!isLogin && (
            <div className="relative group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
          )}

          {/* Email input */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          {/* Password input */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          {/* Error Alert Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center py-2"
            >
              {error}
            </motion.div>
          )}

          {/* Remember me and forgot password links (Exclusively on login view) */}
          {isLogin && (
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500/50" />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-500 hover:text-primary-600 transition-colors">Forgot password?</a>
            </div>
          )}

          {/* Submit Action */}
          <motion.button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-dark-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" /> // Spin loader during syncs
            ) : (
              <>
                {isLogin ? 'Start Playing' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>


      </motion.div>
    </div>
  );
};

export default AuthCard;