// ==================== models/Booking.js ====================
const pool = require('../config/database');

class Booking {
  // Create new booking
  static async create({ name, email, company, notes, date, timeSlot }) {
    const result = await pool.query(
      `INSERT INTO bookings (name, email, company, notes, date, time_slot, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [name, email, company, notes, date, timeSlot, 'pending']
    );
    return result.rows[0];
  }

  // Find all bookings with filters and pagination
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
    } else if (startDate) {
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    } else if (endDate) {
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY date DESC, time_slot DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count with same filters
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
    } else if (startDate) {
      countQuery += ` AND date >= $${countParamCount}`;
      countParams.push(startDate);
    } else if (endDate) {
      countQuery += ` AND date <= $${countParamCount}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    
    return {
      bookings: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  // Find booking by date and time slot
  static async findByDateAndTime(date, timeSlot) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE date = $1 AND time_slot = $2 AND status != $3',
      [date, timeSlot, 'cancelled']
    );
    return result.rows[0];
  }

  // Find all bookings by date
  static async findByDate(date) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE date = $1 AND status != $2 ORDER BY time_slot ASC',
      [date, 'cancelled']
    );
    return result.rows;
  }

  // Find booking by ID
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Find bookings by email
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE email = $1 ORDER BY date DESC',
      [email]
    );
    return result.rows;
  }

  // Find upcoming bookings
  static async findUpcoming(limit = 10) {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE date >= $1 AND status NOT IN ('cancelled', 'completed')
       ORDER BY date ASC, time_slot ASC 
       LIMIT $2`,
      [today, limit]
    );
    return result.rows;
  }

  // Find past bookings
  static async findPast(limit = 10) {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE date < $1 
       ORDER BY date DESC, time_slot DESC 
       LIMIT $2`,
      [today, limit]
    );
    return result.rows;
  }

  // Update booking status
  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  // Update booking details
  static async update(id, { name, email, company, notes, date, timeSlot, status }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (company !== undefined) {
      fields.push(`company = $${paramCount}`);
      values.push(company);
      paramCount++;
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }
    if (date !== undefined) {
      fields.push(`date = $${paramCount}`);
      values.push(date);
      paramCount++;
    }
    if (timeSlot !== undefined) {
      fields.push(`time_slot = $${paramCount}`);
      values.push(timeSlot);
      paramCount++;
    }
    if (status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete booking
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Get recent bookings
  static async getRecentBookings(limit = 5) {
    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  // Count bookings by status
  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }

  // Count bookings by date
  static async countByDate(date) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE date = $1 AND status != $2',
      [date, 'cancelled']
    );
    return parseInt(result.rows[0].count);
  }

  // Count bookings in date range
  static async countByDateRange(startDate, endDate) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE date BETWEEN $1 AND $2',
      [startDate, endDate]
    );
    return parseInt(result.rows[0].count);
  }

  // Count total bookings
  static async countTotal() {
    const result = await pool.query('SELECT COUNT(*) FROM bookings');
    return parseInt(result.rows[0].count);
  }

  // Get bookings grouped by status
  static async getBookingsByStatus() {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM bookings 
       GROUP BY status 
       ORDER BY count DESC`
    );
    return result.rows;
  }

  // Get bookings grouped by date
  static async getBookingsByDate(limit = 30) {
    const result = await pool.query(
      `SELECT date, COUNT(*) as count 
       FROM bookings 
       WHERE date >= CURRENT_DATE - INTERVAL '${limit} days'
       GROUP BY date 
       ORDER BY date DESC`
    );
    return result.rows;
  }

  // Get monthly booking statistics
  static async getMonthlyStats(year, month) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
       FROM bookings 
       WHERE EXTRACT(YEAR FROM date) = $1 
       AND EXTRACT(MONTH FROM date) = $2`,
      [year, month]
    );
    return result.rows[0];
  }

  // Check if slot is available
  static async isSlotAvailable(date, timeSlot) {
    const booking = await this.findByDateAndTime(date, timeSlot);
    return !booking;
  }

  // Bulk update status
  static async bulkUpdateStatus(ids, status) {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ANY($2::int[]) 
       RETURNING *`,
      [status, ids]
    );
    return result.rows;
  }

  // Bulk delete
  static async bulkDelete(ids) {
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = ANY($1::int[]) RETURNING *',
      [ids]
    );
    return result.rows;
  }
}

module.exports = Booking;
