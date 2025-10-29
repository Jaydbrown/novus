// ==================== routes/adminRoutes.js ====================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const contactController = require('../controllers/contactController');
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/auth');

// ==================== Dashboard ====================
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// ==================== Bookings Management ====================
router.get('/bookings', authMiddleware, bookingController.getAllBookings);
router.get('/bookings/:id', authMiddleware, bookingController.getBookingById);
router.patch('/bookings/:id', authMiddleware, bookingController.updateBookingStatus);
router.delete('/bookings/:id', authMiddleware, bookingController.deleteBooking);

// ==================== Contacts Management ====================
router.get('/contacts', authMiddleware, contactController.getAllContacts);
router.get('/contacts/:id', authMiddleware, contactController.getContactById);
router.patch('/contacts/:id', authMiddleware, contactController.updateContactStatus);
router.delete('/contacts/:id', authMiddleware, contactController.deleteContact);

// ==================== Newsletter Management ====================
router.get('/newsletters', authMiddleware, newsletterController.getAllSubscribers);
router.delete('/newsletters/:id', authMiddleware, newsletterController.deleteSubscriber);

// ==================== Settings Management ====================
// Note: Settings routes are in settingsRoutes.js (/api/admin/settings)

// ==================== Admin Management (Optional) ====================
// Uncomment if you want to manage admin accounts
router.get('/admins', authMiddleware, adminController.getAllAdmins);
router.post('/admins', authMiddleware, adminController.createAdmin);
router.delete('/admins/:id', authMiddleware, adminController.deleteAdmin);

module.exports = router;
