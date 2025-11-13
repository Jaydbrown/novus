// ==================== models/Settings.js ====================
const pool = require('../config/database');

class Settings {
  static async get() {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    return result.rows[0];
  }

  static async update(settings) {
    const {
      working_hours_start,
      working_hours_end,
      working_days,
      meeting_duration,
      timezone,
      max_bookings_per_day,
      email_notifications,
      company_email,
      company_phone
    } = settings;

    const result = await pool.query(
      `UPDATE settings SET 
        working_hours_start = $1,
        working_hours_end = $2,
        working_days = $3,
        meeting_duration = $4,
        timezone = $5,
        max_bookings_per_day = $6,
        email_notifications = $7,
        company_email = $8,
        company_phone = $9
      WHERE id = 1
      RETURNING *`,
      [
        working_hours_start,
        working_hours_end,
        working_days,
        meeting_duration,
        timezone,
        max_bookings_per_day,
        email_notifications,
        company_email,
        company_phone
      ]
    );
    return result.rows[0];
  }
}

module.exports = Settings;