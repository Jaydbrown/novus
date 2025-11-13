const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
  // Connect to default 'postgres' database to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    const dbName = process.env.DB_NAME || 'novus_consultations';

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log(` Database "${dbName}" already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(` Database "${dbName}" created successfully`);
    }

    await client.end();
    console.log('\nDatabase setup complete!');
    console.log('You can now run: npm run init-db');
  } catch (error) {
    console.error('Error creating database:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your .env file has correct DB_USER and DB_PASSWORD');
    console.error('3. Verify the postgres user has permission to create databases');
    await client.end();
    process.exit(1);
  }
};

createDatabase();