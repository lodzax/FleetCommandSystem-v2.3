const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing MySQL connection...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    console.log('Connected successfully!');
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
    
    // Try with empty string password explicitly
    try {
      console.log('Trying with explicit empty password...');
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
      });
      console.log('Connected with empty password!');
      await connection.end();
    } catch (error2) {
      console.error('Also failed:', error2.message);
      
      // Try without password field
      try {
        console.log('Trying without password field...');
        const connection = await mysql.createConnection({
          host: 'localhost',
          user: 'root'
        });
        console.log('Connected without password field!');
        await connection.end();
      } catch (error3) {
        console.error('All attempts failed:', error3.message);
      }
    }
  }
}

testConnection();