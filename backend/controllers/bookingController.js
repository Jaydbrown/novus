// ==================== controllers/bookingController.js ====================
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { sendBookingConfirmation } = require('../utils/emailService');

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const settings = await Settings.get();
    const bookings = await Booking.findByDate(date);
    
    const bookedSlots = bookings.map(b => b.time_slot);
    const allSlots = generateTimeSlots(settings);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { name, email, company, notes, date, timeSlot } = req.body;
    
    // Check if slot is already booked
    const existingBooking = await Booking.findByDateAndTime(date, timeSlot);
    if (existingBooking) {
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
    
    // Send confirmation email
    await sendBookingConfirmation(booking);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { bookings, total } = await Booking.findAll({
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      bookings,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.updateStatus(id, status);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.delete(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

function generateTimeSlots(settings) {
  const slots = [];
  const start = parseInt(settings.working_hours_start.split(':')[0]);
  const end = parseInt(settings.working_hours_end.split(':')[0]);
  const duration = settings.meeting_duration;
  
  for (let hour = start; hour < end; hour++) {
    for (let min = 0; min < 60; min += duration) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  
  return slots;
}
