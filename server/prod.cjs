// FleetCommand v2.3 — Production Entry Point
// Run with: node server/prod.cjs
const { createRequire } = require('module');
const path = require('path');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Prevent worker crashes ──
process.on('uncaughtException', err => { console.error('[FC] Uncaught:', err.message, err.stack); });
process.on('unhandledRejection', r => { console.error('[FC] Unhandled rejection:', r); });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── MySQL Pool ──
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fleetcommand',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ── JWT Auth Middleware ──
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require JWT auth for all write operations (POST, PUT, DELETE)
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (req.path === '/api/auth/login' || req.path === '/api/auth/signup' || req.path === '/api/auth/verify-password' || req.path === '/api/migrate' || req.path.startsWith('/api/settings/') || req.path === '/api/fuel-balance-logs' || (req.method === 'POST' && req.path === '/api/users')) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// ── Auth Routes ──
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status === 'Suspended') return res.status(403).json({ error: 'Account has been suspended' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, user: safeUser, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    const userRole = role || 'Driver';
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `usr-${Date.now()}`;
    const memberSince = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    await pool.query('INSERT INTO users (id, name, email, role, status, memberSince, password) VALUES (?,?,?,?,?,?,?)', [id, name, email, userRole, 'Pending', memberSince, hashedPassword]);
    res.json({ success: true, message: 'Registration submitted. Pending admin approval.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/verify-password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) return res.status(400).json({ error: 'userId and password are required' });
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.json({ valid: false });
    const valid = await bcrypt.compare(password, user.password);
    res.json({ valid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── API Routes ──
app.get('/api/users', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    const safe = rows.map(u => { const { password, ...rest } = u; return rest; });
    res.json(safe);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/users', async (req, res) => {
  try {
    const u = req.body;
    const hashed = await bcrypt.hash(u.password, 10);
    await pool.query('INSERT INTO users (id,name,email,role,status,memberSince,avatar,password) VALUES (?,?,?,?,?,?,?,?)', [u.id,u.name,u.email,u.role,u.status,u.memberSince,u.avatar||null,hashed]);
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const u = req.body;
    await pool.query('UPDATE users SET name=?,email=?,role=?,status=?,avatar=? WHERE id=?', [u.name,u.email,u.role,u.status,u.avatar||null,req.params.id]);
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/trucks', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM trucks'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/trucks', async (req, res) => { try { const t = req.body; await pool.query('INSERT INTO trucks (id,plateNumber,type,model,capacity,status,fuelRate,currentLat,currentLng,driverId,assignedDriverName,mileage,nextServiceMileage,lastServiceDate,imageUrl,category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [t.id,t.plateNumber,t.type,t.model,t.capacity,t.status,t.fuelRate,t.currentLat,t.currentLng,t.driverId||null,t.assignedDriverName||null,t.mileage,t.nextServiceMileage,t.lastServiceDate,t.imageUrl||null,t.category||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/trucks/:id', async (req, res) => { try { const t = req.body; const cols = ['plateNumber','type','model','capacity','status','fuelRate','currentLat','currentLng','driverId','assignedDriverName','mileage','nextServiceMileage','lastServiceDate','imageUrl','category']; const setClauses = []; const vals = []; for (const c of cols) { if (t[c] !== undefined) { setClauses.push(c+'=?'); vals.push(t[c] === null ? null : t[c]); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE trucks SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/trucks/:id', async (req, res) => { try { await pool.query('DELETE FROM trucks WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/drivers', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM drivers'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/drivers', async (req, res) => { try { const d = req.body; await pool.query('INSERT INTO drivers (id,name,status,licenseClass,assignedTruckId,assignedTruckPlate,phone,email,rating,tripsCompleted,lastActive,avatar,idNumber,isVerified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [d.id,d.name,d.status,d.licenseClass,d.assignedTruckId||null,d.assignedTruckPlate||null,d.phone,d.email,d.rating,d.tripsCompleted,d.lastActive,d.avatar||null,d.idNumber||null,d.isVerified?1:0]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/drivers/:id', async (req, res) => { try { const d = req.body; const cols = ['name','status','licenseClass','assignedTruckId','assignedTruckPlate','phone','email','rating','tripsCompleted','lastActive','avatar','idNumber','isVerified']; const setClauses = []; const vals = []; for (const c of cols) { if (d[c] !== undefined) { setClauses.push(c+'=?'); vals.push(d[c] === null ? null : d[c]); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE drivers SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/drivers/:id', async (req, res) => { try { await pool.query('DELETE FROM drivers WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/jobs', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM jobs'); const rows = r.map(row => { if (row.routeCoordinates && typeof row.routeCoordinates==='string') { try { row.routeCoordinates = JSON.parse(row.routeCoordinates); } catch {} } return row; }); res.json(rows); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/jobs', async (req, res) => { try { const j = req.body; await pool.query('INSERT INTO jobs (id,title,cargoType,weight,source,sourceLat,sourceLng,destination,destinationLat,destinationLng,status,driverId,truckId,driverName,truckPlate,scheduledDate,dispatchTime,completionTime,estimatedHours,routeCoordinates,fuelAllocated,income) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [j.id,j.title,j.cargoType,j.weight,j.source,j.sourceLat,j.sourceLng,j.destination,j.destinationLat,j.destinationLng,j.status,j.driverId||null,j.truckId||null,j.driverName||null,j.truckPlate||null,j.scheduledDate,j.dispatchTime||null,j.completionTime||null,j.estimatedHours,j.routeCoordinates?JSON.stringify(j.routeCoordinates):null,j.fuelAllocated,j.income]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/jobs/:id', async (req, res) => { try { const j = req.body; const cols = ['title','cargoType','weight','source','sourceLat','sourceLng','destination','destinationLat','destinationLng','status','driverId','truckId','driverName','truckPlate','scheduledDate','dispatchTime','completionTime','estimatedHours','routeCoordinates','fuelAllocated','income']; const setClauses = []; const vals = []; for (const c of cols) { if (j[c] !== undefined) { let val = j[c]; if (c === 'routeCoordinates' && val && typeof val === 'object') val = JSON.stringify(val); setClauses.push(c+'=?'); vals.push(val === null ? null : val); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE jobs SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/jobs/:id', async (req, res) => { try { await pool.query('DELETE FROM jobs WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/maintenance', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM maintenance_records'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/maintenance', async (req, res) => { try { const m = req.body; await pool.query('INSERT INTO maintenance_records (id,truckId,truckPlate,serviceType,cost,status,scheduledDate,completedDate,technicianName,notes,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [m.id,m.truckId,m.truckPlate||null,m.serviceType,m.cost,m.status,m.scheduledDate,m.completedDate||null,m.technicianName,m.notes,m.priority]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/maintenance/:id', async (req, res) => { try { const m = req.body; const cols = ['truckId','truckPlate','serviceType','cost','status','scheduledDate','completedDate','technicianName','notes','priority']; const setClauses = []; const vals = []; for (const c of cols) { if (m[c] !== undefined) { setClauses.push(c+'=?'); vals.push(m[c] === null ? null : m[c]); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE maintenance_records SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/fuel-logs', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM fuel_logs ORDER BY created_at DESC'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/fuel-logs', async (req, res) => { try { const f = req.body; await pool.query('INSERT INTO fuel_logs (id,truckId,truckPlate,driverId,driverName,litres,cost,odometer,location,date,fuelType) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [f.id,f.truckId,f.truckPlate||null,f.driverId,f.driverName||null,f.litres,f.cost,f.odometer,f.location,f.date,f.fuelType]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/fuel-requisitions', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM fuel_requisitions ORDER BY created_at DESC'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/fuel-requisitions', async (req, res) => { try { const r = req.body; await pool.query('INSERT INTO fuel_requisitions (id,truckId,truckPlate,driverId,driverName,litresRequested,estimatedCost,fuelDate,fuelType,branchId,branchName,dateRequested,status,reviewedBy,reviewedDate,verifiedBy,verifiedDate,approvedBy,approvedDate,rejectedBy,rejectedDate,rejectionReason,qrCodeData,purpose,redeemToken,redeemDate,redeemedByGasStation,redeemedAttendantSignature,redeemedActualLitres,redeemedActualCost,submittedBy,submittedById,destination,odometerReading) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [r.id,r.truckId,r.truckPlate||null,r.driverId,r.driverName||null,r.litresRequested,r.estimatedCost,r.fuelDate,r.fuelType,r.branchId,r.branchName||null,r.dateRequested,r.status||'Pending',r.reviewedBy||null,r.reviewedDate||null,r.verifiedBy||null,r.verifiedDate||null,r.approvedBy||null,r.approvedDate||null,r.rejectedBy||null,r.rejectedDate||null,r.rejectionReason||null,r.qrCodeData||null,r.purpose,r.redeemToken||null,r.redeemDate||null,r.redeemedByGasStation||null,r.redeemedAttendantSignature||null,r.redeemedActualLitres||null,r.redeemedActualCost||null,r.submittedBy||null,r.submittedById||null,r.destination||null,r.odometerReading||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/fuel-requisitions/:id', async (req, res) => { try { const r = req.body; const cols = ['status','reviewedBy','reviewedDate','verifiedBy','verifiedDate','approvedBy','approvedDate','rejectedBy','rejectedDate','rejectionReason','qrCodeData','redeemToken','redeemDate','redeemedByGasStation','redeemedAttendantSignature','redeemedActualLitres','redeemedActualCost','litresRequested','estimatedCost','odometerReading']; const setClauses = []; const vals = []; for (const c of cols) { if (r[c] !== undefined) { setClauses.push(c+'=?'); vals.push(r[c] === null ? null : r[c]); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE fuel_requisitions SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/branches', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM branches'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/branches', async (req, res) => { try { const b = req.body; await pool.query('INSERT INTO branches (id,name,locationName,lat,lng,phone,manager) VALUES (?,?,?,?,?,?,?)', [b.id,b.name,b.locationName,b.lat,b.lng,b.phone||null,b.manager||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/activities', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 200'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/activities', async (req, res) => { try { const a = req.body; await pool.query('INSERT INTO user_activities (id,userId,userName,action,timestamp,details) VALUES (?,?,?,?,?,?)', [a.id,a.userId,a.userName,a.action,a.timestamp,a.details||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/dispatches', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM dispatch_records'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/dispatches', async (req, res) => { try { const d = req.body; await pool.query('INSERT INTO dispatch_records (id,date,driverId,driverName,truckId,truckPlate,destination,itemDescription,quantity,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [d.id,d.date,d.driverId,d.driverName,d.truckId,d.truckPlate,d.destination,d.itemDescription,d.quantity,d.status,d.notes]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/stock-movements', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM stock_movements'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/stock-movements', async (req, res) => { try { const s = req.body; await pool.query('INSERT INTO stock_movements (id,fromBranch,toBranch,itemDescription,itemsCount,status) VALUES (?,?,?,?,?,?)', [s.id,s.fromBranch,s.toBranch,s.itemDescription,s.itemsCount,s.status]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/settings', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM app_settings'); const s = {}; r.forEach(row => { s[row.settingKey] = row.settingValue; }); res.json(s); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/settings/:key', async (req, res) => { try { await pool.query('INSERT INTO app_settings (settingKey,settingValue) VALUES (?,?) ON DUPLICATE KEY UPDATE settingValue=?', [req.params.key,req.body.value,req.body.value]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.post('/api/reset', async (_req, res) => { try { await pool.query('DELETE FROM trucks'); await pool.query('DELETE FROM drivers'); await pool.query('DELETE FROM jobs'); await pool.query('DELETE FROM maintenance_records'); await pool.query('DELETE FROM fuel_logs'); await pool.query('DELETE FROM fuel_requisitions'); await pool.query('DELETE FROM dispatch_records'); await pool.query('DELETE FROM stock_movements'); await pool.query('DELETE FROM branches'); await pool.query('DELETE FROM user_activities'); await pool.query('DELETE FROM fuel_balance_logs'); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/fuel-balance-logs', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM fuel_balance_logs ORDER BY createdAt DESC'); res.json(r); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/fuel-balance-logs', async (req, res) => { try { const b = req.body; await pool.query('INSERT INTO fuel_balance_logs (id,type,fuelType,litres,balanceBefore,balanceAfter,note,createdBy) VALUES (?,?,?,?,?,?,?,?)', [b.id,b.type,b.fuelType,b.litres,b.balanceBefore,b.balanceAfter,b.note,b.createdBy||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.post('/api/migrate', async (_req, res) => {
  const results = [];
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN submittedBy VARCHAR(100) DEFAULT NULL AFTER redeemedActualCost");
    results.push('added submittedBy');
  } catch(e) { results.push('submittedBy: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN submittedById VARCHAR(50) DEFAULT NULL AFTER submittedBy");
    results.push('added submittedById');
  } catch(e) { results.push('submittedById: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN destination VARCHAR(255) DEFAULT NULL AFTER submittedById");
    results.push('added destination');
  } catch(e) { results.push('destination: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN category VARCHAR(50) DEFAULT 'Truck' AFTER imageUrl");
    results.push('added category to trucks');
  } catch(e) { results.push('category: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN verifiedBy VARCHAR(100) DEFAULT NULL AFTER reviewedDate");
    results.push('added verifiedBy');
  } catch(e) { results.push('verifiedBy: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN verifiedDate VARCHAR(20) DEFAULT NULL AFTER verifiedBy");
    results.push('added verifiedDate');
  } catch(e) { results.push('verifiedDate: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN odometerReading INT DEFAULT NULL AFTER destination");
    results.push('added odometerReading');
  } catch(e) { results.push('odometerReading: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message)); }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS fuel_balance_logs (
      id VARCHAR(50) PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      fuelType VARCHAR(10) NOT NULL,
      litres DECIMAL(10,2) NOT NULL,
      balanceBefore DECIMAL(10,2) NOT NULL,
      balanceAfter DECIMAL(10,2) NOT NULL,
      note TEXT,
      createdBy VARCHAR(100),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    results.push('created fuel_balance_logs table');
  } catch(e) { results.push('fuel_balance_logs: ' + e.message); }
  res.json({ok:true, results});
});

// ── Serve Static Frontend ──
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });

// ── Express error handler ──
app.use((err, req, res, _next) => {
  console.error(`[FC] ${req.method} ${req.path} error: ${err.message}`);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[FleetCommand] Production server running on port ${PORT}`);
});
