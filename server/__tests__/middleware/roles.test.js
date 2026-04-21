const { authorize } = require('../../middleware/roles');
const { mockRes } = require('../helpers/mockRes');

describe('middleware/roles - authorize()', () => {
  test('returns 401 when req.user is missing', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when role is not in the allowed list', () => {
    const req = { user: { id: 1, role: 'submitter' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin', 'editor')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when role matches', () => {
    const req = { user: { id: 1, role: 'editor' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin', 'editor')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('calls next() when role matches the only allowed role', () => {
    const req = { user: { id: 99, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 403 when allowed list is empty', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
