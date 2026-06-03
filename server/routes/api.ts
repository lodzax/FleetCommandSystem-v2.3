import { Router, Request, Response } from 'express';
import pool from '../db';
import { authMiddleware } from './auth';

const router = Router();

// Helper: parse JSON fields from DB row
function parseRow(row: any): any {
  if (!row) return row;
  const r = { ...row };
  if (r.routeCoordinates && typeof r.routeCoordinates === 'string') {
    try { r.routeCoordinates = JSON.parse(r.routeCoordinates); } catch {}
  }
  return r;
}

// Require JWT auth for all write operations (POST, PUT, DELETE)
router.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  return authMiddleware(req, res, next);
});

// ── Users ──
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const [rows]: any[] = await pool.query('SELECT * FROM users');
    const safe = rows.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const u = req.body;
    const password = u.password;
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }
    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, role, status, memberSince, avatar, password) VALUES (?,?,?,?,?,?,?,?)`,
      [u.id, u.name, u.email, u.role, u.status, u.memberSince, u.avatar || null, hashed]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const u = req.body;
    await pool.query(
      `UPDATE users SET name=?, email=?, role=?, status=?, avatar=? WHERE id=?`,
      [u.name, u.email, u.role, u.status, u.avatar || null, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/users/:id — delete a user
router.delete('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Trucks ──
router.get('/trucks', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trucks');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/trucks', async (req: Request, res: Response) => {
  try {
    const t = req.body;
    await pool.query(
      `INSERT INTO trucks (id, plateNumber, type, model, capacity, status, fuelRate, currentLat, currentLng, driverId, assignedDriverName, mileage, nextServiceMileage, lastServiceDate, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [t.id, t.plateNumber, t.type, t.model, t.capacity, t.status, t.fuelRate, t.currentLat, t.currentLng, t.driverId || null, t.assignedDriverName || null, t.mileage, t.nextServiceMileage, t.lastServiceDate, t.imageUrl || null]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/trucks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const t = req.body;
    await pool.query(
      `UPDATE trucks SET plateNumber=?, type=?, model=?, capacity=?, status=?, fuelRate=?, currentLat=?, currentLng=?, driverId=?, assignedDriverName=?, mileage=?, nextServiceMileage=?, lastServiceDate=?, imageUrl=? WHERE id=?`,
      [t.plateNumber, t.type, t.model, t.capacity, t.status, t.fuelRate, t.currentLat, t.currentLng, t.driverId || null, t.assignedDriverName || null, t.mileage, t.nextServiceMileage, t.lastServiceDate, t.imageUrl || null, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/trucks/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM trucks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Drivers ──
router.get('/drivers', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM drivers');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/drivers', async (req: Request, res: Response) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO drivers (id, name, status, licenseClass, assignedTruckId, assignedTruckPlate, phone, email, rating, tripsCompleted, lastActive, avatar, idNumber, isVerified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [d.id, d.name, d.status, d.licenseClass, d.assignedTruckId || null, d.assignedTruckPlate || null, d.phone, d.email, d.rating, d.tripsCompleted, d.lastActive, d.avatar || null, d.idNumber || null, d.isVerified ? 1 : 0]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const d = req.body;
    await pool.query(
      `UPDATE drivers SET name=?, status=?, licenseClass=?, assignedTruckId=?, assignedTruckPlate=?, phone=?, email=?, rating=?, tripsCompleted=?, lastActive=?, avatar=?, idNumber=?, isVerified=? WHERE id=?`,
      [d.name, d.status, d.licenseClass, d.assignedTruckId || null, d.assignedTruckPlate || null, d.phone, d.email, d.rating, d.tripsCompleted, d.lastActive, d.avatar || null, d.idNumber || null, d.isVerified ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/drivers/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Jobs ──
router.get('/jobs', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jobs');
    res.json((rows as any[]).map(parseRow));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const j = req.body;
    await pool.query(
      `INSERT INTO jobs (id, title, cargoType, weight, source, sourceLat, sourceLng, destination, destinationLat, destinationLng, status, driverId, truckId, driverName, truckPlate, scheduledDate, dispatchTime, completionTime, estimatedHours, routeCoordinates, fuelAllocated, income) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [j.id, j.title, j.cargoType, j.weight, j.source, j.sourceLat, j.sourceLng, j.destination, j.destinationLat, j.destinationLng, j.status, j.driverId || null, j.truckId || null, j.driverName || null, j.truckPlate || null, j.scheduledDate, j.dispatchTime || null, j.completionTime || null, j.estimatedHours, j.routeCoordinates ? JSON.stringify(j.routeCoordinates) : null, j.fuelAllocated, j.income]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const j = req.body;
    await pool.query(
      `UPDATE jobs SET title=?, cargoType=?, weight=?, source=?, sourceLat=?, sourceLng=?, destination=?, destinationLat=?, destinationLng=?, status=?, driverId=?, truckId=?, driverName=?, truckPlate=?, scheduledDate=?, dispatchTime=?, completionTime=?, estimatedHours=?, routeCoordinates=?, fuelAllocated=?, income=? WHERE id=?`,
      [j.title, j.cargoType, j.weight, j.source, j.sourceLat, j.sourceLng, j.destination, j.destinationLat, j.destinationLng, j.status, j.driverId || null, j.truckId || null, j.driverName || null, j.truckPlate || null, j.scheduledDate, j.dispatchTime || null, j.completionTime || null, j.estimatedHours, j.routeCoordinates ? JSON.stringify(j.routeCoordinates) : null, j.fuelAllocated, j.income, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Maintenance ──
router.get('/maintenance', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maintenance_records');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const m = req.body;
    await pool.query(
      `INSERT INTO maintenance_records (id, truckId, truckPlate, serviceType, cost, status, scheduledDate, completedDate, technicianName, notes, priority) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [m.id, m.truckId, m.truckPlate || null, m.serviceType, m.cost, m.status, m.scheduledDate, m.completedDate || null, m.technicianName, m.notes, m.priority]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const m = req.body;
    await pool.query(
      `UPDATE maintenance_records SET truckId=?, truckPlate=?, serviceType=?, cost=?, status=?, scheduledDate=?, completedDate=?, technicianName=?, notes=?, priority=? WHERE id=?`,
      [m.truckId, m.truckPlate || null, m.serviceType, m.cost, m.status, m.scheduledDate, m.completedDate || null, m.technicianName, m.notes, m.priority, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Fuel Logs ──
router.get('/fuel-logs', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fuel_logs ORDER BY created_at DESC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/fuel-logs', async (req: Request, res: Response) => {
  try {
    const f = req.body;
    await pool.query(
      `INSERT INTO fuel_logs (id, truckId, truckPlate, driverId, driverName, litres, cost, odometer, location, date, fuelType) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [f.id, f.truckId, f.truckPlate || null, f.driverId, f.driverName || null, f.litres, f.cost, f.odometer, f.location, f.date, f.fuelType]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Fuel Requisitions ──
router.get('/fuel-requisitions', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fuel_requisitions ORDER BY created_at DESC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/fuel-requisitions', async (req: Request, res: Response) => {
  try {
    const r = req.body;
    await pool.query(
      `INSERT INTO fuel_requisitions (id, truckId, truckPlate, driverId, driverName, litresRequested, estimatedCost, fuelDate, fuelType, branchId, branchName, dateRequested, status, reviewedBy, reviewedDate, approvedBy, approvedDate, rejectedBy, rejectedDate, rejectionReason, qrCodeData, purpose, redeemToken, redeemDate, redeemedByGasStation, redeemedAttendantSignature, redeemedActualLitres, redeemedActualCost, submittedBy, submittedById) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [r.id, r.truckId, r.truckPlate || null, r.driverId, r.driverName || null, r.litresRequested, r.estimatedCost, r.fuelDate, r.fuelType, r.branchId, r.branchName || null, r.dateRequested, r.status || 'Pending', r.reviewedBy || null, r.reviewedDate || null, r.approvedBy || null, r.approvedDate || null, r.rejectedBy || null, r.rejectedDate || null, r.rejectionReason || null, r.qrCodeData || null, r.purpose, r.redeemToken || null, r.redeemDate || null, r.redeemedByGasStation || null, r.redeemedAttendantSignature || null, r.redeemedActualLitres || null, r.redeemedActualCost || null, r.submittedBy || null, r.submittedById || null]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/fuel-requisitions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = req.body;
    await pool.query(
      `UPDATE fuel_requisitions SET status=?, reviewedBy=?, reviewedDate=?, approvedBy=?, approvedDate=?, rejectedBy=?, rejectedDate=?, rejectionReason=?, qrCodeData=?, redeemToken=?, redeemDate=?, redeemedByGasStation=?, redeemedAttendantSignature=?, redeemedActualLitres=?, redeemedActualCost=? WHERE id=?`,
      [r.status, r.reviewedBy || null, r.reviewedDate || null, r.approvedBy || null, r.approvedDate || null, r.rejectedBy || null, r.rejectedDate || null, r.rejectionReason || null, r.qrCodeData || null, r.redeemToken || null, r.redeemDate || null, r.redeemedByGasStation || null, r.redeemedAttendantSignature || null, r.redeemedActualLitres || null, r.redeemedActualCost || null, id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Branches ──
router.get('/branches', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM branches');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/branches', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    await pool.query(
      `INSERT INTO branches (id, name, locationName, lat, lng, phone, manager) VALUES (?,?,?,?,?,?,?)`,
      [b.id, b.name, b.locationName, b.lat, b.lng, b.phone || null, b.manager || null]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Activities ──
router.get('/activities', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/activities', async (req: Request, res: Response) => {
  try {
    const a = req.body;
    await pool.query(
      `INSERT INTO user_activities (id, userId, userName, action, timestamp, details) VALUES (?,?,?,?,?,?)`,
      [a.id, a.userId, a.userName, a.action, a.timestamp, a.details || null]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Dispatch Records ──
router.get('/dispatches', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dispatch_records');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/dispatches', async (req: Request, res: Response) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO dispatch_records (id, date, driverId, driverName, truckId, truckPlate, destination, itemDescription, quantity, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [d.id, d.date, d.driverId, d.driverName, d.truckId, d.truckPlate, d.destination, d.itemDescription, d.quantity, d.status, d.notes]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Stock Movements ──
router.get('/stock-movements', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stock_movements');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/stock-movements', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    await pool.query(
      `INSERT INTO stock_movements (id, fromBranch, toBranch, itemDescription, itemsCount, status) VALUES (?,?,?,?,?,?)`,
      [s.id, s.fromBranch, s.toBranch, s.itemDescription, s.itemsCount, s.status]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Settings ──
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_settings');
    const settings: Record<string, string> = {};
    (rows as any[]).forEach((r: any) => { settings[r.settingKey] = r.settingValue; });
    res.json(settings);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/settings/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    await pool.query(
      `INSERT INTO app_settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = ?`,
      [key, req.body.value, req.body.value]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Reset (clear operational data) ──
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM trucks');
    await pool.query('DELETE FROM drivers');
    await pool.query('DELETE FROM jobs');
    await pool.query('DELETE FROM maintenance_records');
    await pool.query('DELETE FROM fuel_logs');
    await pool.query('DELETE FROM fuel_requisitions');
    await pool.query('DELETE FROM dispatch_records');
    await pool.query('DELETE FROM stock_movements');
    await pool.query('DELETE FROM branches');
    await pool.query('DELETE FROM user_activities');
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
