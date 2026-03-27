const router = require('express').Router();
const auth = require('../auth/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        authenticate, ctrl.me);

module.exports = router;