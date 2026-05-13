import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Lessons API Endpoints', () => {
  describe('GET /api/lessons', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/lessons');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/lessons/1');
      expect(res.status).toBe(401);
    });
  });
});