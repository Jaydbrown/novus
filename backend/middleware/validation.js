// ==================== middleware/validation.js ====================
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const bookingValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
  validateRequest
];

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  validateRequest
];

const newsletterValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  validateRequest
];

const authValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// ==================== middleware/validation.js (ADD BLOG VALIDATION) ====================
// Add this to your existing validation.js file

const blogValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('author').optional().trim().isLength({ max: 100 }),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status'),
  validateRequest
];

module.exports = {
  bookingValidation,
  contactValidation,
  newsletterValidation,
  authValidation,
  loginValidation,
  validateRequest,
  blogValidation
};