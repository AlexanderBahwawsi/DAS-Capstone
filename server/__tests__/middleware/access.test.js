jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../../config/db');
const { canAccessSubmission } = require('../../middleware/access');

describe('middleware/access - canAccessSubmission()', () => {
  beforeEach(() => {
    pool.query.mockReset();
  });

  test('returns false when user is missing', async () => {
    expect(await canAccessSubmission(null, { id: 1, user_id: 2 })).toBe(false);
  });

  test('returns false when submission is missing', async () => {
    expect(await canAccessSubmission({ id: 1, role: 'admin' }, null)).toBe(false);
  });

  test('admins always have access', async () => {
    const result = await canAccessSubmission(
      { id: 99, role: 'admin' },
      { id: 1, user_id: 2 }
    );
    expect(result).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('editors always have access', async () => {
    const result = await canAccessSubmission(
      { id: 99, role: 'editor' },
      { id: 1, user_id: 2 }
    );
    expect(result).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('the submission author has access', async () => {
    const result = await canAccessSubmission(
      { id: 5, role: 'submitter' },
      { id: 1, user_id: 5 }
    );
    expect(result).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('an assigned reviewer has access', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const result = await canAccessSubmission(
      { id: 7, role: 'reviewer' },
      { id: 1, user_id: 5 }
    );
    expect(result).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('a reviewer not assigned is denied', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await canAccessSubmission(
      { id: 7, role: 'reviewer' },
      { id: 1, user_id: 5 }
    );
    expect(result).toBe(false);
  });

  test('an unrelated submitter is denied', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await canAccessSubmission(
      { id: 8, role: 'submitter' },
      { id: 1, user_id: 5 }
    );
    expect(result).toBe(false);
  });
});
