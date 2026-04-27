// Global Jest setup.
//
// `server/config/db.js` runs `pool.query('SELECT NOW()')` and `process.exit(1)`
// at module load time. We replace the `pg` module with a fake so that loading
// the app inside tests never opens a real database connection.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test';

jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});
