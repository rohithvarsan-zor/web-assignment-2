const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/', authenticateJWT, notificationController.getMyNotifications);
router.put('/:id/read', authenticateJWT, notificationController.markAsRead);
router.put('/read-all', authenticateJWT, notificationController.markAllAsRead);

module.exports = router;
