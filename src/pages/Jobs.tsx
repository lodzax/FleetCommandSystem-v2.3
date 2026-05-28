import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { Plus, Search, Calendar, Landmark, MapPin, BadgePercent, TrendingUp, X, Trash2 } from 'lucide-react';
import { CargoType, Job, JobStatus } from '../types';

// Pre-coded Geolocation station list for Zimbabwe Mining Routes
export const PRE_CODED_LOCATIONS = [
  { name: "Hwange Coal Fields", lat: -18.3647, lng: 26.5000 },
  { name: "Bulawayo Power Station", lat: -20.1406, lng: 28.5856 },
  { name: "Zimplats Ngezi Mine", lat: -18.6657, lng: 30.3473 },
  { name: "Gweru Metallurgy Smelter", lat: -19.4500, lng: 29.8167 },
  { name: "Shurugwi Chrome Pit", lat: -19.6700, lng: 30.0000 },
  { name: "Harare Gateway Hub", lat: -17.8252, lng: 31.0530 },
  { name: "Mimosa Mining Shaft", lat: -20.3204, lng: 30.0638 },
  { name: "Beitbridge Border Logistics", lat: -22.2100, lng: 30.0000 },
  { name: "Mutare Port Terminal", lat: -18.9727, lng: 32.6708 }
];

export const Jobs: React.FC = () => {
  const { jobs, drivers, trucks, addJob, updateJobStatus, deleteJob } = useFleet();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<JobStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Dynamic Locations State persisted to local storage
  const [availableLocations, setAvailableLocations] = useState<{name: string, lat: number, lng: number, details?: string}[]>(() => {
    const saved = localStorage.getItem('jobs_available_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return PRE_CODED_LOCATIONS;
  });

  // Modal form inputs
  const [title, setTitle] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('Coal');
  const [weight, setWeight] = useState(40);
  const [estHours, setEstHours] = useState(4.5);
  const [income, setIncome] = useState(25000);

  // Source selection states
  const [sourceSelection, setSourceSelection] = useState('0');
  const [sourceName, setSourceName] = useState('');
  const [sourceLat, setSourceLat] = useState('');
  const [sourceLng, setSourceLng] = useState('');
  const [sourceDetails, setSourceDetails] = useState('');

  // Destination selection states
  const [destSelection, setDestSelection] = useState('1');
  const [destName, setDestName] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  const [destDetails, setDestDetails] = useState('');

  // Auto-fill source state when selection changes
  React.useEffect(() => {
    if (sourceSelection !== 'custom') {
      const idx = parseInt(sourceSelection);
      const loc = availableLocations[idx];
      if (loc) {
        setSourceName(loc.name);
        setSourceLat(loc.lat.toString());
        setSourceLng(loc.lng.toString());
        setSourceDetails(loc.details || '');
      }
    } else {
      setSourceName('');
      setSourceLat('');
      setSourceLng('');
      setSourceDetails('');
    }
  }, [sourceSelection, availableLocations]);

  // Auto-fill destination state when selection changes
  React.useEffect(() => {
    if (destSelection !== 'custom') {
      const idx = parseInt(destSelection);
      const loc = availableLocations[idx];
      if (loc) {
        setDestName(loc.name);
        setDestLat(loc.lat.toString());
        setDestLng(loc.lng.toString());
        setDestDetails(loc.details || '');
      }
    } else {
      setDestName('');
      setDestLat('');
      setDestLng('');
      setDestDetails('');
    }
  }, [destSelection, availableLocations]);

  // Search and filter logic
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.id.toLowerCase().includes(search.toLowerCase()) ||
                          j.cargoType.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === 'All' ? true : j.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();

    let srcName = sourceName.trim() || 'Custom Mining Site';
    let sLat = parseFloat(sourceLat) || -18.3647;
    let sLng = parseFloat(sourceLng) || 26.5000;
    let sDet = sourceDetails.trim();

    let dstName = destName.trim() || 'Custom Facility';
    let dLat = parseFloat(destLat) || -20.1406;
    let dLng = parseFloat(destLng) || 28.5856;
    let dDet = destDetails.trim();

    // Persist new locations locally
    const updatedLocs = [...availableLocations];
    let locationsWereModified = false;

    if (sourceSelection === 'custom' || !availableLocations.some(l => l.name.toLowerCase() === srcName.toLowerCase())) {
      if (!updatedLocs.some(l => l.name.toLowerCase() === srcName.toLowerCase())) {
        updatedLocs.push({ name: srcName, lat: sLat, lng: sLng, details: sDet });
        locationsWereModified = true;
      }
    }

    if (destSelection === 'custom' || !availableLocations.some(l => l.name.toLowerCase() === dstName.toLowerCase())) {
      if (!updatedLocs.some(l => l.name.toLowerCase() === dstName.toLowerCase())) {
        updatedLocs.push({ name: dstName, lat: dLat, lng: dLng, details: dDet });
        locationsWereModified = true;
      }
    }

    if (locationsWereModified) {
      setAvailableLocations(updatedLocs);
      localStorage.setItem('jobs_available_locations', JSON.stringify(updatedLocs));
    }

    addJob({
      title,
      cargoType,
      weight,
      source: srcName,
      sourceLat: sLat,
      sourceLng: sLng,
      destination: dstName,
      destinationLat: dLat,
      destinationLng: dLng,
      scheduledDate: new Date().toISOString().split('T')[0],
      estimatedHours: estHours,
      income,
      routeCoordinates: [
        [sLat, sLng],
        [(sLat + dLat) / 2, (sLng + dLng) / 2], // Midpoint curve
        [dLat, dLng]
      ]
    });

    // Reset inputs
    setTitle('');
    setCargoType('Coal');
    setWeight(40);
    setSourceSelection('0');
    setDestSelection('1');
    setEstHours(4.5);
    setIncome(25000);

    setShowModal(false);
  };

  return (
    <Layout title="JOBS">
      <div className="space-y-6">
        
        {/* TOP METRIC MINI-GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Total Manifest Orders</p>
              <h4 className="text-xl font-bold font-mono text-white mt-1">{jobs.length}</h4>
            </div>
            <span className="text-xs text-orange-500 font-mono">100% Secure</span>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Active Shipments</p>
              <h4 className="text-xl font-bold font-mono text-orange-400 mt-1">
                {jobs.filter(j => j.status === 'In Transit').length}
              </h4>
            </div>
            <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1 rounded animate-pulse">Live Tracking</span>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Allocated Backup</p>
              <h4 className="text-xl font-bold font-mono text-blue-400 mt-1">
                {jobs.filter(j => j.status === 'Assigned').length}
              </h4>
            </div>
            <span className="text-xs text-zinc-450 font-mono">Pending Departure</span>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Gross Income Registered</p>
              <h4 className="text-lg font-bold font-mono text-emerald-400 mt-1">
                ${jobs.reduce((acc, j) => acc + (j.status === 'Completed' ? j.income : 0), 0).toLocaleString()}
              </h4>
            </div>
            <span className="text-xs text-emerald-500 font-mono">Audit Complete</span>
          </div>
        </div>

        {/* OPERATIONS CONTROLS AND SEARCH */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2">
            {(['All', 'Pending', 'Assigned', 'In Transit', 'Completed'] as const).map(tab => {
              const tabCount = tab === 'All' ? jobs.length : jobs.filter(j => j.status === tab).length;
              const isSelected = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-black shadow-md shadow-orange-500/10'
                      : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab} ({tabCount})
                </button>
              );
            })}
          </div>

          {/* Search & Action button */}
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="w-full bg-[#0c0f1d] border border-zinc-850 text-xs px-3.5 py-2 pl-9 rounded-lg focus:border-zinc-700 text-zinc-200 outline-none placeholder-zinc-500 font-mono"
              />
              <Search className="absolute left-3 top-2.5 text-zinc-555" size={14} />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Plus size={15} />
              <span>New Job</span>
            </button>
          </div>
        </div>

        {/* DATA CONTAINER TABLE */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
          
          <div className="overflow-x-auto">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-20 text-zinc-550 border border-zinc-850 border-dashed rounded bg-zinc-950/20 text-sm font-mono">
                No transport manifests found matching filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs bg-zinc-950/25 border border-zinc-850 rounded">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono">
                    <th className="p-3.5 pl-4">Job ID</th>
                    <th className="p-3.5">Cargo Spec</th>
                    <th className="p-3.5">Route Corridors</th>
                    <th className="p-3.5">Assigned Driver</th>
                    <th className="p-3.5 font-mono">Truck Asset</th>
                    <th className="p-3.5">Cargo Value</th>
                    <th className="p-3.5">Execution Status</th>
                    <th className="p-3.5 text-right pr-6 font-mono">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredJobs.map(j => (
                    <tr key={j.id} className="text-zinc-300 hover:bg-zinc-900/10 transition-colors">
                      <td className="p-3.5 pl-4 font-mono font-black text-orange-400 text-xs">{j.id}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white text-xs">{j.title}</p>
                        <span className="text-[10px] text-zinc-500 font-semibold">{j.weight} Tons of {j.cargoType}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <p className="text-zinc-200 font-medium">From: <span className="text-zinc-400">{j.source}</span></p>
                          <p className="text-zinc-200 font-medium">To: <span className="text-zinc-400">{j.destination}</span></p>
                        </div>
                      </td>
                      <td className="p-3.5 text-zinc-200 font-medium font-mono text-[11px]">
                        {j.driverName || (j.driverId ? (drivers.find(d => d.id === j.driverId)?.name || `Captain (${j.driverId})`) : null) || 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        {(j.truckPlate || (j.truckId ? (trucks.find(t => t.id === j.truckId)?.plateNumber || `Hauler (${j.truckId})`) : null)) ? (
                          <span className="font-mono bg-zinc-900 py-0.5 px-1.5 border border-zinc-850 rounded text-zinc-300 font-medium uppercase text-[10px]">
                            {j.truckPlate || (j.truckId ? (trucks.find(t => t.id === j.truckId)?.plateNumber || j.truckId) : null)}
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-white text-xs">${j.income.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] tracking-wide font-mono font-bold ${
                          j.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          j.status === 'In Transit' ? 'bg-orange-500/10 text-orange-400 animate-pulse' :
                          j.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>{j.status}</span>
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        {confirmDeleteId === j.id ? (
                          <div className="inline-flex gap-1.5 items-center justify-end">
                            <span className="text-[9px] text-red-500 font-mono font-bold uppercase mr-1">Purge?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteJob(j.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer transition-colors hover:bg-red-500"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer hover:bg-zinc-800"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(j.id);
                            }}
                            className="px-2 py-1 bg-red-650/10 hover:bg-red-650 hover:bg-red-650 hover:text-white border border-red-500/20 text-red-400 hover:text-zinc-100 font-mono text-[9px] font-bold rounded transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            title="Purge Manifest"
                          >
                            <Trash2 size={10} />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* MODAL TO ADD NEW JOBS */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 text-xs flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">REGISTER NEW TRANSPORT ROUTE/JOB</h3>
                <p className="text-zinc-550 mt-1">Binds automatically to GPS coordinates in Zimbabwe networks</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body form */}
            <form onSubmit={handleCreateJob} className="text-xs flex flex-col flex-1 overflow-hidden space-y-4">
              
              {/* Scrollable Fields Container */}
              <div className="overflow-y-auto flex-1 space-y-4 pr-1.5 max-h-[60vh]">
                
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Manifest Title / Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Coal Ore Transport Express Run"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                  />
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Cargo Commodity</label>
                  <select
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value as CargoType)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Coal">Coal</option>
                    <option value="Chrome Ore">Chrome Ore</option>
                    <option value="Gold Ore">Gold Ore</option>
                    <option value="Concentrate">Concentrate</option>
                    <option value="Heavy Equipment">Heavy Equipment</option>
                    <option value="Mining Supplies">Mining Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Mass Payload (Tons)</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    required
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4 border border-zinc-800 bg-[#0b0f19] p-4 rounded-xl">
                <span className="text-[11px] font-black text-orange-400 font-mono uppercase tracking-wider block">Source Location (Mining Site)</span>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Preset Sites lookup</label>
                    <select
                      value={sourceSelection}
                      onChange={(e) => setSourceSelection(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer text-xs"
                    >
                      {availableLocations.map((loc, idx) => (
                        <option key={`src-${idx}`} value={idx}>{loc.name} ({loc.lat}, {loc.lng})</option>
                      ))}
                      <option value="custom">✦ Enter New Mining Site / Custom Coordinates...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Site / Mine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Shurugwi Mine Pit B"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Latitude *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={sourceLat}
                        onChange={(e) => setSourceLat(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Longitude *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={sourceLng}
                        onChange={(e) => setSourceLng(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Other Mining Details (e.g. Shaft level, Region)</label>
                    <input
                      type="text"
                      placeholder="e.g., Shaft 4, Midlands Province"
                      value={sourceDetails}
                      onChange={(e) => setSourceDetails(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border border-zinc-800 bg-[#0b0f19] p-4 rounded-xl">
                <span className="text-[11px] font-black text-orange-400 font-mono uppercase tracking-wider block">Destination Location (Facility Depot)</span>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Preset Facilities lookup</label>
                    <select
                      value={destSelection}
                      onChange={(e) => setDestSelection(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer text-xs"
                    >
                      {availableLocations.map((loc, idx) => (
                        <option key={`dst-${idx}`} value={idx}>{loc.name} ({loc.lat}, {loc.lng})</option>
                      ))}
                      <option value="custom">✦ Enter New Facility / Custom Coordinates...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Facility Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Bulawayo Power Station Depot"
                      value={destName}
                      onChange={(e) => setDestName(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Latitude *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={destLat}
                        onChange={(e) => setDestLat(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Longitude *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={destLng}
                        onChange={(e) => setDestLng(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 font-bold font-mono uppercase mb-1 font-semibold">Other Facility Details (e.g. Unloading Dock, Zone)</label>
                    <input
                      type="text"
                      placeholder="e.g., Silo 3, Heavy Industrial Area"
                      value={destDetails}
                      onChange={(e) => setDestDetails(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Est. Duration (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={estHours}
                    onChange={(e) => setEstHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Route Rate (USD)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={income}
                    onChange={(e) => setIncome(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              </div> {/* End Scrollable Fields Container */}

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 text-xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded transition-all shadow-lg"
                >
                  Schedule Delivery Manifest
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};
