const { pool } = require('../config/db');

const reviewModel = {
    // Create a new review
    async create({ submission_id, reviewer_id, rating, comment = '' }) {
        const { rows } = await pool.query(
            `INSERT INTO reviews (submission_id, reviewer_id, rating, comment)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [submission_id, reviewer_id, rating, comment]
        );
        return rows[0];
    },

    // Get all reviews for a specific submission (with reviewer name)
    async findBySubmission(submission_id) {
        const { rows } = await pool.query(
            `SELECT r.*, u.first_name, u.last_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.submission_id = $1
             ORDER BY r.created_at DESC`,
            [submission_id]
        );
        return rows;
    },

    // Get all reviews written by a specific reviewer (with submission title)
    async findByReviewer(reviewer_id) {
        const { rows } = await pool.query(
            `SELECT r.*, s.title, s.genre
             FROM reviews r
             JOIN submissions s ON r.submission_id = s.id
             WHERE r.reviewer_id = $1
             ORDER BY r.created_at DESC`,
            [reviewer_id]
        );
        return rows;
    },

    // Find a single review by its id (with reviewer name)
    async findById(id) {
        const { rows } = await pool.query(
            `SELECT r.*, u.first_name, u.last_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.id = $1`,
            [id]
        );
        return rows[0];
    },

    // Update a review's rating and/or comment
    async update(id, { rating, comment }) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (rating !== undefined) {
            fields.push(`rating = $${paramIndex++}`);
            values.push(rating);
        }
        if (comment !== undefined) {
            fields.push(`comment = $${paramIndex++}`);
            values.push(comment);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const { rows } = await pool.query(
            `UPDATE reviews SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return rows[0];
    },

    // Get average rating and review count for a submission (used by admin panel)
    async getAverageRating(submission_id) {
        const { rows } = await pool.query(
            `SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as review_count
             FROM reviews WHERE submission_id = $1`,
            [submission_id]
        );
        return rows[0];
    }
};

module.exports = reviewModel;