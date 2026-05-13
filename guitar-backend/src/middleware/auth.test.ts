import { describe, it, expect } from 'vitest';

describe('auth middleware', () => {
  describe('module exports', () => {
    it('should export authenticate function', async () => {
      const auth = await import('./auth.js');
      expect(typeof auth.authenticate).toBe('function');
    });

    it('should export optionalAuth function', async () => {
      const auth = await import('./auth.js');
      expect(typeof auth.optionalAuth).toBe('function');
    });
  });
});