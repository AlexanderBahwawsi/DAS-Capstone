jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('../../models/Review');
jest.mock('../../models/Submission');
jest.mock('../../models/User');

const { pool } = require('../../config/db');
const Review = require('../../models/Review');
const Submission = require('../../models/Submission');
const User = require('../../models/User');
const reviewController = require('../../controllers/reviewController');
const { mockRes } = require('../helpers/mockRes');

describe('controllers/reviewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockReset();
  });

  describe('create()', () => {
    const baseReq = (overrides = {}) => ({
      params: { submissionId: 'KCR-0001' },
      body: { rating: 4, comment: 'good work' },
      user: { id: 7, role: 'reviewer' },
      ...overrides,
    });

    test('400 when rating is missing', async () => {
      const req = baseReq({ body: { comment: 'no rating' } });
      const res = mockRes();
      await reviewController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when rating is out of range', async () => {
      const req = baseReq({ body: { rating: 6, comment: 'bad' } });
      const res = mockRes();
      await reviewController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when submission does not exist', async () => {
      Submission.findBySubmissionId.mockResolvedValue(undefined);
      const res = mockRes();
      await reviewController.create(baseReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('403 when reviewer is not assigned', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 2 });
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = mockRes();
      await reviewController.create(baseReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('reviewer success path returns enriched 201', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 2 });
      pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      Review.create.mockResolvedValue({ id: 99, rating: 4, comment: 'good work' });
      User.findById.mockResolvedValue({ first_name: 'R', last_name: 'V' });

      const res = mockRes();
      await reviewController.create(baseReq(), res);

      expect(Review.create).toHaveBeenCalledWith({
        submission_id: 1,
        reviewer_id: 7,
        rating: 4,
        comment: 'good work',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 99, first_name: 'R', last_name: 'V',
      }));
    });

    test('editor bypasses the assignment check', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 2 });
      Review.create.mockResolvedValue({ id: 1, rating: 5, comment: '' });
      User.findById.mockResolvedValue({ first_name: 'E', last_name: 'D' });

      const req = baseReq({ user: { id: 8, role: 'editor' } });
      const res = mockRes();
      await reviewController.create(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('returns 409 when duplicate review violates unique constraint', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 2 });
      pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      Review.create.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = mockRes();
      await reviewController.create(baseReq(), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('update()', () => {
    test('404 when review not found', async () => {
      Review.findById.mockResolvedValue(undefined);
      const req = { params: { id: 1 }, body: {}, user: { id: 1 } };
      const res = mockRes();
      await reviewController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('403 when editing another reviewer\'s review', async () => {
      Review.findById.mockResolvedValue({ id: 1, reviewer_id: 99 });
      const req = { params: { id: 1 }, body: { rating: 4 }, user: { id: 1 } };
      const res = mockRes();
      await reviewController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('400 when new rating out of range', async () => {
      Review.findById.mockResolvedValue({ id: 1, reviewer_id: 1 });
      const req = { params: { id: 1 }, body: { rating: 7 }, user: { id: 1 } };
      const res = mockRes();
      await reviewController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('updates the review on success', async () => {
      Review.findById.mockResolvedValue({ id: 1, reviewer_id: 1 });
      Review.update.mockResolvedValue({ id: 1, rating: 5, comment: 'great' });
      const req = { params: { id: 1 }, body: { rating: 5, comment: 'great' }, user: { id: 1 } };
      const res = mockRes();
      await reviewController.update(req, res);
      expect(Review.update).toHaveBeenCalledWith(1, { rating: 5, comment: 'great' });
      expect(res.json).toHaveBeenCalledWith({ id: 1, rating: 5, comment: 'great' });
    });
  });

  describe('getMyReviews()', () => {
    test('returns reviews for the logged-in user', async () => {
      Review.findByReviewer.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const req = { user: { id: 4 } };
      const res = mockRes();
      await reviewController.getMyReviews(req, res);
      expect(Review.findByReviewer).toHaveBeenCalledWith(4);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
  });
});
