import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Users Endpoints', () => {
  describe('GET /api/auth/me', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });
});