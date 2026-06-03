import { Truck, Driver, Job, MaintenanceRecord, FuelLog, FuelRequisition, User, UserActivity } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: "6a0af25f60e8427cb4294428",
    name: "Tadiwa Magora",
    email: "tadiwamagora45x@gmail.com",
    role: "Administrator",
    status: "Verified",
    memberSince: "18 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-2",
    name: "xxassasinhunterxx",
    email: "xxassasinhunterxx@gmail.com",
    role: "Administrator",
    status: "Verified",
    memberSince: "20 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-3",
    name: "John Mandaza",
    email: "john.mandaza@fleetcommand.co.zw",
    role: "Manager",
    status: "Verified",
    memberSince: "22 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-4",
    name: "Sarah Gumbo",
    email: "s.gumbo@fleetcommand.co.zw",
    role: "Manager",
    status: "Verified",
    memberSince: "24 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-5",
    name: "Alfred Moyo",
    email: "alfred.moyo@fleetcommand.co.zw",
    role: "Director",
    status: "Verified",
    memberSince: "26 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-6",
    name: "Grace Sibanda",
    email: "grace.sibanda@fleetcommand.co.zw",
    role: "Accounts",
    status: "Verified",
    memberSince: "28 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-7",
    name: "Taurai Chigumbura",
    email: "taurai.c@fleetcommand.co.zw",
    role: "Treasurer",
    status: "Verified",
    memberSince: "29 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-8",
    name: "Simba Chikosi",
    email: "simba.c@fleetcommand.co.zw",
    role: "Driver",
    status: "Verified",
    memberSince: "22 May 2026",
    avatar: "",
    password: "password"
  },
  {
    id: "user-9",
    name: "Cleophas Sithole",
    email: "cleo.sithole@fleetcommand.co.zw",
    role: "Attendant",
    status: "Verified",
    memberSince: "29 May 2026",
    avatar: "",
    password: "password"
  }
];

export const INITIAL_TRUCKS: Truck[] = [
  {
    id: "TRK-101",
    plateNumber: "AGA-9302",
    type: "CAT 777G Dump Truck",
    model: "Caterpillar 2024",
    capacity: "100 Tons",
    status: "Active",
    fuelRate: 48,
    currentLat: -18.3647,
    currentLng: 26.5000, // Hwange
    driverId: "DRV-001",
    mileage: 64200,
    nextServiceMileage: 68000,
    lastServiceDate: "2026-04-12",
    trackerImei: "861234567890101",
    trackerModel: "EH002 GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456789",
    lastGpsUpdate: "2026-06-03T08:15:00Z",
    trackerBattery: 85,
    trackerSpeed: 42
  },
  {
    id: "TRK-102",
    plateNumber: "ADX-4029",
    type: "Scania R500 Heavy Tipper",
    model: "Scania R-Series",
    capacity: "40 Tons",
    status: "Active",
    fuelRate: 35,
    currentLat: -20.1406,
    currentLng: 28.5856, // Bulawayo
    driverId: "DRV-002",
    mileage: 124500,
    nextServiceMileage: 125000,
    lastServiceDate: "2026-05-10",
    trackerImei: "861234567890102",
    trackerModel: "EH002 GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456790",
    lastGpsUpdate: "2026-06-03T08:30:00Z",
    trackerBattery: 62,
    trackerSpeed: 55
  },
  {
    id: "TRK-103",
    plateNumber: "ABY-1284",
    type: "Volvo FMX 440 Tipper",
    model: "Volvo Truck Ltd",
    capacity: "35 Tons",
    status: "Maintenance",
    fuelRate: 32,
    currentLat: -18.6657,
    currentLng: 30.3473, // Ngezi Mine
    driverId: null,
    mileage: 182000,
    nextServiceMileage: 180000, // Overdue service!
    lastServiceDate: "2026-03-05",
    trackerImei: "861234567890103",
    trackerModel: "EH003 GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456791",
    lastGpsUpdate: "2026-06-03T07:00:00Z",
    trackerBattery: 24,
    trackerSpeed: 0
  },
  {
    id: "TRK-104",
    plateNumber: "AFD-3301",
    type: "CAT 773G Off-Highway Truck",
    model: "Caterpillar 2023",
    capacity: "60 Tons",
    status: "Idle",
    fuelRate: 42,
    currentLat: -19.6700,
    currentLng: 30.0000, // Shurugwi
    driverId: "DRV-003",
    mileage: 48900,
    nextServiceMileage: 55000,
    lastServiceDate: "2026-05-02",
    trackerImei: "861234567890104",
    trackerModel: "ET006 GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456792",
    lastGpsUpdate: "2026-06-03T06:45:00Z",
    trackerBattery: 91,
    trackerSpeed: 0
  },
  {
    id: "TRK-105",
    plateNumber: "AEZ-8890",
    type: "Mercedes-Benz Actros 3344",
    model: "Actros Flatbed Heavy",
    capacity: "45 Tons",
    status: "Active",
    fuelRate: 38,
    currentLat: -17.8252,
    currentLng: 31.0530, // Harare Depot
    driverId: "DRV-005",
    mileage: 198000,
    nextServiceMileage: 200000,
    lastServiceDate: "2026-05-18",
    trackerImei: "861234567890105",
    trackerModel: "EH002 GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456793",
    lastGpsUpdate: "2026-06-03T08:22:00Z",
    trackerBattery: 78,
    trackerSpeed: 0
  },
  {
    id: "TRK-106",
    plateNumber: "AFG-1249",
    type: "Bell B45E Articulated Dumper",
    model: "Bell Equipment 2025",
    capacity: "45 Tons",
    status: "Idle",
    fuelRate: 40,
    currentLat: -20.3204,
    currentLng: 30.0638, // Mimosa Mine
    driverId: null,
    mileage: 32100,
    nextServiceMileage: 35000,
    lastServiceDate: "2026-04-20",
    trackerImei: "861234567890106",
    trackerModel: "IP67 Waterproof GPS Vehicle Tracker",
    trackerSimCard: "SIM-898602100123456794",
    lastGpsUpdate: "2026-06-03T05:30:00Z",
    trackerBattery: 55,
    trackerSpeed: 0
  },
  {
    id: "TRK-107",
    plateNumber: "AGX-2201",
    type: "Sinotruk HOWO 6x4 Tipper",
    model: "HOWO Heavy Duties",
    capacity: "30 Tons",
    status: "Out of Service",
    fuelRate: 34,
    currentLat: -19.4500,
    currentLng: 29.8167, // Gweru Hub
    driverId: null,
    mileage: 231000,
    nextServiceMileage: 230000, // Overdue!
    lastServiceDate: "2026-02-15"
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: "DRV-001",
    name: "Tadiwa Magora",
    status: "Active",
    licenseClass: "Class 2 Heavy Duty",
    assignedTruckId: "TRK-101",
    phone: "+263 77 345 6112",
    email: "tadiwamagora45x@gmail.com",
    rating: 4.9,
    tripsCompleted: 142,
    lastActive: "Active Now"
  },
  {
    id: "DRV-002",
    name: "John Moyo",
    status: "Active",
    licenseClass: "Class 2 Heavy Duty",
    assignedTruckId: "TRK-102",
    phone: "+263 78 221 4455",
    email: "john.moyo@fleetcommand.co.zw",
    rating: 4.8,
    tripsCompleted: 98,
    lastActive: "Active Now"
  },
  {
    id: "DRV-003",
    name: "Farai Moyo",
    status: "On Route",
    licenseClass: "Class 2 Heavy Duty + HAZMAT",
    assignedTruckId: "TRK-104",
    phone: "+263 71 889 2031",
    email: "farai.moyo@fleetcommand.co.zw",
    rating: 4.7,
    tripsCompleted: 215,
    lastActive: "Active Now"
  },
  {
    id: "DRV-004",
    name: "Chipo Sibanda",
    status: "Off Duty",
    licenseClass: "Class 2 Heavy Duty",
    assignedTruckId: null,
    phone: "+263 77 104 9988",
    email: "chipo.s@fleetcommand.co.zw",
    rating: 4.6,
    tripsCompleted: 64,
    lastActive: "1 day ago"
  },
  {
    id: "DRV-005",
    name: "Blessing Ndlovu",
    status: "On Route",
    licenseClass: "Class 2 Heavy Duty",
    assignedTruckId: "TRK-105",
    phone: "+263 73 512 8834",
    email: "blessing.n@fleetcommand.co.zw",
    rating: 4.5,
    tripsCompleted: 87,
    lastActive: "Active Now"
  },
  {
    id: "DRV-006",
    name: "Lovemore Gumbo",
    status: "Off Duty",
    licenseClass: "Class 4 Standard Heavy",
    assignedTruckId: null,
    phone: "+263 77 400 1205",
    email: "lovemore.g@fleetcommand.co.zw",
    rating: 4.2,
    tripsCompleted: 13,
    lastActive: "3 days ago"
  }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: "JOB-801",
    title: "Coal Haulage - Hwange to Bulawayo",
    cargoType: "Coal",
    weight: 95,
    source: "Hwange Coal Fields",
    sourceLat: -18.3647,
    sourceLng: 26.5000,
    destination: "Bulawayo Power Station",
    destinationLat: -20.1406,
    destinationLng: 28.5856,
    status: "In Transit",
    driverId: "DRV-001",
    truckId: "TRK-101",
    scheduledDate: "2026-05-28",
    dispatchTime: "06:30",
    estimatedHours: 5.5,
    fuelAllocated: 180,
    income: 28500,
    routeCoordinates: [
      [-18.3647, 26.5000],
      [-19.1000, 27.5000],
      [-20.1406, 28.5856]
    ]
  },
  {
    id: "JOB-802",
    title: "Platinum Concentrate Dispatch - Ngezi to Gweru Smelter",
    cargoType: "Concentrate",
    weight: 38,
    source: "Zimplats Ngezi Mine",
    sourceLat: -18.6657,
    sourceLng: 30.3473,
    destination: "Gweru Metallurgy Smelter",
    destinationLat: -19.4500,
    destinationLng: 29.8167,
    status: "Assigned",
    driverId: "DRV-002",
    truckId: "TRK-102",
    scheduledDate: "2026-05-28",
    estimatedHours: 3.2,
    fuelAllocated: 95,
    income: 16400,
    routeCoordinates: [
      [-18.6657, 30.3473],
      [-19.1000, 30.1000],
      [-19.4500, 29.8167]
    ]
  },
  {
    id: "JOB-803",
    title: "Chrome Ore Transport - Shurugwi to Harare Port Depot",
    cargoType: "Chrome Ore",
    weight: 55,
    source: "Shurugwi Chrome Pit",
    sourceLat: -19.6700,
    sourceLng: 30.0000,
    destination: "Harare Gateway Fueling & Freight Hub",
    destinationLat: -17.8252,
    destinationLng: 31.0530,
    status: "In Transit",
    driverId: "DRV-003",
    truckId: "TRK-104",
    scheduledDate: "2026-05-28",
    dispatchTime: "05:00",
    estimatedHours: 4.8,
    fuelAllocated: 160,
    income: 34200,
    routeCoordinates: [
      [-19.6700, 30.0000],
      [-19.4500, 29.8167],
      [-18.6657, 30.3473],
      [-17.8252, 31.0530]
    ]
  },
  {
    id: "JOB-804",
    title: "Heavy Excavator Mobilization - Bulawayo to Ngezi",
    cargoType: "Heavy Equipment",
    weight: 42,
    source: "Bulawayo Heavy Yard",
    sourceLat: -20.1406,
    sourceLng: 28.5856,
    destination: "Zimplats Ngezi Mine",
    destinationLat: -18.6657,
    destinationLng: 30.3473,
    status: "Pending",
    driverId: null,
    truckId: null,
    scheduledDate: "2026-05-29",
    estimatedHours: 6.0,
    fuelAllocated: 240,
    income: 48000
  },
  {
    id: "JOB-805",
    title: "High-Grade Gold Ore Express - Mimosa to Harare Refinery",
    cargoType: "Gold Ore",
    weight: 30,
    source: "Mimosa Gold Shaft B",
    sourceLat: -20.3204,
    sourceLng: 30.0638,
    destination: "Harare Gateway Fueling & Freight Hub",
    destinationLat: -17.8252,
    destinationLng: 31.0530,
    status: "Completed",
    driverId: "DRV-005",
    truckId: "TRK-105",
    scheduledDate: "2026-05-27",
    dispatchTime: "08:00",
    completionTime: "14:15",
    estimatedHours: 5.8,
    fuelAllocated: 175,
    income: 42000,
    routeCoordinates: [
      [-20.3204, 30.0638],
      [-20.0700, 30.8300],
      [-17.8252, 31.0530]
    ]
  }
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: "MNT-201",
    truckId: "TRK-103",
    serviceType: "Heavy Hauler Brake Replacement & Hydraulic Seal",
    cost: 38400,
    status: "In Progress",
    scheduledDate: "2026-05-26",
    technicianName: "Chamu Mudenda",
    notes: "Front axles and hydraulic pressure manifold both leaking. Overhaul ongoing.",
    priority: "High"
  },
  {
    id: "MNT-202",
    truckId: "TRK-101",
    serviceType: "CAT Engine Diagnostics & Filters Service",
    cost: 14500,
    status: "Completed",
    scheduledDate: "2026-04-12",
    completedDate: "2026-04-13",
    technicianName: "Maxwell Gumbo",
    notes: "Oils replaced, fuel filters flushed, turbine telemetry calibrated.",
    priority: "Medium"
  },
  {
    id: "MNT-203",
    truckId: "TRK-107",
    serviceType: "Chassis Welding & Stress Crack Repair",
    cost: 29000,
    status: "Scheduled",
    scheduledDate: "2026-05-30",
    technicianName: "Chamu Mudenda",
    notes: "Cracks observed in main tip bin pivot joint. Major load risk.",
    priority: "High"
  },
  {
    id: "MNT-204",
    truckId: "TRK-102",
    serviceType: "Scheduled Tire Rotation & Alignment",
    cost: 8600,
    status: "Completed",
    scheduledDate: "2026-05-10",
    completedDate: "2026-05-10",
    technicianName: "Maxwell Gumbo",
    notes: "Replaced 4 rear inner dual tires. Air pressures calibrated.",
    priority: "Low"
  }
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: "FL-901",
    truckId: "TRK-101",
    driverId: "DRV-001",
    litres: 350,
    cost: 7700, // in R (Approx R22/Litrea)
    odometer: 63800,
    location: "Hwange Depo Station",
    date: "2026-05-25",
    fuelType: "Diesel"
  },
  {
    id: "FL-902",
    truckId: "TRK-102",
    driverId: "DRV-002",
    litres: 180,
    cost: 3960,
    odometer: 124100,
    location: "Bulawayo Gateway Station",
    date: "2026-05-26",
    fuelType: "Diesel"
  },
  {
    id: "FL-903",
    truckId: "TRK-104",
    driverId: "DRV-003",
    litres: 240,
    cost: 5280,
    odometer: 48600,
    location: "Gweru Fuel depot",
    date: "2026-05-26",
    fuelType: "Diesel"
  },
  {
    id: "FL-904",
    truckId: "TRK-105",
    driverId: "DRV-005",
    litres: 310,
    cost: 6820,
    odometer: 197500,
    location: "Harare Gateway Fueling",
    date: "2026-05-27",
    fuelType: "Diesel"
  },
  {
    id: "FL-905",
    truckId: "TRK-101",
    driverId: "DRV-001",
    litres: 320,
    cost: 7040,
    odometer: 64150,
    location: "Hwange Depo Station",
    date: "2026-05-27",
    fuelType: "Diesel"
  }
];

export const INITIAL_REQUISITIONS: FuelRequisition[] = [
  {
    id: "REQ-301",
    truckId: "TRK-101",
    driverId: "DRV-001",
    litresRequested: 350,
    estimatedCost: 763,
    fuelDate: "2026-05-25",
    fuelType: "Diesel",
    branchId: "BR-101",
    branchName: "Hwange Central Depot",
    dateRequested: "2026-05-25",
    status: "Approved",
    reviewedBy: "Tadiwa Magora",
    reviewedDate: "2026-05-25",
    approvedBy: "Tadiwa Magora",
    approvedDate: "2026-05-25",
    purpose: "Routine haulage coal route"
  },
  {
    id: "REQ-302",
    truckId: "TRK-104",
    driverId: "DRV-003",
    litresRequested: 240,
    estimatedCost: 523,
    fuelDate: "2026-05-26",
    fuelType: "Diesel",
    branchId: "BR-102",
    branchName: "Bulawayo Transit Depot",
    dateRequested: "2026-05-26",
    status: "Reviewed",
    reviewedBy: "Tadiwa Magora",
    reviewedDate: "2026-05-26",
    purpose: "Chrome Ore dispatch Shurugwi Route"
  },
  {
    id: "REQ-303",
    truckId: "TRK-102",
    driverId: "DRV-002",
    litresRequested: 190,
    estimatedCost: 414,
    fuelDate: "2026-05-28",
    fuelType: "Diesel",
    branchId: "BR-103",
    branchName: "Harare HQ Dispatch",
    dateRequested: "2026-05-28",
    status: "Pending",
    purpose: "Platinum Concentrate Ngezi Corridor run"
  }
];

export const INITIAL_ACTIVITIES: UserActivity[] = [
  {
    id: "ACT-001",
    userId: "6a0af25f60e8427cb4294428",
    userName: "Tadiwa Magora",
    action: "Assigned Job JOB-801 to TRK-101 / DRV-001",
    timestamp: "2026-05-28T05:10:00Z"
  },
  {
    id: "ACT-002",
    userId: "6a0af25f60e8427cb4294428",
    userName: "Tadiwa Magora",
    action: "Approved Fuel Requisition REQ-301",
    timestamp: "2026-05-25T14:30:00Z"
  },
  {
    id: "ACT-003",
    userId: "user-2",
    userName: "xxassasinhunterxx",
    action: "Scheduled service MNT-203 for heavy crack welding",
    timestamp: "2026-05-27T10:15:00Z"
  }
];
