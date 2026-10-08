const { body } = require('express-validator');
const validate = require('./validate');

const candidateProfileValidator = validate([
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[+0-9\s\-()]{7,20}$/)
    .withMessage('Please provide a valid phone number'),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('location')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('qualification')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('university')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('graduation_year')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1960, max: 2035 })
    .withMessage('Please provide a valid graduation year'),
  body('experience_years')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('Experience years must be a valid number'),
  body('bio')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
]);

const recruiterProfileValidator = validate([
  body('company_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty'),
  body('company_website')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Company website must be a valid URL'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('designation')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('company_description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
]);

module.exports = {
  candidateProfileValidator,
  recruiterProfileValidator
};
