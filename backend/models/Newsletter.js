// ==================== models/Newsletter.js ====================
const pool = require('../config/database');

class Newsletter {
  static async create(email) {
    const result = await pool.query(
      'INSERT INTO newsletter (email) VALUES ($1) RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM newsletter WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM newsletter WHERE is_active = true ORDER BY subscribed_at DESC'
    );
    return result.rows;
  }

  static async activate(email) {
    const result = await pool.query(
      'UPDATE newsletter SET is_active = true WHERE email = $1 RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  static async deactivate(email) {
    const result = await pool.query(
      'UPDATE newsletter SET is_active = false WHERE email = $1 RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  static async countActive() {
    const result = await pool.query(
      'SELECT COUNT(*) FROM newsletter WHERE is_active = true'
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Newsletter;