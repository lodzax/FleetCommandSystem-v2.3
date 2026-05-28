import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Truck, Driver, Job, MaintenanceRecord, FuelLog, FuelRequisition, UserActivity, Branch, DispatchRecord, StockMovement 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_TRUCKS, INITIAL_DRIVERS, INITIAL_JOBS, 
  INITIAL_MAINTENANCE, INITIAL_FUEL_LOGS, INITIAL_REQUISITIONS, INITIAL_ACTIVITIES 
} from '../data/mockData';

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'BR-101', name: 'Hwange Central Depot', locationName: 'Hwange Mining Zone', lat: -18.3647, lng: 26.5000, phone: '+263 81 22345', manager: 'Alfred Moyo' },
  { id: 'BR-102', name: 'Bulawayo Transit Depot', locationName: 'Bulawayo Industrial', lat: -20.1500, lng: 28.5833, phone: '+263 9 77890', manager: 'Sipho Ndlovu' },
  { id: 'BR-103', name: 'Harare HQ Dispatch', locationName: 'Harare Central', lat: -17.8292, lng: 31.0522, phone: '+263 4 489320', manager: 'Grace Kabasa' },
];

interface FleetContextType {
  users: User[];
  activeUser: User | null;
  trucks: Truck[];
  drivers: Driver[];
  jobs: Job[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  fuelRequisitions: FuelRequisition[];
  activities: UserActivity[];
  branches: Branch[];
  theme: string;
  logoText: string;
  logoEmoji: string;
  setActiveUser: (user: User | null) => void;
  approveUser: (id: string) => void;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserRole: (id: string, role: User['role']) => void;
  revokeUser: (id: string) => void;
  addTruck: (truck: Omit<Truck, 'id' | 'mileage' | 'nextServiceMileage' | 'lastServiceDate' | 'driverId'>) => void;
  updateTruckStatus: (id: string, status: Truck['status']) => void;
  assignDriverToTruck: (truckId: string, driverId: string | null) => void;
  addDriver: (driver: Omit<Driver, 'id' | 'assignedTruckId' | 'tripsCompleted' | 'rating' | 'lastActive'>) => void;
  updateDriverStatus: (id: string, status: Driver['status']) => void;
  addJob: (job: Omit<Job, 'id' | 'status' | 'fuelAllocated'>) => void;
  assignJob: (jobId: string, driverId: string, truckId: string) => void;
  updateJobStatus: (id: string, status: Job['status']) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'status'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceRecord['status']) => void;
  addFuelLog: (log: Omit<FuelLog, 'id' | 'date'>) => void;
  addFuelRequisition: (req: Omit<FuelRequisition, 'id' | 'status' | 'dateRequested'>) => void;
  updateRequisitionStatus: (id: string, status: FuelRequisition['status']) => void;
  redeemRequisition: (id: string, redeemData: { redeemedByGasStation: string; redeemedAttendantSignature: string; redeemedActualLitres: number; redeemedActualCost: number }) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  setTheme: (t: string) => void;
  setLogoText: (l: string) => void;
  setLogoEmoji: (e: string) => void;
  logActivity: (action: string, details?: string) => void;
  resetAllData: () => void;
  clearTrucksData: () => void;
  clearDriversData: () => void;
  clearJobsData: () => void;
  clearMaintenanceData: () => void;
  clearFuelData: () => void;
  deleteTruck: (id: string) => void;
  deleteDriver: (id: string) => void;
  deleteJob: (id: string) => void;
  dispatches: DispatchRecord[];
  setDispatches: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  clearDispatchData: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to load or fallback
  const getStored = <T,>(key: string, initial: T): T => {
    const val = localStorage.getItem(`fc_${key}`);
    return val ? JSON.parse(val) : initial;
  };

  const [users, setUsers] = useState<User[]>(() => getStored('users', INITIAL_USERS));
  const [activeUser, setActiveUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('fc_activeUser');
    return stored ? JSON.parse(stored) : INITIAL_USERS[0]; // Let's default to Admin on first load or null if not stored
  });
  const [trucks, setTrucks] = useState<Truck[]>(() => getStored('trucks', INITIAL_TRUCKS));
  const [drivers, setDrivers] = useState<Driver[]>(() => getStored('drivers', INITIAL_DRIVERS));
  const [jobs, setJobs] = useState<Job[]>(() => getStored('jobs', INITIAL_JOBS));
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => getStored('maintenance', INITIAL_MAINTENANCE));
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => getStored('fuelLogs', INITIAL_FUEL_LOGS));
  const [fuelRequisitions, setFuelRequisitions] = useState<FuelRequisition[]>(() => getStored('requisitions', INITIAL_REQUISITIONS));
  const [activities, setActivities] = useState<UserActivity[]>(() => getStored('activities', INITIAL_ACTIVITIES));
  const [branches, setBranches] = useState<Branch[]>(() => getStored('branches', INITIAL_BRANCHES));
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => getStored('dispatch_records', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getStored('stock_movements', []));
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem('fc_theme') || 'slate');
  const [logoText, setLogoTextState] = useState<string>(() => localStorage.getItem('fc_logoText') || 'FLEETCOMMAND');
  const [logoEmoji, setLogoEmojiState] = useState<string>(() => localStorage.getItem('fc_logoEmoji') || '🚛');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('fc_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('fc_dispatch_records', JSON.stringify(dispatches));
  }, [dispatches]);

  useEffect(() => {
    localStorage.setItem('fc_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('fc_theme', theme);
    // Apply theme class to document element for global CSS integration
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fc_logoText', logoText);
  }, [logoText]);

  useEffect(() => {
    localStorage.setItem('fc_logoEmoji', logoEmoji);
  }, [logoEmoji]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('fc_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fc_activeUser', JSON.stringify(activeUser));
  }, [activeUser]);

  useEffect(() => {
    localStorage.setItem('fc_trucks', JSON.stringify(trucks));
  }, [trucks]);

  useEffect(() => {
    localStorage.setItem('fc_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('fc_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('fc_maintenance', JSON.stringify(maintenance));
  }, [maintenance]);

  useEffect(() => {
    localStorage.setItem('fc_fuelLogs', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem('fc_requisitions', JSON.stringify(fuelRequisitions));
  }, [fuelRequisitions]);

  useEffect(() => {
    localStorage.setItem('fc_activities', JSON.stringify(activities));
  }, [activities]);

  const setActiveUser = (u: User | null) => {
    setActiveUserState(u);
    if (u) {
      localStorage.setItem('fc_activeUser', JSON.stringify(u));
      const activityAction = `Assumed operational session: ${u.name} (${u.role})`;
      const newAct: UserActivity = {
        id: `ACT-${Date.now()}`,
        userId: u.id,
        userName: u.name,
        action: activityAction,
        timestamp: new Date().toISOString()
      };
      setActivities(prev => [newAct, ...prev]);
    } else {
      localStorage.removeItem('fc_activeUser');
    }
  };

  const logout = () => {
    setActiveUserState(null);
    localStorage.removeItem('fc_activeUser');
  };

  const approveUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Verified' as const } : u));
    const target = users.find(u => u.id === id);
    logActivity(`Verified and approved user account: ${target?.name || id}`);
  };

  const logActivity = (action: string, details?: string) => {
    const newAct: UserActivity = {
      id: `ACT-${Date.now()}`,
      userId: activeUser ? activeUser.id : 'system',
      userName: activeUser ? activeUser.name : 'System Core',
      action,
      timestamp: new Date().toISOString(),
      details
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const addUser = (u: Omit<User, 'id'>) => {
    const newUser: User = {
      ...u,
      id: `usr-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    logActivity(`Added user: ${u.name}`, `Role: ${u.role}`);
  };

  const updateUserRole = (id: string, role: User['role']) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    const target = users.find(u => u.id === id);
    logActivity(`Updated ${target?.name || id}'s role to ${role}`);
  };

  const revokeUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Suspended' as const } : u));
    const target = users.find(u => u.id === id);
    logActivity(`Suspended user access: ${target?.name || id}`);
  };

  const addTruck = (t: Omit<Truck, 'id' | 'mileage' | 'nextServiceMileage' | 'lastServiceDate' | 'driverId'>) => {
    const newId = `TRK-${Math.floor(100 + Math.random() * 900)}`;
    const newTruck: Truck = {
      ...t,
      id: newId,
      status: 'Idle',
      mileage: 12000,
      nextServiceMileage: 20000,
      lastServiceDate: new Date().toISOString().split('T')[0],
      driverId: null
    };
    setTrucks(prev => [...prev, newTruck]);
    logActivity(`Registered new fleet asset: ${newId} (${t.plateNumber})`, `${t.type}`);
  };

  const updateTruckStatus = (id: string, status: Truck['status']) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    logActivity(`Updated truck status: ${id} to ${status}`);
  };

  const assignDriverToTruck = (truckId: string, driverId: string | null) => {
    // Break existing assignments for driver
    const driverVal = driverId;
    setTrucks(prev => prev.map(t => {
      // Unassign from old truck
      if (driverVal && t.driverId === driverVal) {
        return { ...t, driverId: null };
      }
      if (t.id === truckId) {
        return { ...t, driverId: driverVal, status: driverVal ? 'Active' as const : 'Idle' as const };
      }
      return t;
    }));

    setDrivers(prev => prev.map(d => {
      // Unassign driver from other trucks
      if (truckId && d.assignedTruckId === truckId) {
        return { ...d, assignedTruckId: null, status: 'Off Duty' as const };
      }
      if (d.id === driverId) {
        return { ...d, assignedTruckId: truckId, status: truckId ? 'Active' as const : 'Off Duty' as const };
      }
      return d;
    }));

    const truck = trucks.find(t => t.id === truckId);
    const driver = drivers.find(d => d.id === driverId);
    logActivity(
      driverId 
        ? `Assigned Driver ${driver?.name} to Truck ${truck?.plateNumber || truckId}`
        : `Unassigned Driver from Truck ${truck?.plateNumber || truckId}`
    );
  };

  const addDriver = (d: Omit<Driver, 'id' | 'tripsCompleted' | 'rating' | 'lastActive'>) => {
    const newId = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    const newDriver: Driver = {
      ...d,
      id: newId,
      status: d.assignedTruckId ? 'Active' : 'Off Duty',
      rating: 5.0,
      tripsCompleted: 0,
      lastActive: 'Just registered'
    };
    setDrivers(prev => [...prev, newDriver]);

    // Link target truck as well if assigned on registration
    if (d.assignedTruckId) {
      setTrucks(prev => prev.map(t => t.id === d.assignedTruckId ? {
        ...t,
        driverId: newId,
        status: 'Active'
      } : t));
    }

    logActivity(`Enrolled new driver: ${newId} - ${d.name}`, `License: ${d.licenseClass} | Truck: ${d.assignedTruckId || 'None'}`);
  };

  const updateDriverStatus = (id: string, status: Driver['status']) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    logActivity(`Updated driver status: ${id} to ${status}`);
  };

  const addJob = (j: Omit<Job, 'id' | 'status' | 'fuelAllocated'>) => {
    const newId = `JOB-${Math.floor(800 + Math.random() * 200)}`;
    const fuelAllocated = Math.round((j.weight > 50 ? 40 : 30) * (j.estimatedHours * 1.5));
    const newJob: Job = {
      ...j,
      id: newId,
      status: 'Pending',
      fuelAllocated
    };
    setJobs(prev => [...prev, newJob]);
    logActivity(`Created dispatch job: ${newId}`, `${j.title}`);
  };

  const assignJob = (jobId: string, driverId: string, truckId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    const truck = trucks.find(t => t.id === truckId);

    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: 'Assigned' as const,
          driverId,
          truckId,
          driverName: driver?.name,
          truckPlate: truck?.plateNumber
        };
      }
      return j;
    }));

    // Assign truck and driver together as well
    assignDriverToTruck(truckId, driverId);

    logActivity(`Assigned Job ${jobId} to Driver ${driver?.name} & Truck ${truck?.plateNumber}`);
  };

  const updateJobStatus = (id: string, status: Job['status']) => {
    const job = jobs.find(j => j.id === id);
    const dateStr = new Date().toISOString().split('T')[0];

    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        const updates: Partial<Job> = { status };
        if (status === 'In Transit') {
          updates.dispatchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (status === 'Completed') {
          updates.completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return { ...j, ...updates };
      }
      return j;
    }));

    // Sync driver and truck dynamics if completed
    if (status === 'Completed' && job) {
      if (job.driverId) {
        setDrivers(prev => prev.map(d => d.id === job.driverId ? { 
          ...d, 
          tripsCompleted: d.tripsCompleted + 1,
          status: 'Active' as const 
        } : d));
      }
      if (job.truckId) {
        setTrucks(prev => prev.map(t => t.id === job.truckId ? {
          ...t,
          mileage: t.mileage + Math.round(job.estimatedHours * 80), // roughly 80km/h
          status: 'Idle' as const
        }: t));
      }
    } else if (status === 'In Transit' && job) {
      if (job.driverId) {
        setDrivers(prev => prev.map(d => d.id === job.driverId ? { ...d, status: 'On Route' as const } : d));
      }
      if (job.truckId) {
        setTrucks(prev => prev.map(t => t.id === job.truckId ? { ...t, status: 'Active' as const } : t));
      }
    }

    logActivity(`Status transition: ${id} is now ${status}`);
  };

  const addMaintenanceRecord = (m: Omit<MaintenanceRecord, 'id' | 'status'>) => {
    const newId = `MNT-${Math.floor(200 + Math.random() * 100)}`;
    const newRecord: MaintenanceRecord = {
      ...m,
      id: newId,
      status: 'Scheduled'
    };
    setMaintenance(prev => [...prev, newRecord]);

    // Put truck in maintenance if high priority or immediate
    setTrucks(prev => prev.map(t => t.id === m.truckId ? { ...t, status: 'Maintenance' as const } : t));

    logActivity(`Logged Maintenance for Truck ${m.truckId}: ${newId}`, m.serviceType);
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceRecord['status']) => {
    const record = maintenance.find(m => m.id === id);
    setMaintenance(prev => prev.map(m => {
      if (m.id === id) {
        const u: Partial<MaintenanceRecord> = { status };
        if (status === 'Completed') {
          u.completedDate = new Date().toISOString().split('T')[0];
        }
        return { ...m, ...u };
      }
      return m;
    }));

    if (status === 'Completed' && record) {
      setTrucks(prev => prev.map(t => t.id === record.truckId ? {
        ...t,
        status: 'Idle' as const,
        lastServiceDate: new Date().toISOString().split('T')[0],
        nextServiceMileage: t.mileage + 15000
      } : t));
    } else if (status === 'In Progress' && record) {
      setTrucks(prev => prev.map(t => t.id === record.truckId ? { ...t, status: 'Maintenance' as const } : t));
    }

    logActivity(`Maintenance Log ${id} status: ${status}`);
  };

  const addFuelLog = (fl: Omit<FuelLog, 'id' | 'date'>) => {
    const newId = `FL-${Math.floor(900 + Math.random() * 100)}`;
    const newLog: FuelLog = {
      ...fl,
      id: newId,
      date: new Date().toISOString().split('T')[0]
    };
    setFuelLogs(prev => [newLog, ...prev]);

    // Update truck mileage and cost
    setTrucks(prev => prev.map(t => t.id === fl.truckId ? { ...t, mileage: fl.odometer } : t));

    logActivity(`Logged Fuel Fillup: ${newId} (${fl.litres}L)`, `Truck: ${fl.truckId}, Cost: R${fl.cost}`);
  };

  const addFuelRequisition = (req: Omit<FuelRequisition, 'id' | 'status' | 'dateRequested'>) => {
    const newId = `REQ-${Math.floor(300 + Math.random() * 100)}`;
    const newReq: FuelRequisition = {
      ...req,
      id: newId,
      status: 'Pending',
      dateRequested: new Date().toISOString().split('T')[0]
    };
    setFuelRequisitions(prev => [newReq, ...prev]);
    logActivity(`Created fuel request: ${newId} (${req.litresRequested}L)`, `Truck: ${req.truckId}`);
  };

  const updateRequisitionStatus = (id: string, status: FuelRequisition['status']) => {
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approvedDate: status === 'Approved' ? new Date().toISOString().split('T')[0] : undefined,
          // Generate a user-friendly 6-digit redeem token on approval
          redeemToken: status === 'Approved' ? Math.floor(100000 + Math.random() * 900000).toString() : r.redeemToken
        };
      }
      return r;
    }));

    logActivity(`Fuel Requisition ${id}: ${status}`);
  };

  const redeemRequisition = (id: string, rd: { 
    redeemedByGasStation: string; 
    redeemedAttendantSignature: string; 
    redeemedActualLitres: number; 
    redeemedActualCost: number; 
  }) => {
    const target = fuelRequisitions.find(r => r.id === id);
    if (!target) return;

    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Redeemed',
          redeemDate: new Date().toISOString().split('T')[0],
          redeemedByGasStation: rd.redeemedByGasStation,
          redeemedAttendantSignature: rd.redeemedAttendantSignature,
          redeemedActualLitres: rd.redeemedActualLitres,
          redeemedActualCost: rd.redeemedActualCost
        };
      }
      return r;
    }));

    // Add a real entry to fuel logs upon redemption
    const matchTruck = trucks.find(t => t.id === target.truckId);
    const newLog: FuelLog = {
      id: `FL-${Math.floor(900 + Math.random() * 100)}`,
      truckId: target.truckId,
      truckPlate: target.truckPlate || 'N/A',
      driverId: target.driverId,
      driverName: target.driverName || 'N/A',
      litres: rd.redeemedActualLitres,
      cost: rd.redeemedActualCost,
      odometer: matchTruck ? matchTruck.mileage + 45 : 12050,
      location: rd.redeemedByGasStation,
      date: new Date().toISOString().split('T')[0],
      fuelType: 'Diesel'
    };
    setFuelLogs(prev => [newLog, ...prev]);

    logActivity(`Verified & Redeemed Fuel Token for ${target.id} at ${rd.redeemedByGasStation}`, `Filled ${rd.redeemedActualLitres}L`);
  };

  const addBranch = (b: Omit<Branch, 'id'>) => {
    const newId = `BR-${Math.floor(100 + Math.random() * 900)}`;
    const newBranch: Branch = {
      ...b,
      id: newId
    };
    setBranches(prev => [...prev, newBranch]);
    logActivity(`Added physical operations branch: ${b.name}`, `${b.locationName}`);
  };

  const setTheme = (t: string) => {
    setThemeState(t);
    logActivity(`Theme changed to ${t}`);
  };

  const setLogoText = (l: string) => {
    setLogoTextState(l);
    logActivity(`System logo text updated to ${l}`);
  };

  const setLogoEmoji = (e: string) => {
    setLogoEmojiState(e);
    logActivity(`System logo icon updated to ${e}`);
  };

  const clearTrucksData = () => {
    setTrucks([]);
    localStorage.setItem('fc_trucks', JSON.stringify([]));
    logActivity("Cleared all trucks from system registry");
  };

  const clearDriversData = () => {
    setDrivers([]);
    localStorage.setItem('fc_drivers', JSON.stringify([]));
    logActivity("Cleared all drivers from personnel manifest");
  };

  const clearJobsData = () => {
    setJobs([]);
    localStorage.setItem('fc_jobs', JSON.stringify([]));
    logActivity("Cleared all active and historical jobs");
  };

  const clearMaintenanceData = () => {
    setMaintenance([]);
    localStorage.setItem('fc_maintenance', JSON.stringify([]));
    logActivity("Cleared all maintenance logs and schedules");
  };

  const clearFuelData = () => {
    setFuelLogs([]);
    setFuelRequisitions([]);
    localStorage.setItem('fc_fuelLogs', JSON.stringify([]));
    localStorage.setItem('fc_requisitions', JSON.stringify([]));
    logActivity("Cleared all fuel fillup histories and tokens");
  };

  const clearDispatchData = () => {
    setDispatches([]);
    setStockMovements([]);
    localStorage.setItem('fc_dispatch_records', JSON.stringify([]));
    localStorage.setItem('fc_stock_movements', JSON.stringify([]));
    logActivity("Cleared all logistics dispatch manifests and stock movements");
  };

  const deleteTruck = (id: string) => {
    setTrucks(prev => prev.filter(t => t.id !== id));
    setDrivers(prev => prev.map(d => d.assignedTruckId === id ? { ...d, assignedTruckId: null, status: 'Off Duty' as const } : d));
    setJobs(prev => prev.map(j => j.truckId === id ? { ...j, truckId: null, truckPlate: undefined, status: j.status === 'Assigned' || j.status === 'In Transit' ? 'Pending' as const : j.status } : j));
    logActivity(`Deleted fleet asset truck: ${id}`);
  };

  const deleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    setTrucks(prev => prev.map(t => t.driverId === id ? { ...t, driverId: null, status: 'Idle' as const } : t));
    setJobs(prev => prev.map(j => j.driverId === id ? { ...j, driverId: null, driverName: undefined, status: j.status === 'Assigned' || j.status === 'In Transit' ? 'Pending' as const : j.status } : j));
    logActivity(`Deleted driver personnel: ${id}`);
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    logActivity(`Deleted job record: ${id}`);
  };

  const resetAllData = () => {
    // Keep user roles intact so the console can still function with switcher and login, but clear operational data completely
    setUsers(INITIAL_USERS);
    const fallbackUser = activeUser && INITIAL_USERS.some(u => u.id === activeUser.id) ? activeUser : INITIAL_USERS[0];
    setActiveUserState(fallbackUser);
    
    setTrucks([]);
    setDrivers([]);
    setJobs([]);
    setMaintenance([]);
    setFuelLogs([]);
    setFuelRequisitions([]);
    setActivities([
      {
        id: "ACT-001",
        timestamp: new Date().toISOString(),
        user: fallbackUser.name,
        role: fallbackUser.role,
        action: "Database Clear",
        details: "Clean slate initialized. All simulated operational tables purged."
      }
    ]);
    setBranches([]);
    setThemeState('slate');
    setLogoTextState('FLEETCOMMAND');
    setLogoEmojiState('🚛');

    localStorage.setItem('fc_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('fc_activeUser', JSON.stringify(fallbackUser));
    localStorage.setItem('fc_trucks', JSON.stringify([]));
    localStorage.setItem('fc_drivers', JSON.stringify([]));
    localStorage.setItem('fc_jobs', JSON.stringify([]));
    localStorage.setItem('fc_maintenance', JSON.stringify([]));
    localStorage.setItem('fc_fuelLogs', JSON.stringify([]));
    localStorage.setItem('fc_requisitions', JSON.stringify([]));
    localStorage.setItem('fc_activities', JSON.stringify([
      {
        id: "ACT-001",
        timestamp: new Date().toISOString(),
        user: fallbackUser.name,
        role: fallbackUser.role,
        action: "Database Clear",
        details: "Clean slate initialized. All simulated operational tables purged."
      }
    ]));
    setDispatches([]);
    setStockMovements([]);
    localStorage.setItem('fc_branches', JSON.stringify([]));
    localStorage.setItem('fc_dispatch_records', JSON.stringify([]));
    localStorage.setItem('fc_stock_movements', JSON.stringify([]));
    localStorage.setItem('fc_theme', 'slate');
    localStorage.setItem('fc_logoText', 'FLEETCOMMAND');
    localStorage.setItem('fc_logoEmoji', '🚛');
  };

  return (
    <FleetContext.Provider value={{
      users, activeUser, trucks, drivers, jobs, maintenance, fuelLogs, fuelRequisitions, activities,
      branches, theme, logoText, logoEmoji,
      setActiveUser, approveUser, logout, addUser, updateUserRole, revokeUser,
      addTruck, updateTruckStatus, assignDriverToTruck,
      addDriver, updateDriverStatus,
      addJob, assignJob, updateJobStatus,
      addMaintenanceRecord, updateMaintenanceStatus,
      addFuelLog, addFuelRequisition, updateRequisitionStatus,
      redeemRequisition, addBranch,
      setTheme, setLogoText, setLogoEmoji,
      logActivity, resetAllData,
      clearTrucksData, clearDriversData, clearJobsData, clearMaintenanceData, clearFuelData, clearDispatchData,
      deleteTruck, deleteDriver, deleteJob,
      dispatches, setDispatches, stockMovements, setStockMovements
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
