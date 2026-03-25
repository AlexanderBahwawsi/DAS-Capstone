const { pool } = require('../config/db');

// Generate ID
const nextSubmissionId = async () => {

  const result = await pool.query(`SELECT COUNT(*) FROM submissions`);

  const count = parseInt(result.rows[0].count) + 1;

  const id = `KCR-${String(count).padStart(4, '0')}`;

  return id;

};


//  Create new submission
const createSubmission = async (userId, title, genre) => {

  const submissionId = await nextSubmissionId();

  const result = await pool.query(
    `INSERT INTO submissions
     (submission_id, user_id, title, genre)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [submissionId, userId, title, genre]
  );

  return result.rows[0];

};


const findBySubmissionId = async (submissionId) => {

  const result = await pool.query(
    `SELECT s.*, u.first_name, u.last_name, u.email
     FROM submissions s
     JOIN users u ON s.user_id = u.id
     WHERE s.submission_id = $1`,
    [submissionId]
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


// filters 
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


// Update status 
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


// Add file 
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
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [submissionId, filename, originalName, mimetype, size]
  );

  return result.rows[0];

};


// Get file for submission
const getSubmissionFiles = async (submissionId) => {

  const result = await pool.query(
    `SELECT *
     FROM submission_files
     WHERE submission_id = $1`,
    [submissionId]
  );

  return result.rows;

};


// assign reviewer
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


// average rating
const getAverageRating = async (submissionId) => {

  const result = await pool.query(
    `SELECT AVG(rating) as average_rating,
            COUNT(rating) as review_count
     FROM reviews
     WHERE submission_id = $1`,
    [submissionId]
  );

  return result.rows[0];

};


module.exports = {

  nextSubmissionId,
  createSubmission,
  findBySubmissionId,
  findByUserId,
  findAll,
  updateStatus,
  addSubmissionFile,
  getSubmissionFiles,
  getAssignedReviewers,
  getAverageRating

};