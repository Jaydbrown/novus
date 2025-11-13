// ==================== routes/adminRoutes.js ====================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const contactController = require('../controllers/contactController');
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/auth');

// Dashboard
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// Bookings management
router.get('/bookings', authMiddleware, bookingController.getAllBookings);
router.patch('/bookings/:id', authMiddleware, bookingController.updateBookingStatus);
router.delete('/bookings/:id', authMiddleware, bookingController.deleteBooking);

// Contacts management
router.get('/contacts', authMiddleware, contactController.getAllContacts);
router.patch('/contacts/:id', authMiddleware, contactController.updateContactStatus);
router.delete('/contacts/:id', authMiddleware, contactController.deleteContact);

// Newsletter management
router.get('/newsletters', authMiddleware, newsletterController.getAllSubscribers);

module.exports = router;
