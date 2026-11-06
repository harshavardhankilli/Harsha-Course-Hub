/**
 * Harsha CourseHub - Database Seeder Utility
 * Executes database/seed.sql safely into harsha_coursehub_db
 * Designed & Developed by Harsha
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seedDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'harsha_coursehub_db',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}...`);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected successfully.');

    const seedSqlPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('Executing seed queries...');
    await connection.query(sql);

    console.log('✓ Demo data seeded successfully!');
    console.log('  - 10 Andhra Pradesh engineering students inserted');
    console.log('  - 13 accredited semester courses inserted');
    console.log('  - 23 verified registrations inserted');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
