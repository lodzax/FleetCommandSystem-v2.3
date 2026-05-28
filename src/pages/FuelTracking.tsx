import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Droplet, Landmark, Activity, CreditCard, Search, 
  Plus, CheckCircle, FileX, Calendar, Sparkles, X, ChevronRight, Check
} from 'lucide-react';
import { FuelLog, FuelRequisition } from '../types';

export const FuelTracking: React.FC = () => {
  const { fuelLogs, fuelRequisitions, trucks, drivers, addFuelLog, addFuelRequisition, updateRequisitionStatus, redeemRequisition } = useFleet();

  const [activeTab, setActiveTab] = useState<'logs' | 'requisitions' | 'gas-station'>('logs');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);

  // Gas station redemption form state
  const [verifyToken, setVerifyToken] = useState('');
  const [matchedReq, setMatchedReq] = useState<FuelRequisition | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  
  const [gasStationName, setGasStationName] = useState('Puma Energy Cadoma');
  const [actualLitres, setActualLitres] = useState(200);
  const [actualCost, setActualCost] = useState(4400);
  const [attendantSig, setAttendantSig] = useState('');

  const handleVerifyTokenInput = (tokenStr: string) => {
    setVerifyToken(tokenStr);
    setRedeemError('');
    if (tokenStr.trim().length === 6) {
      const match = fuelRequisitions.find(r => r.redeemToken === tokenStr.trim());
      if (match) {
        if (match.status === 'Redeemed') {
          setRedeemError(`Voucher token ${tokenStr} was already redeemed on ${match.redeemDate} at ${match.redeemedByGasStation}`);
          setMatchedReq(null);
        } else if (match.status === 'Rejected') {
          setRedeemError(`Voucher token ${tokenStr} was rejected by head office`);
          setMatchedReq(null);
        } else if (match.status === 'Pending') {
          setRedeemError(`Voucher token ${tokenStr} is still Pending head office approval`);
          setMatchedReq(null);
        } else {
          // Approved
          setMatchedReq(match);
          setActualLitres(match.litresRequested);
          setActualCost(match.estimatedCost);
        }
      } else {
        setRedeemError('No active voucher found matching token');
        setMatchedReq(null);
      }
    } else {
      setMatchedReq(null);
    }
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedReq) return;
    if (!gasStationName || !attendantSig) {
      setRedeemError("Please enter the Gas Station Name and sign the attendant signature.");
      return;
    }

    redeemRequisition(matchedReq.id, {
      redeemedByGasStation: gasStationName,
      redeemedAttendantSignature: attendantSig,
      redeemedActualLitres: actualLitres,
      redeemedActualCost: actualCost
    });

    setRedeemSuccess(`Successfully verified token & preloaded ${actualLitres}L of fuel into Truck!`);
    setTimeout(() => {
      setRedeemSuccess(null);
    }, 5000);
    
    // reset form
    setVerifyToken('');
    setMatchedReq(null);
    setAttendantSig('');
    setActiveTab('logs');
  };

  // Form states for Log Fuel
  const [logTruckId, setLogTruckId] = useState('');
  const [logDriverId, setLogDriverId] = useState('');
  const [logLitres, setLogLitres] = useState(250);
  const [logCost, setLogCost] = useState(5500);
  const [logOdo, setLogOdo] = useState(64500);
  const [logLoc, setLogLoc] = useState('Hwange Depo Station');

  // Form states for requisitions
  const [reqTruckId, setReqTruckId] = useState('');
  const [reqDriverId, setReqDriverId] = useState('');
  const [reqLitres, setReqLitres] = useState(200);
  const [reqCost, setReqCost] = useState(4400);
  const [reqPurpose, setReqPurpose] = useState('Ngezi Platinum heavy haul dispatch run');

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
    setLogLitres(250);
    setLogCost(5500);
    setLogOdo(64500);
    setLogLoc('Hwange Depo Station');
    setShowLogModal(false);
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTruckId || !reqDriverId) return;

    const truck = trucks.find(t => t.id === reqTruckId);
    const driver = drivers.find(d => d.id === reqDriverId);

    addFuelRequisition({
      truckId: reqTruckId,
      truckPlate: truck?.plateNumber,
      driverId: reqDriverId,
      driverName: driver?.name,
      litresRequested: reqLitres,
      estimatedCost: reqCost,
      purpose: reqPurpose
    });

    // Reset Form
    setReqTruckId('');
    setReqDriverId('');
    setReqLitres(200);
    setReqCost(4400);
    setReqPurpose('Ngezi Platinum heavy haul dispatch run');
    setShowReqModal(false);
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

          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">REQUISITIONS PIPELINE</span>
              <p className="text-3xl font-bold text-white font-mono mt-1">
                {fuelRequisitions.filter(r => r.status === 'Pending').length}
              </p>
              <p className="text-[10px] text-zinc-450 font-mono">requests awaiting approval</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
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

        {/* DATA LEDGER TAB ROW */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Sub tabs view */}
          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === 'logs'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <Droplet size={14} />
              <span>Fuel Fill Logs ({fuelLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requisitions')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === 'requisitions'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <CreditCard size={14} />
              <span>Requisitions Pipeline ({fuelRequisitions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('gas-station')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === 'gas-station'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <Landmark size={14} />
              <span>Gas Station Clerk ({fuelRequisitions.filter(r => r.status === 'Approved').length} Approved)</span>
            </button>
          </div>

          {/* Inline feedback notifications */}
          {redeemSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-mono shadow-md">
              <span className="font-extrabold text-sm">✔</span>
              <span>{redeemSuccess}</span>
            </div>
          )}

          {/* Quick forms triggers */}
          <div>
            {activeTab === 'logs' ? (
              <button
                onClick={() => setShowLogModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
              >
                <Plus size={15} />
                <span>Log Fuel Fillup</span>
              </button>
            ) : activeTab === 'requisitions' ? (
              <button
                onClick={() => setShowReqModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
              >
                <Plus size={15} />
                <span>Request Fuel Token</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* LEDGER DETAILS CONTAINER */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
                 {activeTab === 'logs' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-zinc-950/25 border border-zinc-850 rounded">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                    <th className="p-3 pl-4">Log ID</th>
                    <th className="p-3">Asset Code</th>
                    <th className="p-3">Staff Operator</th>
                    <th className="p-3">Litres Dispensed</th>
                    <th className="p-3 font-mono">Fillup Cost</th>
                    <th className="p-3">Odometer Mileage</th>
                    <th className="p-3 pr-4">Fueling Depot Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {fuelLogs.map(l => (
                    <tr key={l.id} className="text-zinc-350 hover:bg-zinc-900/10">
                      <td className="p-3 pl-4 font-mono font-bold text-orange-400">{l.id}</td>
                      <td className="p-3 font-mono text-white text-xs font-black uppercase">{l.truckId}</td>
                      <td className="p-3">{l.driverName || 'Simulated Auto Dispenser'}</td>
                      <td className="p-3 font-mono font-bold text-zinc-300">{l.litres} L</td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">${l.cost.toLocaleString()}</td>
                      <td className="p-3 font-mono text-zinc-400">{l.odometer?.toLocaleString()} km</td>
                      <td className="p-3 pr-4 font-sans text-zinc-400">{l.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'requisitions' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-zinc-950/25 border border-zinc-850 rounded">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                    <th className="p-3 pl-4">Req Token</th>
                    <th className="p-3">Asset Plate</th>
                    <th className="p-3">Request Pilot</th>
                    <th className="p-3">Est. Litres</th>
                    <th className="p-3 font-mono">Est. USD</th>
                    <th className="p-3">Purpose / Note</th>
                    <th className="p-3 text-right">Approval Status</th>
                    <th className="p-3 pr-4 text-center">Action Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {fuelRequisitions.map(r => (
                    <tr key={r.id} className="text-zinc-350 hover:bg-zinc-900/10">
                      <td className="p-3 pl-4 font-mono font-bold text-orange-400">{r.id}</td>
                      <td className="p-3 font-mono text-white text-xs uppercase font-bold">{r.truckPlate || r.truckId}</td>
                      <td className="p-3">{r.driverName}</td>
                      <td className="p-3 font-mono">{r.litresRequested} L</td>
                      <td className="p-3 font-mono text-amber-500">${r.estimatedCost.toLocaleString()}</td>
                      <td className="p-3 font-sans text-zinc-500 italic max-w-xs truncate">{r.purpose}</td>
                      <td className="p-3 text-right">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold font-mono ${
                            r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            r.status === 'Redeemed' ? 'bg-zinc-800 text-zinc-400 font-light' :
                            r.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                          }`}>{r.status}</span>
                        </div>
                        {r.status === 'Approved' && r.redeemToken && (
                          <div className="mt-1 text-[10px] text-yellow-400 font-bold font-mono">
                            Token: <span className="underline select-all tracking-widest">{r.redeemToken}</span>
                          </div>
                        )}
                        {r.status === 'Redeemed' && r.redeemedByGasStation && (
                          <div className="mt-1 text-[9px] text-zinc-500 font-mono italic">
                            At: {r.redeemedByGasStation}
                          </div>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        {r.status === 'Pending' ? (
                          <div className="flex justify-center gap-1.5 font-mono">
                            <button
                              onClick={() => updateRequisitionStatus(r.id, 'Approved')}
                              className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateRequisitionStatus(r.id, 'Rejected')}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9.5px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[10px] italic">{r.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GAS STATION CLERK TAB VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
              <div className="space-y-4 bg-zinc-950/40 p-5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Landmark className="text-orange-400" size={16} />
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase">Voucher Redemption Console</h4>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Verify 6-Digit Fuel Token</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyToken}
                      onChange={(e) => handleVerifyTokenInput(e.target.value)}
                      placeholder="Enter e.g. 6428135"
                      className="w-full tracking-widest text-center bg-zinc-950 border border-zinc-800 rounded py-2 text-sm font-bold font-mono text-yellow-400 focus:outline-none focus:border-orange-500 animate-pulse"
                    />
                    {redeemError && (
                      <p className="text-[10px] text-red-400 mt-1.5 font-mono">{redeemError}</p>
                    )}
                  </div>

                  {matchedReq ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded space-y-3">
                      <div className="flex justify-between text-[11px] border-b border-zinc-900 pb-1.5">
                        <span className="text-emerald-400 font-mono font-bold">✔ VALID FUEL VOUCHER</span>
                        <span className="text-zinc-450 font-mono">{matchedReq.id}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-zinc-300 font-mono">
                        <div>
                          <span className="text-zinc-500 uppercase font-bold text-[9px]">Operated Truck ID</span>
                          <p className="text-white uppercase font-bold text-xs">{matchedReq.truckPlate}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 uppercase font-bold text-[9px]">Authorized Driver</span>
                          <p className="text-white font-bold text-xs">{matchedReq.driverName}</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 uppercase font-bold text-[9px]">Approved Volume</span>
                          <p className="text-orange-400 font-bold text-xs">{matchedReq.litresRequested} Litres</p>
                        </div>
                        <div>
                          <span className="text-zinc-500 uppercase font-bold text-[9px]">Estimated Cost</span>
                          <p className="text-indigo-400 font-bold text-xs">${matchedReq.estimatedCost}</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-455 bg-zinc-950/40 p-2 rounded">
                        <span className="font-semibold text-zinc-550 italic">Purpose Note:</span> {matchedReq.purpose}
                      </div>

                      <form onSubmit={handleRedeemSubmit} className="space-y-3.5 pt-2 border-t border-zinc-900">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Actual Volume (Litres)</label>
                            <input
                              type="number"
                              required
                              value={actualLitres}
                              onChange={(e) => setActualLitres(parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Actual Cost (USD)</label>
                            <input
                              type="number"
                              required
                              value={actualCost}
                              onChange={(e) => setActualCost(parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Filling Station & Vendor Name</label>
                          <input
                            type="text"
                            required
                            value={gasStationName}
                            onChange={(e) => setGasStationName(e.target.value)}
                            placeholder="e.g. Puma Energy Cadoma"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Station Attendant Signature Confirmation</label>
                          <input
                            type="text"
                            required
                            value={attendantSig}
                            onChange={(e) => setAttendantSig(e.target.value)}
                            placeholder="e.g. Cleophas Sithole (Puma Attendant)"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono italic text-[11px]"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs tracking-wider rounded cursor-pointer transition-colors mt-2 uppercase font-bold"
                        >
                          dispense fuel & charge voucher token
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-zinc-800 border-dashed rounded text-zinc-650 font-mono text-xs">
                      Enter a valid 6-digit head-office approved token to unlock the fuel pump dispenser form.
                    </div>
                  )}
                </div>
              </div>

              {/* APPROVED VOUCHERS LISTING DIRECT CLERKS ACCESS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <CreditCard className="text-orange-500" size={16} />
                  <h4 className="text-xs font-bold text-zinc-350 font-mono uppercase">Approved Active Vouchers ({fuelRequisitions.filter(r => r.status === 'Approved').length})</h4>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {fuelRequisitions.filter(r => r.status === 'Approved').length === 0 ? (
                    <p className="text-xs text-zinc-650 font-mono italic p-6 text-center">No head-office active approved fuel vouchers ready for redemption.</p>
                  ) : (
                    fuelRequisitions.filter(r => r.status === 'Approved').map(v => (
                      <div key={v.id} className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold font-mono text-white">{v.id}</p>
                          <p className="text-zinc-550 text-[10px] mt-0.5">Pilot: {v.driverName} | Rig: {v.truckPlate}</p>
                          <p className="text-orange-400/80 text-[10px] mt-0.5">{v.litresRequested}L (Est: ${v.estimatedCost})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 font-mono">CODE/TOKEN:</p>
                          <button
                            onClick={() => handleVerifyTokenInput(v.redeemToken || '')}
                            className="mt-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 font-bold font-mono text-[11px] text-yellow-400 rounded cursor-pointer transition-all"
                            title="Instant load token to form"
                          >
                            {v.redeemToken} ➔
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

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

      {/* REQUEST FUEL REQUISITION MODAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Request Fuel Token Requisition</h3>
                <p className="text-zinc-555 mt-1">Requires supervisor authorization before releasing fuel dispensing parameters</p>
              </div>
              <button 
                onClick={() => setShowReqModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Target Dumper Asset</label>
                  <select
                    required
                    value={reqTruckId}
                    onChange={(e) => setReqTruckId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                  >
                    <option value="">-- Vehicles --</option>
                    {trucks.map(t => (
                      <option key={`reqt-${t.id}`} value={t.id}>{t.id} - {t.plateNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Active Staff Captain</label>
                  <select
                    required
                    value={reqDriverId}
                    onChange={(e) => setReqDriverId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                  >
                    <option value="">-- Operator --</option>
                    {drivers.map(d => (
                      <option key={`reqd-${d.id}`} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Requisition Volume (Litres)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={reqLitres}
                    onChange={(e) => {
                      setReqLitres(parseInt(e.target.value) || 0);
                      setReqCost(Math.round((parseInt(e.target.value) || 0) * 1.50)); // Auto multiply by approx $1.50 rate
                    }}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Calculated Estimate (USD)</label>
                  <input
                    type="number"
                    readOnly
                    value={reqCost}
                    className="w-full bg-[#181e35] border border-zinc-850 p-2.5 rounded text-zinc-500 outline-none"
                    title="Computed at $1.50/Litre rate limit"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Requisition Statement Purpose</label>
                <textarea
                  required
                  placeholder="e.g., Coal Ore Transport Express Run from Hwange Fields to Bulawayo Depot"
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-[#2d3748] p-2.5 rounded text-zinc-200 h-20 resize-none outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Submit Requisition Order
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};
