jest.mock('../../config/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));
jest.mock('../../models/Submission');
jest.mock('../../middleware/access');

const request = require('supertest');
const Submission = require('../../models/Submission');
const { canAccessSubmission } = require('../../middleware/access');
const app = require('../../app');
const { generateToken } = require('../../middleware/auth');

const adminToken     = generateToken({ id: 1, email: 'admin@x.com',  role: 'admin' });
const editorToken    = generateToken({ id: 2, email: 'editor@x.com', role: 'editor' });
const submitterToken = generateToken({ id: 3, email: 'sub@x.com',    role: 'submitter' });

describe('routes/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/submissions', () => {
    test('401 without token', async () => {
      const res = await request(app).get('/api/submissions');
      expect(res.status).toBe(401);
    });

    test('403 for submitter', async () => {
      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(403);
    });

    test('200 for editor with optional filters', async () => {
      Submission.findAll.mockResolvedValue([{ id: 1, title: 'A' }]);
      const res = await request(app)
        .get('/api/submissions?status=pending&genre=fiction')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(Submission.findAll).toHaveBeenCalledWith({
        status: 'pending', genre: 'fiction',
      });
    });
  });

  describe('GET /api/submissions/mine', () => {
    test('returns the submitter\'s own submissions', async () => {
      Submission.findByUserId.mockResolvedValue([{ id: 7 }]);
      const res = await request(app)
        .get('/api/submissions/mine')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(200);
      expect(Submission.findByUserId).toHaveBeenCalledWith(3);
    });
  });

  describe('GET /api/submissions/:id', () => {
    test('404 when missing', async () => {
      Submission.findBySubmissionId.mockResolvedValue(undefined);
      const res = await request(app)
        .get('/api/submissions/KCR-9999')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(404);
    });

    test('403 when not authorized', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 999 });
      canAccessSubmission.mockResolvedValue(false);
      const res = await request(app)
        .get('/api/submissions/KCR-0001')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(403);
    });

    test('200 when access is allowed', async () => {
      const sub = { id: 1, user_id: 3, title: 'mine' };
      Submission.findBySubmissionId.mockResolvedValue(sub);
      canAccessSubmission.mockResolvedValue(true);
      const res = await request(app)
        .get('/api/submissions/KCR-0001')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(sub);
    });
  });

  describe('PUT /api/submissions/:id/status', () => {
    test('403 for submitter', async () => {
      const res = await request(app)
        .put('/api/submissions/KCR-0001/status')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });

    test('400 for invalid status', async () => {
      const res = await request(app)
        .put('/api/submissions/KCR-0001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'banana' });
      expect(res.status).toBe(400);
    });

    test('200 when admin updates status', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 9 });
      Submission.updateStatus.mockResolvedValue({ id: 9, status: 'accepted' });
      const res = await request(app)
        .put('/api/submissions/KCR-0001/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 9, status: 'accepted' });
    });
  });
});
