import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Settings2, Flag, HelpCircle, LogOut, ArrowRight, ArrowLeft, Sun, Moon, Music } from 'lucide-react';

/**
 * Properties for the ProfileDropdown component.
 * @property user - The currently authenticated active user object.
 * @property onClose - Callback to close the dropdown menu panel.
 * @property onLogout - Callback triggered when standard user signs out of the app.
 * @property onOpenHelp - Callback triggering the display of the Help Center.
 * @property onOpenSupport - Callback triggering the display of the Bug Report / Support page.
 * @property onUpdate - Callback executing profile field updates (username, password, etc.).
 * @property theme - Active theme state ('light' or 'dark').
 * @property setTheme - State modifier function updating active theme.
 * @property notationStyle - Standard musical notation preference ('scientific' or 'syllabic').
 * @property onUpdateNotation - Modifier function updating musical notation preference.
 * @property isLefty - Boolean flag indicating if the guitar fretboard UI is flipped (Left-handed mode).
 * @property onUpdateLefty - Modifier function updating lefty status preference.
 */
export interface ProfileDropdownProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenSupport: () => void;
  onUpdate: (data: { username?: string; avatar_url?: string; password?: string }) => Promise<void>;
  
  theme?: 'dark' | 'light';
  setTheme?: (theme: 'dark' | 'light') => void;
  notationStyle?: 'scientific' | 'syllabic';
  onUpdateNotation?: (style: 'scientific' | 'syllabic') => void;
  isLefty?: boolean;
  onUpdateLefty?: (lefty: boolean) => void;
}

/**
 * ProfileDropdown Component
 * Renders a visually premium, slide-out glassmorphic dropdown panel for user account settings.
 * Divided into 3 animated tabs/subviews:
 * 1. 'main': Quick navigation links, account details, sign out, bug reports, and help.
 * 2. 'preferences': Interactive controls for dark mode, notation systems, and left-handed guitar layout.
 * 3. 'edit': Input fields to seamlessly update username or change security passwords.
 */
const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onClose,
  onLogout,
  onOpenHelp,
  onOpenSupport,
  onUpdate,
  theme,
  setTheme,
  notationStyle,
  onUpdateNotation,
  isLefty,
  onUpdateLefty
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Tab view states ('main', 'edit', 'preferences')
  const [view, setView] = useState<'main' | 'edit' | 'preferences'>('main');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Close the dropdown when clicking anywhere outside the menu panel area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Extract the first character of the username to render as the profile avatar initial
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <>
      <motion.div
        ref={dropdownRef}
        layout
        transition={{
          layout: { type: 'spring', stiffness: 350, damping: 35 } // Smooth resizing spring transitions
        }}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="fixed top-20 right-6 z-[2001] glass-panel p-5 rounded-[2rem] w-80 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          
          {/* VIEW 1: Main Menu Panel */}
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-4 w-full"
            >
              {/* User Identity Banner showing avatar initial, name, and level */}
              <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center text-dark-900 font-black text-xl shadow-lg shadow-primary-500/20 shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-white truncate leading-none mb-1.5">{user?.username}</h2>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-[9px] font-black text-primary-400 uppercase tracking-wider">
                    Student • Lv.{user?.level || 1}
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-white/10 my-2" />

              {/* Menu lists */}
              <div className="space-y-3">
                {/* Section A: Account Management options */}
                <div className="space-y-1">
                  <div className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Account</div>
                  {/* Edit profile navigation */}
                  <button
                    onClick={() => setView('edit')}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all flex items-center justify-between group text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Edit2 size={14} className="text-primary-500/80 group-hover:text-primary-400 transition-colors" />
                      <span>Edit Profile</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Preferences settings panel navigation */}
                  <button
                    onClick={() => setView('preferences')}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all flex items-center justify-between group text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 size={14} className="text-primary-500/80 group-hover:text-primary-400 transition-colors" />
                      <span>Preferences</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* Section B: General Support options */}
                <div className="space-y-1">
                  <div className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Support</div>
                  {/* Bug Reporter */}
                  <button
                    onClick={() => { onClose(); onOpenSupport(); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all flex items-center justify-between group text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flag size={14} className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors" />
                      <span>Report Bug</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* FAQ Help Center */}
                  <button
                    onClick={() => { onClose(); onOpenHelp(); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all flex items-center justify-between group text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle size={14} className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors" />
                      <span>Help Center</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                <div className="h-[1px] bg-white/10 my-2" />

                {/* Sign Out Trigger */}
                <button
                  onClick={onLogout}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 transition-all flex items-center gap-2.5 text-xs font-black"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          ) : view === 'preferences' ? (
            
            /* VIEW 2: App Preferences Settings */
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-4 w-full"
            >
              {/* Back action */}
              <div className="flex items-center gap-2.5 mb-2">
                <button
                  onClick={() => setView('main')}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={14} />
                </button>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Preferences</h3>
              </div>

              <div className="space-y-4">
                {/* Theme Selector (Light vs Dark Mode) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Sun size={12} className="text-primary-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Theme</span>
                  </div>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setTheme && setTheme('dark')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'bg-primary-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Moon size={12} />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme && setTheme('light')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 ${theme === 'light' ? 'bg-primary-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Sun size={12} />
                      Light
                    </button>
                  </div>
                </div>

                {/* Notation Style Selector (Scientific e.g. E2, vs Syllabic e.g. Mi2) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Music size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Notation</span>
                  </div>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => onUpdateNotation && onUpdateNotation('scientific')}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-wider transition-all ${notationStyle === 'scientific' ? 'bg-primary-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      Scientific
                    </button>
                    <button
                      onClick={() => onUpdateNotation && onUpdateNotation('syllabic')}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-wider transition-all ${notationStyle === 'syllabic' ? 'bg-primary-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      Syllabic
                    </button>
                  </div>
                </div>

                {/* Lefty Mode Switch (Flips fretboard diagrams horizontally) */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Settings2 size={14} className="text-amber-500" />
                    <div className="text-left">
                      <div className="text-[10px] font-black text-white leading-none mb-1">Left-Handed</div>
                      <div className="text-[8px] text-gray-500 font-bold">Fretboard UI flip</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateLefty && onUpdateLefty(!isLefty)}
                    className={`w-10 h-6 rounded-full transition-all relative ${isLefty ? 'bg-primary-500' : 'bg-white/10'}`}
                  >
                    <motion.div
                      animate={{ x: isLefty ? 18 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            
            /* VIEW 3: Account Profile Editor */
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-4 w-full"
            >
              {/* Back Action */}
              <div className="flex items-center gap-2.5 mb-2">
                <button
                  onClick={() => setView('main')}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={14} />
                </button>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Edit Profile</h3>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3.5">
                {/* Username Input */}
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input w-full px-4 py-3 rounded-xl text-xs text-white font-bold focus:border-primary-500/50 transition-all outline-none"
                    placeholder="Your username"
                  />
                </div>

                {/* Password Input (Optional - left blank to remain unchanged) */}
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full px-4 py-3 rounded-xl text-xs text-white font-bold focus:border-primary-500/50 transition-all outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>

                {/* Form submit button */}
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    // Pass update payload upwards
                    await onUpdate({ username, ...(password ? { password } : {}) });
                    setIsSaving(false);
                    setPassword('');
                    setView('main');
                  }}
                  disabled={isSaving}
                  className="w-full py-3 bg-primary-500 text-dark-900 text-xs font-black rounded-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 mt-4 shadow-lg shadow-primary-500/20"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ProfileDropdown;
