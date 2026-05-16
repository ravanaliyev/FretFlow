import db from '../config/database.js';
import { calculateLevel } from '../utils/xpCalculator.js';

export async function checkAndGrantAchievements(userId: number): Promise<void> {
  // Fetch all achievements
  const allAchievements = await db.execute('SELECT * FROM achievements');

  // Fetch already-earned achievements for this user
  const earnedResult = await db.execute({
    sql: 'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    args: [userId],
  });
  const earnedIds = new Set(earnedResult.rows.map((r: any) => r.achievement_id));

  // --- Gather Stats ---

  // Lesson stats
  const lessonsResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND is_completed = 1',
    args: [userId],
  });
  const lessonsCompleted = Number((lessonsResult.rows[0] as any).count);

  // Level 1 specifically
  const level1Result = await db.execute({
    sql: `SELECT COUNT(*) as count 
          FROM lesson_progress lp
          JOIN lessons l ON lp.lesson_id = l.id
          WHERE lp.user_id = ? AND lp.is_completed = 1 AND l.level = 1`,
    args: [userId],
  });
  const level1Completed = Number((level1Result.rows[0] as any).count);

  const level1TotalResult = await db.execute('SELECT COUNT(*) as count FROM lessons WHERE level = 1');
  const level1Total = Number((level1TotalResult.rows[0] as any).count);

  // Perfect pitch
  const perfectResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND best_accuracy >= 100',
    args: [userId],
  });
  const perfectCount = Number((perfectResult.rows[0] as any).count);

  // Streaks
  const streakResult = await db.execute({
    sql: 'SELECT current_streak FROM streaks WHERE user_id = ?',
    args: [userId],
  });
  const currentStreak = Number((streakResult.rows[0] as any)?.current_streak || 0);

  // Songs
  const songsResult = await db.execute({
    sql: 'SELECT COUNT(DISTINCT song_id) as count FROM song_scores WHERE user_id = ?',
    args: [userId],
  });
  const songsCompleted = Number((songsResult.rows[0] as any).count);

  // Duels
  const duelsPlayedResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM duels WHERE (host_user_id = ? OR guest_user_id = ?) AND status = "finished"',
    args: [userId, userId],
  });
  const duelsPlayed = Number((duelsPlayedResult.rows[0] as any).count);

  const duelsWonResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM duels WHERE winner_user_id = ?',
    args: [userId],
  });
  const duelsWon = Number((duelsWonResult.rows[0] as any).count);

  // Speed Challenge (best_score in users table)
  const userResult = await db.execute({
    sql: 'SELECT best_score, xp_total FROM users WHERE id = ?',
    args: [userId],
  });
  const userRow = userResult.rows[0] as any;
  const speedHighScore = Number(userRow?.best_score || 0);
  const currentXP = Number(userRow?.xp_total || 0);

  // Time based
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 4;
  const isMorning = hour >= 5 && hour < 9;

  // --- Condition map (keyed by achievement name) ---
  const conditions: Record<string, boolean> = {
    'First Note':        lessonsCompleted >= 1,
    'Perfect Pitch':     perfectCount >= 1,
    'Streak Starter':    currentStreak >= 3,
    'Week Warrior':      currentStreak >= 7,
    'Song Master':       songsCompleted >= 10,
    'Lesson Legend':     lessonsCompleted >= 25,
    'Level 1 Graduate':  level1Completed >= level1Total && level1Total > 0,
    'Duelist':           duelsPlayed >= 1,
    'Champion':          duelsWon >= 1,
    'Speed Demon':       speedHighScore >= 50,
    'Night Owl':         isNight,
    'Early Bird':        isMorning,
  };

  const now = new Date().toISOString();
  let totalBonusXP = 0;

  for (const row of allAchievements.rows) {
    const achievement = row as any;
    if (earnedIds.has(achievement.id)) continue;
    if (!conditions[achievement.name]) continue;

    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, ?)',
      args: [userId, achievement.id, now],
    });
    totalBonusXP += achievement.xp_reward || 0;
  }

  // Update user XP/Level if any bonus earned
  if (totalBonusXP > 0) {
    const newXP = currentXP + totalBonusXP;
    const newLevel = calculateLevel(newXP);
    await db.execute({
      sql: 'UPDATE users SET xp_total = ?, level = ? WHERE id = ?',
      args: [newXP, newLevel, userId],
    });
  }
}
