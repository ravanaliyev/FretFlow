import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit2, Settings2, Flag, HelpCircle, LogOut, ArrowLeft } from 'lucide-react';

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

  return (
    <>
      <motion.div
        ref={dropdownRef}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="fixed top-20 right-6 z-[2001] glass-panel p-6 rounded-3xl w-72 border-white/10 shadow-2xl shadow-black/50"
      >
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-500/10 border-2 border-primary-500/30 flex items-center justify-center text-primary-500 overflow-hidden">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-none mb-1">{user?.username}</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Lv.{user?.level} Student</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setView('edit')}
                  className="w-full py-3 bg-primary-500 text-dark-900 text-xs font-black rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button
                  onClick={() => { onClose(); onOpenSettings(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Settings2 size={14} /> Settings
                </button>
                <button
                  onClick={() => { onClose(); onOpenSupport(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Flag size={14} /> Support / Report Bug
                </button>
                <button
                  onClick={() => { onClose(); onOpenHelp(); }}
                  className="w-full py-3 bg-white/5 text-gray-300 text-xs font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <HelpCircle size={14} /> Help Center
                </button>
                <button
                  onClick={onLogout}
                  className="w-full py-3 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setView('main')} className="text-gray-500 hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Edit Profile</h3>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white font-medium focus:border-primary-500/50 transition-all outline-none"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white font-medium focus:border-primary-500/50 transition-all outline-none"
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
                className="w-full py-3 bg-primary-500 text-dark-900 text-sm font-black rounded-xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ProfileDropdown;
