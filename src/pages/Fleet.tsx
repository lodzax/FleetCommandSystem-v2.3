import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  Plus, Search, ShieldAlert, CheckCircle, Wrench, AlertTriangle, 
  Settings, Truck as TruckIcon, Gauge, Hammer, Sparkles, X, UserCheck, Trash2,
  MapPin, Satellite, Navigation, Battery, Signal, ExternalLink, Smartphone, Pencil
} from 'lucide-react';
import { Truck, TruckStatus } from '../types';
import { compressAndGetBase64 } from '../utils/compress';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const Fleet: React.FC = () => {
  const { trucks, drivers, addTruck, updateTruck, updateTruckStatus, assignDriverToTruck, deleteTruck, branches } = useFleet();

  const [viewTab, setViewTab] = useState<'roster' | 'tracking'>('roster');
  const [search, setSearch] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<'All' | 'Truck' | 'Light Vehicle'>('All');
  const [showLightVehicleModal, setShowLightVehicleModal] = useState(false);
  const [lvPlate, setLvPlate] = useState('');
  const [lvType, setLvType] = useState('');
  const [lvModel, setLvModel] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Form states
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [fuelRate, setFuelRate] = useState(0);
  const [locationPreset, setLocationPreset] = useState(0);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customLocationName, setCustomLocationName] = useState('');
  const [customLat, setCustomLat] = useState(0);
  const [customLng, setCustomLng] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [trackerImei, setTrackerImei] = useState('');
  const [trackerModel, setTrackerModel] = useState('');
  const [trackerSimCard, setTrackerSimCard] = useState('');

  const [assignDriverId, setAssignDriverId] = useState('');

  // Edit truck modal states
  const [showEditTruckModal, setShowEditTruckModal] = useState(false);
  const [editPlate, setEditPlate] = useState('');
  const [editType, setEditType] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editFuelRate, setEditFuelRate] = useState(0);
  const [editTrackerImei, setEditTrackerImei] = useState('');
  const [editTrackerModel, setEditTrackerModel] = useState('');
  const [editTrackerSim, setEditTrackerSim] = useState('');

  const availableStations = branches && branches.length > 0 
    ? branches.map(b => ({ name: b.name, lat: b.lat, lng: b.lng }))
    : [];

  // Search
  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = t.plateNumber.toLowerCase().includes(search.toLowerCase()) || 
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = vehicleFilter === 'All' || (t.category || 'Truck') === vehicleFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    
    let lat = useCustomLocation ? customLat : (availableStations[locationPreset]?.lat || 0);
    let lng = useCustomLocation ? customLng : (availableStations[locationPreset]?.lng || 0);

    addTruck({
      plateNumber,
      type,
      model,
      capacity,
      fuelRate,
      currentLat: lat,
      currentLng: lng,
      imageUrl: imageUrl.trim() || undefined,
      trackerImei: trackerImei.trim() || undefined,
      trackerModel: trackerImei.trim() ? trackerModel : undefined,
      trackerSimCard: trackerImei.trim() ? trackerSimCard.trim() || undefined : undefined
    });

    // Reset Form
    setPlateNumber('');
    setType('');
    setModel('');
    setCapacity('');
    setFuelRate(0);
    setLocationPreset(0);
    setUseCustomLocation(false);
    setImageUrl('');
    setTrackerImei('');
    setTrackerSimCard('');
    setTrackerModel('');
    setShowAddModal(false);
  };

  const handleAddLightVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    addTruck({
      plateNumber: lvPlate,
      type: lvType,
      model: lvModel,
      capacity: '-',
      fuelRate: 0,
      currentLat: 0,
      currentLng: 0,
      category: 'Light Vehicle'
    });
    setLvPlate('');
    setLvType('');
    setLvModel('');
    setShowLightVehicleModal(false);
  };

  const handleDriverAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruck) return;

    assignDriverToTruck(selectedTruck.id, assignDriverId);
    setAssignDriverId('');

    // Instant local state sync to refresh pane
    const tId = selectedTruck.id;
    setTimeout(() => {
      setSelectedTruck(trucks.find(t => t.id === tId) || null);
    }, 120);
  };

  const openEditTruckModal = (t: Truck) => {
    setEditPlate(t.plateNumber);
    setEditType(t.type);
    setEditModel(t.model);
    setEditCapacity(t.capacity);
    setEditFuelRate(t.fuelRate);
    setEditTrackerImei(t.trackerImei || '');
    setEditTrackerModel(t.trackerModel || '');
    setEditTrackerSim(t.trackerSimCard || '');
    setShowEditTruckModal(true);
  };

  const handleEditTruck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruck) return;
    updateTruck(selectedTruck.id, {
      plateNumber: editPlate,
      type: editType,
      model: editModel,
      capacity: editCapacity,
      fuelRate: editFuelRate,
      trackerImei: editTrackerImei || undefined,
      trackerModel: editTrackerImei ? editTrackerModel : undefined,
      trackerSimCard: editTrackerImei ? editTrackerSim || undefined : undefined
    });
    setSelectedTruck(prev => prev ? {
      ...prev,
      plateNumber: editPlate,
      type: editType,
      model: editModel,
      capacity: editCapacity,
      fuelRate: editFuelRate,
      trackerImei: editTrackerImei || undefined,
      trackerModel: editTrackerImei ? editTrackerModel : undefined,
      trackerSimCard: editTrackerImei ? editTrackerSim || undefined : undefined
    } : null);
    setShowEditTruckModal(false);
  };

  const selectedTruckDriver = selectedTruck ? drivers.find(d => d.id === selectedTruck.driverId) : null;
  const unassignedDrivers = drivers.filter(d => d.status === 'Active' || d.status === 'Off Duty' && !d.assignedTruckId);

  // Map initialization
  useEffect(() => {
    if (viewTab !== 'tracking' || !mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([-19.0, 29.5], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    trucks.forEach(t => {
      if (!t.currentLat || !t.currentLng) return;
      const statusColors: Record<string, string> = {
        Active: '#22c55e',
        Idle: '#a1a1aa',
        Maintenance: '#eab308',
        'Out of Service': '#ef4444'
      };
      const color = statusColors[t.status] || '#a1a1aa';

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([t.currentLat, t.currentLng], { icon })
        .addTo(leafletMap.current!)
        .bindPopup(`
          <div style="font-family:monospace;font-size:11px;min-width:180px">
            <b style="font-size:13px">${t.plateNumber}</b><br/>
            ${t.type}<br/>
            <span style="color:${color}">●</span> ${t.status}<br/>
            ${t.trackerImei ? `IMEI: ${t.trackerImei}<br/>` : ''}
            ${t.trackerModel ? `Tracker: ${t.trackerModel}<br/>` : ''}
            ${t.lastGpsUpdate ? `Last GPS: ${new Date(t.lastGpsUpdate).toLocaleString()}` : 'No GPS data'}
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Fit bounds to markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      leafletMap.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup not needed since we reuse the map
    };
  }, [viewTab, trucks]);

  return (
    <Layout title="Fleet">
      <div className="space-y-6">
        
        {/* VIEW TAB TOGGLE */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-1 bg-[#0c0f1d] p-1 rounded-lg border border-zinc-800/60">
            <button
              onClick={() => setViewTab('roster')}
              className={`px-4 py-1.5 rounded text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                viewTab === 'roster' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TruckIcon size={14} className="inline mr-1.5" />FLEET ROSTER
            </button>
            <button
              onClick={() => setViewTab('tracking')}
              className={`px-4 py-1.5 rounded text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                viewTab === 'tracking' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Satellite size={14} className="inline mr-1.5" />GPS TRACKING
            </button>
          </div>

          {viewTab === 'roster' && (
            <>
              <div className="flex gap-1 bg-[#0c0f1d] p-1 rounded-lg border border-zinc-800/60">
                <button onClick={() => setVehicleFilter('All')}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                    vehicleFilter === 'All' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>ALL</button>
                <button onClick={() => setVehicleFilter('Truck')}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                    vehicleFilter === 'Truck' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>TRUCKS</button>
                <button onClick={() => setVehicleFilter('Light Vehicle')}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                    vehicleFilter === 'Light Vehicle' ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>LIGHT VEHICLES</button>
              </div>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by plate or type..."
                  className="w-full bg-[#0c0f1d] border border-zinc-850 text-xs px-3.5 py-2 pl-9 rounded-lg focus:border-zinc-700 text-zinc-200 outline-none placeholder-zinc-500 font-mono"
                />
                <Search className="absolute left-3 top-2.5 text-zinc-555" size={14} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Commission Truck</span>
                </button>
                <button
                  onClick={() => setShowLightVehicleModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Commission Vehicle</span>
                </button>
              </div>
            </>
          )}

          {viewTab === 'tracking' && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Active</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400 inline-block"></span> Idle</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block"></span> Maintenance</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Out of Service</span>
            </div>
          )}
        </div>

        {viewTab === 'tracking' ? (
          /* GPS TRACKING VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-[#101424] border border-zinc-800 rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <div ref={mapRef} className="w-full h-full" />
            </div>
            <div className="lg:col-span-1 bg-[#101424] border border-zinc-800 rounded-xl p-5 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Satellite size={16} className="text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">Ehangtech GPS Tracking</h3>
              </div>

              {/* Ehangtech platform integration card */}
              <div className="bg-[#0c0f1d] border border-orange-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-orange-500" />
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Tracker Platform</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                  Powered by <span className="text-orange-400 font-semibold">Ehangtech</span> GPS vehicle trackers — real-time fleet positioning via GSM/GPRS/Beidou.
                </p>
                <a
                  href="http://www.4G-gps.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-orange-500 hover:text-orange-400 font-mono font-bold"
                >
                  <ExternalLink size={12} />
                  Open Ehangtech Tracking Portal
                </a>
                <div className="pt-2 text-[9px] text-zinc-600 font-mono border-t border-zinc-800/60">
                  Supported: EH002, EH003, ET006, IP67, OBD, Relay, Fuel Sensor trackers
                </div>
              </div>

              {/* Truck GPS list */}
              <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">Fleet GPS Status</h4>
              <div className="space-y-2">
                {trucks.filter(t => t.trackerImei).map(t => {
                  const statusColors: Record<string, string> = {
                    Active: 'text-emerald-500',
                    Idle: 'text-zinc-400',
                    Maintenance: 'text-yellow-500',
                    'Out of Service': 'text-red-500'
                  };
                  const sinceLastUpdate = t.lastGpsUpdate
                    ? Math.round((Date.now() - new Date(t.lastGpsUpdate).getTime()) / 60000)
                    : null;
                  return (
                    <div key={t.id} className="bg-[#0c0f1d] border border-zinc-800/80 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-200 font-mono">{t.plateNumber}</span>
                        <span className={`text-[9px] font-mono font-bold ${statusColors[t.status] || 'text-zinc-400'}`}>
                          ● {t.status}
                        </span>
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Navigation size={10} className="text-orange-500" />
                          Tracker: {t.trackerModel || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Signal size={10} className="text-orange-500" />
                          IMEI: {t.trackerImei}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Battery size={10} className="text-orange-500" />
                          Battery: {t.trackerBattery != null ? `${t.trackerBattery}%` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <MapPin size={10} />
                          {sinceLastUpdate != null
                            ? sinceLastUpdate < 60
                              ? `Updated ${sinceLastUpdate} min ago`
                              : `Updated ${Math.round(sinceLastUpdate / 60)}h ago`
                            : 'No data'}
                          {t.trackerSpeed != null && t.trackerSpeed > 0 && (
                            <span className="text-emerald-500">{t.trackerSpeed} km/h</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {trucks.filter(t => !t.trackerImei).length > 0 && (
                  <div className="text-[9px] text-zinc-600 font-mono text-center py-2">
                    {trucks.filter(t => !t.trackerImei).length} truck(s) without GPS tracker fitted
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* DOUBLE COLUMN SPLIT SCREEN: TRUCK ROSTER | TELEMETRY INTERFACES */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
            {/* LEFT: ROSTER LISTING */}
            <div className="lg:col-span-2 bg-[#101424] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-3 border-b border-zinc-800 mb-4">
              FLEET REGISTER ({filteredTrucks.length})
            </h3>

            <div className="overflow-y-auto max-h-[640px] pr-1">
              {filteredTrucks.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-medium font-mono">No vehicles registered.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTrucks.map(t => {
                    const isSelected = selectedTruck?.id === t.id;
                    const isOverdue = t.mileage >= t.nextServiceMileage;
                    const driverObj = drivers.find(d => d.id === t.driverId);

                    return (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedTruck(t)}
                        className={`bg-[#0e1120] border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20' 
                            : 'border-zinc-800 hover:border-zinc-700 hover:bg-[#12162a]'
                        }`}
                      >
                        {/* Upper Card Block: Modern Image Placeholder/Renders */}
                        <div className="relative h-28 w-full bg-[#070914] border-b border-zinc-850/60 flex items-center justify-center overflow-hidden">
                          {/* Pattern overlay */}
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2438_1px,transparent_1px),linear-gradient(to_bottom,#1f2438_1px,transparent_1px)] bg-[size:12px_12px] opacity-20"></div>
                          
                          {/* Optional custom picture or schematic placeholder */}
                          {t.imageUrl ? (
                            <img 
                              src={t.imageUrl} 
                              alt={t.type}
                              referrerPolicy="no-referrer"
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-1 z-10">
                              <span className="text-3xl filter drop-shadow">
                                {(t.category || 'Truck') === 'Light Vehicle' ? '🚗' :
                                 t.type.includes('Dump') || t.type.includes('Dumper') ? '🚧' : 
                                 t.type.includes('Flatbed') ? '🚚' : '🚛'}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                {t.type.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          )}

                          {/* Decorative overlay corner strip */}
                          <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                            <div className={`text-black text-[7px] font-bold font-mono py-1 text-center uppercase tracking-wider block rotate-45 translate-x-3 -translate-y-0.5 w-16 ${
                              (t.category || 'Truck') === 'Light Vehicle'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-600'
                            }`}>
                              {(t.category || 'Truck') === 'Light Vehicle' ? 'VEHICLE' : 'HAULER'}
                            </div>
                          </div>

                          {/* State dot */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full border border-zinc-800">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              t.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                              t.status === 'Maintenance' ? 'bg-yellow-500 animate-pulse' :
                              t.status === 'Out of Service' ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'
                            }`} />
                            <span className="text-[8px] font-bold font-mono uppercase tracking-wider text-zinc-300">{t.status}</span>
                          </div>

                          {/* Capacity Badge (hide for light vehicles) */}
                          {(t.category || 'Truck') !== 'Light Vehicle' && (
                            <div className="absolute bottom-2 right-2 bg-zinc-950/95 text-orange-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded border border-zinc-800 shadow-sm">
                              CAP: {t.capacity}
                            </div>
                          )}
                        </div>

                        {/* Mid Section: Essential Details */}
                        <div className="p-3.5 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-white text-xs truncate leading-snug" title={t.type}>{t.type}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">Model: {t.model}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-mono select-all bg-[#1a2038] text-zinc-300 px-2 py-0.5 rounded font-black border border-zinc-800 shadow-sm">
                              {t.plateNumber}
                            </span>
                          </div>

                          {/* Specs horizontal layout */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-400 font-mono">
                            <div className="space-y-0.5 bg-zinc-950/20 p-1.5 rounded border border-zinc-900 shadow-xs">
                              <span className="text-zinc-550 block text-[8px] uppercase font-sans">{(t.category || 'Truck') === 'Light Vehicle' ? 'Make / Model' : 'Current Mileage'}</span>
                              <div className="flex items-center gap-1">
                                {(t.category || 'Truck') === 'Light Vehicle' ? (
                                  <span className="font-bold text-zinc-300">{t.model || '-'}</span>
                                ) : (
                                  <>
                                    <span className="font-bold text-zinc-300">{t.mileage.toLocaleString()} km</span>
                                    {isOverdue && (
                                      <span className="bg-red-650/20 text-red-500 border border-red-500/10 px-0.5 rounded text-[8px] font-bold cursor-help" title="Immediate Service Overdue!">!</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="space-y-0.5 bg-zinc-950/20 p-1.5 rounded border border-zinc-900 shadow-xs">
                              <span className="text-zinc-550 block text-[8px] uppercase font-sans">{(t.category || 'Truck') === 'Light Vehicle' ? 'Plate Number' : 'Fuel Burn Rate'}</span>
                              <span className="font-bold text-zinc-300">{(t.category || 'Truck') === 'Light Vehicle' ? t.plateNumber : `${t.fuelRate} L/100km`}</span>
                            </div>
                          </div>
                        </div>

                        {/* Lower Footer Bar: Driver assignment details */}
                        <div className="px-3.5 py-2 bg-zinc-950/20 border-t border-zinc-800/40 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                          <span className="text-zinc-550 text-[8px] uppercase font-sans">Machinery Captain</span>
                          {driverObj ? (
                            <span className="text-orange-400 font-extrabold flex items-center gap-1 truncate max-w-[120px]">
                              👥 {driverObj.name.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="text-zinc-500 italic text-[9px]">No Pilot Assigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: ANALYTICAL METRICS AND PAIRINGS */}
          <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-3 border-b border-zinc-800 mb-4">
              TELEMETRY ANALYSIS PANEL
            </h3>

            {!selectedTruck ? (
              <div className="py-20 text-center text-zinc-550 border border-zinc-850 border-dashed rounded bg-zinc-950/20 text-xs font-mono">
                Select a heavy loader platform from the assets roster on the left to monitor mechanical logs and modify workshop telemetry.
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* Header overview card */}
                <div className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-lg border border-zinc-850">
                  <div className="h-10 w-10 rounded bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                    <TruckIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white leading-snug">{selectedTruck.type}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">M-PLATFORM: {selectedTruck.id} | Plate: {selectedTruck.plateNumber}</span>
                  </div>
                </div>

                {/* Status modifier buttons */}
                <div className="space-y-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Set Operations Status</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {(['Active', 'Idle', 'Maintenance', 'Out of Service'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          updateTruckStatus(selectedTruck.id, st);
                          setSelectedTruck(prev => ({ ...prev!, status: st }));
                        }}
                        className={`py-1.5 rounded font-mono text-[10px] font-semibold transition-all cursor-pointer border ${
                          selectedTruck.status === st
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                            : 'bg-zinc-950/40 border-zinc-850 hover:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Details */}
                <div className="border-t border-zinc-850 pt-4">
                  <button
                    onClick={() => openEditTruckModal(selectedTruck)}
                    className="w-full py-1.5 bg-zinc-900 hover:bg-orange-600/20 border border-zinc-800 hover:border-orange-500/40 text-zinc-400 hover:text-orange-400 font-mono text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={11} />
                    <span>Edit Vehicle Details</span>
                  </button>
                </div>

                {/* Telemetry diagnostics stats */}
                <div className="space-y-2.5 border-t border-zinc-850 pt-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Platform Odometer & Fuel Burn</p>
                  
                  <div className="bg-[#0b0f19] border border-zinc-850 p-4 rounded-lg space-y-3 font-mono text-zinc-400">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5"><Gauge size={13} /> Odometer Mileage:</span>
                      <span className="text-zinc-200 font-bold font-mono">{selectedTruck.mileage.toLocaleString()} km</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1.5"><Hammer size={13} /> Service Interval Limit:</span>
                      <span className="text-zinc-200 font-bold font-mono">{selectedTruck.nextServiceMileage.toLocaleString()} km</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-950 pt-2 text-[10.5px]">
                      <span className="text-zinc-500">Service Overdue Check:</span>
                      {selectedTruck.mileage >= selectedTruck.nextServiceMileage ? (
                        <span className="text-red-400 font-black animate-pulse uppercase">Requires Service Now!</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold uppercase">Nominal Health</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Truck specialized pilot pairing */}
                <div className="space-y-2.5 border-t border-zinc-850 pt-4">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Assigned Truck Captain Pairing</p>
                    {selectedTruck.driverId && (
                      <button
                        onClick={() => {
                          assignDriverToTruck(selectedTruck.id, null);
                          setSelectedTruck(prev => ({ ...prev!, driverId: null }));
                        }}
                        className="text-[10px] text-red-500 hover:text-red-400 font-bold font-mono"
                      >
                        Break Pair
                      </button>
                    )}
                  </div>

                  {selectedTruckDriver ? (
                    <div className="bg-[#171d33] border border-zinc-800/80 rounded p-3 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-white truncate">{selectedTruckDriver.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">STAFF ID: {selectedTruckDriver.id} • {selectedTruckDriver.licenseClass.split(' ')[0]}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-orange-600/15 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                        {selectedTruckDriver.name.charAt(0)}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleDriverAssignment} className="space-y-2 bg-[#0c0f1d] border border-zinc-850 p-3 rounded">
                      <p className="text-[10px] text-zinc-500">Currently has no specialized truck pilot assigned in dispatch logs.</p>
                      
                      <div className="flex gap-2">
                        <select
                          required
                          value={assignDriverId}
                          onChange={(e) => setAssignDriverId(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-850 text-xs p-1.5 rounded outline-none focus:border-zinc-700 text-zinc-200"
                        >
                          <option value="">-- Available Pilots --</option>
                          {unassignedDrivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                          ))}
                        </select>
                        
                        <button
                          type="submit"
                          disabled={!assignDriverId}
                          className="px-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 text-black font-bold text-[11px] rounded transition-all cursor-pointer"
                        >
                          Pair Pilot
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Ehangtech GPS Tracker Device */}
                <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
                  <p className="text-[10px] text-orange-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
                    <Satellite size={12} /> GPS Tracker
                  </p>
                  <div className="bg-[#0c0f1d] border border-zinc-800/80 rounded-lg p-3 space-y-2">
                    {selectedTruck.trackerImei ? (
                      <>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">Tracker Model</span>
                          <span className="text-zinc-200 font-semibold">{selectedTruck.trackerModel || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">IMEI Number</span>
                          <span className="text-zinc-200 font-semibold text-[9px]">{selectedTruck.trackerImei}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">SIM Card</span>
                          <span className="text-zinc-200 font-semibold text-[9px]">{selectedTruck.trackerSimCard || 'N/A'}</span>
                        </div>
                        {selectedTruck.trackerBattery != null && (
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-500 flex items-center gap-1"><Battery size={10} /> Battery</span>
                            <span className={selectedTruck.trackerBattery < 30 ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                              {selectedTruck.trackerBattery}%
                            </span>
                          </div>
                        )}
                        {selectedTruck.trackerSpeed != null && selectedTruck.trackerSpeed > 0 && (
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-500 flex items-center gap-1"><Navigation size={10} /> Speed</span>
                            <span className="text-emerald-400 font-semibold">{selectedTruck.trackerSpeed} km/h</span>
                          </div>
                        )}
                        {selectedTruck.lastGpsUpdate && (
                          <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-800/60 pt-1.5 mt-1">
                            <span className="text-zinc-500">Last GPS fix</span>
                            <span className="text-zinc-400">{new Date(selectedTruck.lastGpsUpdate).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pt-1">
                          <a
                            href="http://www.4G-gps.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-orange-500 hover:text-orange-400 font-mono flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> Track on Ehangtech Portal
                          </a>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-zinc-500 font-mono text-center py-2">
                        No GPS tracker fitted to this asset.
                        <br />
                        <span className="text-zinc-600">Commission with an Ehangtech tracker (EH002, EH003, or ET006).</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Danger Zone / Deletion */}
                <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
                  <p className="text-[10px] text-red-500 uppercase tracking-widest font-mono font-bold">Terminal Safety & Deletion</p>
                  <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg flex flex-col gap-2">
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Decommissioning this asset purges it from all active telemetry arrays. Warning: This cannot be undone.
                    </p>
                    {confirmDeleteId === selectedTruck.id ? (
                      <div className="space-y-2 mt-1">
                        <p className="text-[10px] text-red-400 font-bold font-mono text-center uppercase">CONFIRM REMOVAL OF {selectedTruck.plateNumber}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              deleteTruck(selectedTruck.id);
                              setSelectedTruck(null);
                              setConfirmDeleteId(null);
                            }}
                            className="flex-1 py-1.5 bg-red-650 hover:bg-red-605 text-white font-mono text-[10px] font-black rounded cursor-pointer text-center"
                          >
                            Yes, Decommission
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-[10px] font-bold rounded cursor-pointer text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDeleteId(selectedTruck.id);
                        }}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-4:00 hover:text-red-300 font-mono text-[10px] font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        <span>Decommission & Delete Asset</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
        )}

      </div>

      {/* ADD TRUCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Commission Heavy Fleet Asset</h3>
                <p className="text-zinc-550 mt-1">Registers multi-ton truck or dump machine into active telemetry arrays</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddTruck} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">State License Plate ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ADX-4029"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Asset Machine Type</label>
                  <input
                    type="text"
                    required
                    placeholder="Truck type (e.g. Dump Truck)"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Specific Model / Maker</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Caterpillar C-Tier 2025"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Load Capacity Ratio</label>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="30 Tons">30 Tons</option>
                    <option value="40 Tons">40 Tons</option>
                    <option value="45 Tons">45 Tons</option>
                    <option value="60 Tons">60 Tons</option>
                    <option value="100 Tons">100 Tons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Est. L/100km Fuel Consumption</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="e.g., 35"
                    value={fuelRate}
                    onChange={(e) => setFuelRate(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">
                  Machine Inspection Photo (From Local Drive)
                </label>
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-orange-500', 'bg-orange-500/5');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/5');
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/5');
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      try {
                        const base64 = await compressAndGetBase64(file);
                        setImageUrl(base64);
                      } catch (err) {
                        console.error('Failed to compress truck image:', err);
                      }
                    }
                  }}
                  onClick={() => {
                    document.getElementById('truck-image-input')?.click();
                  }}
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-[#0c0f1d] p-4 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[100px] text-zinc-400 hover:text-zinc-200 group relative"
                >
                  <input
                    type="file"
                    id="truck-image-input"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await compressAndGetBase64(file);
                          setImageUrl(base64);
                        } catch (err) {
                          console.error('Failed to compress truck image:', err);
                        }
                      }
                    }}
                    className="hidden"
                  />
                  
                  {imageUrl ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-12 w-12 rounded bg-zinc-900 border border-zinc-805 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={imageUrl} alt="Machine preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">Photo Loaded</p>
                        <p className="text-[9px] text-zinc-500 font-mono truncate leading-normal">Ready to commission heavy machinery</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl('');
                          const el = document.getElementById('truck-image-input') as HTMLInputElement;
                          if (el) el.value = '';
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-zinc-500 hover:text-red-400 text-[10px] font-mono rounded font-medium transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                      <p className="font-mono text-[10px] text-zinc-400 group-hover:text-orange-500 font-bold">Click to select asset photo</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">or drag photo file here</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Deploy Initial Station Point</label>
                <select
                  value={useCustomLocation ? "custom" : locationPreset}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setUseCustomLocation(true);
                    } else {
                      setUseCustomLocation(false);
                      setLocationPreset(parseInt(e.target.value));
                    }
                  }}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer mb-2"
                >
                  {availableStations.map((loc, idx) => (
                    <option key={`preset-${idx}`} value={idx}>{loc.name}</option>
                  ))}
                  <option value="custom">✦ Enter Custom Coordinates...</option>
                </select>

                {useCustomLocation && (
                  <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg space-y-3 font-mono mt-2 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase">Station / Node Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Location name"
                        value={customLocationName}
                        onChange={(e) => setCustomLocationName(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-1.5 mt-0.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={customLat}
                          onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0c0f1d] border border-zinc-850 p-1.5 mt-0.5 rounded text-[11px] text-zinc-200 outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={customLng}
                          onChange={(e) => setCustomLng(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#0c0f1d] border border-zinc-850 p-1.5 mt-0.5 rounded text-[11px] text-zinc-200 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ehangtech GPS Tracker Configuration */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Satellite size={14} className="text-orange-500" />
                  <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider font-mono">Ehangtech GPS Tracker (Optional)</label>
                </div>
                <p className="text-[9px] text-zinc-600 font-mono -mt-1">
                  Fitting an Ehangtech GPS tracker enables real-time fleet tracking on the GPS Fleet Tracking map.
                  Supported: EH002, EH003, ET006, IP67, OBD, Relay models.
                </p>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tracker IMEI</label>
                    <input
                      type="text"
                      placeholder="e.g., 861234567890101"
                      value={trackerImei}
                      onChange={(e) => setTrackerImei(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tracker Model</label>
                    <select
                      value={trackerModel}
                      onChange={(e) => setTrackerModel(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px] cursor-pointer"
                    >
                      <option value="EH002 GPS Vehicle Tracker">EH002 GPS Vehicle Tracker</option>
                      <option value="EH003 GPS Vehicle Tracker">EH003 GPS Vehicle Tracker</option>
                      <option value="ET006 GPS Vehicle Tracker">ET006 GPS Vehicle Tracker</option>
                      <option value="IP67 Waterproof GPS Vehicle Tracker">IP67 Waterproof</option>
                      <option value="OBD GPS Vehicle Tracker">OBD GPS Tracker</option>
                      <option value="Relay GPS Vehicle Tracker">Relay GPS Tracker</option>
                      <option value="Fuel Sensor GPS Vehicle Tracker">Fuel Sensor GPS Tracker</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">SIM Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g., SIM-898602100123456789"
                    value={trackerSimCard}
                    onChange={(e) => setTrackerSimCard(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs animate-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Confirm Asset Commission
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT TRUCK MODAL */}
      {showEditTruckModal && selectedTruck && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Edit Vehicle Details</h3>
                <p className="text-zinc-500 mt-1 font-mono">{selectedTruck.id} · {selectedTruck.plateNumber}</p>
              </div>
              <button onClick={() => setShowEditTruckModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEditTruck} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">License Plate</label>
                <input type="text" required value={editPlate}
                  onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Type</label>
                  <input type="text" required value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Model</label>
                  <input type="text" required value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500" />
                </div>
              </div>
              {(selectedTruck.category || 'Truck') !== 'Light Vehicle' && (
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Capacity</label>
                    <select value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer">
                      <option value="30 Tons">30 Tons</option>
                      <option value="40 Tons">40 Tons</option>
                      <option value="45 Tons">45 Tons</option>
                      <option value="60 Tons">60 Tons</option>
                      <option value="100 Tons">100 Tons</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Fuel Rate (L/100km)</label>
                    <input type="number" min="1" max="100" required value={editFuelRate}
                      onChange={(e) => setEditFuelRate(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500" />
                  </div>
                </div>
              )}
              <div className="border-t border-zinc-800 pt-3 space-y-3">
                <label className="text-[11px] font-bold text-orange-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Satellite size={12} /> GPS Tracker
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">IMEI</label>
                    <input type="text" value={editTrackerImei}
                      onChange={(e) => setEditTrackerImei(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Model</label>
                    <select value={editTrackerModel} onChange={(e) => setEditTrackerModel(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px] cursor-pointer">
                      <option value="EH002 GPS Vehicle Tracker">EH002</option>
                      <option value="EH003 GPS Vehicle Tracker">EH003</option>
                      <option value="ET006 GPS Vehicle Tracker">ET006</option>
                      <option value="IP67 Waterproof GPS Vehicle Tracker">IP67</option>
                      <option value="OBD GPS Vehicle Tracker">OBD</option>
                      <option value="Relay GPS Vehicle Tracker">Relay</option>
                      <option value="Fuel Sensor GPS Vehicle Tracker">Fuel Sensor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">SIM Card</label>
                  <input type="text" value={editTrackerSim}
                    onChange={(e) => setEditTrackerSim(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-[11px] font-mono" />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowEditTruckModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHT VEHICLE MODAL */}
      {showLightVehicleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase">Commission Light Vehicle</h3>
                <p className="text-zinc-500 mt-1">Register a sedan, pick-up, or panel van</p>
              </div>
              <button onClick={() => setShowLightVehicleModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddLightVehicle} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">License Plate</label>
                <input required value={lvPlate} onChange={(e) => setLvPlate(e.target.value)}
                  placeholder="e.g., ABC-1234"
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Vehicle Type</label>
                <select required value={lvType} onChange={(e) => setLvType(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                  <option value="">-- Select Type --</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Pick-Up">Pick-Up</option>
                  <option value="Panel Van">Panel Van</option>
                  <option value="SUV">SUV</option>
                  <option value="Double Cab">Double Cab</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Make / Model</label>
                <input value={lvModel} onChange={(e) => setLvModel(e.target.value)}
                  placeholder="e.g., Toyota Hilux 2023"
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowLightVehicleModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};
