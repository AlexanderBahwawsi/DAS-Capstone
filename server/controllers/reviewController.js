const reviewModel = require('../models/Review');
const { pool } = require('../config/db');

const reviewController = {
    // create a review
    async create(req, res) {
        try {
            const { submissionId } = req.params;
            const { rating, comment } = req.body;

            // Look up submission
            const { rows } = await pool.query(
                'SELECT id FROM submissions WHERE id = $1',
                [submissionId]
            );
            if (!rows[0]) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            // Validate rating 1-5
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }

            const review = await reviewModel.create({
                submission_id: submissionId,
                reviewer_id: req.user.id,
                rating,
                comment
            });

            res.status(201).json(review);
        } catch (err) {
            // Error (reviewer already reviewed this submission)
            if (err.code === '23505') {
                return res.status(409).json({ error: 'You have already reviewed this submission' });
            }
            console.error('Create review error:', err);
            res.status(500).json({ error: 'Failed to create review' });
        }
    },

    // return all reviews for a submission
    async getForSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const reviews = await reviewModel.findBySubmission(submissionId);
            res.json(reviews);
        } catch (err) {
            console.error('Get reviews error:', err);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    },

    // return all reviews by the logged-in reviewer
    async getMyReviews(req, res) {
        try {
            const reviews = await reviewModel.findByReviewer(req.user.id);
            res.json(reviews);
        } catch (err) {
            console.error('Get my reviews error:', err);
            res.status(500).json({ error: 'Failed to fetch your reviews' });
        }
    },

    // update own review only
    async update(req, res) {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;

            // Look up the review
            const review = await reviewModel.findById(id);
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            // Verify the reviewer owns this review
            if (review.reviewer_id !== req.user.id) {
                return res.status(403).json({ error: 'You can only edit your own reviews' });
            }

            // Validate rating if given
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }

            const updated = await reviewModel.update(id, { rating, comment });
            res.json(updated);
        } catch (err) {
            console.error('Update review error:', err);
            res.status(500).json({ error: 'Failed to update review' });
        }
    }
};

module.exports = reviewController;