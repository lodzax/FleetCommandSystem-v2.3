const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  let sql = fs.readFileSync(path.resolve(__dirname, '..', 'localhost.sql'), 'utf8');
  sql = sql.replace(/\r\n/g, '\n');

  // Mask internal semicolons inside data URLs before splitting
  sql = sql.replace(/;base64,/g, '@@SEMI@@base64,');

  // Strip all comment lines, SET, CREATE DATABASE, USE, START TRANSACTION, COMMIT
  sql = sql.replace(/^(--|SET |START |COMMIT|CREATE DATABASE|USE |\/\*!).*\n/gm, '');

  // Strip collation, charset, engine references
  sql = sql.replace(/COLLATE[ =]latin1_swedish_ci/gi, ' ');
  sql = sql.replace(/CHARACTER SET latin1/gi, ' ');
  sql = sql.replace(/DEFAULT CHARSET[ =]latin1/gi, ' ');
  sql = sql.replace(/ENGINE[ =]InnoDB/gi, ' ');
  sql = sql.replace(/COLLATE[ =]utf8mb4_bin/gi, ' ');
  sql = sql.replace(/AUTO_INCREMENT=\d+/gi, ' ');
  sql = sql.replace(/DEFAULT CHARACTER SET latin1/gi, ' ');

  // Split by semicolon
  const rawStmts = sql.split(';')
    .map(s => s.trim().replace(/@@SEMI@@/g, ';'))
    .filter(s => s.length > 10);

  const conn = await mysql.createConnection({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '31eEg41oHsNM7Ss.root',
    password: 'xw2v4U1tBTAHm1gT',
    database: 'sys',
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });

  console.log('Connected to TiDB');
  await conn.query('CREATE DATABASE IF NOT EXISTS npivfupq_fleet');
  await conn.query('USE npivfupq_fleet');

  const tables = ['users', 'trucks', 'drivers', 'jobs', 'maintenance_records',
    'fuel_logs', 'fuel_requisitions', 'fuel_balance_logs', 'branches',
    'user_activities', 'dispatch_records', 'stock_movements', 'app_settings'];
  for (const t of tables) {
    try { await conn.query(`DROP TABLE IF EXISTS \`${t}\``); } catch {}
  }
  console.log('Dropped existing tables');

  const createStmts = rawStmts.filter(s => /CREATE\s+TABLE/i.test(s));
  const otherStmts = rawStmts.filter(s => !/CREATE\s+TABLE/i.test(s));

  let count = 0;
  for (const stmt of createStmts) {
    try { await conn.query(stmt); count++; }
    catch (e) { console.error(`CREATE error: ${e.message.slice(0, 100)}`); }
  }
  console.log(`Created ${count} tables`);

  count = 0;
  for (const stmt of otherStmts) {
    try { await conn.query(stmt); count++; }
    catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      if (stmt.toUpperCase().startsWith('ALTER')) continue;
      console.error(`Error on #${count}: ${e.message.slice(0, 100)}`);
    }
  }
  console.log(`Executed ${count} data statements`);

  for (const t of tables) {
    try {
      const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${t}\``);
      console.log(`  ${t}: ${rows[0].c} rows`);
    } catch (e) {
      console.log(`  ${t}: ERROR - ${e.message.slice(0, 60)}`);
    }
  }

  await conn.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
