import React from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { getTruckMarker, getHubMarker } from '../utils/leafletIcons';
import { 
  Truck as TruckIcon, Users, Briefcase, Wrench, AlertTriangle, 
  MapPin, Clock, ArrowRight, ShieldCheck, HelpCircle, Fuel
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { trucks, drivers, jobs, maintenance, fuelLogs, branches } = useFleet();

  // 1. Calculations for KPIs
  const activeTrucks = trucks.filter(t => t.status === 'Active' || t.status === 'Maintenance').length;
  const onRouteDrivers = drivers.filter(d => d.status === 'On Route').length;
  const activeJobs = jobs.filter(j => j.status === 'In Transit' || j.status === 'Assigned').length;
  
  // Calculate maintenance alerts (overdue or high priority scheduled)
  const overdueOrCriticalMaintenance = trucks.filter(t => t.mileage >= t.nextServiceMileage).length + 
    maintenance.filter(m => m.status !== 'Completed' && m.priority === 'High').length;

  // 2. Active Jobs data
  const ongoingJobs = jobs.filter(j => j.status === 'In Transit' || j.status === 'Assigned');

  // Zimbabwe center coordinates
  const zimbabweCenter: [number, number] = [-19.0154, 29.1549];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Trucks */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-5 hover:border-orange-500/30 transition-all flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Active Trucks</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {trucks.filter(t => t.status === 'Active').length}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">of {trucks.length} total vehicles</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
              <TruckIcon size={18} />
            </div>
          </div>

          {/* On Route Drivers */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-5 hover:border-orange-500/30 transition-all flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Drivers On Route</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {onRouteDrivers}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono font-bold text-emerald-400">
                {drivers.filter(d => d.status === 'Active').length} ready for dispatch
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Users size={18} />
            </div>
          </div>

          {/* Jobs In Progress */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-5 hover:border-orange-500/30 transition-all flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Jobs In Progress</span>
              <p className="text-3xl font-extrabold font-mono text-white mt-1">
                {jobs.filter(j => j.status === 'In Transit').length}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">{jobs.filter(j => j.status === 'Pending').length} pending dispatch</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Briefcase size={18} />
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-5 hover:border-orange-500/30 transition-all flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Maintenance Due</span>
              <p className={`text-3xl font-extrabold font-mono mt-1 ${overdueOrCriticalMaintenance > 0 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                {overdueOrCriticalMaintenance}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">active service requests</p>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
              overdueOrCriticalMaintenance > 0 
                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                : 'bg-zinc-850 text-zinc-550 border-zinc-800'
            }`}>
              <Wrench size={18} />
            </div>
          </div>

          {/* Total Operations Fuel */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-5 hover:border-orange-500/30 transition-all flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Fuel Tracking</span>
              <p className="text-xl font-bold font-mono text-orange-400 mt-2 truncate">
                ${fuelLogs.reduce((acc, l) => acc + l.cost, 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-450 font-mono">Cumulative refuels</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-600/25">
              <Fuel size={18} />
            </div>
          </div>
        </div>

        {/* MAP & DRIVER STATUS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2 bg-[#101424] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 bg-zinc-950/40 border-b border-zinc-850 flex justify-between items-center px-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">LIVE FLEET TRACKING</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">Map Engine: OpenStreetMap</span>
            </div>

            {/* Simulated/Leaflet Integrated Viewport */}
            <div className="flex-1 w-full bg-[#0c0f1d] relative z-10">
              <MapContainer 
                center={zimbabweCenter} 
                zoom={6.2} 
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="leaflet-dark-tiles"
                />

                {/* Draw Route Polylines from Active Jobs */}
                {jobs.map(j => (
                  j.status === 'In Transit' && j.routeCoordinates ? (
                    <Polyline
                      key={`route-${j.id}`}
                      positions={j.routeCoordinates}
                      color="#f97316"
                      weight={3}
                      opacity={0.8}
                      dashArray="5, 10"
                    />
                  ) : null
                ))}

                {/* Custom Source and Destination markers from Jobs */}
                {jobs.map(j => (
                  j.status === 'In Transit' ? (
                    <React.Fragment key={`hubs-${j.id}`}>
                      <Marker 
                        position={[j.sourceLat, j.sourceLng]} 
                        icon={getHubMarker('source', j.source.split(' ')[0])}
                      >
                        <Popup>
                          <div className="text-xs p-1 bg-[#121624] text-gray-200">
                            <p className="font-bold text-orange-400">SOURCE: {j.source}</p>
                            <p>Cargo: {j.cargoType} ({j.weight} Tons)</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Marker 
                        position={[j.destinationLat, j.destinationLng]} 
                        icon={getHubMarker('destination', j.destination.split(' ')[0])}
                      >
                        <Popup>
                          <div className="text-xs p-1 bg-[#121624] text-gray-200">
                            <p className="font-bold text-emerald-400">DEST: {j.destination}</p>
                            <p>Route: JOB {j.id}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  ) : null
                ))}

                {/* Active Truck markers */}
                {trucks.map(t => (
                  <Marker 
                    key={t.id} 
                    position={[t.currentLat, t.currentLng]} 
                    icon={getTruckMarker(t.status)}
                  >
                    <Popup>
                      <div className="text-xs p-2 text-zinc-300 min-w-[200px] font-sans">
                        <div className="flex justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                          <span className="font-mono text-orange-400 font-bold">{t.id}</span>
                          <span className={`px-1.5 rounded font-mono text-[9px] uppercase ${
                            t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.status === 'Maintenance' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>{t.status}</span>
                        </div>
                        <p className="text-white font-medium text-xs">{t.type}</p>
                        <p className="text-zinc-400 text-[10px] mt-0.5">Plate: {t.plateNumber}</p>
                        <p className="text-zinc-500 text-[10px] my-1 font-mono">Mileage: {t.mileage.toLocaleString()} km</p>
                        
                        {t.driverId && (
                          <div className="mt-2 pt-1.5 border-t border-zinc-800 text-[10px] flex justify-between">
                            <span className="text-zinc-500">Assigned Driver:</span>
                            <span className="text-white font-semibold font-mono">
                              {drivers.find(d => d.id === t.driverId)?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Custom Depot/Branch Markers */}
                {branches && branches.map(b => (
                  <Marker 
                    key={`branch-${b.id}`} 
                    position={[b.lat, b.lng]} 
                    icon={getHubMarker('general', b.name.split(' ')[0])}
                  >
                    <Popup>
                      <div className="text-xs p-2 text-zinc-300 min-w-[200px] font-sans">
                        <div className="flex justify-between border-b border-zinc-800 pb-1 mb-1">
                          <span className="font-mono text-emerald-400 font-bold">🏢 DEPOT / BRANCH</span>
                          <span className="font-mono text-[9px] text-zinc-500">{b.id}</span>
                        </div>
                        <p className="text-white font-semibold text-xs">{b.name}</p>
                        <p className="text-zinc-400 text-[10px] mt-0.5">Location: {b.locationName}</p>
                        {b.phone && <p className="text-zinc-550 text-[10px] mt-0.5">Tel: {b.phone}</p>}
                        {b.manager && (
                          <div className="mt-1.5 pt-1.5 border-t border-zinc-900 flex justify-between text-[10px]">
                            <span className="text-zinc-500">Manager:</span>
                            <span className="text-emerald-400 font-mono font-bold">{b.manager}</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Drivers status panel on right side */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">DRIVER STATUS UNIT</h3>
              <Link to="/drivers" className="text-xs text-orange-500 hover:text-orange-400 font-semibold">View Staff</Link>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-850 mt-2">
              {drivers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-medium">No drivers added yet</div>
              ) : (
                drivers.map(d => (
                  <div key={d.id} className="py-3 flex items-center gap-3 hover:bg-zinc-900/20 px-1 rounded transition-colors">
                    <div className="h-9 w-9 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold font-mono text-zinc-400 text-xs">
                      {d.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{d.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                        <span className="font-mono">{d.id}</span>
                        <span>•</span>
                        <span className="text-zinc-400 truncate">{d.licenseClass}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                        d.status === 'On Route' ? 'bg-orange-500/10 text-orange-400' :
                        d.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {d.status}
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">{d.tripsCompleted} runs</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE DISPATCHES & CRITICAL NOTIFICATION TICKERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Jobs table */}
          <div className="lg:col-span-2 bg-[#101424] border border-zinc-800/80 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">ACTIVE CARGO DELIVERIES</h3>
              <Link to="/jobs" className="text-xs text-orange-500 hover:text-orange-400 font-semibold">Freight Manager</Link>
            </div>

            <div className="overflow-x-auto">
              {ongoingJobs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-medium">No active or assigned cargo flows</div>
              ) : (
                <table className="w-full text-left text-xs bg-zinc-950/20 border border-zinc-850 rounded">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                      <th className="p-3">Job ID</th>
                      <th className="p-3">Cargo Spec</th>
                      <th className="p-3">Route Corridors</th>
                      <th className="p-3">Staff / Truck</th>
                      <th className="p-3">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {ongoingJobs.map(j => (
                      <tr key={j.id} className="text-zinc-300 hover:bg-zinc-900/10">
                        <td className="p-3 font-mono text-orange-500 font-bold">{j.id}</td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{j.cargoType}</p>
                          <span className="text-[10px] text-zinc-500 font-mono">{j.weight} Tons</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-zinc-400 font-medium text-[11px]">
                            <span className="truncate">{j.source.split(' ')[0]}</span>
                            <ArrowRight size={12} className="text-zinc-650" />
                            <span className="truncate">{j.destination.split(' ')[0]}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-zinc-200">{j.driverName || 'Unassigned'}</p>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 py-0.5 px-1 mt-0.5 inline-block rounded border border-zinc-850">{j.truckPlate || 'Unassigned'}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${j.status === 'In Transit' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              j.status === 'In Transit' ? 'bg-orange-500/10 text-orange-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>{j.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Maintenance Alerts on bottom-right */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
                <AlertTriangle size={15} className="text-yellow-500" />
                WORKSHOP FOREMAN TICKER
              </h3>
              <Link to="/maintenance" className="text-xs text-orange-500 hover:text-orange-400 font-semibold">Service Bay</Link>
            </div>

            <div className="space-y-4 mt-4">
              {/* Overdue trucks because of high mileage */}
              {trucks.filter(t => t.mileage >= t.nextServiceMileage).map(t => (
                <div key={`overdue-${t.id}`} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-3">
                  <div className="h-8 w-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mt-0.5 shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-400">Truck mileage exceeded limit!</p>
                    <p className="text-[11px] text-zinc-300 font-mono mt-0.5">{t.id} - {t.plateNumber}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Mileage: {t.mileage.toLocaleString()} / Overdue: {t.nextServiceMileage.toLocaleString()} km</p>
                  </div>
                </div>
              ))}

              {/* Maintenance orders ongoing or pending */}
              {maintenance.filter(m => m.status !== 'Completed').length === 0 && trucks.filter(t => t.mileage >= t.nextServiceMileage).length === 0 ? (
                <div className="text-center py-16 bg-zinc-950/20 rounded border border-zinc-900 border-dashed text-zinc-500 text-xs font-mono">
                  No active mechanical warning bulletins logged. All systems nominal.
                </div>
              ) : (
                maintenance.filter(m => m.status !== 'Completed').map(m => (
                  <div key={m.id} className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-lg flex items-start gap-3">
                    <div className="h-8 w-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mt-0.5 shrink-0">
                      <Wrench size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="text-xs font-bold text-yellow-500 truncate">{m.serviceType}</p>
                        <span className="text-[9px] uppercase font-mono px-1 bg-zinc-900 rounded text-zinc-400 shrink-0">{m.priority}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 font-mono mt-0.5 flex justify-between">
                        <span>Truck: {m.truckId}</span>
                        <span className="text-zinc-500">{m.status}</span>
                      </p>
                      <p className="text-[9.5px] text-zinc-500 mt-1 line-clamp-2">{m.notes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
