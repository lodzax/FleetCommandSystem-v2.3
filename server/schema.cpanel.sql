-- FleetCommandSystem Database Schema (cPanel version)
-- Run this AFTER creating the database via cPanel MySQL Databases wizard
-- Replace `npivfupq_fleet` with your actual database name if different

USE npivfupq_fleet;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  role ENUM('Administrator','Director','Manager','Accounts','Treasurer','Driver','Attendant') NOT NULL DEFAULT 'Driver',
  status ENUM('Verified','Pending','Suspended') NOT NULL DEFAULT 'Pending',
  memberSince VARCHAR(20) NOT NULL,
  avatar TEXT,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trucks
CREATE TABLE IF NOT EXISTS trucks (
  id VARCHAR(50) PRIMARY KEY,
  plateNumber VARCHAR(20) NOT NULL,
  type VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  status ENUM('Active','Maintenance','Out of Service','Idle') NOT NULL DEFAULT 'Idle',
  fuelRate DECIMAL(5,2) NOT NULL DEFAULT 0,
  currentLat DECIMAL(10,6) NOT NULL DEFAULT 0,
  currentLng DECIMAL(10,6) NOT NULL DEFAULT 0,
  driverId VARCHAR(50) NULL,
  assignedDriverName VARCHAR(100),
  mileage INT NOT NULL DEFAULT 0,
  nextServiceMileage INT NOT NULL DEFAULT 20000,
  lastServiceDate VARCHAR(20),
  imageUrl TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver (driverId)
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('Active','On Route','Off Duty','Restricted') NOT NULL DEFAULT 'Off Duty',
  licenseClass VARCHAR(50) NOT NULL,
  assignedTruckId VARCHAR(50) NULL,
  assignedTruckPlate VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(150),
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.0,
  tripsCompleted INT NOT NULL DEFAULT 0,
  lastActive VARCHAR(50),
  avatar TEXT,
  idNumber VARCHAR(50),
  isVerified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_truck (assignedTruckId)
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  cargoType ENUM('Coal','Chrome Ore','Gold Ore','Concentrate','Heavy Equipment','Mining Supplies') NOT NULL,
  weight DECIMAL(10,2) NOT NULL DEFAULT 0,
  source VARCHAR(150) NOT NULL,
  sourceLat DECIMAL(10,6) NOT NULL DEFAULT 0,
  sourceLng DECIMAL(10,6) NOT NULL DEFAULT 0,
  destination VARCHAR(150) NOT NULL,
  destinationLat DECIMAL(10,6) NOT NULL DEFAULT 0,
  destinationLng DECIMAL(10,6) NOT NULL DEFAULT 0,
  status ENUM('Pending','Assigned','In Transit','Completed') NOT NULL DEFAULT 'Pending',
  driverId VARCHAR(50) NULL,
  truckId VARCHAR(50) NULL,
  driverName VARCHAR(100),
  truckPlate VARCHAR(20),
  scheduledDate VARCHAR(20),
  dispatchTime VARCHAR(20),
  completionTime VARCHAR(20),
  estimatedHours DECIMAL(5,1) NOT NULL DEFAULT 0,
  routeCoordinates JSON,
  fuelAllocated DECIMAL(10,2) NOT NULL DEFAULT 0,
  income DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver (driverId),
  INDEX idx_truck (truckId),
  INDEX idx_status (status)
);

-- Maintenance Records
CREATE TABLE IF NOT EXISTS maintenance_records (
  id VARCHAR(50) PRIMARY KEY,
  truckId VARCHAR(50) NOT NULL,
  truckPlate VARCHAR(20),
  serviceType VARCHAR(200) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('Scheduled','In Progress','Completed') NOT NULL DEFAULT 'Scheduled',
  scheduledDate VARCHAR(20),
  completedDate VARCHAR(20),
  technicianName VARCHAR(100) NOT NULL,
  notes TEXT,
  priority ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_truck (truckId)
);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id VARCHAR(50) PRIMARY KEY,
  truckId VARCHAR(50) NOT NULL,
  truckPlate VARCHAR(20),
  driverId VARCHAR(50) NOT NULL,
  driverName VARCHAR(100),
  litres DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  odometer INT NOT NULL DEFAULT 0,
  location VARCHAR(200),
  date VARCHAR(20),
  fuelType ENUM('Diesel','Petrol') NOT NULL DEFAULT 'Diesel',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_truck (truckId),
  INDEX idx_date (date)
);

-- Fuel Requisitions
CREATE TABLE IF NOT EXISTS fuel_requisitions (
  id VARCHAR(50) PRIMARY KEY,
  truckId VARCHAR(50) NOT NULL,
  truckPlate VARCHAR(20),
  driverId VARCHAR(50) NOT NULL,
  driverName VARCHAR(100),
  litresRequested DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimatedCost DECIMAL(10,2) NOT NULL DEFAULT 0,
  fuelDate VARCHAR(20),
  fuelType ENUM('Diesel','Petrol') NOT NULL DEFAULT 'Diesel',
  branchId VARCHAR(50),
  branchName VARCHAR(100),
  dateRequested VARCHAR(20),
  status ENUM('Pending','Reviewed','Verified','Approved','Rejected','Redeemed') NOT NULL DEFAULT 'Pending',
  reviewedBy VARCHAR(100),
  reviewedDate VARCHAR(20),
  verifiedBy VARCHAR(100),
  verifiedDate VARCHAR(20),
  approvedBy VARCHAR(100),
  approvedDate VARCHAR(20),
  rejectedBy VARCHAR(100),
  rejectedDate VARCHAR(20),
  rejectionReason TEXT,
  qrCodeData LONGTEXT,
  purpose TEXT,
  redeemToken VARCHAR(10),
  redeemDate VARCHAR(20),
  redeemedByGasStation VARCHAR(200),
  redeemedAttendantSignature VARCHAR(200),
  redeemedActualLitres DECIMAL(10,2),
  redeemedActualCost DECIMAL(10,2),
  submittedBy VARCHAR(100),
  submittedById VARCHAR(50),
  destination VARCHAR(255) DEFAULT NULL,
  odometerReading INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_truck (truckId),
  INDEX idx_status (status)
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  locationName VARCHAR(150),
  lat DECIMAL(10,6) NOT NULL DEFAULT 0,
  lng DECIMAL(10,6) NOT NULL DEFAULT 0,
  phone VARCHAR(30),
  manager VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Activities / Audit Log
CREATE TABLE IF NOT EXISTS user_activities (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  userName VARCHAR(100),
  action TEXT NOT NULL,
  timestamp VARCHAR(30),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (userId)
);

-- Dispatch Records
CREATE TABLE IF NOT EXISTS dispatch_records (
  id VARCHAR(50) PRIMARY KEY,
  date VARCHAR(20),
  driverId VARCHAR(50),
  driverName VARCHAR(100),
  truckId VARCHAR(50),
  truckPlate VARCHAR(20),
  destination VARCHAR(200),
  itemDescription TEXT,
  quantity VARCHAR(50),
  status ENUM('Pending','In Transit','Delivered') NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(50) PRIMARY KEY,
  fromBranch VARCHAR(100),
  toBranch VARCHAR(100),
  itemDescription TEXT,
  itemsCount INT NOT NULL DEFAULT 0,
  status ENUM('Pending','In Transit','Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  settingKey VARCHAR(50) PRIMARY KEY,
  settingValue TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default settings (set via API on first launch)
-- App settings are created by the application on first run
