const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiterController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const { recruiterProfileValidator } = require('../validators/profileValidators');

// Recruiter Profile
router.get(
  '/profile',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  recruiterController.getRecruiterProfile
);

router.put(
  '/profile',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  recruiterProfileValidator,
  recruiterController.updateRecruiterProfile
);

router.post(
  '/logo',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  uploadLogo.single('logo'),
  recruiterController.uploadCompanyLogo
);

// Recruiter Jobs & Applications
router.get(
  '/jobs',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  recruiterController.getRecruiterJobs
);

router.get(
  '/applications',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  recruiterController.getRecruiterApplications
);

// Recruiter Dashboard Statistics
router.get(
  '/statistics',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  recruiterController.getRecruiterStatistics
);

// Secure Resume Download
router.get(
  '/resumes/:filename',
  authenticateJWT,
  recruiterController.downloadResume
);

module.exports = router;
