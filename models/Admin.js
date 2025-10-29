// ==================== models/Admin.js ====================
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admins (username, email, password, role, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword, 'admin']
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM admins WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM admins'
    );
    return result.rows;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Alias for compatibility with auth routes
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE admins SET password = $1 WHERE id = $2 RETURNING id, username, email',
      [hashedPassword, id]
    );
    return result.rows[0];
  }

  static async deleteById(id) {
    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Admin;
