const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateJWT, authorizeRoles('admin'));

router.get('/statistics', adminController.getAdminStatistics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/jobs', adminController.getAdminJobs);
router.get('/applications', adminController.getAdminApplications);
router.get('/audit-logs', adminController.getAdminAuditLogs);
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

module.exports = router;
