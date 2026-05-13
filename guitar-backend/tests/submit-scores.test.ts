import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Submit Scores Endpoint', () => {
  describe('POST /api/scores', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/scores')
        .send({ song_id: 1, score: 85 });
      expect(res.status).toBe(401);
    });
  });
});