const { body } = require('express-validator');
const validate = require('./validate');

const interviewCreateValidator = validate([
  body('application_id')
    .notEmpty()
    .withMessage('Application ID is required')
    .isInt({ min: 1 })
    .withMessage('Application ID must be a valid integer'),
  body('scheduled_date')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date format (YYYY-MM-DD)'),
  body('scheduled_time')
    .notEmpty()
    .withMessage('Scheduled time is required'),
  body('mode')
    .notEmpty()
    .withMessage('Interview mode is required')
    .isIn(['online', 'offline', 'phone'])
    .withMessage('Mode must be online, offline, or phone'),
  body('meeting_link')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  body('location')
    .optional()
    .trim(),
  body('interviewer_notes')
    .optional()
    .trim()
]);

const interviewUpdateValidator = validate([
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Status must be scheduled, completed, cancelled, or rescheduled'),
  body('scheduled_date')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date format (YYYY-MM-DD)'),
  body('scheduled_time')
    .optional()
    .trim(),
  body('mode')
    .optional()
    .isIn(['online', 'offline', 'phone'])
    .withMessage('Mode must be online, offline, or phone')
]);

module.exports = {
  interviewCreateValidator,
  interviewUpdateValidator
};
