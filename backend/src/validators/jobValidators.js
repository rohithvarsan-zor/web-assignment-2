const { body } = require('express-validator');
const validate = require('./validate');

const jobCreateValidator = validate([
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 255 })
    .withMessage('Job title cannot exceed 255 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Job location is required'),
  body('employment_type')
    .trim()
    .notEmpty()
    .withMessage('Employment type is required'),
  body('salary_min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Minimum salary must be a number'),
  body('salary_max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Maximum salary must be a number'),
  body('application_deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid date format (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'closed'])
    .withMessage('Status must be draft, published, or closed')
]);

const jobUpdateValidator = validate([
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job title cannot be empty'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Job description cannot be empty'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'closed'])
    .withMessage('Status must be draft, published, or closed')
]);

module.exports = {
  jobCreateValidator,
  jobUpdateValidator
};
