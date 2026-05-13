import { describe, it, expect } from 'vitest';

describe('auth.service', () => {
  // Auth service functions are tightly coupled with database
  // and require a running server with initialized database.
  // Integration tests in tests/api.test.ts cover the full auth flow.
  // These unit tests verify the module structure.

  describe('module exports', () => {
    it('should export register function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.register).toBe('function');
    });

    it('should export login function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.login).toBe('function');
    });

    it('should export refreshTokens function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.refreshTokens).toBe('function');
    });

    it('should export getUserById function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.getUserById).toBe('function');
    });

    it('should export updateUser function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.updateUser).toBe('function');
    });

    it('should export addXP function', async () => {
      const authService = await import('../services/auth.service.js');
      expect(typeof authService.addXP).toBe('function');
    });
  });
});