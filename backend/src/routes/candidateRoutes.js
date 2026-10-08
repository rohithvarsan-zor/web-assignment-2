const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { uploadResume, uploadPhoto } = require('../middleware/upload');
const { candidateProfileValidator } = require('../validators/profileValidators');

// Get logged-in candidate profile
router.get(
  '/profile',
  authenticateJWT,
  authorizeRoles('candidate'),
  candidateController.getCandidateProfile
);

// Update logged-in candidate profile
router.put(
  '/profile',
  authenticateJWT,
  authorizeRoles('candidate'),
  candidateProfileValidator,
  candidateController.updateCandidateProfile
);

// Upload resume
router.post(
  '/resume',
  authenticateJWT,
  authorizeRoles('candidate'),
  uploadResume.single('resume'),
  candidateController.uploadResumeHandler
);

// Upload profile photo
router.post(
  '/photo',
  authenticateJWT,
  authorizeRoles('candidate'),
  uploadPhoto.single('photo'),
  candidateController.uploadPhotoHandler
);

// Recruiter & Admin can view candidate profile by candidate's user ID
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles('recruiter', 'admin'),
  candidateController.getCandidateById
);

module.exports = router;
