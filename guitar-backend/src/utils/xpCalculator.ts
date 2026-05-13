// XP Level Thresholds (cumulative)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  4000,   // Level 7
  7500,   // Level 8
  12000,  // Level 9
  20000,  // Level 10
];

// XP Rewards
export const XP_REWARDS = {
  lessonCompleted: 10,
  songCompleted: 50,
  questCompleted: 25,
  perfectAccuracy: 20,
  dailyStreakBonus: 15,
};

export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

export function getXPProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = getXPForNextLevel(currentLevel);

  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpInCurrentLevel / xpNeeded) * 100);

  return {
    currentLevel,
    xpInCurrentLevel,
    xpForNextLevel: xpNeeded,
    progressPercent,
  };
}

export function getLevelName(level: number): string {
  const names = [
    'Beginner',
    'Novice',
    'Apprentice',
    'Intermediate',
    'Advanced',
    'Expert',
    'Master',
    'Grand Master',
    'Legendary',
    'Guitar Hero',
  ];
  return names[Math.min(level - 1, names.length - 1)] || 'Beginner';
}

export function calculateLessonXP(accuracy: number, baseXP: number): number {
  // Perfect accuracy (100%) gives bonus XP
  const multiplier = accuracy === 100 ? 1.5 : accuracy >= 80 ? 1.0 : 0.8;
  return Math.round(baseXP * multiplier);
}

export function calculateSongXP(score: number, baseXP: number): number {
  // Score 90-100: 1.5x, 70-89: 1.0x, below 70: 0.8x
  const multiplier = score >= 90 ? 1.5 : score >= 70 ? 1.0 : 0.8;
  return Math.round(baseXP * multiplier);
}