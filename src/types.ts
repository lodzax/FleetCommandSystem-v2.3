export type TruckStatus = 'Active' | 'Maintenance' | 'Out of Service' | 'Idle';

export interface Truck {
  id: string; // e.g., "TRK-001"
  plateNumber: string;
  type: string; // e.g., "CAT 777G Dump Truck", "Scania R500 Heavy Tipper", "Volvo FMX 440"
  model: string;
  capacity: string; // e.g., "40 Tons", "100 Tons"
  status: TruckStatus;
  fuelRate: number; // Litres per 100km
  currentLat: number;
  currentLng: number;
  driverId: string | null;
  assignedDriverName?: string;
  mileage: number; // km
  nextServiceMileage: number;
  lastServiceDate: string;
  imageUrl?: string;
}

export type DriverStatus = 'Active' | 'On Route' | 'Off Duty' | 'Restricted';

export interface Driver {
  id: string; // e.g., "DRV-101"
  name: string;
  status: DriverStatus;
  licenseClass: string; // e.g., "Class 2 Heavy", "Class 4 Professional"
  assignedTruckId: string | null;
  assignedTruckPlate?: string;
  phone: string;
  email: string;
  rating: number; // 0.0 - 5.0
  tripsCompleted: number;
  lastActive: string;
  avatar?: string;
  idNumber?: string;
  isVerified?: boolean;
}

export type JobStatus = 'Pending' | 'Assigned' | 'In Transit' | 'Completed';
export type CargoType = 'Coal' | 'Chrome Ore' | 'Gold Ore' | 'Concentrate' | 'Heavy Equipment' | 'Mining Supplies';

export interface Job {
  id: string; // e.g., "JOB-801"
  title: string;
  cargoType: CargoType;
  weight: number; // Tons
  source: string; // e.g., "Hwange Coal Fields"
  sourceLat: number;
  sourceLng: number;
  destination: string; // e.g., "Bulawayo Power Station"
  destinationLat: number;
  destinationLng: number;
  status: JobStatus;
  driverId: string | null;
  truckId: string | null;
  driverName?: string;
  truckPlate?: string;
  scheduledDate: string;
  dispatchTime?: string;
  completionTime?: string;
  estimatedHours: number;
  routeCoordinates?: [number, number][]; // Line segments
  fuelAllocated: number; // Litres
  income: number; // USD ($)
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface MaintenanceRecord {
  id: string; // e.g., "MNT-201"
  truckId: string;
  truckPlate?: string;
  serviceType: string; // e.g., "Hydraulic Fluid Flushing", "Engine Diagnostics & Filter Change", "Heavy Hauler Brake Replacement"
  cost: number; // in USD ($)
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  technicianName: string;
  notes: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface FuelLog {
  id: string;
  truckId: string;
  truckPlate?: string;
  driverId: string;
  driverName?: string;
  litres: number;
  cost: number; // in USD ($)
  odometer: number; // km
  location: string; // e.g., "Hwange Depo Station", "Harare Gateway Fueling"
  date: string;
  fuelType: 'Diesel' | 'Petrol';
}

export interface FuelRequisition {
  id: string;
  truckId: string;
  truckPlate?: string;
  driverId: string;
  driverName?: string;
  litresRequested: number;
  estimatedCost: number;
  dateRequested: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Redeemed';
  approvedDate?: string;
  purpose: string;
  redeemToken?: string;
  redeemDate?: string;
  redeemedByGasStation?: string;
  redeemedAttendantSignature?: string;
  redeemedActualLitres?: number;
  redeemedActualCost?: number;
}

export interface Branch {
  id: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  phone?: string;
  manager?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Director' | 'Fleet Manager' | 'Dispatch Manager' | 'Driver';
  status: 'Verified' | 'Pending' | 'Suspended';
  memberSince: string;
  avatar?: string;
  password?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string; // e.g., "Dispatched job JOB-302", "Scheduled Maintenance for TRK-010"
  timestamp: string; // ISO String
  details?: string;
}

export interface DispatchRecord {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  truckId: string;
  truckPlate: string;
  destination: string;
  itemDescription: string;
  quantity: string;
  status: 'Pending' | 'In Transit' | 'Delivered';
  notes: string;
}

export interface StockMovement {
  id: string;
  fromBranch: string;
  toBranch: string;
  itemDescription: string;
  itemsCount: number;
  status: 'Pending' | 'In Transit' | 'Completed';
}

