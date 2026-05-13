import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { getProfile, getQuests, getAchievements, getMilestones, claimQuest } from '../api/client';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  level_name: string;
  streak: {
    current: number;
    longest: number;
    last_practice: string | null;
  };
}

interface Quest {
  id: number;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  expires_at: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  earned: boolean;
  earned_at: string | null;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  icon: string;
}

interface GamificationContextType {
  user: User | null;
  quests: Quest[];
  achievements: Achievement[];
  milestones: Milestone[];
  isLoading: boolean;
  claimQuestReward: (questId: number) => Promise<{ success: boolean; xp_earned: number }>;
  refreshGamification: () => Promise<void>;
  xpToNextLevel: number;
  currentLevelXp: number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000];

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGamification = useCallback(async () => {
    try {
      const [profileData, questsData, achievementsData, milestonesData] = await Promise.all([
        getProfile(),
        getQuests(),
        getAchievements(),
        getMilestones(),
      ]);
      setUser(profileData);
      setQuests(questsData);
      setAchievements(achievementsData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Only fetch when user is authenticated
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        const [profileData, questsData, achievementsData, milestonesData] = await Promise.all([
          getProfile(),
          getQuests(),
          getAchievements(),
          getMilestones(),
        ]);
        setUser(profileData);
        setQuests(questsData);
        setAchievements(achievementsData);
        setMilestones(milestonesData);
      } catch (error) {
        console.error('Failed to load gamification data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const claimQuestReward = useCallback(async (questId: number) => {
    try {
      const result = await claimQuest(questId);
      if (result.success) {
        await refreshGamification();
      }
      return result;
    } catch (error) {
      console.error('Failed to claim quest:', error);
      return { success: false, xp_earned: 0 };
    }
  }, [refreshGamification]);

  // Calculate XP progress
  const xpToNextLevel = user
    ? LEVEL_THRESHOLDS[user.level] - (LEVEL_THRESHOLDS[user.level - 1] || 0)
    : 0;
  const currentLevelXp = user ? user.xp_total - (LEVEL_THRESHOLDS[user.level - 1] || 0) : 0;

  return (
    <GamificationContext.Provider
      value={{
        user,
        quests,
        achievements,
        milestones,
        isLoading,
        claimQuestReward,
        refreshGamification,
        xpToNextLevel,
        currentLevelXp,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

// Utility function to calculate level from XP
export function calculateLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Utility function to get level name
export function getLevelName(level: number): string {
  const names = [
    'Beginner',      // 1
    'Novice',        // 2
    'Apprentice',    // 3
    'Journeyman',    // 4
    'Adept',         // 5
    'Expert',        // 6
    'Master',        // 7
    'Grandmaster',   // 8
    'Legend',        // 9
    'Guitar God',    // 10
  ];
  return names[level - 1] || 'Unknown';
}

// Utility function to get XP progress percentage within current level
export function getXPProgress(xp: number, level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 100;
  const currentLevelStart = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelStart = LEVEL_THRESHOLDS[level];
  const progress = ((xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}