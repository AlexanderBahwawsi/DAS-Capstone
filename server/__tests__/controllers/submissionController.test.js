jest.mock('../../models/Submission');
jest.mock('../../middleware/access');

const Submission = require('../../models/Submission');
const { canAccessSubmission } = require('../../middleware/access');
const submissionController = require('../../controllers/submissionController');
const { mockRes } = require('../helpers/mockRes');

describe('controllers/submissionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const validBody = {
      title: 'A Tale',
      genre: 'fiction',
      word_count: 1200,
      bio: 'I am an author',
      notes: 'enjoy',
    };

    test('400 when title is missing', async () => {
      const req = { user: { id: 1 }, body: { genre: 'g', bio: 'b' } };
      const res = mockRes();
      await submissionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when genre is missing', async () => {
      const req = { user: { id: 1 }, body: { title: 't', bio: 'b' } };
      const res = mockRes();
      await submissionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when bio is missing', async () => {
      const req = { user: { id: 1 }, body: { title: 't', genre: 'g' } };
      const res = mockRes();
      await submissionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('creates a submission and returns 201', async () => {
      Submission.nextSubmissionID.mockResolvedValue('KCR-0001');
      Submission.create.mockResolvedValue({ id: 50, submission_id: 'KCR-0001' });

      const req = { user: { id: 1 }, body: validBody, files: [] };
      const res = mockRes();
      await submissionController.create(req, res);

      expect(Submission.create).toHaveBeenCalledWith(expect.objectContaining({
        submission_id: 'KCR-0001',
        user_id: 1,
        title: 'A Tale',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('persists each uploaded file', async () => {
      Submission.nextSubmissionID.mockResolvedValue('KCR-0002');
      Submission.create.mockResolvedValue({ id: 51, submission_id: 'KCR-0002' });
      Submission.addFile.mockResolvedValue({});

      const req = {
        user: { id: 1 },
        body: validBody,
        files: [
          { filename: 'a.pdf', originalname: 'a.pdf', mimetype: 'application/pdf', size: 100 },
          { filename: 'b.docx', originalname: 'b.docx', mimetype: 'application/msword', size: 200 },
        ],
      };
      const res = mockRes();
      await submissionController.create(req, res);

      expect(Submission.addFile).toHaveBeenCalledTimes(2);
      expect(Submission.addFile).toHaveBeenNthCalledWith(1, 51, 'a.pdf', 'a.pdf', 'application/pdf', 100);
    });
  });

  describe('getOne()', () => {
    test('404 when submission missing', async () => {
      Submission.findBySubmissionId.mockResolvedValue(undefined);
      const req = { user: { id: 1 }, params: { id: 'KCR-0001' } };
      const res = mockRes();
      await submissionController.getOne(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('403 when user cannot access', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 1, user_id: 2 });
      canAccessSubmission.mockResolvedValue(false);
      const req = { user: { id: 5, role: 'submitter' }, params: { id: 'KCR-0001' } };
      const res = mockRes();
      await submissionController.getOne(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('returns the submission when allowed', async () => {
      const sub = { id: 1, user_id: 5, title: 'x' };
      Submission.findBySubmissionId.mockResolvedValue(sub);
      canAccessSubmission.mockResolvedValue(true);
      const req = { user: { id: 5 }, params: { id: 'KCR-0001' } };
      const res = mockRes();
      await submissionController.getOne(req, res);
      expect(res.json).toHaveBeenCalledWith(sub);
    });
  });

  describe('updateStatus()', () => {
    test('400 on invalid status', async () => {
      const req = { params: { id: 'KCR-0001' }, body: { status: 'banana' } };
      const res = mockRes();
      await submissionController.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when submission missing', async () => {
      Submission.findBySubmissionId.mockResolvedValue(undefined);
      const req = { params: { id: 'KCR-0001' }, body: { status: 'accepted' } };
      const res = mockRes();
      await submissionController.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('updates and returns new submission', async () => {
      Submission.findBySubmissionId.mockResolvedValue({ id: 9 });
      Submission.updateStatus.mockResolvedValue({ id: 9, status: 'accepted' });
      const req = { params: { id: 'KCR-0001' }, body: { status: 'accepted' } };
      const res = mockRes();
      await submissionController.updateStatus(req, res);
      expect(Submission.updateStatus).toHaveBeenCalledWith(9, 'accepted');
      expect(res.json).toHaveBeenCalledWith({ id: 9, status: 'accepted' });
    });
  });
});
