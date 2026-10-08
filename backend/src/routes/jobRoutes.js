const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateJWT, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { jobCreateValidator, jobUpdateValidator } = require('../validators/jobValidators');

// Public routes (with optional auth to detect saved/applied status)
router.get('/', optionalAuth, jobController.getJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

// Recruiter & Admin routes
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  jobCreateValidator,
  jobController.createJob
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  jobUpdateValidator,
  jobController.updateJob
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  jobController.deleteJob
);

router.post(
  '/:id/publish',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  jobController.publishJob
);

router.post(
  '/:id/close',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  jobController.closeJob
);

// Candidate routes for saving jobs
router.post(
  '/:id/save',
  authenticateJWT,
  authorizeRoles('candidate'),
  jobController.saveJob
);

router.delete(
  '/:id/save',
  authenticateJWT,
  authorizeRoles('candidate'),
  jobController.unsaveJob
);

module.exports = router;
