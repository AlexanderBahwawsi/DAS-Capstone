jest.mock('../../config/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));
jest.mock('../../models/Review');
jest.mock('../../models/Submission');
jest.mock('../../models/User');

const request = require('supertest');
const { pool } = require('../../config/db');
const Review = require('../../models/Review');
const Submission = require('../../models/Submission');
const User = require('../../models/User');
const app = require('../../app');
const { generateToken } = require('../../middleware/auth');

const adminToken    = generateToken({ id: 1, email: 'admin@x.com',    role: 'admin' });
const editorToken   = generateToken({ id: 2, email: 'editor@x.com',   role: 'editor' });
const reviewerToken = generateToken({ id: 3, email: 'reviewer@x.com', role: 'reviewer' });
const submitterToken = generateToken({ id: 4, email: 'sub@x.com',     role: 'submitter' });

describe('routes/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockReset().mockResolvedValue({ rows: [] });
  });

  describe('GET /api/reviews/queue', () => {
    test('401 without token', async () => {
      const res = await request(app).get('/api/reviews/queue');
      expect(res.status).toBe(401);
    });

    test('403 for submitter', async () => {
      const res = await request(app)
        .get('/api/reviews/queue')
        .set('Authorization', `Bearer ${submitterToken}`);
      expect(res.status).toBe(403);
    });

    test('200 for reviewer with queue rows', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 't', reviewed: false }],
      });
      const res = await request(app)
        .get('/api/reviews/queue')
        .set('Authorization', `Bearer ${reviewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, title: 't', reviewed: false }]);
    });

    test('200 for editor', async () => {
      const res = await request(app)
        .get('/api/reviews/queue')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/reviews/mine', () => {
    test('401 without token', async () => {
      const res = await request(app).get('/api/reviews/mine');
      expect(res.status).toBe(401);
    });

    test('200 returns reviewer\'s reviews', async () => {
      Review.findByReviewer.mockResolvedValue([{ id: 1, rating: 5 }]);
      const res = await request(app)
        .get('/api/reviews/mine')
        .set('Authorization', `Bearer ${reviewerToken}`);
      expect(res.status).toBe(200);
      expect(Review.findByReviewer).toHaveBeenCalledWith(3);
      expect(res.body).toEqual([{ id: 1, rating: 5 }]);
    });
  });

  describe('POST /api/reviews/:submissionId', () => {
    test('400 when rating invalid', async () => {
      const res = await request(app)
        .post('/api/reviews/KCR-0001')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 9 });
      expect(res.status).toBe(400);
    });

    test('403 when submitter tries to review', async () => {
      const res = await request(app)
        .post('/api/reviews/KCR-0001')
        .set('Authorization', `Bearer ${submitterToken}`)
        .send({ rating: 4, comment: 'x' });
      expect(res.status).toBe(403);
    });

    test('404 when submission missing', async () => {
      Submission.findBySubmissionId.mockResolvedValue(undefined);
      const res = await request(app)
        .post('/api/reviews/KCR-0001')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 4, comment: 'x' });
      expect(res.status).toBe(404);
    });

    test('201 when reviewer is assigned', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 10, user_id: 99 });
      pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      Review.create.mockResolvedValue({ id: 5, rating: 4, comment: 'x' });
      User.findById.mockResolvedValue({ first_name: 'R', last_name: 'V' });

      const res = await request(app)
        .post('/api/reviews/KCR-0001')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ rating: 4, comment: 'x' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(expect.objectContaining({
        id: 5, first_name: 'R', last_name: 'V',
      }));
    });

    test('admin can review without assignment', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 10, user_id: 99 });
      Review.create.mockResolvedValue({ id: 6, rating: 5, comment: '' });
      User.findById.mockResolvedValue({ first_name: 'Ada', last_name: 'Min' });

      const res = await request(app)
        .post('/api/reviews/KCR-0001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 5 });

      expect(res.status).toBe(201);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
