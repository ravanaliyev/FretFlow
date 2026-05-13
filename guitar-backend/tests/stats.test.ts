import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Stats API Endpoints', () => {
  describe('GET /api/stats/practice', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/stats/practice');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stats/accuracy', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/stats/accuracy');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stats/activity', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/stats/activity');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stats/summary', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/stats/summary');
      expect(res.status).toBe(401);
    });
  });
});