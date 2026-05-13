import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Songs Endpoints - Extended', () => {
  describe('GET /api/songs/:id', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/songs/1');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent song', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: `songs_get_${Date.now()}@test.com`,
          password: 'testpassword123',
          username: `songs_get_${Date.now()}`,
        });

      if (registerRes.status === 201) {
        const token = registerRes.body.accessToken;
        const res = await request(app)
          .get('/api/songs/999999')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
      }
    });
  });

  describe('POST /api/songs', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/songs')
        .send({ title: 'Test', artist: 'Tester' });
      expect(res.status).toBe(401);
    });

    it('should create song with valid data', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: `songs_create_${Date.now()}@test.com`,
          password: 'testpassword123',
          username: `songs_create_${Date.now()}`,
        });

      if (registerRes.status === 201) {
        const token = registerRes.body.accessToken;
        const res = await request(app)
          .post('/api/songs')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'New Song', artist: 'New Artist' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('id');
      }
    });
  });
});