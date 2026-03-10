const { pool } = require('../config/db');
const User = require('../models/User');
const Submission = require('../models/Submission');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['admin', 'editor', 'reviewer', 'submitter'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${allowed.join(', ')}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await User.updateRole(user.id, role);
    res.json({ message: 'Role updated', user: { id: updated.id, email: updated.email, role: updated.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await User.deleteById(user.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.assignReviewer = async (req, res) => {
  try {
    const { submission_id, reviewer_id } = req.body;

    const submission = await Submission.findBySubmissionId(submission_id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const reviewer = await User.findById(reviewer_id);
    if (!reviewer || !['reviewer', 'editor'].includes(reviewer.role)) {
      return res.status(400).json({ error: 'Invalid reviewer' });
    }

    await pool.query(
      'INSERT INTO assignments (submission_id, reviewer_id) VALUES ($1, $2)',
      [submission.id, reviewer.id]
    );

    if (submission.status === 'pending') {
      await Submission.updateStatus(submission.id, 'in_review');
    }

    res.status(201).json({
      message: `${reviewer.first_name} ${reviewer.last_name} assigned to ${submission.submission_id}`
    });
  } catch (err) {
    if (err.constraint && err.constraint.includes('submission_id_reviewer_id')) {
      return res.status(409).json({ error: 'Reviewer already assigned to this submission' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM assignments WHERE submission_id = $1 AND reviewer_id = $2',
      [req.params.submissionId, req.params.reviewerId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.getReviewerWorkload = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             COUNT(a.id) AS assigned_count
      FROM users u
      LEFT JOIN assignments a ON a.reviewer_id = u.id
      WHERE u.role IN ('reviewer', 'editor')
      GROUP BY u.id
      ORDER BY assigned_count DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { submission_ids, status } = req.body;
    const allowed = ['pending', 'in_review', 'accepted', 'rejected'];

    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      return res.status(400).json({ error: 'submission_ids must be a non-empty array' });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const placeholders = submission_ids.map((_, i) => `$${i + 2}`).join(', ');
    await pool.query(
      `UPDATE submissions SET status = $1, updated_at = NOW() WHERE submission_id IN (${placeholders})`,
      [status, ...submission_ids]
    );

    res.json({ message: `${submission_ids.length} submission(s) updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.submission_id, s.title, s.genre, s.word_count, s.status, s.created_at,
             u.first_name || ' ' || u.last_name AS author_name, u.email AS author_email,
             (SELECT AVG(rating) FROM reviews WHERE submission_id = s.id) AS avg_rating,
             (SELECT COUNT(*)    FROM reviews WHERE submission_id = s.id) AS review_count
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `);

    res.json({ exported_at: new Date().toISOString(), count: rows.length, submissions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
