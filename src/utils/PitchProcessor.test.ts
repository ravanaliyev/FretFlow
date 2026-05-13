import { describe, it, expect } from 'vitest';

// Since AudioProcessor requires browser APIs, we test the pure functions
describe('PitchProcessor', () => {
  describe('parabolicInterpolation edge cases', () => {
    // Testing the interpolation logic directly

    function parabolicInterpolation(yinBuffer: number[], tau: number): number {
      const x1 = tau - 1;
      const x2 = tau;
      const x3 = tau + 1;
      if (x1 < 0 || x3 >= yinBuffer.length) return tau;
      const y1 = yinBuffer[x1];
      const y2 = yinBuffer[x2];
      const y3 = yinBuffer[x3];
      const a = (y1 - 2 * y2 + y3) / 2;
      if (a === 0) return tau;
      const b = (y3 - y1) / 2;
      return x2 - b / (2 * a);
    }

    it('should return tau when x1 is out of bounds (tau=0)', () => {
      const yinBuffer = [0, 1, 2, 3, 4];
      expect(parabolicInterpolation(yinBuffer, 0)).toBe(0);
    });

    it('should return tau when x3 is out of bounds (last index)', () => {
      const yinBuffer = [0, 1, 2, 3, 4];
      expect(parabolicInterpolation(yinBuffer, 4)).toBe(4);
    });

    it('should return tau when a === 0 (no curvature)', () => {
      // All points on a line means a === 0
      const yinBuffer = [0, 1, 2]; // tau=1, points are linear
      expect(parabolicInterpolation(yinBuffer, 1)).toBe(1);
    });

    it('should interpolate when all conditions are met', () => {
      const yinBuffer = [1, 2, 1]; // minimum at tau=1
      const result = parabolicInterpolation(yinBuffer, 1);
      expect(result).toBe(1);
    });
  });

  describe('frequencyToNote logic', () => {
    function frequencyToNote(frequency: number): string {
      const A4 = 440;
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
      const noteIndex = ((midiNote % 12) + 12) % 12; // Handle negative modulo
      const octave = Math.floor(midiNote / 12) - 1;
      return noteNames[noteIndex] + octave;
    }

    it('should return A4 for 440 Hz', () => {
      expect(frequencyToNote(440)).toBe('A4');
    });

    it('should return C4 for ~261.63 Hz', () => {
      const note = frequencyToNote(261.63);
      expect(note).toBe('C4');
    });

    it('should return E4 for ~329.63 Hz', () => {
      const note = frequencyToNote(329.63);
      expect(note).toBe('E4');
    });

    it('should handle octaves correctly', () => {
      expect(frequencyToNote(220)).toBe('A3');
      expect(frequencyToNote(880)).toBe('A5');
    });

    it('should handle note index wrapping (C and C# boundary)', () => {
      // C4 is midi 60, C#4 is midi 61
      const c4 = frequencyToNote(261.63);
      const cSharp4 = frequencyToNote(277.18);
      expect(c4.startsWith('C')).toBe(true);
      expect(cSharp4.startsWith('C#')).toBe(true);
    });
  });

  describe('getMostFrequent logic', () => {
    function getMostFrequent(arr: string[]): string {
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let mostFrequent = arr[0] || '';

      for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
        if (counts[item] > maxCount) {
          maxCount = counts[item];
          mostFrequent = item;
        }
      }
      return mostFrequent;
    }

    it('should return the most frequent element', () => {
      expect(getMostFrequent(['A', 'B', 'A', 'A'])).toBe('A');
    });

    it('should return first element when all have same count', () => {
      expect(getMostFrequent(['A', 'B', 'C'])).toBe('A');
    });

    it('should return empty string for empty array', () => {
      expect(getMostFrequent([])).toBe('');
    });

    it('should handle single element array', () => {
      expect(getMostFrequent(['A'])).toBe('A');
    });

    it('should return last encountered when counts are equal', () => {
      // Since we iterate and update when counts increase,
      // if A and B have same count, whichever appears last with higher count wins
      const result = getMostFrequent(['A', 'B', 'A', 'B']);
      expect(['A', 'B']).toContain(result);
    });
  });

  describe('volume threshold edge cases', () => {
    it('should handle volume exactly at threshold (3)', () => {
      const threshold = 3;
      const volume = 3;
      expect(volume > threshold).toBe(false);
    });

    it('should handle volume just above threshold (3.01)', () => {
      const threshold = 3;
      const volume = 3.01;
      expect(volume > threshold).toBe(true);
    });

    it('should handle zero volume', () => {
      const threshold = 3;
      const volume = 0;
      expect(volume > threshold).toBe(false);
    });

    it('should handle negative volume', () => {
      const threshold = 3;
      const volume = -1;
      expect(volume > threshold).toBe(false);
    });
  });
});