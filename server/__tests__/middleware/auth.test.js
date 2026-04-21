const jwt = require('jsonwebtoken');
const { authenticate, generateToken, JWT_SECRET } = require('../../middleware/auth');
const { mockRes } = require('../helpers/mockRes');

describe('middleware/auth', () => {
  describe('generateToken()', () => {
    test('signs a JWT containing id, email, and role', () => {
      const token = generateToken({ id: 42, email: 'a@b.com', role: 'reviewer' });
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.id).toBe(42);
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.role).toBe('reviewer');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('authenticate()', () => {
    test('returns 401 when Authorization header is missing', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic abc' } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 for an invalid token', () => {
      const req = { headers: { authorization: 'Bearer not-a-real-token' } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('attaches req.user and calls next() for a valid token', () => {
      const token = generateToken({ id: 7, email: 'x@y.com', role: 'admin' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toMatchObject({ id: 7, email: 'x@y.com', role: 'admin' });
    });

    test('returns 401 for an expired token', () => {
      const expired = jwt.sign(
        { id: 1, email: 'a@b.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: -10 }
      );
      const req = { headers: { authorization: `Bearer ${expired}` } };
      const res = mockRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
