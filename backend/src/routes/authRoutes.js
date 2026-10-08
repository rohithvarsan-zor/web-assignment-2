const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidators');
const { authenticateJWT } = require('../middleware/auth');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', authenticateJWT, authController.getMe);
router.post('/logout', authenticateJWT, authController.logout);
router.put('/change-password', authenticateJWT, changePasswordValidator, authController.changePassword);

module.exports = router;
