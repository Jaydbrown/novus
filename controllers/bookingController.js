// ==================== controllers/bookingController.js ====================
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { sendBookingConfirmation, sendBookingStatusUpdate } = require('../utils/emailService');

// ==================== Public Endpoints ====================

// Get available time slots for a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book slots in the past' });
    }

    console.log('📅 Getting available slots for:', date);

    const settings = await Settings.get();
    const bookings = await Booking.findByDate(date);
    
    const bookedSlots = bookings.map(b => b.time_slot);
    const allSlots = generateTimeSlots(settings);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    console.log('✅ Found', availableSlots.length, 'available slots');
    
    res.json({ 
      success: true,
      date,
      slots: availableSlots,
      totalSlots: allSlots.length,
      availableCount: availableSlots.length,
      bookedCount: bookedSlots.length
    });
  } catch (error) {
    console.error('❌ Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const { name, email, company, notes, date, timeSlot } = req.body;
    
    // Validation
    if (!name || !email || !date || !timeSlot) {
      return res.status(400).json({ 
        error: 'Name, email, date, and time slot are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Date validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book in the past' });
    }

    console.log('📝 Creating booking for:', email, 'on', date, 'at', timeSlot);
    
    // Check if slot is already booked
    const existingBooking = await Booking.findByDateAndTime(date, timeSlot);
    if (existingBooking) {
      console.log('❌ Time slot already booked');
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    
    // Create booking
    const booking = await Booking.create({
      name,
      email,
      company,
      notes,
      date,
      timeSlot
    });
    
    // Send confirmation email (don't block if email fails)
    try {
      await sendBookingConfirmation(booking);
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
      // Continue anyway - booking is saved
    }
    
    console.log('✅ Booking created:', booking.id);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully! Check your email for confirmation.',
      booking: {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        company: booking.company,
        date: booking.date,
        time_slot: booking.time_slot,
        status: booking.status,
        created_at: booking.created_at
      }
    });
  } catch (error) {
    console.error('❌ Create booking error:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
};

// ==================== Admin Endpoints ====================

// Get all bookings (with pagination and filtering)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📋 Fetching bookings - Page:', page, 'Status:', status || 'all');
    
    const { bookings, total } = await Booking.findAll({
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset
    });
    
    console.log('✅ Found', total, 'bookings');
    
    res.json({
      success: true,
      bookings,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching booking:', id);
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      console.log('❌ Booking not found:', id);
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log('✅ Booking found:', booking.id);
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('❌ Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, confirmed, completed, or cancelled' 
      });
    }
    
    console.log('🔄 Updating booking', id, 'to status:', status);
    
    const booking = await Booking.updateStatus(id, status);
    
    if (!booking) {
      console.log('❌ Booking not found:', id);
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Send status update email (optional)
    try {
      if (sendBookingStatusUpdate) {
        await sendBookingStatusUpdate(booking, status);
        console.log('✅ Status update email sent');
      }
    } catch (emailError) {
      console.error('⚠️  Email notification failed:', emailError.message);
    }
    
    console.log('✅ Booking status updated:', booking.id);
    
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('❌ Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️  Deleting booking:', id);
    
    const booking = await Booking.delete(id);
    
    if (!booking) {
      console.log('❌ Booking not found:', id);
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log('✅ Booking deleted:', id);
    
    res.json({ 
      success: true,
      message: 'Booking deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('📊 Fetching booking statistics');
    
    const totalBookings = await Booking.countTotal();
    const pendingBookings = await Booking.countByStatus('pending');
    const confirmedBookings = await Booking.countByStatus('confirmed');
    const completedBookings = await Booking.countByStatus('completed');
    const cancelledBookings = await Booking.countByStatus('cancelled');
    
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = await Booking.countByDate(today);
    
    const stats = {
      total: totalBookings,
      today: todayBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      completionRate: totalBookings > 0 
        ? ((completedBookings / totalBookings) * 100).toFixed(2) 
        : 0
    };
    
    console.log('✅ Booking stats:', stats);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get booking stats error:', error);
    res.status(500).json({ error: 'Failed to get booking statistics' });
  }
};

// Bulk delete bookings
exports.bulkDeleteBookings = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Booking IDs array is required' });
    }
    
    console.log('🗑️  Bulk deleting bookings:', ids.length);
    
    let deletedCount = 0;
    const errors = [];
    
    for (const id of ids) {
      try {
        const deleted = await Booking.delete(id);
        if (deleted) deletedCount++;
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }
    
    console.log('✅ Bulk delete completed:', deletedCount, 'deleted');
    
    res.json({
      success: true,
      message: `${deletedCount} booking(s) deleted successfully`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete bookings' });
  }
};

// ==================== Helper Functions ====================

function generateTimeSlots(settings) {
  const slots = [];
  const start = parseInt(settings.working_hours_start.split(':')[0]);
  const end = parseInt(settings.working_hours_end.split(':')[0]);
  const duration = settings.meeting_duration || 30;
  
  for (let hour = start; hour < end; hour++) {
    for (let min = 0; min < 60; min += duration) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Don't add slot if it would go past end time
      const slotEndHour = hour + Math.floor((min + duration) / 60);
      if (slotEndHour <= end) {
        slots.push(time);
      }
    }
  }
  
  return slots;
}
