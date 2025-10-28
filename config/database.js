const { Pool } = require('pg');
require('dotenv').config();

let pool;

// ✅ Use DATABASE_URL if available (for Neon/Render)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Neon + Render
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('✅ Using Neon/Render PostgreSQL connection');
} else {
  // ✅ Fallback to local Postgres for development
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'novus_consultations',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'jaiyeolaeva',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('✅ Using local PostgreSQL connection');
}

// --- Event listeners ---
pool.on('connect', () => {
  console.log('📡 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
