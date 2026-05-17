import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Settings2, Flag, HelpCircle, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';

export interface ProfileDropdownProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onUpdate: (data: { username?: string; avatar_url?: string; password?: string }) => Promise<void>;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onClose,
  onLogout,
  onOpenHelp,
  onOpenSettings,
  onOpenSupport,
  onUpdate
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'edit'>('main');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Extract initial for avatar
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <>
      <motion.div
        ref={dropdownRef}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="fixed top-20 right-6 z-[2001] glass-panel p-5 rounded-[2rem] w-80 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* User Identity Header */}
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

              {/* Menu Categories */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Account</div>
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

                  <button
                    onClick={() => { onClose(); onOpenSettings(); }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all flex items-center justify-between group text-xs font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 size={14} className="text-primary-500/80 group-hover:text-primary-400 transition-colors" />
                      <span>Preferences</span>
                    </div>
                    <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Support</div>
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

                <button
                  onClick={onLogout}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 transition-all flex items-center gap-2.5 text-xs font-black"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <button
                  onClick={() => setView('main')}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={14} />
                </button>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Edit Profile</h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5 block ml-1">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input w-full px-4 py-3 rounded-xl text-xs text-white font-bold focus:border-primary-500/50 transition-all outline-none"
                    placeholder="Your username"
                  />
                </div>

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

                <button
                  onClick={async () => {
                    setIsSaving(true);
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
