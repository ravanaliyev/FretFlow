import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Input Validation', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Get a valid token for authenticated endpoints
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `validation.test.${Date.now()}@test.com`,
        password: 'testpassword123',
        username: `validationuser${Date.now()}`
      });
    accessToken = registerRes.body.accessToken;
  });

  describe('POST /api/auth/register validation', () => {
    it('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for password less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for username less than 2 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', username: 'a' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for username more than 30 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', username: 'a'.repeat(31) });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login validation', () => {
    it('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/scores validation', () => {
    it('returns 400 for score greater than 100', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 1, score: 150 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for negative score', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 1, score: -10 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid song_id (string)', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 'not-a-number', score: 50 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing song_id', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ score: 50 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing score', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for accuracy greater than 100', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 1, score: 50, accuracy_percent: 150 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for negative accuracy', async () => {
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ song_id: 1, score: 50, accuracy_percent: -10 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});