const mysql = require('mysql2/promise');

const passwordsToTry = ['', 'root', 'password', 'admin', 'mysql', '123456', 'localhost'];

async function testPasswords() {
  for (const password of passwordsToTry) {
    try {
      console.log(`Trying password: '${password}'`);
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: password
      });
      console.log(`Success with password: '${password}'`);
      await connection.end();
      return password;
    } catch (err) {
      console.log(`Failed with password '${password}': ${err.message}`);
    }
  }
  console.log('All passwords failed');
  return null;
}

testPasswords().then(pwd => {
  console.log(`Working password: ${pwd}`);
});