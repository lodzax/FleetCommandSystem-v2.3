import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  Palette, RefreshCw, Layers, CheckCircle2, 
  MapPin, Plus, Home, HelpCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { 
    theme, setTheme, 
    logoText, setLogoText, 
    logoEmoji, setLogoEmoji,
    branches, addBranch
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

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bLoc || !bLat || !bLng) {
      toast.error('Please fill in Name, Location, Latitude, and Longitude');
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

    toast.success('Branch registered');
  };

  const saveBranding = () => {
    setLogoText(tempLogoText);
    setLogoEmoji(tempLogoEmoji);
    toast.success('Branding updated');
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
                      placeholder="Branch name"
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
                      placeholder="Location description"
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
                        placeholder="Latitude"
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
                        placeholder="Longitude"
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
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Manager Name</label>
                    <input
                      type="text"
                      value={bManager}
                      onChange={(e) => setBManager(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-white placeholder-zinc-700"
                      placeholder="Manager name"
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
                            <span>Lat: {Number(b.lat).toFixed(4)}</span>
                            <span>Lng: {Number(b.lng).toFixed(4)}</span>
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
        </div>
      </div>
    </Layout>
  );
};
