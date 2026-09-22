const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Job posting validation
const validateJobPosting = [
  body('role')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Role must be between 2 and 100 characters'),
  
  body('package')
    .custom((value) => {
      const numValue = parseFloat(value);
      return !isNaN(numValue) && numValue > 0;
    })
    .withMessage('Package must be a valid number greater than 0'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Job description must be between 10 and 2000 characters'),
  
  body('skills')
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return false;
    })
    .withMessage('At least one skill is required'),
  
  body('location')
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return false;
    })
    .withMessage('At least one location is required'),
  
  body('members')
    .optional()
    .custom((value) => {
      const numValue = parseInt(value);
      return !isNaN(numValue) && numValue >= 1;
    })
    .withMessage('Number of members must be a positive integer'),
  
  body('importantDates.registrationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      return deadline > now;
    })
    .withMessage('Registration deadline must be in the future'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('academicHistory')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Academic history must not exceed 1000 characters'),
  
  body('portfolioUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid portfolio URL'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateJobPosting,
  validateProfileUpdate,
  handleValidationErrors
};
