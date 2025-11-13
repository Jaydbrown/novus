// ==================== routes/authRoutes.js ====================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authValidation, loginValidation } = require('../middleware/validation');

router.post('/register', authValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;