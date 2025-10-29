// ==================== controllers/adminController.js ====================
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');
const Admin = require('../models/Admin');

// ==================== Dashboard Statistics ====================
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📊 Fetching dashboard statistics...');
    
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
    
    console.log('✅ Dashboard stats fetched successfully');
    
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
    console.error('❌ Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};

// ==================== Admin Management (Optional) ====================

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    
    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('❌ Get all admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if username already exists
    const existingUsername = await Admin.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await Admin.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create admin
    const admin = await Admin.create({ username, email, password });
    
    console.log('✅ New admin created:', admin.username);
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('❌ Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Check if this is the last admin
    const allAdmins = await Admin.findAll();
    if (allAdmins.length === 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }
    
    // Delete admin
    await Admin.deleteById(id);
    
    console.log('✅ Admin deleted:', admin.username);
    
    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
};

// Update admin password
exports.updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Update password
    await Admin.updatePassword(id, newPassword);
    
    console.log('✅ Password updated for admin:', admin.username);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Get system health (optional)
exports.getSystemHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    };
    
    res.json(health);
  } catch (error) {
    console.error('❌ System health error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
};
