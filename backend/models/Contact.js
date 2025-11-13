const pool = require('../config/database');

class Contact {
  static async create({ name, email, subject, message }) {
    const result = await pool.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subject, message]
    );
    return result.rows[0];
  }

  static async findAll({ status, limit = 10, offset = 0 }) {
    let query = 'SELECT * FROM contacts';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contacts';
    const countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = $1';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      contacts: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM contacts WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Contact;
