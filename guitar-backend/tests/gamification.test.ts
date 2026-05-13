import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Gamification API Endpoints', () => {
  describe('GET /api/gamification/profile', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/gamification/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/quests', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/gamification/quests');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/achievements', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/gamification/achievements');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gamification/milestones', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/gamification/milestones');
      expect(res.status).toBe(401);
    });
  });
});