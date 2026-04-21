jest.mock('../../models/User');
jest.mock('bcryptjs');

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const authController = require('../../controllers/authController');
const { mockRes } = require('../helpers/mockRes');

describe('controllers/authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    test('400 when email is missing', async () => {
      const req = { body: { password: 'password123' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    test('400 when password is missing', async () => {
      const req = { body: { email: 'a@b.com' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('401 when user does not exist', async () => {
      User.findByEmail.mockResolvedValue(undefined);
      const req = { body: { email: 'nope@b.com', password: 'pw' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    test('401 when password does not match', async () => {
      User.findByEmail.mockResolvedValue({
        id: 1, email: 'a@b.com', password_hash: 'hash',
        first_name: 'A', last_name: 'B', role: 'submitter',
      });
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { email: 'a@b.com', password: 'wrong' } };
      const res = mockRes();
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('returns token and user payload on success', async () => {
      User.findByEmail.mockResolvedValue({
        id: 1, email: 'a@b.com', password_hash: 'hash',
        first_name: 'A', last_name: 'B', role: 'editor',
      });
      bcrypt.compare.mockResolvedValue(true);

      const req = { body: { email: 'a@b.com', password: 'pw' } };
      const res = mockRes();
      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(typeof payload.token).toBe('string');
      expect(payload.user).toEqual({
        id: 1, first_name: 'A', last_name: 'B', email: 'a@b.com', role: 'editor',
      });
      expect(payload.user.password_hash).toBeUndefined();
    });

    test('500 when the model throws', async () => {
      User.findByEmail.mockRejectedValue(new Error('boom'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const req = { body: { email: 'a@b.com', password: 'pw' } };
      const res = mockRes();
      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('register()', () => {
    const validBody = {
      first_name: 'A',
      last_name: 'B',
      email: 'a@b.com',
      password: 'password123',
      bio: 'hi',
    };

    test('400 when required fields are missing', async () => {
      const req = { body: { email: 'a@b.com' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when password is too short', async () => {
      const req = { body: { ...validBody, password: 'short' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password must be at least 8 characters',
      });
    });

    test('400 when email is malformed', async () => {
      const req = { body: { ...validBody, email: 'not-an-email' } };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email address' });
    });

    test('400 when email is already registered', async () => {
      User.findByEmail.mockResolvedValue({ id: 1 });
      const req = { body: validBody };
      const res = mockRes();
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    test('creates user with role=submitter and returns 201 + token', async () => {
      User.findByEmail.mockResolvedValue(undefined);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-pw');
      User.create.mockResolvedValue({
        id: 10, first_name: 'A', last_name: 'B', email: 'a@b.com', role: 'submitter',
      });

      const req = { body: validBody };
      const res = mockRes();
      await authController.register(req, res);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        first_name: 'A',
        last_name: 'B',
        email: 'a@b.com',
        password_hash: 'hashed-pw',
        role: 'submitter',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      const payload = res.json.mock.calls[0][0];
      expect(payload.token).toEqual(expect.any(String));
      expect(payload.user.role).toBe('submitter');
    });

    test('always forces role=submitter even when client sends another role', async () => {
      User.findByEmail.mockResolvedValue(undefined);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-pw');
      User.create.mockResolvedValue({
        id: 10, first_name: 'A', last_name: 'B', email: 'a@b.com', role: 'submitter',
      });

      const req = { body: { ...validBody, role: 'admin' } };
      const res = mockRes();
      await authController.register(req, res);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'submitter' }));
    });
  });

  describe('me()', () => {
    test('returns user payload for authenticated user', async () => {
      User.findById.mockResolvedValue({
        id: 4, first_name: 'A', last_name: 'B', email: 'a@b.com',
        role: 'reviewer', bio: 'hello', created_at: '2024-01-01',
      });
      const req = { user: { id: 4 } };
      const res = mockRes();
      await authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 4, email: 'a@b.com', role: 'reviewer',
      }));
    });

    test('404 when user is not found', async () => {
      User.findById.mockResolvedValue(undefined);
      const req = { user: { id: 99 } };
      const res = mockRes();
      await authController.me(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
