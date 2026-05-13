import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  getXPForNextLevel,
  getXPProgress,
  getLevelName,
  calculateLessonXP,
  calculateSongXP,
} from './xpCalculator.js';

describe('xpCalculator', () => {
  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for XP below first threshold', () => {
      expect(calculateLevel(50)).toBe(1);
    });

    it('should return level 2 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('should return level 5 for 1000 XP', () => {
      expect(calculateLevel(1000)).toBe(5);
    });

    it('should return level 10 for 20000+ XP (max level)', () => {
      expect(calculateLevel(20000)).toBe(10);
      expect(calculateLevel(50000)).toBe(10);
    });

    it('should return correct level at each threshold', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(250)).toBe(3);
      expect(calculateLevel(500)).toBe(4);
      expect(calculateLevel(1000)).toBe(5);
      expect(calculateLevel(2000)).toBe(6);
      expect(calculateLevel(4000)).toBe(7);
      expect(calculateLevel(7500)).toBe(8);
      expect(calculateLevel(12000)).toBe(9);
      expect(calculateLevel(20000)).toBe(10);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return 100 for level 1', () => {
      expect(getXPForNextLevel(1)).toBe(100);
    });

    it('should return 250 for level 2', () => {
      expect(getXPForNextLevel(2)).toBe(250);
    });

    it('should return 500 for level 3', () => {
      expect(getXPForNextLevel(3)).toBe(500);
    });

    it('should return 1000 for level 4', () => {
      expect(getXPForNextLevel(4)).toBe(1000);
    });

    it('should return 20000 for level 9', () => {
      expect(getXPForNextLevel(9)).toBe(20000);
    });

    it('should return double max threshold for level 10+', () => {
      expect(getXPForNextLevel(10)).toBe(40000);
      expect(getXPForNextLevel(11)).toBe(40000);
    });
  });

  describe('getXPProgress', () => {
    it('should return correct progress for level 1', () => {
      const result = getXPProgress(50);
      expect(result.currentLevel).toBe(1);
      expect(result.xpInCurrentLevel).toBe(50);
      expect(result.xpForNextLevel).toBe(100);
      expect(result.progressPercent).toBe(50);
    });

    it('should return 0% at exact threshold (start of next level)', () => {
      const result = getXPProgress(100);
      expect(result.currentLevel).toBe(2);
      expect(result.progressPercent).toBe(0); // At level 2 start, 0% progress toward level 3
    });

    it('should return correct progress mid-level', () => {
      const result = getXPProgress(175);
      expect(result.currentLevel).toBe(2);
      expect(result.xpInCurrentLevel).toBe(75);
      expect(result.xpForNextLevel).toBe(150);
      expect(result.progressPercent).toBe(50);
    });

    it('should handle max level correctly', () => {
      const result = getXPProgress(25000);
      expect(result.currentLevel).toBe(10);
    });
  });

  describe('getLevelName', () => {
    it('should return Beginner for level 1', () => {
      expect(getLevelName(1)).toBe('Beginner');
    });

    it('should return Novice for level 2', () => {
      expect(getLevelName(2)).toBe('Novice');
    });

    it('should return Expert for level 6', () => {
      expect(getLevelName(6)).toBe('Expert');
    });

    it('should return Master for level 7', () => {
      expect(getLevelName(7)).toBe('Master');
    });

    it('should return Guitar Hero for level 10', () => {
      expect(getLevelName(10)).toBe('Guitar Hero');
    });

    it('should cap at Guitar Hero for level > 10', () => {
      expect(getLevelName(15)).toBe('Guitar Hero');
    });
  });

  describe('calculateLessonXP', () => {
    it('should return 1.5x multiplier for 100% accuracy', () => {
      expect(calculateLessonXP(100, 10)).toBe(15);
      expect(calculateLessonXP(100, 20)).toBe(30);
    });

    it('should return 1x multiplier for 80-99% accuracy', () => {
      expect(calculateLessonXP(80, 10)).toBe(10);
      expect(calculateLessonXP(95, 10)).toBe(10);
      expect(calculateLessonXP(99, 10)).toBe(10);
    });

    it('should return 0.8x multiplier for below 80%', () => {
      expect(calculateLessonXP(79, 10)).toBe(8);
      expect(calculateLessonXP(50, 10)).toBe(8);
      expect(calculateLessonXP(0, 10)).toBe(8);
    });

    it('should round to nearest integer', () => {
      expect(calculateLessonXP(100, 15)).toBe(23); // 15 * 1.5 = 22.5 -> 23
      expect(calculateLessonXP(80, 17)).toBe(17);
    });
  });

  describe('calculateSongXP', () => {
    it('should return 1.5x multiplier for score 90+', () => {
      expect(calculateSongXP(90, 50)).toBe(75);
      expect(calculateSongXP(100, 50)).toBe(75);
    });

    it('should return 1x multiplier for score 70-89', () => {
      expect(calculateSongXP(70, 50)).toBe(50);
      expect(calculateSongXP(80, 50)).toBe(50);
      expect(calculateSongXP(89, 50)).toBe(50);
    });

    it('should return 0.8x multiplier for score below 70', () => {
      expect(calculateSongXP(69, 50)).toBe(40);
      expect(calculateSongXP(50, 50)).toBe(40);
      expect(calculateSongXP(0, 50)).toBe(40);
    });

    it('should round to nearest integer', () => {
      expect(calculateSongXP(95, 33)).toBe(50); // 33 * 1.5 = 49.5 -> 50
      expect(calculateSongXP(75, 17)).toBe(17);
    });
  });
});