const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL');

  await connection.query('CREATE DATABASE IF NOT EXISTS fleetcommand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await connection.query('USE fleetcommand');

  const schema = fs.readFileSync(path.join(__dirname, 'server', 'schema.sql'), 'utf8');
  await connection.query(schema);
  console.log('Database initialized successfully!');
  await connection.end();
}

initDB().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});