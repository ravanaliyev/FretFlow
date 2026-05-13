import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from './jwt.js';

describe('jwt utils', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(1, 'test@example.com');
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(1);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate different tokens for same user', () => {
      const token1 = generateRefreshToken(1);
      const token2 = generateRefreshToken(1);
      expect(token1).not.toBe(token2); // Different jti
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(42, 'user@test.com');
      const payload = verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(42);
      expect(payload?.email).toBe('user@test.com');
      expect(payload?.type).toBe('access');
    });

    it('should reject a refresh token as access token', () => {
      const refreshToken = generateRefreshToken(1);
      const payload = verifyAccessToken(refreshToken);
      expect(payload).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(verifyAccessToken('invalid.token.here')).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateAccessToken(1, 'test@test.com');
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      expect(verifyAccessToken(tamperedToken)).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(99);
      const payload = verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(99);
      expect(payload?.type).toBe('refresh');
      expect(payload?.jti).toBeDefined();
    });

    it('should reject an access token as refresh token', () => {
      const accessToken = generateAccessToken(1, 'test@test.com');
      const payload = verifyRefreshToken(accessToken);
      expect(payload).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(verifyRefreshToken('not.a.valid.token')).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateAccessToken(5, 'decode@test.com');
      const payload = decodeToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(5);
      expect(payload?.email).toBe('decode@test.com');
    });

    it('should return null for malformed token', () => {
      expect(decodeToken('not-valid-base64!@#$')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(decodeToken('')).toBeNull();
    });
  });
});