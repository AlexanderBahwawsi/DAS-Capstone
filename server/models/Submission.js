const { pool } = require('../config/db');

const submissionModel = {

   async nextSubmissionID() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM submissions`
    );

    const count = parseInt(rows[0].count) + 1;

    const formattedId = `KCR-${String(count).padStart(4, '0')}`;

    return formattedId;
  },
  
  async create({ submission_id, user_id, title, genre, word_count = null, bio, notes = null }) {
    const { rows } = await pool.query(
      `INSERT INTO submissions (user_id, title, genre, word_count, bio, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [submission_id, user_id, title, genre, word_count, bio, notes]
    );
    return rows[0];
  },

  async findBySubmissionId(id) {
    const { rows } = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByUserId(user_id) {
    const { rows } = await pool.query(
      `SELECT * FROM submissions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findAll({ status, genre } = {}) {
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

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE submissions
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  async addFile(submission_id, filename, original_name, mimetype, size) {
    const { rows } = await pool.query(
      `INSERT INTO submission_files
       (submission_id, filename, original_name, mimetype, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [submission_id, filename, original_name, mimetype, size]
    );
    return rows[0];
  },

  async getFiles(submission_id) {
    const { rows } = await pool.query(
      `SELECT * FROM submission_files
       WHERE submission_id = $1`,
      [submission_id]
    );
    return rows;
  },

  async getAssignedReviewers(submission_id) {
    const { rows } = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email
       FROM assignments a
       JOIN users u ON a.reviewer_id = u.id
       WHERE a.submission_id = $1`,
      [submission_id]
    );
    return rows;
  },

  async getAverageRating(submission_id) {
    const { rows } = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
       FROM reviews
       WHERE submission_id = $1`,
      [submission_id]
    );
    return rows[0];
  }

};

module.exports = submissionModel;