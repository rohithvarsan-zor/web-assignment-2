const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { applyValidator, applicationStatusValidator } = require('../validators/applicationValidators');

// Apply for a job (candidate only)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('candidate'),
  applyValidator,
  applicationController.applyForJob
);

// Get my applications (candidate only)
router.get(
  '/my',
  authenticateJWT,
  authorizeRoles('candidate'),
  applicationController.getMyApplications
);

// Get application by ID (candidate, recruiter, admin)
router.get(
  '/:id',
  authenticateJWT,
  applicationController.getApplicationById
);

// Update application status (recruiter, admin)
router.put(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  applicationStatusValidator,
  applicationController.updateApplicationStatus
);

// Withdraw application (candidate)
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('candidate'),
  applicationController.withdrawApplication
);

module.exports = router;
