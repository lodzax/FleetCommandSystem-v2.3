const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

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

// ── API Routes ──
app.get('/api/users', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM users');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/trucks', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM trucks');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/drivers', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM drivers');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/jobs', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM jobs');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/maintenance', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM maintenance_records');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/fuel-logs', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM fuel_logs ORDER BY created_at DESC');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/api/fuel-requisitions', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM fuel_requisitions ORDER BY created_at DESC');
    res.json(r);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.post('/api/fuel-requisitions', async (req, res) => {
  try {
    const r = req.body;
    await pool.query('INSERT INTO fuel_requisitions (id,truckId,truckPlate,driverId,driverName,litresRequested,estimatedCost,fuelDate,fuelType,branchId,branchName,dateRequested,status,reviewedBy,reviewedDate,approvedBy,approvedDate,rejectedBy,rejectedDate,rejectionReason,qrCodeData,purpose,redeemToken,redeemDate,redeemedByGasStation,redeemedAttendantSignature,redeemedActualLitres,redeemedActualCost,submittedBy,submittedById) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
      [r.id, r.truckId, r.truckPlate||null, r.driverId, r.driverName||null, r.litresRequested, r.estimatedCost, r.fuelDate, r.fuelType, r.branchId, r.branchName||null, r.dateRequested, r.status||'Pending', r.reviewedBy||null, r.reviewedDate||null, r.approvedBy||null, r.approvedDate||null, r.rejectedBy||null, r.rejectedDate||null, r.rejectionReason||null, r.qrCodeData||null, r.purpose, r.redeemToken||null, r.redeemDate||null, r.redeemedByGasStation||null, r.redeemedAttendantSignature||null, r.redeemedActualLitres||null, r.redeemedActualCost||null, r.submittedBy||null, r.submittedById||null]);
    res.json({ok: true});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.put('/api/fuel-requisitions/:id', async (req, res) => {
  try {
    const r = req.body;
    await pool.query('UPDATE fuel_requisitions SET status=?,reviewedBy=?,reviewedDate=?,approvedBy=?,approvedDate=?,rejectedBy=?,rejectedDate=?,rejectionReason=?,qrCodeData=?,redeemToken=?,redeemDate=?,redeemedByGasStation=?,redeemedAttendantSignature=?,redeemedActualLitres=?,redeemedActualCost=? WHERE id=?', 
      [r.status, r.reviewedBy||null, r.reviewedDate||null, r.approvedBy||null, r.approvedDate||null, r.rejectedBy||null, r.rejectedDate||null, r.rejectionReason||null, r.qrCodeData||null, r.redeemToken||null, r.redeemDate||null, r.redeemedByGasStation||null, r.redeemedAttendantSignature||null, r.redeemedActualLitres||null, r.redeemedActualCost||null, req.params.id]);
    res.json({ok: true});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.post('/api/migrate', async (_req, res) => {
  const results = [];
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN submittedBy VARCHAR(100) DEFAULT NULL AFTER redeemedActualCost");
    results.push('added submittedBy');
  } catch(e) {
    results.push('submittedBy: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message));
  }
  try {
    await pool.query("ALTER TABLE fuel_requisitions ADD COLUMN submittedById VARCHAR(50) DEFAULT NULL AFTER submittedBy");
    results.push('added submittedById');
  } catch(e) {
    results.push('submittedById: ' + (e.code === 'ER_DUP_FIELDNAME' ? 'already exists' : e.message));
  }
  res.json({ok: true, results});
});

// ── Serve Static Frontend ──
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[FleetCommand] Production server running on port ${PORT}`);
});