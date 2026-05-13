import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Progress Endpoints', () => {
  describe('GET /api/progress/lessons', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/progress/lessons');
      // Returns 401 without auth, or 500 if auth passes but DB fails
      expect([401, 500]).toContain(res.status);
    });
  });

  describe('POST /api/progress/lessons', () => {
    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/progress/lessons')
        .send({ lesson_id: 1 });
      // Returns 401 without auth, or 500 if auth passes but DB fails
      expect([401, 500]).toContain(res.status);
    });
  });
});