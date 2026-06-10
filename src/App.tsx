import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Dashboard } from './pages/Dashboard';
import { Dispatch } from './pages/Dispatch';
import { Jobs } from './pages/Jobs';
import { Drivers } from './pages/Drivers';
import { Fleet } from './pages/Fleet';
import { Maintenance } from './pages/Maintenance';
import { FuelTracking } from './pages/FuelTracking';
import { RequisitionsPipeline } from './pages/RequisitionsPipeline';
import { MineazyFuelRedemption } from './pages/MineazyFuelRedemption';
import { VerifyRequisition } from './pages/VerifyRequisition';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { PendingVerification } from './pages/PendingVerification';
import { UserGuide } from './pages/UserGuide';
import { ScannerRedemption } from './pages/ScannerRedemption';
import { Auth } from './pages/Auth';

function AppRoutes() {
  const { activeUser } = useFleet();

  if (!activeUser) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<VerifyRequisition />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  if (activeUser.status === 'Pending') {
    return (
      <HashRouter>
        <Routes>
          <Route path="*" element={<PendingVerification />} />
        </Routes>
      </HashRouter>
    );
  }

  // Setup permission rules:
  const isPending = activeUser.status === 'Pending';
  const role = activeUser.role;

  const isAdminOrDirector = role === 'Administrator' || role === 'Director';
  const isOpsRole = isAdminOrDirector || role === 'Manager' || role === 'Treasurer';
  const isAttendant = role === 'Attendant';
  const fallbackRoute = isAttendant ? '/redemption' : '/';
  const canAccessDispatch = !isPending && (isOpsRole || role === 'Accounts');
  const canAccessJobs = !isPending && (isOpsRole || role === 'Accounts');
  const canAccessFleet = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const canAccessDrivers = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const canAccessMaintenance = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const canAccessFuel = !isPending && (isOpsRole || role === 'Accounts');
  const canAccessRequisitions = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const canAccessRedemption = !isPending && role === 'Attendant';
  const canAccessReports = !isPending && (isAdminOrDirector || role === 'Manager' || role === 'Accounts' || role === 'Treasurer');
  const canAccessSettings = !isPending && isAdminOrDirector;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={isAttendant ? <Navigate to="/redemption" replace /> : <Dashboard />} />
        
        <Route path="/dispatch" element={canAccessDispatch ? <Dispatch /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/jobs" element={canAccessJobs ? <Jobs /> : <Navigate to={fallbackRoute} replace />} />
        
        <Route path="/drivers" element={canAccessDrivers ? <Drivers /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/fleet" element={canAccessFleet ? <Fleet /> : <Navigate to={fallbackRoute} replace />} />
        
        <Route path="/maintenance" element={canAccessMaintenance ? <Maintenance /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/fuel" element={canAccessFuel ? <FuelTracking /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/requisitions" element={canAccessRequisitions ? <RequisitionsPipeline /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/redemption" element={canAccessRedemption ? <MineazyFuelRedemption /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/reports" element={canAccessReports ? <Reports /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/verify" element={<VerifyRequisition />} />
        
        <Route path="/profile" element={isAttendant ? <Navigate to="/redemption" replace /> : <Profile />} />
        <Route path="/scan" element={<ScannerRedemption />} />
        <Route path="/guide" element={<UserGuide />} />
        <Route path="/settings" element={canAccessSettings ? <Settings /> : <Navigate to={fallbackRoute} replace />} />
        <Route path="/users" element={role === 'Administrator' ? <UserManagement /> : <Navigate to={fallbackRoute} replace />} />
        
        <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <AppRoutes />
    </FleetProvider>
  );
}
