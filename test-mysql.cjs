const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  const [rows] = await connection.query('SELECT 1 AS test');
  console.log('MySQL connection OK:', rows[0]);
  await connection.end();
}

testConnection().catch(err => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});