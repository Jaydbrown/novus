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
router.get('/health', adminController.getSystemHealth); // No auth needed

// ==================== Bookings Management ====================
router.get('/bookings', authMiddleware, bookingController.getAllBookings);
router.get('/bookings/stats', authMiddleware, bookingController.getBookingStats);
router.get('/bookings/:id', authMiddleware, bookingController.getBookingById);
router.patch('/bookings/:id', authMiddleware, bookingController.updateBookingStatus);
router.delete('/bookings/:id', authMiddleware, bookingController.deleteBooking);
router.post('/bookings/bulk-delete', authMiddleware, bookingController.bulkDeleteBookings);

// ==================== Contacts Management ====================
router.get('/contacts', authMiddleware, contactController.getAllContacts);
router.get('/contacts/stats', authMiddleware, contactController.getContactStats);
router.get('/contacts/:id', authMiddleware, contactController.getContactById);
router.patch('/contacts/:id', authMiddleware, contactController.updateContactStatus);
router.delete('/contacts/:id', authMiddleware, contactController.deleteContact);
router.post('/contacts/bulk-delete', authMiddleware, contactController.bulkDeleteContacts);

// ==================== Newsletter Management ====================
router.get('/newsletters', authMiddleware, newsletterController.getAllSubscribers);
router.get('/newsletters/stats', authMiddleware, newsletterController.getNewsletterStats);
router.get('/newsletters/export', authMiddleware, newsletterController.exportSubscribers);
router.get('/newsletters/:id', authMiddleware, newsletterController.getSubscriberById);
router.delete('/newsletters/:id', authMiddleware, newsletterController.deleteSubscriber);
router.post('/newsletters/bulk-delete', authMiddleware, newsletterController.bulkDeleteSubscribers);

// ==================== Settings Management ====================
// Note: Settings routes are in settingsRoutes.js (/api/admin/settings)

// ==================== Admin Management ====================
router.get('/admins', authMiddleware, adminController.getAllAdmins);
router.post('/admins', authMiddleware, adminController.createAdmin);
router.patch('/admins/:id/password', authMiddleware, adminController.updateAdminPassword);
router.delete('/admins/:id', authMiddleware, adminController.deleteAdmin);

module.exports = router;
