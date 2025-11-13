const pool = require('./database');

const initDatabase = async () => {
  try {
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        notes TEXT,
        date DATE NOT NULL,
        time_slot VARCHAR(10) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, time_slot)
      )
    `);

    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create newsletter table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        working_hours_start VARCHAR(10) DEFAULT '09:00',
        working_hours_end VARCHAR(10) DEFAULT '17:00',
        working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
        meeting_duration INTEGER DEFAULT 30,
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        max_bookings_per_day INTEGER DEFAULT 10,
        email_notifications BOOLEAN DEFAULT true,
        company_email VARCHAR(255) DEFAULT 'contact@novus.com',
        company_phone VARCHAR(50) DEFAULT '+234 708 279 5914'
      )
    `);

    // ==================== config/initDatabase.js (ADD THIS TABLE) ====================
// Add this to your existing initDatabase.js file

await pool.query(`
  CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100),
    author VARCHAR(100),
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

    // Insert default settings if not exists
    const settingsCheck = await pool.query('SELECT * FROM settings LIMIT 1');
    if (settingsCheck.rows.length === 0) {
      await pool.query('INSERT INTO settings DEFAULT VALUES');
    }

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)');
    // Create indexes for better performance
await pool.query('CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status)');
await pool.query('CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category)');
await pool.query('CREATE INDEX IF NOT EXISTS idx_blog_created ON blog_posts(created_at DESC)');


    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = initDatabase;