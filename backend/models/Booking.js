// ==================== models/Booking.js ====================
const pool = require('../config/database');

class Booking {
  static async create({ name, email, company, notes, date, timeSlot }) {
    const result = await pool.query(
      `INSERT INTO bookings (name, email, company, notes, date, time_slot) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, email, company, notes, date, timeSlot]
    );
    return result.rows[0];
  }

  static async findAll({ status, startDate, endDate, limit = 10, offset = 0 }) {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate && endDate) {
      query += ` AND date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount += 2;
    }

    query += ` ORDER BY date DESC, time_slot DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM bookings WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (startDate && endDate) {
      countQuery += ` AND date BETWEEN $${countParamCount} AND $${countParamCount + 1}`;
      countParams.push(startDate, endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    
    return {
      bookings: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findByDateAndTime(date, timeSlot) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE date = $1 AND time_slot = $2 AND status != $3',
      [date, timeSlot, 'cancelled']
    );
    return result.rows[0];
  }

  static async findByDate(date) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE date = $1 AND status != $2',
      [date, 'cancelled']
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getRecentBookings(limit = 5) {
    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }

  static async countByDate(date) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE date = $1 AND status != $2',
      [date, 'cancelled']
    );
    return parseInt(result.rows[0].count);
  }

  static async countTotal() {
    const result = await pool.query('SELECT COUNT(*) FROM bookings');
    return parseInt(result.rows[0].count);
  }
}

module.exports = Booking;