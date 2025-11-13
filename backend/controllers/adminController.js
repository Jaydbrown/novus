// ==================== controllers/adminController.js ====================
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get statistics
    const totalBookings = await Booking.countTotal();
    const todayBookings = await Booking.countByDate(today);
    const pendingBookings = await Booking.countByStatus('pending');
    const newContacts = await Contact.countByStatus('new');
    const activeSubscribers = await Newsletter.countActive();
    
    // Get recent bookings
    const recentBookings = await Booking.getRecentBookings(5);
    
    // Get booking statistics by status
    const confirmedBookings = await Booking.countByStatus('confirmed');
    const cancelledBookings = await Booking.countByStatus('cancelled');
    const completedBookings = await Booking.countByStatus('completed');
    
    res.json({
      stats: {
        totalBookings,
        todayBookings,
        pendingBookings,
        newContacts,
        activeSubscribers,
        confirmedBookings,
        cancelledBookings,
        completedBookings
      },
      recentBookings
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};
