// ==================== routes/bookingRoutes.js ====================
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { bookingValidation } = require('../middleware/validation');

router.get('/available-slots', bookingController.getAvailableSlots);
router.post('/', bookingValidation, bookingController.createBooking);

module.exports = router;