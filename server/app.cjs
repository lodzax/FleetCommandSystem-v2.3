const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const { sendNotification } = require('./server/sendmail.cjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ error: 'Missing fields' });
    await sendNotification({ to, subject, body });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Users
app.get('/api/users', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM users'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/users', async (req, res) => { try { const u = req.body; await pool.query('INSERT INTO users (id,name,email,role,status,memberSince,avatar,password) VALUES (?,?,?,?,?,?,?,?)', [u.id,u.name,u.email,u.role,u.status,u.memberSince,u.avatar||null,u.password||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/users/:id', async (req, res) => { try { const u = req.body; await pool.query('UPDATE users SET name=?,email=?,role=?,status=?,avatar=? WHERE id=?', [u.name,u.email,u.role,u.status,u.avatar||null,req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/trucks', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM trucks'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/trucks', async (req, res) => { try { const t = req.body; await pool.query('INSERT INTO trucks (id,plateNumber,type,model,capacity,status,fuelRate,currentLat,currentLng,driverId,assignedDriverName,mileage,nextServiceMileage,lastServiceDate,imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [t.id,t.plateNumber,t.type,t.model,t.capacity,t.status,t.fuelRate,t.currentLat,t.currentLng,t.driverId||null,t.assignedDriverName||null,t.mileage,t.nextServiceMileage,t.lastServiceDate,t.imageUrl||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/trucks/:id', async (req, res) => { try { const t = req.body; await pool.query('UPDATE trucks SET plateNumber=?,type=?,model=?,capacity=?,status=?,fuelRate=?,currentLat=?,currentLng=?,driverId=?,assignedDriverName=?,mileage=?,nextServiceMileage=?,lastServiceDate=?,imageUrl=? WHERE id=?', [t.plateNumber,t.type,t.model,t.capacity,t.status,t.fuelRate,t.currentLat,t.currentLng,t.driverId||null,t.assignedDriverName||null,t.mileage,t.nextServiceMileage,t.lastServiceDate,t.imageUrl||null,req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/trucks/:id', async (req, res) => { try { await pool.query('DELETE FROM trucks WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/drivers', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM drivers'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/drivers', async (req, res) => { try { const d = req.body; await pool.query('INSERT INTO drivers (id,name,status,licenseClass,assignedTruckId,assignedTruckPlate,phone,email,rating,tripsCompleted,lastActive,avatar,idNumber,isVerified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [d.id,d.name,d.status,d.licenseClass,d.assignedTruckId||null,d.assignedTruckPlate||null,d.phone,d.email,d.rating,d.tripsCompleted,d.lastActive,d.avatar||null,d.idNumber||null,d.isVerified?1:0]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/drivers/:id', async (req, res) => { try { const d = req.body; await pool.query('UPDATE drivers SET name=?,status=?,licenseClass=?,assignedTruckId=?,assignedTruckPlate=?,phone=?,email=?,rating=?,tripsCompleted=?,lastActive=?,avatar=?,idNumber=?,isVerified=? WHERE id=?', [d.name,d.status,d.licenseClass,d.assignedTruckId||null,d.assignedTruckPlate||null,d.phone,d.email,d.rating,d.tripsCompleted,d.lastActive,d.avatar||null,d.idNumber||null,d.isVerified?1:0,req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/drivers/:id', async (req, res) => { try { await pool.query('DELETE FROM drivers WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/jobs', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM jobs'); res.json(Array.isArray(r)?r:[]); } catch(e) { res.json([]); } });
app.post('/api/jobs', async (req, res) => { try { const j = req.body; await pool.query('INSERT INTO jobs (id,title,cargoType,weight,source,sourceLat,sourceLng,destination,destinationLat,destinationLng,status,driverId,truckId,driverName,truckPlate,scheduledDate,dispatchTime,completionTime,estimatedHours,routeCoordinates,fuelAllocated,income) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [j.id,j.title,j.cargoType,j.weight,j.source,j.sourceLat,j.sourceLng,j.destination,j.destinationLat,j.destinationLng,j.status,j.driverId||null,j.truckId||null,j.driverName||null,j.truckPlate||null,j.scheduledDate,j.dispatchTime||null,j.completionTime||null,j.estimatedHours,j.routeCoordinates?JSON.stringify(j.routeCoordinates):null,j.fuelAllocated,j.income]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/jobs/:id', async (req, res) => { try { const j = req.body; await pool.query('UPDATE jobs SET title=?,cargoType=?,weight=?,source=?,sourceLat=?,sourceLng=?,destination=?,destinationLat=?,destinationLng=?,status=?,driverId=?,truckId=?,driverName=?,truckPlate=?,scheduledDate=?,dispatchTime=?,completionTime=?,estimatedHours=?,routeCoordinates=?,fuelAllocated=?,income=? WHERE id=?', [j.title,j.cargoType,j.weight,j.source,j.sourceLat,j.sourceLng,j.destination,j.destinationLat,j.destinationLng,j.status,j.driverId||null,j.truckId||null,j.driverName||null,j.truckPlate||null,j.scheduledDate,j.dispatchTime||null,j.completionTime||null,j.estimatedHours,j.routeCoordinates?JSON.stringify(j.routeCoordinates):null,j.fuelAllocated,j.income,req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.delete('/api/jobs/:id', async (req, res) => { try { await pool.query('DELETE FROM jobs WHERE id=?',[req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/maintenance', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM maintenance_records'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/maintenance', async (req, res) => { try { const m = req.body; await pool.query('INSERT INTO maintenance_records (id,truckId,truckPlate,serviceType,cost,status,scheduledDate,completedDate,technicianName,notes,priority) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [m.id,m.truckId,m.truckPlate||null,m.serviceType,m.cost,m.status,m.scheduledDate,m.completedDate||null,m.technicianName,m.notes,m.priority]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/maintenance/:id', async (req, res) => { try { const m = req.body; await pool.query('UPDATE maintenance_records SET truckId=?,truckPlate=?,serviceType=?,cost=?,status=?,scheduledDate=?,completedDate=?,technicianName=?,notes=?,priority=? WHERE id=?', [m.truckId,m.truckPlate||null,m.serviceType,m.cost,m.status,m.scheduledDate,m.completedDate||null,m.technicianName,m.notes,m.priority,req.params.id]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/fuel-logs', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM fuel_logs ORDER BY created_at DESC'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/fuel-logs', async (req, res) => { try { const f = req.body; await pool.query('INSERT INTO fuel_logs (id,truckId,truckPlate,driverId,driverName,litres,cost,odometer,location,date,fuelType) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [f.id,f.truckId,f.truckPlate||null,f.driverId,f.driverName||null,f.litres,f.cost,f.odometer,f.location,f.date,f.fuelType]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/fuel-requisitions', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM fuel_requisitions ORDER BY created_at DESC'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/fuel-requisitions', async (req, res) => { try { const r = req.body; await pool.query('INSERT INTO fuel_requisitions (id,truckId,truckPlate,driverId,driverName,litresRequested,estimatedCost,fuelDate,fuelType,branchId,branchName,dateRequested,status,reviewedBy,reviewedDate,verifiedBy,verifiedDate,approvedBy,approvedDate,rejectedBy,rejectedDate,rejectionReason,qrCodeData,purpose,redeemToken,redeemDate,redeemedByGasStation,redeemedAttendantSignature,redeemedActualLitres,redeemedActualCost,submittedBy,submittedById,destination,odometerReading) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [r.id,r.truckId,r.truckPlate||null,r.driverId,r.driverName||null,r.litresRequested,r.estimatedCost,r.fuelDate,r.fuelType,r.branchId,r.branchName||null,r.dateRequested,r.status||'Pending',r.reviewedBy||null,r.reviewedDate||null,r.verifiedBy||null,r.verifiedDate||null,r.approvedBy||null,r.approvedDate||null,r.rejectedBy||null,r.rejectedDate||null,r.rejectionReason||null,r.qrCodeData||null,r.purpose,r.redeemToken||null,r.redeemDate||null,r.redeemedByGasStation||null,r.redeemedAttendantSignature||null,r.redeemedActualLitres||null,r.redeemedActualCost||null,r.submittedBy||null,r.submittedById||null,r.destination||null,r.odometerReading||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.put('/api/fuel-requisitions/:id', async (req, res) => { try { const r = req.body; const cols = ['status','reviewedBy','reviewedDate','verifiedBy','verifiedDate','approvedBy','approvedDate','rejectedBy','rejectedDate','rejectionReason','qrCodeData','redeemToken','redeemDate','redeemedByGasStation','redeemedAttendantSignature','redeemedActualLitres','redeemedActualCost','litresRequested','estimatedCost','odometerReading','destination']; const setClauses = []; const vals = []; for (const c of cols) { if (r[c] !== undefined) { setClauses.push(c+'=?'); vals.push(r[c] === null ? null : r[c]); } } if (!setClauses.length) return res.status(400).json({error:'no fields to update'}); vals.push(req.params.id); await pool.query('UPDATE fuel_requisitions SET '+setClauses.join(',')+' WHERE id=?', vals); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/branches', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM branches'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/branches', async (req, res) => { try { const b = req.body; await pool.query('INSERT INTO branches (id,name,locationName,lat,lng,phone,manager) VALUES (?,?,?,?,?,?,?)', [b.id,b.name,b.locationName,b.lat,b.lng,b.phone||null,b.manager||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/activities', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 200'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/activities', async (req, res) => { try { const a = req.body; await pool.query('INSERT INTO user_activities (id,userId,userName,action,timestamp,details) VALUES (?,?,?,?,?,?)', [a.id,a.userId,a.userName,a.action,a.timestamp,a.details||null]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/dispatches', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM dispatch_records'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/dispatches', async (req, res) => { try { const d = req.body; await pool.query('INSERT INTO dispatch_records (id,date,driverId,driverName,truckId,truckPlate,destination,itemDescription,quantity,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [d.id,d.date,d.driverId,d.driverName,d.truckId,d.truckPlate,d.destination,d.itemDescription,d.quantity,d.status,d.notes]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/stock-movements', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM stock_movements'); res.json(r); } catch(e) { res.json([]); } });
app.post('/api/stock-movements', async (req, res) => { try { const s = req.body; await pool.query('INSERT INTO stock_movements (id,fromBranch,toBranch,itemDescription,itemsCount,status) VALUES (?,?,?,?,?,?)', [s.id,s.fromBranch,s.toBranch,s.itemDescription,s.itemsCount,s.status]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

app.get('/api/settings', async (_req, res) => { try { const [r] = await pool.query('SELECT * FROM app_settings'); const s = {}; (Array.isArray(r)?r:[]).forEach(row => { s[row.settingKey] = row.settingValue; }); res.json(s); } catch(e) { res.json({}); } });
app.put('/api/settings/:key', async (req, res) => { try { await pool.query('INSERT INTO app_settings (settingKey,settingValue) VALUES (?,?) ON DUPLICATE KEY UPDATE settingValue=?', [req.params.key,req.body.value,req.body.value]); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });
app.post('/api/reset', async (_req, res) => { try { await pool.query('DELETE FROM trucks'); await pool.query('DELETE FROM drivers'); await pool.query('DELETE FROM jobs'); await pool.query('DELETE FROM maintenance_records'); await pool.query('DELETE FROM fuel_logs'); await pool.query('DELETE FROM fuel_requisitions'); await pool.query('DELETE FROM dispatch_records'); await pool.query('DELETE FROM stock_movements'); await pool.query('DELETE FROM branches'); await pool.query('DELETE FROM user_activities'); res.json({ok:true}); } catch(e) { res.status(500).json({error:e.message}); } });

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });

app.listen(PORT, () => { console.log('[FleetCommand] Running on port '+PORT); });
