// ==================== models/Blog.js ====================
const pool = require('../config/database');

class Blog {
  static async create({ title, content, excerpt, category, author, image_url, status = 'draft' }) {
    const result = await pool.query(
      `INSERT INTO blog_posts (title, content, excerpt, category, author, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, content, excerpt, category, author, image_url, status]
    );
    return result.rows[0];
  }

  static async findAll({ category, status = 'published', limit = 10, offset = 0 }) {
    let query = 'SELECT * FROM blog_posts WHERE status = $1';
    const params = [status];
    let paramCount = 2;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE status = $1';
    const countParams = [status];
    
    if (category) {
      countQuery += ' AND category = $2';
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    
    return {
      posts: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findAllForAdmin({ status, category, limit = 10, offset = 0 }) {
    let query = 'SELECT * FROM blog_posts WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;
    
    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    
    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    
    return {
      posts: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const { title, content, excerpt, category, author, image_url, status } = updates;
    
    const result = await pool.query(
      `UPDATE blog_posts 
       SET title = $1, content = $2, excerpt = $3, category = $4, 
           author = $5, image_url = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [title, content, excerpt, category, author, image_url, status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM blog_posts WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }

  static async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM blog_posts WHERE status = $1 ORDER BY category',
      ['published']
    );
    return result.rows.map(row => row.category);
  }
}

module.exports = Blog;