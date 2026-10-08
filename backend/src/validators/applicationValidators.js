const { body } = require('express-validator');
const validate = require('./validate');

const applyValidator = validate([
  body('job_id')
    .notEmpty()
    .withMessage('Job ID is required')
    .isInt({ min: 1 })
    .withMessage('Job ID must be a positive integer'),
  body('cover_letter')
    .optional()
    .trim(),
  body('resume_url')
    .optional()
    .trim()
]);

const applicationStatusValidator = validate([
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'withdrawn'])
    .withMessage('Invalid application status')
]);

module.exports = {
  applyValidator,
  applicationStatusValidator
};
