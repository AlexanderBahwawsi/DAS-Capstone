const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users',                                    ctrl.getAllUsers);
router.put('/users/:id/role',                           ctrl.updateUserRole);
router.delete('/users/:id',                             ctrl.deleteUser);

router.post('/assign',                                  ctrl.assignReviewer);
router.delete('/assign/:submissionId/:reviewerId',      ctrl.removeAssignment);
router.get('/workload',                                 ctrl.getReviewerWorkload);

router.put('/submissions/bulk-status',                  ctrl.bulkUpdateStatus);
router.get('/export',                                   ctrl.exportData);

module.exports = router;
