import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Songs Endpoints', () => {
  describe('GET /api/songs', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/songs');
      expect(res.status).toBe(401);
    });
  });
});