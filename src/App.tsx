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
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';

function AppRoutes() {
  const { activeUser } = useFleet();

  if (!activeUser) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  // Setup permission rules:
  // Status: "Pending" accounts show ONLY Dashboard and Profile (for status review).
  const isPending = activeUser.status === 'Pending';
  const role = activeUser.role;

  const canAccessDispatch = !isPending && (role === 'Admin' || role === 'Director' || role === 'Dispatch Manager');
  const canAccessJobs = !isPending && (role === 'Admin' || role === 'Director' || role === 'Dispatch Manager');
  const canAccessFleet = !isPending && (role === 'Admin' || role === 'Director' || role === 'Fleet Manager');
  const canAccessDrivers = !isPending && (role === 'Admin' || role === 'Director' || role === 'Fleet Manager');
  const canAccessMaintenance = !isPending && (role === 'Admin' || role === 'Director');
  const canAccessFuel = !isPending && (role === 'Admin' || role === 'Director' || role === 'Fleet Manager');
  const canAccessSettings = !isPending && (role === 'Admin' || role === 'Director');

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/dispatch" element={canAccessDispatch ? <Dispatch /> : <Navigate to="/" replace />} />
        <Route path="/jobs" element={canAccessJobs ? <Jobs /> : <Navigate to="/" replace />} />
        
        <Route path="/drivers" element={canAccessDrivers ? <Drivers /> : <Navigate to="/" replace />} />
        <Route path="/fleet" element={canAccessFleet ? <Fleet /> : <Navigate to="/" replace />} />
        
        <Route path="/maintenance" element={canAccessMaintenance ? <Maintenance /> : <Navigate to="/" replace />} />
        <Route path="/fuel" element={canAccessFuel ? <FuelTracking /> : <Navigate to="/" replace />} />
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={canAccessSettings ? <Settings /> : <Navigate to="/" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
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
