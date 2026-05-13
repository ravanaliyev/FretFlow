import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Scores API Endpoints', () => {
  describe('GET /api/scores', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/scores');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/scores/me', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/scores/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/scores/leaderboard', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/scores/leaderboard');
      expect(res.status).toBe(401);
    });
  });
});