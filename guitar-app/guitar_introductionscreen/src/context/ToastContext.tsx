import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

interface AchievementToast {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon: string;
}

interface ToastContextType {
  showAchievementToast: (achievement: Omit<AchievementToast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AchievementToast[]>([]);

  const showAchievementToast = useCallback((achievement: Omit<AchievementToast, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...achievement, id }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showAchievementToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="glass-panel rounded-2xl p-4 min-w-[300px] max-w-[400px] border border-yellow-500/30 shadow-lg shadow-yellow-500/10"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wide mb-1">
                    Achievement Unlocked!
                  </p>
                  <h4 className="font-bold text-white">{toast.name}</h4>
                  <p className="text-sm text-gray-400">{toast.description}</p>
                  <p className="text-sm text-primary-500 font-semibold mt-1">
                    +{toast.xp_reward} XP
                  </p>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}