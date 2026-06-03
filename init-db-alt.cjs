const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
  let connection;
  
  try {
    // Try different connection approaches
    console.log('Attempting to connect to MySQL...');
    
    // Approach 1: Standard connection
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
      });
      console.log('Connected with empty password');
    } catch (err1) {
      console.log('Standard connection failed:', err1.message);
      
      // Approach 2: Try with no password field
      try {
        connection = await mysql.createConnection({
          host: 'localhost',
          user: 'root'
        });
        console.log('Connected without password field');
      } catch (err2) {
        console.log('Connection without password failed:', err2.message);
        
        // Approach 3: Try 127.0.0.1 instead of localhost
        try {
          connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: ''
          });
          console.log('Connected via 127.0.0.1 with empty password');
        } catch (err3) {
          console.log('Connection via 127.0.0.1 failed:', err3.message);
          
          // Approach 4: Try to connect as anonymous user
          try {
            connection = await mysql.createConnection({
              host: 'localhost',
              user: ''
            });
            console.log('Connected as anonymous user');
          } catch (err4) {
            console.log('All connection attempts failed');
            throw new Error('Could not connect to MySQL server. Please check if MySQL is running and accessible.');
          }
        }
      }
    }
    
    // Create database if it doesn't exist
    console.log('Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS fleetcommand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Database fleetcommand ensured');
    
    // Use the database
    await connection.query('USE fleetcommand');
    console.log('Using database fleetcommand');
    
    // Read schema file
    console.log('Reading schema file...');
    const schema = fs.readFileSync(path.join(__dirname, 'server', 'schema.sql'), 'utf8');
    
    // Execute schema
    console.log('Executing schema...');
    await connection.query(schema);
    console.log('Schema executed successfully!');
    
    // Close connection
    await connection.end();
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore errors on close
      }
    }
    process.exit(1);
  }
}

initDB();