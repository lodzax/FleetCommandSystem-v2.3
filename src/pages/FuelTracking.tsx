import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { PaginatedTable, Column } from '../components/PaginatedTable';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Droplet, Landmark, Activity, Wallet,
  Plus, X, Pencil, ArrowUpDown, ArrowDown, ArrowUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FuelTracking: React.FC = () => {
  const { fuelLogs, trucks, drivers, addFuelLog, activeUser, prepaidFuelBalance, setPrepaidFuelBalance, fuelPrices, setFuelPrices, fuelBalanceLogs, reorderLevels, setReorderLevels } = useFleet();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showPrepaidModal, setShowPrepaidModal] = useState(false);
  const [prepaidDiesel, setPrepaidDiesel] = useState(0);
  const [prepaidPetrol, setPrepaidPetrol] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceDiesel, setPriceDiesel] = useState(0);
  const [pricePetrol, setPricePetrol] = useState(0);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderDiesel, setReorderDiesel] = useState(100);
  const [reorderPetrol, setReorderPetrol] = useState(80);

  const isAccounts = activeUser?.role === 'Accounts';

  // Form states for Log Fuel
  const [logTruckId, setLogTruckId] = useState('');
  const [logDriverId, setLogDriverId] = useState('');
  const [logLitres, setLogLitres] = useState(0);
  const [logCost, setLogCost] = useState(0);
  const [logOdo, setLogOdo] = useState(0);
  const [logLoc, setLogLoc] = useState('');

  // Total metrics
  const totalSpend = fuelLogs.reduce((acc, l) => acc + l.cost, 0);
  const totalLitres = fuelLogs.reduce((acc, l) => acc + l.litres, 0);
  const avgCostPerLitre = totalLitres > 0 ? (totalSpend / totalLitres) : 0;

  // 1. Prepare Chart Data — Daily Cost Line
  // Group fuel cost by date
  const dateMap: { [key: string]: { cost: number; litres: number } } = {};
  
  // Fill 7 past dates so graph has dynamic nodes even on first loads
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dateMap[dateStr] = { cost: 0, litres: 0 };
  }

  fuelLogs.forEach(l => {
    if (dateMap[l.date]) {
      dateMap[l.date].cost += l.cost;
      dateMap[l.date].litres += l.litres;
    } else {
      dateMap[l.date] = { cost: l.cost, litres: l.litres };
    }
  });

  const dailyChartData = Object.keys(dateMap).sort().map(date => {
    // format as readable e.g., "25 May"
    const [y, m, d] = date.split('-');
    const mStr = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return {
      dateOriginal: date,
      name: mStr,
      Cost: dateMap[date].cost,
      Litres: dateMap[date].litres
    };
  });

  // 2. Prepare Chart Data — Cost by Truck
  const truckSpendMap: { [key: string]: { cost: number; litres: number } } = {};
  
  // Initialize existing trucks
  trucks.forEach(t => {
    truckSpendMap[t.id] = { cost: 0, litres: 0 };
  });

  fuelLogs.forEach(l => {
    if (truckSpendMap[l.truckId]) {
      truckSpendMap[l.truckId].cost += l.cost;
      truckSpendMap[l.truckId].litres += l.litres;
    } else {
      truckSpendMap[l.truckId] = { cost: l.cost, litres: l.litres };
    }
  });

  const truckChartData = Object.keys(truckSpendMap).map(id => {
    const truck = trucks.find(t => t.id === id);
    const label = truck ? `${id} (${truck.plateNumber})` : id;
    return {
      name: id,
      fullName: label,
      Cost: truckSpendMap[id].cost,
      Litres: truckSpendMap[id].litres
    };
  }).filter(data => data.Cost > 0); // Only graph trucks with actual logs

  const handleLogFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTruckId || !logDriverId) return;

    const truck = trucks.find(t => t.id === logTruckId);
    const driver = drivers.find(d => d.id === logDriverId);

    addFuelLog({
      truckId: logTruckId,
      truckPlate: truck?.plateNumber,
      driverId: logDriverId,
      driverName: driver?.name,
      litres: logLitres,
      cost: logCost,
      odometer: logOdo,
      location: logLoc,
      fuelType: 'Diesel'
    });

    // Reset Form
    setLogTruckId('');
    setLogDriverId('');
    setLogLitres(0);
    setLogCost(0);
    setLogOdo(0);
    setLogLoc('');
    setShowLogModal(false);
    toast.success('Fuel fill logged');
  };

  return (
    <Layout title="Fuel">
      <div className="space-y-6 text-xs sm:text-sm">
        
        {/* KPI MODULE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">CUMULATIVE TELEMETRY FUEL COST</span>
              <p className="text-2xl font-black text-white font-mono mt-1">${totalSpend.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-450 font-mono">From all registered logs</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Landmark size={16} />
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">CUMULATIVE COMBUSTION VOLUME</span>
              <p className="text-2xl font-black text-white font-mono mt-1">{totalLitres.toLocaleString()} L</p>
              <p className="text-[10px] text-zinc-450 font-mono">Premium Diesel utilized</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Droplet size={16} />
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">MEAN FUEL PRICE CALCULATED</span>
              <p className="text-2xl font-black text-white font-mono mt-1">${avgCostPerLitre.toFixed(2)}/L</p>
              <p className="text-[10px] text-zinc-450 font-mono">Calculated rate per litre</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>

          {/* Prepaid Fuel Balance - Diesel */}
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">PREPAID DIESEL</span>
              <p className={`text-2xl font-black font-mono mt-1 ${prepaidFuelBalance.diesel <= reorderLevels.diesel ? 'text-red-400' : 'text-white'}`}>{prepaidFuelBalance.diesel.toLocaleString()} L</p>
              <p className="text-[10px] text-zinc-500 font-mono">Reorder at {reorderLevels.diesel}L</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Droplet size={16} />
            </div>
          </div>

          {/* Prepaid Fuel Balance - Petrol */}
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">PREPAID PETROL</span>
              <p className={`text-2xl font-black font-mono mt-1 ${prepaidFuelBalance.petrol <= reorderLevels.petrol ? 'text-red-400' : 'text-white'}`}>{prepaidFuelBalance.petrol.toLocaleString()} L</p>
              <p className="text-[10px] text-zinc-500 font-mono">Reorder at {reorderLevels.petrol}L</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>

          {/* Fuel Price - Diesel */}
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">DIESEL PRICE</span>
              <p className="text-2xl font-black text-white font-mono mt-1">${fuelPrices.diesel.toFixed(2)}/L</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Droplet size={16} />
            </div>
          </div>

          {/* Fuel Price - Petrol */}
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">PETROL PRICE</span>
              <p className="text-2xl font-black text-white font-mono mt-1">${fuelPrices.petrol.toFixed(2)}/L</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>

          {/* Adjust buttons for Accounts */}
          {isAccounts && (
            <button
              onClick={() => { setPrepaidDiesel(prepaidFuelBalance.diesel); setPrepaidPetrol(prepaidFuelBalance.petrol); setShowPrepaidModal(true); }}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Pencil size={14} /> Adjust Prepaid Fuel
            </button>
          )}
          {isAccounts && (
            <button
              onClick={() => { setPriceDiesel(fuelPrices.diesel); setPricePetrol(fuelPrices.petrol); setShowPriceModal(true); }}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Pencil size={14} /> Adjust Fuel Prices
            </button>
          )}
          {isAccounts && (
            <button
              onClick={() => { setReorderDiesel(reorderLevels.diesel); setReorderPetrol(reorderLevels.petrol); setShowReorderModal(true); }}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Pencil size={14} /> Set Reorder Levels
            </button>
          )}

        </div>

        {/* RECHARTS POWERED ANALYTICS GRAPHICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Costs Line Area */}
          <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl h-[310px] flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-4">DAILY REFUEL COSTS (RANDS)</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1f30" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontStyle="italic" />
                  <YAxis stroke="#52525b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#2d3748', borderRadius: '6px' }} />
                  <Area type="monotone" dataKey="Cost" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost and Litres by Truck Bar */}
          <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl h-[310px] flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-4">FUEL CONSUMPTION BY TRUCK ASSET</h3>
            <div className="flex-1 min-h-0">
              {truckChartData.length === 0 ? (
                <p className="text-center py-24 text-zinc-650 font-mono text-xs">No consumption bar graphs logged yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={truckChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1f30" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#2d3748', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    <Bar dataKey="Cost" name="Spend (USD)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Litres" name="Litres" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* DATA LEDGER ACTION BAR */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Fuel Fill Logs ({fuelLogs.length})</h3>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
          >
            <Plus size={15} />
            <span>Log Fuel Fillup</span>
          </button>
        </div>

        {/* FUEL LOGS TABLE */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
            <PaginatedTable
              data={fuelLogs}
              searchFields={['id', 'truckId', 'driverName', 'location']}
              pageSize={15}
              keyExtractor={l => l.id}
              emptyMessage="No fuel fill-up logs recorded."
              columns={[
                { header: 'Log ID', accessor: 'id', sortable: true, className: 'font-mono font-bold text-orange-400', headerClassName: 'pl-4' },
                { header: 'Asset Code', accessor: 'truckId', sortable: true, className: 'font-mono text-white text-xs font-black uppercase' },
                { header: 'Staff Operator', accessor: 'driverName', sortable: true, render: l => l.driverName || 'Simulated Auto Dispenser' },
                { header: 'Litres Dispensed', accessor: 'litres', sortable: true, className: 'font-mono font-bold text-zinc-300', render: l => <span>{l.litres} L</span> },
                { header: 'Fillup Cost', accessor: 'cost', sortable: true, className: 'font-mono text-emerald-400 font-semibold', render: l => <span>${l.cost.toLocaleString()}</span> },
                { header: 'Odometer Mileage', accessor: 'odometer', sortable: true, className: 'font-mono text-zinc-400', render: l => <span>{l.odometer?.toLocaleString()} km</span> },
                { header: 'Fueling Depot Location', accessor: 'location', className: 'font-sans text-zinc-400' },
              ]}
            />
        </div>

      </div>

      {/* ADJUST PREPAID FUEL MODAL */}
      {showPrepaidModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase">Adjust Prepaid Fuel</h3>
                <p className="text-zinc-500 mt-1">Set prepaid volumes for each fuel type</p>
              </div>
              <button onClick={() => setShowPrepaidModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setPrepaidFuelBalance({ diesel: prepaidDiesel, petrol: prepaidPetrol }); setShowPrepaidModal(false); toast.success('Prepaid balance updated'); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Droplet size={12} /> Diesel (Litres)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={prepaidDiesel}
                  onChange={(e) => setPrepaidDiesel(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Wallet size={12} /> Petrol (Litres)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={prepaidPetrol}
                  onChange={(e) => setPrepaidPetrol(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                />
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowPrepaidModal(false)} className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  Save Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST FUEL PRICES MODAL */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Adjust Fuel Prices</h3>
                <p className="text-zinc-500 mt-1">Set price per litre for each fuel type</p>
              </div>
              <button onClick={() => setShowPriceModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setFuelPrices({ diesel: priceDiesel, petrol: pricePetrol }); setShowPriceModal(false); toast.success('Fuel prices updated'); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Droplet size={12} /> Diesel (Price per Litre)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={priceDiesel}
                  onChange={(e) => setPriceDiesel(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Wallet size={12} /> Petrol (Price per Litre)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={pricePetrol}
                  onChange={(e) => setPricePetrol(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                />
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowPriceModal(false)} className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  Save Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET REORDER LEVELS MODAL */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Reorder Levels</h3>
                <p className="text-zinc-500 mt-1">System will email accounts@mineazy.co.zw when balance drops below these thresholds</p>
              </div>
              <button onClick={() => setShowReorderModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setReorderLevels({ diesel: reorderDiesel, petrol: reorderPetrol }); setShowReorderModal(false); toast.success('Reorder levels saved'); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Droplet size={12} /> Diesel (Litres)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={reorderDiesel}
                  onChange={(e) => setReorderDiesel(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Wallet size={12} /> Petrol (Litres)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={reorderPetrol}
                  onChange={(e) => setReorderPetrol(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-base"
                />
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowReorderModal(false)} className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  Save Reorder Levels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG FUEL FILLUP MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Log Petroleum Fuel Dispensation</h3>
                <p className="text-zinc-555 mt-1">Registers diesel refills directly into cumulative operations ledgers</p>
              </div>
              <button 
                onClick={() => setShowLogModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleLogFuel} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Target Dumper Asset</label>
                  <select
                    required
                    value={logTruckId}
                    onChange={(e) => setLogTruckId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                  >
                    <option value="">-- Vehicles --</option>
                    {trucks.map(t => (
                      <option key={`logt-${t.id}`} value={t.id}>{t.id} - {t.plateNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Active Staff Captain</label>
                  <select
                    required
                    value={logDriverId}
                    onChange={(e) => setLogDriverId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                  >
                    <option value="">-- Operator --</option>
                    {drivers.map(d => (
                      <option key={`logd-${d.id}`} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Diesel Litres Filled</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={logLitres}
                    onChange={(e) => setLogLitres(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Total Refuel Cost (USD)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={logCost}
                    onChange={(e) => setLogCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Odometer Mileage (km)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logOdo}
                    onChange={(e) => setLogOdo(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Dispensing Depot Station</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ngezi Platform Pump"
                    value={logLoc}
                    onChange={(e) => setLogLoc(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-sans"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Confirm Fuel Dispensed
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-3 border-b border-zinc-800 mb-4 flex items-center gap-1.5">
          <Wallet size={14} className="text-orange-500" />
          <span>Fuel Balance Transaction History</span>
          <span className="text-[10px] text-zinc-600 font-normal ml-2">({fuelBalanceLogs.length} entries)</span>
        </h3>
            <PaginatedTable
              data={fuelBalanceLogs}
              pageSize={15}
              keyExtractor={log => log.id}
              emptyMessage="No balance transactions recorded."
              columns={[
                {
                  header: 'Date',
                  render: log => <span className="text-zinc-400">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '-'}</span>
                },
                {
                  header: 'Type',
                  render: log => (
                    <span className={`flex items-center gap-1 font-bold ${log.type === 'Top-Up' ? 'text-emerald-400' : log.type === 'Deduction' ? 'text-red-400' : 'text-orange-400'}`}>
                      {log.type === 'Top-Up' ? <ArrowUp size={10} /> : log.type === 'Deduction' ? <ArrowDown size={10} /> : <ArrowUpDown size={10} />}
                      {log.type}
                    </span>
                  )
                },
                { header: 'Fuel', accessor: 'fuelType', sortable: true, className: 'text-zinc-300' },
                { header: 'Litres', className: 'text-right font-bold text-zinc-200', render: log => <span className="text-right">{log.litres.toFixed(0)}L</span> },
                { header: 'Before', className: 'text-right text-zinc-500', render: log => <span className="text-right">{log.balanceBefore.toFixed(0)}L</span> },
                { header: 'After', className: 'text-right text-zinc-200', render: log => <span className="text-right">{log.balanceAfter.toFixed(0)}L</span> },
                { header: 'Note', render: log => <span className="text-zinc-500 max-w-[200px] truncate block">{log.note || '-'}</span> },
              ]}
            />
      </div>

    </Layout>
  );
};
