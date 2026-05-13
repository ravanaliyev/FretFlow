import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './hash.js';

describe('hash utils', () => {
  describe('hashPassword', () => {
    it('should generate a valid bcrypt hash', async () => {
      const hash = await hashPassword('testpassword');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword('samepassword');
      const hash2 = await hashPassword('samepassword');
      expect(hash1).not.toBe(hash2); // Different salt each time
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await verifyPassword('correctpassword', hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password when hash requires non-empty', async () => {
      const hash = await hashPassword('somepassword');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });
  });
});