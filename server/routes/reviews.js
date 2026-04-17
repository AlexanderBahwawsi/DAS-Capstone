const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const reviewController = require('../controllers/reviewController');

router.use(authenticate);

router.get('/mine',           reviewController.getMyReviews);
router.get('/queue',          authorize('reviewer', 'editor'), reviewController.getMyQueue);
router.get('/:submissionId',  reviewController.getForSubmission);
router.post('/:submissionId', authorize('reviewer', 'editor', 'admin'), reviewController.create);
router.put('/:id',            authorize('reviewer', 'editor', 'admin'), reviewController.update);

module.exports = router;
