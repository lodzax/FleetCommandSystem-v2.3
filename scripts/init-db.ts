import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL');

  await connection.query(
    'CREATE DATABASE IF NOT EXISTS fleetcommand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  await connection.query('USE fleetcommand');
  console.log('Database fleetcommand ready');

  const schemaPath = path.resolve(__dirname, '../server/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await connection.query(schema);
  console.log('Schema executed');

  await connection.end();
  console.log('Database initialization complete!');
}

initDB().catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
