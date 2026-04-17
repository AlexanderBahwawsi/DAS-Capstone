const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate);

router.post('/',             upload.array('files', 10), ctrl.create);
router.get('/mine',          ctrl.getMine);
router.get('/',              authorize('admin', 'editor'), ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.get('/:id/files',     ctrl.getFiles);
router.get('/:id/reviewers', ctrl.getReviewers);
router.get('/:id/rating',    ctrl.getRating);
router.put('/:id/status',    authorize('admin', 'editor'), ctrl.updateStatus);

module.exports = router;
