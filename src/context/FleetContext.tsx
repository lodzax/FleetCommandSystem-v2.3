import React, { createContext, useContext, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { api, setToken } from '../api';
import { 
  User, Truck, Driver, Job, MaintenanceRecord, FuelLog, FuelRequisition, UserActivity, Branch, DispatchRecord, StockMovement, FuelBalanceLog 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_TRUCKS, INITIAL_DRIVERS, INITIAL_JOBS, 
  INITIAL_MAINTENANCE, INITIAL_FUEL_LOGS, INITIAL_REQUISITIONS, INITIAL_ACTIVITIES 
} from '../data/mockData';

export const INITIAL_BRANCHES: Branch[] = [];

const DATA_VERSION = '2.4.0-clean';

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
  deleteUser: (id: string) => void;
  addTruck: (truck: Omit<Truck, 'id' | 'mileage' | 'nextServiceMileage' | 'lastServiceDate' | 'driverId'>) => void;
  updateTruck: (id: string, data: Partial<Truck>) => void;
  updateTruckStatus: (id: string, status: Truck['status']) => void;
  assignDriverToTruck: (truckId: string, driverId: string | null) => void;
  addDriver: (driver: Omit<Driver, 'id' | 'assignedTruckId' | 'tripsCompleted' | 'rating' | 'lastActive'>) => void;
  updateDriver: (id: string, data: Partial<Driver>) => void;
  updateDriverStatus: (id: string, status: Driver['status']) => void;
  addJob: (job: Omit<Job, 'id' | 'status' | 'fuelAllocated'>) => void;
  assignJob: (jobId: string, driverId: string, truckId: string) => void;
  updateJobStatus: (id: string, status: Job['status']) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'status'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceRecord['status']) => void;
  addFuelLog: (log: Omit<FuelLog, 'id' | 'date'>) => void;
  addFuelRequisition: (req: Omit<FuelRequisition, 'id' | 'status' | 'dateRequested'>) => void;
  updateRequisitionStatus: (id: string, status: FuelRequisition['status']) => void;
  editRequisitionQuantity: (id: string, litresRequested: number, estimatedCost: number) => void;
  reviewRequisition: (id: string) => void;
  verifyRequisition: (id: string) => void;
  approveRequisition: (id: string) => Promise<void>;
  rejectRequisition: (id: string, reason: string) => void;
  redeemRequisition: (id: string, redeemData: { redeemedByGasStation: string; redeemedAttendantSignature: string; redeemedActualLitres: number; redeemedActualCost: number; odometer: number }) => void;
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
  prepaidFuelBalance: { diesel: number; petrol: number };
  setPrepaidFuelBalance: (balance: { diesel: number; petrol: number }) => void;
  fuelBalanceLogs: FuelBalanceLog[];
  setFuelBalanceLogs: React.Dispatch<React.SetStateAction<FuelBalanceLog[]>>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear stale localStorage if data version changed
  if (localStorage.getItem('fc_dataVersion') !== DATA_VERSION) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('fc_') && k !== 'fc_activeUser') keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('fc_dataVersion', DATA_VERSION);
  }

  const getStored = <T,>(key: string, initial: T): T => {
    const val = localStorage.getItem(`fc_${key}`);
    return val ? JSON.parse(val) : initial;
  };

  const [apiOnline, setApiOnline] = useState(false);

  const [users, setUsers] = useState<User[]>(() => getStored('users', INITIAL_USERS));
  const [activeUser, setActiveUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('fc_activeUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [trucks, setTrucks] = useState<Truck[]>(() => getStored('trucks', INITIAL_TRUCKS));
  const [drivers, setDrivers] = useState<Driver[]>(() => getStored('drivers', INITIAL_DRIVERS));
  const [jobs, setJobs] = useState<Job[]>(() => getStored('jobs', INITIAL_JOBS));
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => getStored('maintenance', INITIAL_MAINTENANCE));
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => getStored('fuelLogs', INITIAL_FUEL_LOGS));
  const [fuelRequisitions, setFuelRequisitions] = useState<FuelRequisition[]>(() => {
    const stored = getStored('requisitions', INITIAL_REQUISITIONS);
    return stored.map(r => ({
      ...r,
      litresRequested: Number(r.litresRequested) || 0,
      estimatedCost: Number(r.estimatedCost) || 0,
    }));
  });
  const [activities, setActivities] = useState<UserActivity[]>(() => getStored('activities', INITIAL_ACTIVITIES));
  const [branches, setBranches] = useState<Branch[]>(() => getStored('branches', INITIAL_BRANCHES));
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => getStored('dispatch_records', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getStored('stock_movements', []));
  const [fuelBalanceLogs, setFuelBalanceLogs] = useState<FuelBalanceLog[]>(() => getStored('fuel_balance_logs', []));
  const [theme, setThemeState] = useState<string>(() => localStorage.getItem('fc_theme') || 'slate');
  const [logoText, setLogoTextState] = useState<string>(() => localStorage.getItem('fc_logoText') || 'FLEETCOMMAND');
  const [logoEmoji, setLogoEmojiState] = useState<string>(() => localStorage.getItem('fc_logoEmoji') || '🚛');
  const [prepaidFuelBalance, setPrepaidFuelBalanceState] = useState<{ diesel: number; petrol: number }>(() => {
    const stored = localStorage.getItem('fc_prepaidFuel');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          return { diesel: Number(parsed.diesel) || 0, petrol: Number(parsed.petrol) || 0 };
        }
      } catch {}
    }
    return { diesel: 0, petrol: 0 };
  });

  // Attempt API sync on mount
  useEffect(() => {
    const loadFromApi = async () => {
      const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
        try { return await fn(); } catch { return fallback; }
      };

      const [apiUsers, apiTrucks, apiDrivers, apiJobs, apiMaintenance, apiFuelLogs, apiReqs, apiActivities, apiBranches, apiDispatches, apiStock, apiSettings, apiFuelBalLogs] = await Promise.all([
        safeFetch(() => api.getUsers(), [] as any[]),
        safeFetch(() => api.getTrucks(), [] as any[]),
        safeFetch(() => api.getDrivers(), [] as any[]),
        safeFetch(() => api.getJobs(), [] as any[]),
        safeFetch(() => api.getMaintenance(), [] as any[]),
        safeFetch(() => api.getFuelLogs(), [] as any[]),
        safeFetch(() => api.getFuelRequisitions(), [] as any[]),
        safeFetch(() => api.getActivities(), [] as any[]),
        safeFetch(() => api.getBranches(), [] as any[]),
        safeFetch(() => api.getDispatches(), [] as any[]),
        safeFetch(() => api.getStockMovements(), [] as any[]),
        safeFetch(() => api.getSettings(), {} as Record<string, string>),
        safeFetch(() => api.getFuelBalanceLogs(), [] as any[]),
      ]);

      setApiOnline(apiUsers.length > 0 || apiSettings && Object.keys(apiSettings).length > 0);
        if (apiUsers.length > 0) setUsers(apiUsers);
        if (apiTrucks.length > 0) setTrucks(apiTrucks.map(t => ({ ...t, fuelRate: Number(t.fuelRate) || 0, mileage: Number(t.mileage) || 0, currentLat: Number(t.currentLat) || 0, currentLng: Number(t.currentLng) || 0, nextServiceMileage: Number(t.nextServiceMileage) || 20000 })));
        if (apiDrivers.length > 0) setDrivers(apiDrivers.map(d => ({ ...d, rating: Number(d.rating) || 0, tripsCompleted: Number(d.tripsCompleted) || 0 })));
        if (apiJobs.length > 0) setJobs(apiJobs.map(j => ({ ...j, weight: Number(j.weight) || 0, fuelAllocated: Number(j.fuelAllocated) || 0, income: Number(j.income) || 0, estimatedHours: Number(j.estimatedHours) || 0, sourceLat: Number(j.sourceLat) || 0, sourceLng: Number(j.sourceLng) || 0, destinationLat: Number(j.destinationLat) || 0, destinationLng: Number(j.destinationLng) || 0 })));
        if (apiMaintenance.length > 0) setMaintenance(apiMaintenance.map(m => ({ ...m, cost: Number(m.cost) || 0 })));
        if (apiFuelLogs.length > 0) setFuelLogs(apiFuelLogs.map(f => ({ ...f, litres: Number(f.litres) || 0, cost: Number(f.cost) || 0, odometer: Number(f.odometer) || 0 })));
        if (apiReqs.length > 0) {
          const normalized = apiReqs.map(r => ({
            ...r,
            litresRequested: Number(r.litresRequested) || 0,
            estimatedCost: Number(r.estimatedCost) || 0,
            redeemedActualLitres: r.redeemedActualLitres != null ? Number(r.redeemedActualLitres) : undefined,
            redeemedActualCost: r.redeemedActualCost != null ? Number(r.redeemedActualCost) : undefined,
          }));
          setFuelRequisitions(normalized);
        }
        if (apiActivities.length > 0) setActivities(apiActivities);
        if (apiBranches.length > 0) setBranches(apiBranches);
        setDispatches(apiDispatches);
        setStockMovements(apiStock);
        if (apiFuelBalLogs.length > 0) setFuelBalanceLogs(apiFuelBalLogs.map(l => ({ ...l, litres: Number(l.litres) || 0, balanceBefore: Number(l.balanceBefore) || 0, balanceAfter: Number(l.balanceAfter) || 0 })));
        if (apiSettings && apiSettings.theme) setThemeState(apiSettings.theme);
        if (apiSettings && apiSettings.logoText) setLogoTextState(apiSettings.logoText);
        if (apiSettings && apiSettings.logoEmoji) setLogoEmojiState(apiSettings.logoEmoji);
        if (apiSettings && (apiSettings.prepaidDiesel != null || apiSettings.prepaidPetrol != null)) {
          setPrepaidFuelBalanceState({
            diesel: parseInt(apiSettings.prepaidDiesel) || 0,
            petrol: parseInt(apiSettings.prepaidPetrol) || 0,
          });
        }

        // Sync local data up to API (for data created while offline)
        if (localStorage.getItem('fc_auth_token')) {
          const apiTruckPlates = new Set(apiTrucks.map((t: any) => t.plateNumber));
          for (const localTruck of trucks) {
            if (!apiTruckPlates.has(localTruck.plateNumber)) {
              api.saveTruck(localTruck).catch(() => {});
            }
          }
          const apiDriverIds = new Set(apiDrivers.map((d: any) => d.id));
          for (const localDriver of drivers) {
            if (!apiDriverIds.has(localDriver.id)) {
              api.saveDriver(localDriver).catch(() => {});
            }
          }
          const apiJobIds = new Set(apiJobs.map((j: any) => j.id));
          for (const localJob of jobs) {
            if (!apiJobIds.has(localJob.id)) {
              api.saveJob(localJob).catch(() => {});
            }
          }
          const apiMaintenanceIds = new Set(apiMaintenance.map((m: any) => m.id));
          for (const localM of maintenance) {
            if (!apiMaintenanceIds.has(localM.id)) {
              api.saveMaintenance(localM).catch(() => {});
            }
          }
          const apiBranchIds = new Set(apiBranches.map((b: any) => b.id));
          for (const localB of branches) {
            if (!apiBranchIds.has(localB.id)) {
              api.saveBranch(localB).catch(() => {});
            }
          }
          const localPrepaid = localStorage.getItem('fc_prepaidFuel');
          if (localPrepaid) {
            const parsed = JSON.parse(localPrepaid);
            api.saveSetting('prepaidDiesel', String(parsed.diesel || 0)).catch(() => {});
            api.saveSetting('prepaidPetrol', String(parsed.petrol || 0)).catch(() => {});
          }
        }
    };
    loadFromApi();
  }, []);

  // Re-sync local data to API whenever apiOnline becomes true
  const prevOnline = React.useRef(false);
  useEffect(() => {
    if (apiOnline && !prevOnline.current) {
      const sync = async () => {
        const [apiTrucks, apiDrivers, apiJobs, apiMaintenance, apiBranches] = await Promise.all([
          api.getTrucks().catch(() => []),
          api.getDrivers().catch(() => []),
          api.getJobs().catch(() => []),
          api.getMaintenance().catch(() => []),
          api.getBranches().catch(() => []),
        ]);
        const apiTruckPlates = new Set(apiTrucks.map((t: any) => t.plateNumber));
        for (const localTruck of trucks) {
          if (!apiTruckPlates.has(localTruck.plateNumber)) api.saveTruck(localTruck).catch(() => {});
        }
        const apiDriverIds = new Set(apiDrivers.map((d: any) => d.id));
        for (const localDriver of drivers) {
          if (!apiDriverIds.has(localDriver.id)) api.saveDriver(localDriver).catch(() => {});
        }
        const apiJobIds = new Set(apiJobs.map((j: any) => j.id));
        for (const localJob of jobs) {
          if (!apiJobIds.has(localJob.id)) api.saveJob(localJob).catch(() => {});
        }
        const apiMaintenanceIds = new Set(apiMaintenance.map((m: any) => m.id));
        for (const localM of maintenance) {
          if (!apiMaintenanceIds.has(localM.id)) api.saveMaintenance(localM).catch(() => {});
        }
        const apiBranchIds = new Set(apiBranches.map((b: any) => b.id));
        for (const localB of branches) {
          if (!apiBranchIds.has(localB.id)) api.saveBranch(localB).catch(() => {});
        }
        // Sync prepaid balance
        const localPrepaid = localStorage.getItem('fc_prepaidFuel');
        if (localPrepaid) {
          const parsed = JSON.parse(localPrepaid);
          api.saveSetting('prepaidDiesel', String(parsed.diesel || 0)).catch(() => {});
          api.saveSetting('prepaidPetrol', String(parsed.petrol || 0)).catch(() => {});
        }
      };
      sync();
    }
    prevOnline.current = apiOnline;
  }, [apiOnline, trucks, drivers, jobs, maintenance, branches]);

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
    localStorage.setItem('fc_fuel_balance_logs', JSON.stringify(fuelBalanceLogs));
  }, [fuelBalanceLogs]);

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

  useEffect(() => {
    localStorage.setItem('fc_prepaidFuel', JSON.stringify(prepaidFuelBalance));
  }, [prepaidFuelBalance]);

  const setPrepaidFuelBalance = (balance: { diesel: number; petrol: number }) => {
    const prev = prepaidFuelBalance;
    setPrepaidFuelBalanceState(balance);
    api.saveSetting('prepaidDiesel', String(balance.diesel)).catch(() => {});
    api.saveSetting('prepaidPetrol', String(balance.petrol)).catch(() => {});

    // Log diesel top-up
    const dieselDiff = balance.diesel - prev.diesel;
    if (dieselDiff !== 0) {
      const log: FuelBalanceLog = {
        id: `FBL-${Date.now()}-d`,
        type: dieselDiff > 0 ? 'Top-Up' : 'Deduction',
        fuelType: 'Diesel',
        litres: Math.abs(dieselDiff),
        balanceBefore: prev.diesel,
        balanceAfter: balance.diesel,
        note: dieselDiff > 0 ? 'Prepaid balance adjustment' : 'Manual deduction',
        createdBy: activeUser?.name,
      };
      setFuelBalanceLogs(prevLogs => [log, ...prevLogs]);
      api.saveFuelBalanceLog(log).catch(() => {});
    }

    // Log petrol top-up
    const petrolDiff = balance.petrol - prev.petrol;
    if (petrolDiff !== 0) {
      const log: FuelBalanceLog = {
        id: `FBL-${Date.now()}-p`,
        type: petrolDiff > 0 ? 'Top-Up' : 'Deduction',
        fuelType: 'Petrol',
        litres: Math.abs(petrolDiff),
        balanceBefore: prev.petrol,
        balanceAfter: balance.petrol,
        note: petrolDiff > 0 ? 'Prepaid balance adjustment' : 'Manual deduction',
        createdBy: activeUser?.name,
      };
      setFuelBalanceLogs(prevLogs => [log, ...prevLogs]);
      api.saveFuelBalanceLog(log).catch(() => {});
    }

    logActivity(`Prepaid fuel balance adjusted — Diesel: ${balance.diesel}L, Petrol: ${balance.petrol}L`);
  };

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
    setToken(null);
  };

  const approveUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Verified' as const } : u));
    const target = users.find(u => u.id === id);
    if (target) api.updateUser(id, { ...target, status: 'Verified' }).catch(() => {});
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

  const addUser = (u: User | Omit<User, 'id'>) => {
    const user: User = 'id' in u ? u as User : { ...u, id: `usr-${Date.now()}` as string };
    setUsers(prev => {
      if (prev.find(p => p.id === user.id)) return prev;
      return [...prev, user];
    });
    api.saveUser(user).catch(() => {});
    logActivity(`Added user: ${user.name}`, `Role: ${user.role}`);
  };

  const updateUserRole = (id: string, role: User['role']) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    const target = users.find(u => u.id === id);
    if (target && apiOnline) api.updateUser(id, { ...target, role }).catch(() => {});
    logActivity(`Updated ${target?.name || id}'s role to ${role}`);
  };

  const revokeUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Suspended' as const } : u));
    const target = users.find(u => u.id === id);
    logActivity(`Suspended user access: ${target?.name || id}`);
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    api.deleteUser(id).catch(() => {});
    logActivity(`Deleted user account: ${target?.name || id}`);
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
      driverId: null,
      category: t.category || 'Truck'
    };
    setTrucks(prev => [...prev, newTruck]);
    api.saveTruck(newTruck).catch(() => {});
    logActivity(`Registered new fleet asset: ${newId} (${t.plateNumber})`, `${t.type}`);
  };

  const updateTruckStatus = (id: string, status: Truck['status']) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    api.updateTruck(id, { status }).catch(() => {});
    logActivity(`Updated truck status: ${id} to ${status}`);
  };

  const updateTruck = (id: string, data: Partial<Truck>) => {
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    api.updateTruck(id, data).catch(() => {});
    logActivity(`Updated truck details: ${id}`, JSON.stringify(data));
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

    if (driverId) {
      api.updateDriver(driverId, { assignedTruckId: truckId, status: truckId ? 'Active' : 'Off Duty' }).catch(() => {});
      if (truckId) api.updateTruck(truckId, { driverId, status: 'Active' }).catch(() => {});
    } else {
      const truck = trucks.find(t => t.id === truckId);
      if (truck?.driverId) api.updateDriver(truck.driverId, { assignedTruckId: null, status: 'Off Duty' }).catch(() => {});
      if (truckId) api.updateTruck(truckId, { driverId: null, status: 'Idle' }).catch(() => {});
    }
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

    api.saveDriver(newDriver).catch(() => {});
    logActivity(`Enrolled new driver: ${newId} - ${d.name}`, `License: ${d.licenseClass} | Truck: ${d.assignedTruckId || 'None'}`);
  };

  const updateDriverStatus = (id: string, status: Driver['status']) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    api.updateDriver(id, { status }).catch(() => {});
    logActivity(`Updated driver status: ${id} to ${status}`);
  };

  const updateDriver = (id: string, data: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    api.updateDriver(id, data).catch(() => {});
    logActivity(`Updated driver details: ${id}`, JSON.stringify(data));
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
    api.saveJob(newJob).catch(() => {});
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

    api.saveMaintenance(newRecord).catch(() => {});
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

    api.saveFuelLog(newLog).catch(() => {});

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
      dateRequested: new Date().toISOString().split('T')[0],
      submittedBy: activeUser?.name,
      submittedById: activeUser?.id,
    };
    setFuelRequisitions(prev => [newReq, ...prev]);
    api.saveFuelRequisition(newReq).catch(() => {});
    logActivity(`Created fuel request: ${newId} (${req.litresRequested}L)`, `Truck: ${req.truckId}`);
  };

  const updateRequisitionStatus = (id: string, status: FuelRequisition['status']) => {
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approvedDate: status === 'Approved' ? new Date().toISOString().split('T')[0] : r.approvedDate,
          redeemToken: status === 'Approved' ? Math.floor(100000 + Math.random() * 900000).toString() : r.redeemToken
        };
      }
      return r;
    }));

    logActivity(`Fuel Requisition ${id}: ${status}`);
  };

  const editRequisitionQuantity = (id: string, litresRequested: number, estimatedCost: number) => {
    setFuelRequisitions(prev => prev.map(r => r.id === id ? { ...r, litresRequested, estimatedCost } : r));
    api.updateFuelRequisition(id, { litresRequested, estimatedCost }).catch(() => {});
    logActivity(`Fuel Requisition ${id}: quantity adjusted to ${litresRequested}L`);
  };

  const reviewRequisition = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const reviewerName = activeUser?.name || 'Admin Officer';
    
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Reviewed' as const,
          reviewedBy: reviewerName,
          reviewedDate: today
        };
      }
      return r;
    }));

    const targetReq = fuelRequisitions.find(r => r.id === id);
    api.updateFuelRequisition(id, { status: 'Reviewed', reviewedBy: reviewerName, reviewedDate: today, litresRequested: targetReq?.litresRequested, estimatedCost: targetReq?.estimatedCost }).catch(() => {});
    api.saveActivity({ id: `ACT-${Date.now()}`, userId: activeUser?.id || '', userName: reviewerName, action: `Fuel Requisition ${id}: Reviewed by ${reviewerName}`, timestamp: new Date().toISOString() }).catch(() => {});

    logActivity(`Fuel Requisition ${id}: Reviewed by ${reviewerName}`);
    
    const verifiers = users.filter(u => u.role === 'Accounts' || u.role === 'Manager');
    verifiers.forEach(u => {
      api.sendEmail(u.email, `Fuel Requisition Review Complete - ${id}`, `<h3>Requisition ${id} Ready for Verification</h3><p>Reviewed by: <b>${reviewerName}</b></p><p>Date: ${today}</p><p><a href="${window.location.origin}/#/requisitions">Open Requisitions Pipeline</a></p>`).catch(() => {});
    });
  };

  const verifyRequisition = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const verifierName = activeUser?.name || 'Accounts Officer';
    
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Verified' as const,
          verifiedBy: verifierName,
          verifiedDate: today
        };
      }
      return r;
    }));

    const targetReq = fuelRequisitions.find(r => r.id === id);
    api.updateFuelRequisition(id, { status: 'Verified', verifiedBy: verifierName, verifiedDate: today, litresRequested: targetReq?.litresRequested, estimatedCost: targetReq?.estimatedCost }).catch(() => {});
    api.saveActivity({ id: `ACT-${Date.now()}`, userId: activeUser?.id || '', userName: verifierName, action: `Fuel Requisition ${id}: Verified by ${verifierName}`, timestamp: new Date().toISOString() }).catch(() => {});

    logActivity(`Fuel Requisition ${id}: Verified by ${verifierName}`);
    
    const directors = users.filter(u => u.role === 'Director' || u.role === 'Administrator');
    directors.forEach(u => {
      api.sendEmail(u.email, `Fuel Requisition Ready for Final Approval - ${id}`, `<h3>Requisition ${id} Verified & Ready for Final Approval</h3><p>Verified by: <b>${verifierName}</b></p><p>Date: ${today}</p><p><a href="${window.location.origin}/#/requisitions">Open Requisitions Pipeline</a></p>`).catch(() => {});
    });
  };

  const approveRequisition = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const approverName = activeUser?.name || 'Treasurer';
    const redeemToken = Math.floor(100000 + Math.random() * 900000).toString();

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const verificationUrl = `${baseUrl}#/verify?id=${id}&approvedBy=${encodeURIComponent(approverName)}&date=${today}&token=${redeemToken}`;

    let qrCodeData: string | undefined;
    try {
      qrCodeData = await QRCode.toDataURL(verificationUrl, { width: 200, margin: 1 });
    } catch {
      qrCodeData = undefined;
    }
    
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Approved' as const,
          approvedBy: approverName,
          approvedDate: today,
          redeemToken,
          qrCodeData
        };
      }
      return r;
    }));

    const req = fuelRequisitions.find(r => r.id === id);
    api.updateFuelRequisition(id, { status: 'Approved', approvedBy: approverName, approvedDate: today, redeemToken, qrCodeData, litresRequested: req?.litresRequested, estimatedCost: req?.estimatedCost }).catch(() => {});
    api.saveActivity({ id: `ACT-${Date.now()}`, userId: activeUser?.id || '', userName: approverName, action: `Fuel Requisition ${id}: Approved by ${approverName}`, timestamp: new Date().toISOString() }).catch(() => {});

    logActivity(`Fuel Requisition ${id}: Approved by ${approverName}`);
    const submitter = users.find(u => u.name === req?.driverName);
    if (submitter) {
      api.sendEmail(submitter.email, `Fuel Requisition Approved - ${id}`, `<h3>Your Fuel Requisition Has Been Approved</h3><p>Requisition: <b>${id}</b></p><p>Approved by: <b>${approverName}</b></p><p>Date: ${today}</p><p>Redeem Token: <b style="font-size:18px;letter-spacing:4px">${redeemToken}</b></p><p>Present this token at the fuel station to redeem.</p>`).catch(() => {});
    }
  };

  const rejectRequisition = (id: string, reason: string) => {
    const today = new Date().toISOString().split('T')[0];
    const rejecterName = activeUser?.name || 'Reviewer';
    
    setFuelRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'Rejected' as const,
          rejectedBy: rejecterName,
          rejectedDate: today,
          rejectionReason: reason
        };
      }
      return r;
    }));

    const rejectReq = fuelRequisitions.find(r => r.id === id);
    api.updateFuelRequisition(id, { status: 'Rejected', rejectedBy: rejecterName, rejectedDate: today, rejectionReason: reason, litresRequested: rejectReq?.litresRequested, estimatedCost: rejectReq?.estimatedCost }).catch(() => {});
    api.saveActivity({ id: `ACT-${Date.now()}`, userId: activeUser?.id || '', userName: rejecterName, action: `Fuel Requisition ${id}: Rejected by ${rejecterName} - Reason: ${reason}`, timestamp: new Date().toISOString() }).catch(() => {});

    logActivity(`Fuel Requisition ${id}: Rejected by ${rejecterName} - Reason: ${reason}`);
    
    const req = fuelRequisitions.find(r => r.id === id);
    const submitter = users.find(u => u.name === req?.driverName);
    if (submitter) {
      api.sendEmail(submitter.email, `Fuel Requisition Rejected - ${id}`, `<h3>Your Fuel Requisition Has Been Rejected</h3><p>Requisition: <b>${id}</b></p><p>Rejected by: <b>${rejecterName}</b></p><p>Date: ${today}</p><p>Reason: <i>${reason}</i></p><p>Please contact the approver for more details.</p>`).catch(() => {});
    }
  };

  const redeemRequisition = (id: string, rd: { 
    redeemedByGasStation: string; 
    redeemedAttendantSignature: string; 
    redeemedActualLitres: number; 
    redeemedActualCost: number;
    odometer: number;
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
    const newLog: FuelLog = {
      id: `FL-${Math.floor(900 + Math.random() * 100)}`,
      truckId: target.truckId,
      truckPlate: target.truckPlate || 'N/A',
      driverId: target.driverId,
      driverName: target.driverName || 'N/A',
      litres: rd.redeemedActualLitres,
      cost: rd.redeemedActualCost,
      odometer: rd.odometer,
      location: rd.redeemedByGasStation,
      date: new Date().toISOString().split('T')[0],
      fuelType: target.fuelType || 'Diesel'
    };
    setFuelLogs(prev => [newLog, ...prev]);

    api.updateFuelRequisition(id, { status: 'Redeemed', redeemDate: new Date().toISOString().split('T')[0], redeemedByGasStation: rd.redeemedByGasStation, redeemedAttendantSignature: rd.redeemedAttendantSignature, redeemedActualLitres: rd.redeemedActualLitres, redeemedActualCost: rd.redeemedActualCost, litresRequested: target.litresRequested, estimatedCost: target.estimatedCost }).catch(() => {});
    api.saveFuelLog(newLog).catch(() => {});

    setPrepaidFuelBalanceState(prev => {
      const newDiesel = Math.max(0, prev.diesel - (target.fuelType === 'Diesel' ? rd.redeemedActualLitres : 0));
      const newPetrol = Math.max(0, prev.petrol - (target.fuelType === 'Petrol' ? rd.redeemedActualLitres : 0));
      const fuelType = target.fuelType || 'Diesel';
      const deductionLog: FuelBalanceLog = {
        id: `FBL-${Date.now()}`,
        type: 'Deduction',
        fuelType: fuelType as 'Diesel' | 'Petrol',
        litres: rd.redeemedActualLitres,
        balanceBefore: fuelType === 'Diesel' ? prev.diesel : prev.petrol,
        balanceAfter: fuelType === 'Diesel' ? newDiesel : newPetrol,
        note: `Redeemed for ${target.truckPlate || target.truckId} at ${rd.redeemedByGasStation}`,
        createdBy: activeUser?.name,
      };
      setFuelBalanceLogs(prevLogs => [deductionLog, ...prevLogs]);
      api.saveFuelBalanceLog(deductionLog).catch(() => {});
      api.saveSetting('prepaidDiesel', String(newDiesel)).catch(() => {});
      api.saveSetting('prepaidPetrol', String(newPetrol)).catch(() => {});
      return { diesel: newDiesel, petrol: newPetrol };
    });

    logActivity(`Verified & Redeemed Fuel Token for ${target.id} at ${rd.redeemedByGasStation}`, `Filled ${rd.redeemedActualLitres}L`);
  };

  const addBranch = (b: Omit<Branch, 'id'>) => {
    const newId = `BR-${Math.floor(100 + Math.random() * 900)}`;
    const newBranch: Branch = {
      ...b,
      id: newId
    };
    setBranches(prev => [...prev, newBranch]);
    api.saveBranch(newBranch).catch(() => {});
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
    api.deleteTruck(id).catch(() => {});
    logActivity(`Deleted fleet asset truck: ${id}`);
  };

  const deleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    setTrucks(prev => prev.map(t => t.driverId === id ? { ...t, driverId: null, status: 'Idle' as const } : t));
    setJobs(prev => prev.map(j => j.driverId === id ? { ...j, driverId: null, driverName: undefined, status: j.status === 'Assigned' || j.status === 'In Transit' ? 'Pending' as const : j.status } : j));
    api.deleteDriver(id).catch(() => {});
    logActivity(`Deleted driver personnel: ${id}`);
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    logActivity(`Deleted job record: ${id}`);
  };

  const resetAllData = () => {
    const currentUser = activeUser || { id: '', name: 'System', role: 'Administrator' };
    setUsers([]);
    setActiveUserState(currentUser);
    
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
        user: currentUser.name,
        role: currentUser.role,
        action: "Database Clear",
      details: "Database clear."
    }
  ]);
    setBranches([]);
    setThemeState('slate');
    setLogoTextState('FLEETCOMMAND');
    setLogoEmojiState('🚛');

    localStorage.setItem('fc_users', JSON.stringify([]));
    localStorage.setItem('fc_activeUser', JSON.stringify(currentUser));
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
        user: currentUser.name,
        role: currentUser.role,
        action: "Database Clear",
        details: "Database clear."
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
    setPrepaidFuelBalanceState({ diesel: 0, petrol: 0 });
    localStorage.setItem('fc_prepaidFuel', JSON.stringify({ diesel: 0, petrol: 0 }));
  };

  return (
    <FleetContext.Provider value={{
      users, activeUser, trucks, drivers, jobs, maintenance, fuelLogs, fuelRequisitions, activities,
      branches, theme, logoText, logoEmoji, prepaidFuelBalance, setPrepaidFuelBalance,
      setActiveUser, approveUser, logout, addUser, updateUserRole, revokeUser, deleteUser,
      addTruck, updateTruck, updateTruckStatus, assignDriverToTruck,
      addDriver, updateDriver, updateDriverStatus,
      addJob, assignJob, updateJobStatus,
      addMaintenanceRecord, updateMaintenanceStatus,
      addFuelLog, addFuelRequisition, updateRequisitionStatus, editRequisitionQuantity,
      reviewRequisition, verifyRequisition, approveRequisition, rejectRequisition,
      redeemRequisition, addBranch,
      setTheme, setLogoText, setLogoEmoji,
      logActivity, resetAllData,
      clearTrucksData, clearDriversData, clearJobsData, clearMaintenanceData, clearFuelData, clearDispatchData,
      deleteTruck, deleteDriver, deleteJob,
      dispatches, setDispatches, stockMovements, setStockMovements,
      fuelBalanceLogs, setFuelBalanceLogs
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
