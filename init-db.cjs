const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
  try {
    // Create connection without specifying database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    // Read schema file
    const schema = fs.readFileSync(path.join(__dirname, 'server', 'schema.sql'), 'utf8');
    
    // Execute schema
    await connection.query(schema);
    console.log('Database initialized successfully!');
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initDB();