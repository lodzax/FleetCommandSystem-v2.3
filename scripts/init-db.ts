import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
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

  // Create database
  await connection.query(
    'CREATE DATABASE IF NOT EXISTS fleetcommand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  await connection.query('USE fleetcommand');
  console.log('Database fleetcommand ready');

  // Run schema
  const schemaPath = path.resolve(__dirname, '../server/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await connection.query(schema);
  console.log('Schema executed');

  // Hash the default admin password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Update seed user with hashed password (replaces the plaintext one from schema.sql)
  await connection.query(
    `INSERT INTO users (id, name, email, role, status, memberSince, password)
     VALUES ('6a0af25f60e8427cb4294428', 'Tadiwa Magora', 'admin@fleetcommand.co.zw', 'Administrator', 'Verified', '2025-01-01', ?)
     ON DUPLICATE KEY UPDATE password = ?`,
    [hashedPassword, hashedPassword]
  );
  console.log('Admin user seeded with hashed password');

  // Add additional seed users with hashed passwords
  const extraUsers = [
    { id: 'usr-director-1', name: 'Simba Chikwanha', email: 'director@fleetcommand.co.zw', role: 'Director', password: 'director123' },
    { id: 'usr-manager-1', name: 'Tendai Mukanya', email: 'manager@fleetcommand.co.zw', role: 'Manager', password: 'manager123' },
    { id: 'usr-accounts-1', name: 'Rumbidzai Sithole', email: 'accounts@fleetcommand.co.zw', role: 'Accounts', password: 'accounts123' },
    { id: 'usr-treasurer-1', name: 'Kudzai Banda', email: 'treasurer@fleetcommand.co.zw', role: 'Treasurer', password: 'treasurer123' },
    { id: 'usr-driver-1', name: 'Tafadzwa Gumbo', email: 'driver@fleetcommand.co.zw', role: 'Driver', password: 'driver123' },
    { id: 'usr-attendant-1', name: 'Chipo Dube', email: 'attendant@fleetcommand.co.zw', role: 'Attendant', password: 'attendant123' },
  ];

  for (const u of extraUsers) {
    const hp = await bcrypt.hash(u.password, 10);
    await connection.query(
      `INSERT INTO users (id, name, email, role, status, memberSince, password)
       VALUES (?, ?, ?, ?, 'Verified', '2025-06-01', ?)
       ON DUPLICATE KEY UPDATE password = ?`,
      [u.id, u.name, u.email, u.role, hp, hp]
    );
  }
  console.log(`Seeded ${extraUsers.length} additional users`);

  // Seed trucks
  const trucks = [
    { id: 'TRK-101', plate: 'AGA-9302', type: 'CAT 777G Dump Truck', model: 'Caterpillar 777G', capacity: '100 Tons', status: 'Active', fuelRate: 2.18, lat: -18.3647, lng: 26.5000, mileage: 14230, nextService: 25000, serviceDate: '2026-02-15' },
    { id: 'TRK-102', plate: 'AFR-4512', type: 'Scania R500 Heavy Tipper', model: 'Scania R500', capacity: '40 Tons', status: 'Active', fuelRate: 1.95, lat: -17.8292, lng: 31.0522, mileage: 89120, nextService: 95000, serviceDate: '2026-03-10' },
    { id: 'TRK-103', plate: 'AAM-8723', type: 'Volvo FMX 440', model: 'Volvo FMX 440', capacity: '40 Tons', status: 'Maintenance', fuelRate: 1.88, lat: -20.1500, lng: 28.5833, mileage: 65430, nextService: 70000, serviceDate: '2026-04-22' },
    { id: 'TRK-104', plate: 'ABF-3341', type: 'Bell B60D Articulated Dump Truck', model: 'Bell B60D', capacity: '60 Tons', status: 'Active', fuelRate: 2.05, lat: -18.3647, lng: 26.5000, mileage: 45120, nextService: 55000, serviceDate: '2026-05-01' },
    { id: 'TRK-105', plate: 'ACD-6178', type: 'Komatsu HD785-7', model: 'Komatsu HD785', capacity: '95 Tons', status: 'Active', fuelRate: 2.22, lat: -17.8292, lng: 31.0522, mileage: 23400, nextService: 35000, serviceDate: '2026-05-18' },
    { id: 'TRK-106', plate: 'AEG-2049', type: 'Scania R620 Heavy Hauler', model: 'Scania R620', capacity: '50 Tons', status: 'Idle', fuelRate: 2.10, lat: -20.1500, lng: 28.5833, mileage: 12300, nextService: 25000, serviceDate: '2026-04-05' },
  ];

  for (const t of trucks) {
    await connection.query(
      `INSERT IGNORE INTO trucks (id, plateNumber, type, model, capacity, status, fuelRate, currentLat, currentLng, mileage, nextServiceMileage, lastServiceDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.plate, t.type, t.model, t.capacity, t.status, t.fuelRate, t.lat, t.lng, t.mileage, t.nextService, t.serviceDate]
    );
  }
  console.log(`Seeded ${trucks.length} trucks`);

  // Seed drivers matching driver user accounts
  const drivers = [
    { id: 'DRV-001', name: 'Tafadzwa Gumbo', status: 'Active', license: 'Class 2 Heavy Duty', truckId: 'TRK-101', phone: '+263 77 345 6112', email: 'driver@fleetcommand.co.zw', rating: 4.9, trips: 142 },
    { id: 'DRV-002', name: 'John Moyo', status: 'Active', license: 'Class 2 Heavy Duty', truckId: 'TRK-102', phone: '+263 78 221 4455', email: 'john.moyo@fleetcommand.co.zw', rating: 4.8, trips: 98 },
    { id: 'DRV-003', name: 'Farai Moyo', status: 'On Route', license: 'Class 2 Heavy Duty + HAZMAT', truckId: 'TRK-104', phone: '+263 71 889 2031', email: 'farai.moyo@fleetcommand.co.zw', rating: 4.7, trips: 215 },
    { id: 'DRV-004', name: 'Chipo Sibanda', status: 'Off Duty', license: 'Class 2 Heavy Duty', truckId: null, phone: '+263 77 104 9988', email: 'chipo.s@fleetcommand.co.zw', rating: 4.6, trips: 64 },
    { id: 'DRV-005', name: 'Blessing Ndlovu', status: 'On Route', license: 'Class 2 Heavy Duty', truckId: 'TRK-105', phone: '+263 73 512 8834', email: 'blessing.n@fleetcommand.co.zw', rating: 4.5, trips: 87 },
  ];

  for (const d of drivers) {
    await connection.query(
      `INSERT IGNORE INTO drivers (id, name, status, licenseClass, assignedTruckId, phone, email, rating, tripsCompleted, lastActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active Now')`,
      [d.id, d.name, d.status, d.license, d.truckId, d.phone, d.email, d.rating, d.trips]
    );
  }
  console.log(`Seeded ${drivers.length} drivers`);

  // Seed some fuel requisitions for demo purposes
  const hashedReqPw = await bcrypt.hash('admin123', 10);
  const requisitions = [
    { id: 'REQ-301', truckId: 'TRK-101', plate: 'AGA-9302', driverId: 'DRV-001', driverName: 'Tafadzwa Gumbo', litres: 400, cost: 872, purpose: 'Ngezi Platinum heavy haul dispatch run', status: 'Approved', branchId: 'BR-101', branchName: 'Hwange Central Depot', fuelDate: '2026-06-01', token: '482917', approvedBy: 'Tadiwa Magora', approvedDate: '2026-05-30' },
    { id: 'REQ-302', truckId: 'TRK-104', plate: 'ABF-3341', driverId: 'DRV-003', driverName: 'Farai Moyo', litres: 350, cost: 742, purpose: 'Hwange to Bulawayo coal transport', status: 'Pending', branchId: 'BR-101', branchName: 'Hwange Central Depot', fuelDate: '2026-06-02' },
    { id: 'REQ-303', truckId: 'TRK-102', plate: 'AFR-4512', driverId: 'DRV-002', driverName: 'John Moyo', litres: 500, cost: 970, purpose: 'Harare HQ equipment delivery run', status: 'Redeemed', branchId: 'BR-103', branchName: 'Harare HQ Dispatch', fuelDate: '2026-05-28', token: '615204', approvedBy: 'Simba Chikwanha', approvedDate: '2026-05-27', redeemedByGasStation: 'Zuva Hwange Service Station', redeemedActualLitres: 495, redeemedActualCost: 958, redeemDate: '2026-05-29' },
  ];

  for (const r of requisitions) {
    await connection.query(
      `INSERT IGNORE INTO fuel_requisitions (id, truckId, truckPlate, driverId, driverName, litresRequested, estimatedCost, fuelDate, fuelType, branchId, branchName, dateRequested, status, approvedBy, approvedDate, redeemToken, redeemedByGasStation, redeemedActualLitres, redeemedActualCost, redeemDate, purpose, submittedBy, submittedById)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Diesel', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id, r.truckId, r.plate, r.driverId, r.driverName, r.litres, r.cost,
        r.fuelDate, r.branchId, r.branchName, r.fuelDate,
        r.status,
        r.approvedBy || null, r.approvedDate || null,
        r.token || null,
        (r as any).redeemedByGasStation || null,
        (r as any).redeemedActualLitres || null,
        (r as any).redeemedActualCost || null,
        (r as any).redeemDate || null,
        r.purpose, 'Tadiwa Magora', '6a0af25f60e8427cb4294428'
      ]
    );
  }
  console.log(`Seeded ${requisitions.length} fuel requisitions`);

  await connection.end();
  console.log('Database initialization complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:    admin@fleetcommand.co.zw / admin123');
  console.log('  Director: director@fleetcommand.co.zw / director123');
  console.log('  Manager:  manager@fleetcommand.co.zw / manager123');
  console.log('  Accounts: accounts@fleetcommand.co.zw / accounts123');
  console.log('  Driver:   driver@fleetcommand.co.zw / driver123');
  console.log('    → Driver profile: Tafadzwa Gumbo, assigned to TRK-101 (AGA-9302)');
  console.log('  Attendant: attendant@fleetcommand.co.zw / attendant123');
}

initDB().catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
