import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  Palette, RefreshCw, Layers, ShieldAlert, CheckCircle2, 
  MapPin, Plus, Trash2, Home, HelpCircle 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    theme, setTheme, 
    logoText, setLogoText, 
    logoEmoji, setLogoEmoji,
    branches, addBranch, 
    clearTrucksData, clearDriversData, clearJobsData, clearMaintenanceData, clearFuelData, clearDispatchData,
    resetAllData,
    trucks, drivers, jobs, maintenance, fuelLogs, fuelRequisitions, dispatches, stockMovements
  } = useFleet();

  // Branch Form state
  const [bName, setBName] = useState('');
  const [bLoc, setBLoc] = useState('');
  const [bLat, setBLat] = useState('');
  const [bLng, setBLng] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bManager, setBManager] = useState('');

  // Logo form state
  const [tempLogoText, setTempLogoText] = useState(logoText);
  const [tempLogoEmoji, setTempLogoEmoji] = useState(logoEmoji);

  // Success indicator triggers
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingWipeCategory, setPendingWipeCategory] = useState<'trucks' | 'drivers' | 'jobs' | 'maintenance' | 'fuel' | 'dispatch' | 'all' | null>(null);

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bLoc || !bLat || !bLng) {
      setErrorMessage("Please fill in Name, Location, Latitude, and Longitude.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    addBranch({
      name: bName,
      locationName: bLoc,
      lat: parseFloat(bLat),
      lng: parseFloat(bLng),
      phone: bPhone,
      manager: bManager
    });

    // Reset inputs
    setBName('');
    setBLoc('');
    setBLat('');
    setBLng('');
    setBPhone('');
    setBManager('');

    setSaveStatus("Branch successfully added to operations ledger");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const saveBranding = () => {
    setLogoText(tempLogoText);
    setLogoEmoji(tempLogoEmoji);
    setSaveStatus("System branding updated successfully");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleClear = (category: 'trucks' | 'drivers' | 'jobs' | 'maintenance' | 'fuel' | 'dispatch') => {
    if (category === 'trucks') clearTrucksData();
    else if (category === 'drivers') clearDriversData();
    else if (category === 'jobs') clearJobsData();
    else if (category === 'maintenance') clearMaintenanceData();
    else if (category === 'fuel') clearFuelData();
    else if (category === 'dispatch') clearDispatchData();

    setPendingWipeCategory(null);
    setClearStatus(`Cleared all ${category} database entries`);
    setTimeout(() => setClearStatus(null), 4000);
  };

  const THEMES = [
    { id: 'slate', name: 'Orange Slate', desc: 'Default mining operations theme', colors: 'from-orange-500 to-amber-500' },
    { id: 'blue', name: 'Royal Blue', desc: 'Ocean and bulk logistics dispatch', colors: 'from-blue-500 to-indigo-600' },
    { id: 'emerald', name: 'Emerald Corridors', desc: 'Copper, gold, and ecological routes', colors: 'from-emerald-500 to-teal-500' },
    { id: 'crimson', name: 'Crimson Haulers', desc: 'Rugged ruby heavy-duty haulage', colors: 'from-rose-600 to-red-500' }
  ];

  const EMOJIS = ['🚛', '⛏️', '🏗️', '🏢', '⚡', '💎', '🗺️', '🚀', '🔥', '⚙️'];

  return (
    <Layout title="Settings">
      <div className="space-y-6 max-w-5xl">
        
        {/* Simple instructions for older operators */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
          <HelpCircle className="text-orange-400 mt-1 shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold text-zinc-100 font-mono text-uppercase">System Control Room</h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Welcome to the settings control center. Here you can tweak the color of the screen, adjust company branding, list custom depots (branches), and delete old lists of jobs or assets. If things look confusing, you can always click "Clear Everything & Reset" at the bottom to wipe all operational data and reset layout settings completely.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {saveStatus && (
          <div className="p-4 bg-emerald-500/10 border-l-2 border-emerald-500 rounded text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 size={16} />
            {saveStatus}
          </div>
        )}
        {clearStatus && (
          <div className="p-4 bg-yellow-500/10 border-l-2 border-yellow-500 rounded text-yellow-400 text-xs flex items-center gap-2 font-mono">
            <RefreshCw size={16} className="animate-spin" />
            {clearStatus}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-red-400/10 border-l-2 border-red-550 rounded text-red-400 text-xs flex items-center gap-2 font-mono">
            <span className="font-extrabold text-sm">✖</span>
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* THEME & VISUAL SELECTION */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Palette size={18} className="text-orange-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">Screen Color Theme</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map(th => {
                const isActive = theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-900 border-orange-500/40 ring-1 ring-orange-500/20' 
                        : 'bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-white">{th.name}</span>
                      <div className={`h-3 w-8 rounded-full bg-gradient-to-r ${th.colors}`}></div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">{th.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOGO & BRAND CUSTOMIZATION */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Layers size={18} className="text-orange-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">Company Logo & Title</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-1.5">Company Title</label>
                <input
                  type="text"
                  value={tempLogoText}
                  onChange={(e) => setTempLogoText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono uppercase"
                  placeholder="e.g. FLEETCOMMAND"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-1.5">Company Emoji badge</label>
                <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 border border-zinc-850 rounded">
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setTempLogoEmoji(em)}
                      className={`h-7 w-7 text-xs flex items-center justify-center rounded transition-all hover:bg-zinc-800 ${
                        tempLogoEmoji === em ? 'bg-orange-500/20 border border-orange-500/40 text-lg' : 'bg-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={saveBranding}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wide rounded transition-all"
                >
                  Save Branding Changes
                </button>
              </div>
            </div>
          </div>

          {/* PHYSICAL BRANCH REGISTER */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <MapPin size={18} className="text-orange-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">Add Fleet Depot / Operational Branch</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Input fields */}
              <form onSubmit={handleBranchSubmit} className="md:col-span-1 space-y-3.5 bg-zinc-950/40 p-4 rounded-lg border border-zinc-850">
                <h4 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono">Register New Depot</h4>
                
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Branch/Depot Name *</label>
                    <input
                      type="text"
                      required
                      value={bName}
                      onChange={(e) => setBName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white placeholder-zinc-700"
                      placeholder="Gweru Transit Depot"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Location Name *</label>
                    <input
                      type="text"
                      required
                      value={bLoc}
                      onChange={(e) => setBLoc(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white placeholder-zinc-700"
                      placeholder="e.g. Gweru, Midlands"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Latitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={bLat}
                        onChange={(e) => setBLat(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white font-mono placeholder-zinc-700"
                        placeholder="-19.45"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Longitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={bLng}
                        onChange={(e) => setBLng(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white font-mono placeholder-zinc-700"
                        placeholder="29.81"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      value={bPhone}
                      onChange={(e) => setBPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white placeholder-zinc-700"
                      placeholder="+263 54 8109"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Manager Name</label>
                    <input
                      type="text"
                      value={bManager}
                      onChange={(e) => setBManager(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white placeholder-zinc-700"
                      placeholder="Peter Chigumba"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs tracking-wider rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Register Branch</span>
                  </button>
                </div>
              </form>

              {/* Connected list */}
              <div className="md:col-span-2 space-y-3.5">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Current Live Depots ({branches.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {branches.length === 0 ? (
                    <div className="text-zinc-600 text-xs italic py-8">No branches registered. Go register some!</div>
                  ) : (
                    branches.map(b => (
                      <div key={b.id} className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg flex items-start gap-2 text-xs">
                        <MapPin className="text-orange-500 mt-0.5 shrink-0" size={14} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white font-mono truncate">{b.name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5 font-medium">{b.locationName}</p>
                          <div className="grid grid-cols-2 gap-1 text-[9px] text-zinc-400 font-mono mt-1 border-t border-zinc-900 pt-1">
                            <span>Lat: {b.lat.toFixed(4)}</span>
                            <span>Lng: {b.lng.toFixed(4)}</span>
                          </div>
                          {b.manager && (
                            <p className="text-[10px] text-orange-400/80 mt-1">Mgr: {b.manager}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DUSTBIN SAFETY: INDIVIDUAL DATA WIPERS */}
          <div className="bg-[#101424] border border-zinc-800/80 rounded-xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <ShieldAlert size={18} className="text-yellow-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">System Database Wipers</h3>
            </div>

            <p className="text-xs text-zinc-500">
              Clear individual database slices back to a clean slate. Wiping operations will erase selected files from browser storage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {pendingWipeCategory === 'trucks' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe all trucks?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Clears all assets from ledger.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('trucks')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('trucks')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">1. Fleet</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Deletes all trucks ({trucks.length})</p>
                </button>
              )}

              {pendingWipeCategory === 'drivers' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe all drivers?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Clears operator registers.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('drivers')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('drivers')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">2. Drivers</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Removes active drivers ({drivers.length})</p>
                </button>
              )}

              {pendingWipeCategory === 'jobs' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe all jobs?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Clears dispatcher logbook.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('jobs')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('jobs')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">3. Jobs</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Clears jobs manifest ({jobs.length})</p>
                </button>
              )}

              {pendingWipeCategory === 'maintenance' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe orders?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Removes scheduled repair cards.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('maintenance')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('maintenance')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">4. Maintenance</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Clears workcards ({maintenance.length})</p>
                </button>
              )}

              {pendingWipeCategory === 'fuel' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe fuel?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Clears histories and slips.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('fuel')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('fuel')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">5. Fuel</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Resets logs ({fuelLogs.length + fuelRequisitions.length})</p>
                </button>
              )}

              {pendingWipeCategory === 'dispatch' ? (
                <div className="p-3 bg-red-950/30 border border-red-500 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-red-400 font-mono font-bold uppercase">Wipe dispatch?</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Clears dispatch notes.</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleClear('dispatch')}
                      className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPendingWipeCategory(null)}
                      className="flex-1 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono text-[9px] font-bold rounded cursor-pointer text-center"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingWipeCategory('dispatch')}
                  className="p-3 bg-red-950/10 hover:bg-red-950/30 border border-red-900/30 hover:border-red-600 text-left rounded-lg text-xs transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-red-400">
                    <span className="font-bold font-mono">6. Dispatch</span>
                    <Trash2 size={13} className="text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Resets entries ({dispatches.length + stockMovements.length})</p>
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-[#1e243a] flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 font-mono">Factory Reset System</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Purges all operational records (fleet, drivers, jobs, logs) to initial empty lists with standard system roles.</p>
              </div>
              {pendingWipeCategory === 'all' ? (
                <div className="flex items-center gap-2 p-2 bg-red-950/30 border border-red-500/30 rounded-lg">
                  <span className="text-[10px] text-red-400 font-mono font-bold">OVERWRITE WHOLE DATABASE?</span>
                  <button
                    onClick={() => {
                      resetAllData();
                      setPendingWipeCategory(null);
                      window.location.reload();
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-black rounded cursor-pointer transition-all"
                  >
                    Yes, Reset System
                  </button>
                  <button
                    onClick={() => setPendingWipeCategory(null)}
                    className="px-2 py-1 bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[10px] font-bold rounded cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingWipeCategory('all')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-red-500/10 border border-red-650/40 hover:border-red-500 text-red-500 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Clear Everything & Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
