const { pool } = require('../config/db');

const createSubmission = async ({
  userId,
  title,
  genre,
  word_count = null,
  bio,
  notes = null
}) => {
  const result = await pool.query(
    `INSERT INTO submissions
     (user_id, title, genre, word_count, bio, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [userId, title, genre, word_count, bio, notes]
  );

  return result.rows[0];
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT s.*, u.first_name, u.last_name, u.email
     FROM submissions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`,
    [id]
  );

  return result.rows[0];
};

const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT *
     FROM submissions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

const findAll = async ({ status, genre } = {}) => {
  let query = `SELECT * FROM submissions`;
  const values = [];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (genre) {
    values.push(genre);
    conditions.push(`genre = $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, values);

  return result.rows;
};

const updateStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE submissions
     SET status = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};

const addSubmissionFile = async (
  submissionId,
  filename,
  originalName,
  mimetype,
  size
) => {
  const result = await pool.query(
    `INSERT INTO submission_files
     (submission_id, filename, original_name, mimetype, size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [submissionId, filename, originalName, mimetype, size]
  );

  return result.rows[0];
};

const getSubmissionFiles = async (submissionId) => {
  const result = await pool.query(
    `SELECT *
     FROM submission_files
     WHERE submission_id = $1`,
    [submissionId]
  );

  return result.rows;
};

const getAssignedReviewers = async (submissionId) => {
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.last_name
     FROM assignments a
     JOIN users u ON a.reviewer_id = u.id
     WHERE a.submission_id = $1`,
    [submissionId]
  );

  return result.rows;
};

const getAverageRating = async (submissionId) => {
  const result = await pool.query(
    `SELECT AVG(rating) AS average_rating,
            COUNT(rating) AS review_count
     FROM reviews
     WHERE submission_id = $1`,
    [submissionId]
  );

  return result.rows[0];
};


module.exports = {
  createSubmission,
  findById,
  findByUserId,
  findAll,
  updateStatus,
  addSubmissionFile,
  getSubmissionFiles,
  getAssignedReviewers,
  getAverageRating
};