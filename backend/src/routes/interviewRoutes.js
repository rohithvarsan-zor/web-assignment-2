const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { interviewCreateValidator, interviewUpdateValidator } = require('../validators/interviewValidators');

// Schedule an interview (recruiter, admin)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  interviewCreateValidator,
  interviewController.scheduleInterview
);

// Get my interviews (candidate, recruiter, admin)
router.get(
  '/my',
  authenticateJWT,
  interviewController.getMyInterviews
);

// Get interview by ID
router.get(
  '/:id',
  authenticateJWT,
  interviewController.getInterviewById
);

// Update interview (reschedule, notes, complete, cancel)
router.put(
  '/:id',
  authenticateJWT,
  interviewUpdateValidator,
  interviewController.updateInterview
);

// Delete / cancel interview (recruiter, admin)
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  interviewController.deleteInterview
);

module.exports = router;
