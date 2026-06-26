const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('fc_auth_token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('fc_auth_token', token);
  } else {
    localStorage.removeItem('fc_auth_token');
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = getToken();
  if (token) {
    (opts.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) {
    if (token && isTokenExpired(token)) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('session-expired'));
    } else {
      setToken(null);
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} failed: ${res.status}${body ? ' — ' + body : ''}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => request<{ success: boolean; user: any; token: string }>('POST', '/auth/login', { email, password }),
  signup: (name: string, email: string, password: string, role: string) => request<{ success: boolean; message: string }>('POST', '/auth/signup', { name, email, password, role }),
  verifyPassword: (userId: string, password: string) => request<{ valid: boolean }>('POST', '/auth/verify-password', { userId, password }),
  changePassword: (currentPassword: string, newPassword: string) => request<{ success: boolean; message: string }>('PUT', '/auth/change-password', { currentPassword, newPassword }),

  // Users
  getUsers: () => request<any[]>('GET', '/users'),
  saveUser: (u: any) => request<any>('POST', '/users', u),
  updateUser: (id: string, u: any) => request<any>('PUT', `/users/${id}`, u),
  deleteUser: (id: string) => request<any>('DELETE', `/users/${id}`),

  // Trucks
  getTrucks: () => request<any[]>('GET', '/trucks'),
  saveTruck: (t: any) => request<any>('POST', '/trucks', t),
  updateTruck: (id: string, t: any) => request<any>('PUT', `/trucks/${id}`, t),
  deleteTruck: (id: string) => request<any>('DELETE', `/trucks/${id}`),

  // Drivers
  getDrivers: () => request<any[]>('GET', '/drivers'),
  saveDriver: (d: any) => request<any>('POST', '/drivers', d),
  updateDriver: (id: string, d: any) => request<any>('PUT', `/drivers/${id}`, d),
  deleteDriver: (id: string) => request<any>('DELETE', `/drivers/${id}`),

  // Jobs
  getJobs: () => request<any[]>('GET', '/jobs'),
  saveJob: (j: any) => request<any>('POST', '/jobs', j),
  updateJob: (id: string, j: any) => request<any>('PUT', `/jobs/${id}`, j),
  deleteJob: (id: string) => request<any>('DELETE', `/jobs/${id}`),

  // Maintenance
  getMaintenance: () => request<any[]>('GET', '/maintenance'),
  saveMaintenance: (m: any) => request<any>('POST', '/maintenance', m),
  updateMaintenance: (id: string, m: any) => request<any>('PUT', `/maintenance/${id}`, m),

  // Fuel Logs
  getFuelLogs: () => request<any[]>('GET', '/fuel-logs'),
  saveFuelLog: (f: any) => request<any>('POST', '/fuel-logs', f),

  // Fuel Requisitions
  getFuelRequisitions: () => request<any[]>('GET', '/fuel-requisitions'),
  saveFuelRequisition: (r: any) => request<any>('POST', '/fuel-requisitions', r),
  updateFuelRequisition: (id: string, r: any) => request<any>('PUT', `/fuel-requisitions/${id}`, r),

  // Branches
  getBranches: () => request<any[]>('GET', '/branches'),
  saveBranch: (b: any) => request<any>('POST', '/branches', b),

  // Activities
  getActivities: () => request<any[]>('GET', '/activities'),
  saveActivity: (a: any) => request<any>('POST', '/activities', a),

  // Dispatches
  getDispatches: () => request<any[]>('GET', '/dispatches'),
  saveDispatch: (d: any) => request<any>('POST', '/dispatches', d),

  // Stock Movements
  getStockMovements: () => request<any[]>('GET', '/stock-movements'),
  saveStockMovement: (s: any) => request<any>('POST', '/stock-movements', s),

  // Settings
  getSettings: () => request<Record<string, string>>('GET', '/settings'),
  saveSetting: (key: string, value: string) => request<any>('PUT', `/settings/${key}`, { value }),

  // Fuel Balance Logs
  getFuelBalanceLogs: () => request<any[]>('GET', '/fuel-balance-logs'),
  saveFuelBalanceLog: (b: any) => request<any>('POST', '/fuel-balance-logs', b),

  // Reset
  resetAll: () => request<any>('POST', '/reset'),

  // Email
  sendEmail: (to: string, subject: string, body: string) => request<any>('POST', '/send-email', { to, subject, body }),
};
