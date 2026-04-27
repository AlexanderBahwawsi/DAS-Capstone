jest.mock('../../config/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));
jest.mock('../../models/User');
jest.mock('bcryptjs');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const app = require('../../app');
const { generateToken } = require('../../middleware/auth');

describe('routes/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('400 when fields missing', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
    });

    test('201 + token on successful registration', async () => {
      User.findByEmail.mockResolvedValue(undefined);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-pw');
      User.create.mockResolvedValue({
        id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com', role: 'submitter',
      });

      const res = await request(app).post('/api/auth/register').send({
        first_name: 'A',
        last_name: 'B',
        email: 'a@b.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user.role).toBe('submitter');
    });

    test('400 on duplicate email', async () => {
      User.findByEmail.mockResolvedValue({ id: 1 });
      const res = await request(app).post('/api/auth/register').send({
        first_name: 'A',
        last_name: 'B',
        email: 'a@b.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns token + user on valid credentials', async () => {
      User.findByEmail.mockResolvedValue({
        id: 1, email: 'a@b.com', password_hash: 'hash',
        first_name: 'A', last_name: 'B', role: 'admin',
      });
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app).post('/api/auth/login').send({
        email: 'a@b.com', password: 'pw',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user.email).toBe('a@b.com');
    });

    test('401 when password is wrong', async () => {
      User.findByEmail.mockResolvedValue({
        id: 1, email: 'a@b.com', password_hash: 'hash', role: 'admin',
      });
      bcrypt.compare.mockResolvedValue(false);
      const res = await request(app).post('/api/auth/login').send({
        email: 'a@b.com', password: 'pw',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    test('401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('200 with token', async () => {
      User.findById.mockResolvedValue({
        id: 11, first_name: 'A', last_name: 'B', email: 'a@b.com',
        role: 'reviewer', bio: '', created_at: '2024-01-01',
      });
      const token = generateToken({ id: 11, email: 'a@b.com', role: 'reviewer' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(11);
    });
  });
});
