import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  FileText, Truck as TruckIcon, CheckCircle2, Clock, AlertTriangle, 
  Search, SlidersHorizontal, Plus, ArrowLeftRight, X, Layers,
  Building, Calendar, MessageSquare, Clipboard, FileSpreadsheet, RotateCcw
} from 'lucide-react';
import { DispatchRecord, StockMovement } from '../types';

export const Dispatch: React.FC = () => {
  const { 
    drivers, trucks, branches, 
    dispatches, setDispatches, 
    stockMovements, setStockMovements 
  } = useFleet();

  // Search & Filters variables
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'In Transit' | 'Delivered'>('all');

  // Modals visibility toggles
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form states for NEW Dispatch
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [customDriverName, setCustomDriverName] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [customTruckPlate, setCustomTruckPlate] = useState('');
  const [selectedDestinationBranch, setSelectedDestinationBranch] = useState('');
  const [customDestination, setCustomDestination] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dispatchDate, setDispatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Form states for NEW Stock Movement
  const [tfFromBranch, setTfFromBranch] = useState('');
  const [tfToBranch, setTfToBranch] = useState('');
  const [tfItemDescription, setTfItemDescription] = useState('');
  const [tfItemsCount, setTfItemsCount] = useState<number>(0);

  // Status changers / delivery confirmation updates
  const handleUpdateStatus = (id: string, newStatus: 'Pending' | 'In Transit' | 'Delivered') => {
    setDispatches(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleUpdateTransferStatus = (id: string, newStatus: 'Pending' | 'In Transit' | 'Completed') => {
    setStockMovements(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  // Dispatch creation
  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine Driver Details
    let driverName = '';
    let dId = selectedDriverId;
    if (selectedDriverId === 'custom') {
      driverName = customDriverName.trim() || 'Temporary Operator';
      dId = 'DRV-' + Math.floor(100 + Math.random() * 900);
    } else {
      const match = drivers.find(d => d.id === selectedDriverId);
      driverName = match ? match.name : 'Unknown Operator';
    }

    // Determine Truck Details
    let truckPlate = '';
    let tId = selectedTruckId;
    if (selectedTruckId === 'custom') {
      truckPlate = (customTruckPlate.trim() || 'TRK-ZIM-001').toUpperCase();
      tId = 'TRK-' + Math.floor(100 + Math.random() * 900);
    } else {
      const match = trucks.find(t => t.id === selectedTruckId);
      truckPlate = match ? match.plateNumber : 'TRK-ZIM-000';
    }

    // Determine Destination
    let destination = '';
    if (selectedDestinationBranch === 'custom') {
      destination = customDestination.trim() || 'Custom Facility Site';
    } else {
      const match = branches.find(b => b.id === selectedDestinationBranch);
      destination = match ? match.name : (customDestination.trim() || 'Bulawayo Depot');
    }

    const newRec: DispatchRecord = {
      id: 'DSP-' + Math.floor(2500 + Math.random() * 7000),
      date: dispatchDate,
      driverId: dId,
      driverName,
      truckId: tId,
      truckPlate,
      destination,
      itemDescription: itemDescription.trim() || 'General Cargo',
      quantity: quantity.trim() || '10 Tons',
      status: 'Pending',
      notes: notes.trim()
    };

    setDispatches(prev => [newRec, ...prev]);

    // Reset Form
    setSelectedDriverId('');
    setCustomDriverName('');
    setSelectedTruckId('');
    setCustomTruckPlate('');
    setSelectedDestinationBranch('');
    setCustomDestination('');
    setItemDescription('');
    setQuantity('');
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setNotes('');

    setShowDispatchModal(false);
  };

  // Stock Movement Transfer creation
  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    const newTransfer: StockMovement = {
      id: 'TRF-' + Math.floor(1000 + Math.random() * 8999),
      fromBranch: tfFromBranch.trim() || 'Hwange Storage Hub',
      toBranch: tfToBranch.trim() || 'Harare Central Depot',
      itemDescription: tfItemDescription.trim() || 'Machine Reagents',
      itemsCount: tfItemsCount || 10,
      status: 'Pending'
    };

    setStockMovements(prev => [newTransfer, ...prev]);

    // Reset Form
    setTfFromBranch('');
    setTfToBranch('');
    setTfItemDescription('');
    setTfItemsCount(0);

    setShowTransferModal(false);
  };

  // Helper selectors calculation
  const isDriverSelected = selectedDriverId !== '';
  const isTruckSelected = selectedTruckId !== '';
  const isDestSelected = selectedDestinationBranch !== '';

  // Filter operations
  const filteredDispatches = dispatches.filter(d => {
    const matchesSearch = 
      d.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Top metric card details
  const activeDispatchesCount = dispatches.filter(d => d.status === 'In Transit').length;
  const trucksAvailableCount = trucks.filter(t => t.status === 'Idle').length || 4;
  const deliveriesCompletedCount = dispatches.filter(d => d.status === 'Delivered').length;
  const pendingDeliveriesCount = dispatches.filter(d => d.status === 'Pending').length;

  return (
    <Layout title="Dispatch">
      <div className="space-y-6 text-xs sm:text-sm">
        
        {/* TOP SYSTEM HEADLINE */}
        <div className="flex justify-between items-center bg-[#101424] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-600/10 border border-orange-500/20 text-orange-400 rounded-lg">
              <Clipboard size={20} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider">Operational Bill of Lading & Cargo Ledger Registry</p>
              <h2 className="text-sm sm:text-base font-black text-white hover:text-orange-400 transition-colors uppercase font-mono">Heavy Hauler Manifests Depot</h2>
            </div>
          </div>
          <p className="hidden md:block text-[10px] text-zinc-550 text-right font-mono">
            SECURE REVISION NODE: <span className="text-zinc-400 font-bold">2026.5.B</span>
          </p>
        </div>

        {/* STATS CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
              <Clock size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wide">Active Dispatches</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{activeDispatchesCount}</p>
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TruckIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wide">Trucks Available</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{trucksAvailableCount}</p>
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-indigo-505/10 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wide">Deliveries Completed</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{deliveriesCompletedCount}</p>
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wide">Pending Deliveries</p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{pendingDeliveriesCount}</p>
            </div>
          </div>

        </div>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* DISPATCH REGISTER SECTION */}
          <div className="lg:col-span-2 bg-[#101424] border border-zinc-800 rounded-xl p-5 flex flex-col space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-black text-orange-400 uppercase font-mono tracking-wider flex items-center gap-2">
                  <FileSpreadsheet size={16} />
                  <span>Logistics Dispatch Register</span>
                </h3>
                <p className="text-zinc-500 text-[11px] mt-1 font-sans">Formal transport paperwork auditing truck driver handovers, payload weights and telemetry status on Zim corridors.</p>
              </div>
              
              <button
                onClick={() => setShowDispatchModal(true)}
                className="self-start sm:self-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-extrabold font-mono rounded-lg shadow-md shadow-orange-600/10 flex items-center gap-1.5 transition-all text-xs"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Register New Dispatch</span>
              </button>
            </div>

            {/* SEARCH & FILTERS CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by ID, driver, truck plate, destination or cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 pl-10 pr-4 py-2.5 rounded-lg text-zinc-200 outline-none focus:border-orange-500 pr-10 text-xs text-zinc-300 font-mono"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-300 outline-none focus:border-orange-500 cursor-pointer text-xs font-mono font-bold"
                >
                  <option value="all">📁 All Transit Statuses</option>
                  <option value="Pending">🕒 Status: Pending Gate</option>
                  <option value="In Transit">🚚 Status: In Transit</option>
                  <option value="Delivered">✅ Status: Delivered Out</option>
                </select>
              </div>
            </div>

            {/* REGISTER LEDGER TABLE */}
            <div className="overflow-x-auto rounded-lg border border-zinc-850 bg-zinc-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950/40 border-b border-zinc-850 font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="p-3.5 font-bold">Log Details</th>
                    <th className="p-3.5 font-bold">Crew & Platform</th>
                    <th className="p-3.5 font-bold">Route Destination</th>
                    <th className="p-3.5 font-bold">Payload Manifest</th>
                    <th className="p-3.5 font-bold text-center">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center font-mono text-zinc-500">
                        No official dispatch manifests matching current audit criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDispatches.map(item => (
                      <tr key={item.id} className="hover:bg-[#121625]/60 transition-colors">
                        
                        <td className="p-3.5 font-mono">
                          <p className="font-bold text-orange-400">{item.id}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            <Calendar size={10} />
                            <span>{item.date}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <p className="font-semibold text-zinc-200">{item.driverName}</p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-tight">{item.truckPlate}</p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-semibold text-zinc-200 truncate max-w-[150px]" title={item.destination}>
                            {item.destination}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-zinc-500 italic mt-0.5 truncate max-w-[140px]" title={item.notes}>
                              "{item.notes}"
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 font-mono">
                          <p className="text-zinc-200 font-semibold truncate max-w-[130px]">{item.itemDescription}</p>
                          <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded mt-1 inline-block">{item.quantity}</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* LIVE DELIVERY CONFIRMATION SELECT SWITCH */}
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                              className={`p-1 px-1.5 rounded text-[10px] font-mono font-bold outline-none cursor-pointer border ${
                                item.status === 'Completed' || item.status === 'Delivered'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : item.status === 'In Transit'
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 animate-pulse'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              <option value="Pending">🕒 Pending</option>
                              <option value="In Transit">🚚 In Transit</option>
                              <option value="Delivered">✅ Delivered</option>
                            </select>
                            <span className="text-[9px] text-zinc-500 font-mono">Instant Dispatch Sync</span>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MASS REGISTER RESET RE-SEED LOGS */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm("Purge dispatcher log entries and start fresh?")) {
                    setDispatches([]);
                    setStockMovements([]);
                    localStorage.setItem('fc_dispatch_records', JSON.stringify([]));
                    localStorage.setItem('fc_stock_movements', JSON.stringify([]));
                  }
                }}
                className="text-[10px] hover:text-orange-400 text-zinc-500 flex items-center gap-1 font-mono hover:underline"
              >
                <RotateCcw size={10} />
                <span>Reset Register to Clean Slate</span>
              </button>
            </div>

          </div>

          {/* STOCK MOVEMENT PANEL */}
          <div className="bg-[#101424] border border-zinc-800 rounded-xl p-5 flex flex-col space-y-4">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-orange-400" />
                <div>
                  <h3 className="text-sm font-black text-orange-400 uppercase font-mono tracking-wider">Stock Movement Registry</h3>
                  <p className="text-zinc-550 text-[10px] font-sans">Warehouse Depot Transfers</p>
                </div>
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-orange-400 rounded-lg border border-zinc-850 flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors"
                title="Log New Transfer"
              >
                <Plus size={11} strokeWidth={2.5} />
                <span>New Transfer</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 tracking-normal leading-relaxed font-sans">
              Registry auditing branch-to-branch material transfers (pneumatic tires, drill bits, high-grade reagents) shifting between local storages.
            </p>

            {/* TRANSFERS LIST */}
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {stockMovements.length === 0 ? (
                <div className="text-center py-10 bg-zinc-950/20 rounded border border-zinc-850 font-mono text-zinc-500 text-[11px]">
                  No active warehouse transfer documents registered.
                </div>
              ) : (
                stockMovements.map(tf => (
                  <div key={tf.id} className="bg-[#0b0f19] border border-zinc-850 hover:border-zinc-700 p-3.5 rounded-lg space-y-2.5 transition-colors">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Layers size={12} className="text-orange-400" />
                        <span className="font-bold text-orange-400">{tf.id}</span>
                      </div>
                      
                      <select
                        value={tf.status}
                        onChange={(e) => handleUpdateTransferStatus(tf.id, e.target.value as any)}
                        className={`p-1 px-1.5 rounded-[4px] text-[9px] font-mono font-bold outline-none cursor-pointer border ${
                          tf.status === 'Completed'
                            ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                            : tf.status === 'In Transit'
                            ? 'bg-orange-500/15 border-orange-500/30 text-orange-450 animate-pulse'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <option value="Pending">🕒 Pending</option>
                        <option value="In Transit">🚚 In Transit</option>
                        <option value="Completed">✅ Completed</option>
                      </select>
                    </div>

                    <div className="space-y-1 bg-zinc-950/40 p-2.5 rounded border border-zinc-900/60 break-words">
                      <p className="font-bold text-zinc-200 text-xs">{tf.itemDescription}</p>
                      <p className="text-[10px] text-orange-400/80 font-mono font-medium uppercase mt-0.5">Quantity: <span className="text-zinc-300 font-sans font-bold">{tf.itemsCount} units</span></p>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-900">
                      <div className="truncate text-left shrink-1">
                        <p className="uppercase text-[8px] text-zinc-600">Origin Depot</p>
                        <span className="text-zinc-400 font-semibold">{tf.fromBranch.split(' ')[0]}</span>
                      </div>
                      <span className="text-zinc-600 font-bold shrink-0">➔</span>
                      <div className="truncate text-right shrink-1">
                        <p className="uppercase text-[8px] text-zinc-600">Intake Hub</p>
                        <span className="text-zinc-400 font-semibold">{tf.toBranch.split(' ')[0]}</span>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* MODAL: REGISTER NEW DISPATCH */}
        {showDispatchModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
              
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Clipboard size={18} className="text-orange-400" />
                  <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Log Dispatch Paperwork Manifest</h3>
                </div>
                <button 
                  onClick={() => setShowDispatchModal(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDispatch} className="text-xs flex flex-col flex-1 overflow-hidden space-y-4">
                
                {/* Scrollable inputs container */}
                <div className="overflow-y-auto flex-1 space-y-4 pr-1 max-h-[60vh]">
                  
                  {/* Crew Driver */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Assigned Crew Driver *</label>
                    <select
                      required
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-200 outline-none focus:border-orange-500 cursor-pointer font-sans"
                    >
                      <option value="">-- Select Crew Driver Operator --</option>
                      {drivers && drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id} • {d.licenseClass})</option>
                      ))}
                      <option value="custom">✦ Register Temporary Custom Driver...</option>
                    </select>

                    {selectedDriverId === 'custom' && (
                      <div className="mt-2.5 p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg animate-fadeIn">
                        <label className="block text-[9px] text-zinc-400 uppercase font-mono mb-1">Temporary Licensee Operator Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Moses Shumba"
                          value={customDriverName}
                          onChange={(e) => setCustomDriverName(e.target.value)}
                          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Truck Machine Platform */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Heavy Hauler Truck Platform *</label>
                    <select
                      required
                      value={selectedTruckId}
                      onChange={(e) => setSelectedTruckId(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-200 outline-none focus:border-orange-500 cursor-pointer font-sans"
                    >
                      <option value="">-- Select Heavy Truck Unit --</option>
                      {trucks && trucks.map(t => (
                        <option key={t.id} value={t.id}>{t.plateNumber} ({t.type} • {t.capacity})</option>
                      ))}
                      <option value="custom">✦ Register Temporary Custom Truck Plate...</option>
                    </select>

                    {selectedTruckId === 'custom' && (
                      <div className="mt-2.5 p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg animate-fadeIn">
                        <label className="block text-[9px] text-zinc-400 uppercase font-mono mb-1">Heavy Freight Plate Registration No.</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TRK-ZIM-110A"
                          value={customTruckPlate}
                          onChange={(e) => setCustomTruckPlate(e.target.value)}
                          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono text-xs uppercase"
                        />
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Intake Depot Destination *</label>
                    <select
                      required
                      value={selectedDestinationBranch}
                      onChange={(e) => setSelectedDestinationBranch(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-200 outline-none focus:border-orange-500 cursor-pointer font-sans"
                    >
                      <option value="">-- Select Logistics Intake Depot --</option>
                      {branches && branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.locationName})</option>
                      ))}
                      <option value="custom">✦ Custom GPS Facility / Roadsite Site...</option>
                    </select>

                    {selectedDestinationBranch === 'custom' && (
                      <div className="mt-2.5 p-3 bg-zinc-950/40 border border-zinc-850 rounded-lg animate-fadeIn">
                        <label className="block text-[9px] text-zinc-400 uppercase font-mono mb-1">Custom Hub/Station Terminal Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kariba Border Crossing Storage B"
                          value={customDestination}
                          onChange={(e) => setCustomDestination(e.target.value)}
                          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2 rounded text-zinc-200 outline-none focus:border-orange-500 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Item and Quantity in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Item Description / Load *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Coal Ore, Platinum Nuggets, Tires"
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-300 outline-none focus:border-orange-500 font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Quantity / Weight *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 45 Tons, 20 Drums, 1500 Cases"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-300 outline-none focus:border-orange-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Dispatch Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Dispatch Date *</label>
                    <input
                      type="date"
                      required
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-300 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Special Operator Instructions / Notes</label>
                    <textarea
                      placeholder="e.g., Cross border procedures, priority offloading, strict seal tags verification..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded-lg text-zinc-300 outline-none focus:border-orange-500 h-20 resize-none font-sans"
                    />
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 flex-shrink-0 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 hover:bg-zinc-850 text-[11px] border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                  >
                    Close Sheet
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-black font-extrabold text-[11px] rounded-lg shadow-lg hover:shadow-orange-600/10 transition-colors"
                  >
                    Commit Dispatch & Emit Status
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* MODAL: REGISTER NEW STOCK TRANSFER */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight size={16} className="text-orange-400" />
                  <h3 className="text-xs font-bold text-orange-400 font-mono uppercase">Log New Warehouse Transfer</h3>
                </div>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs font-mono">
                
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase mb-1">From Origin Branch / Warehouse *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Harare Storage Depot"
                    value={tfFromBranch}
                    onChange={(e) => setTfFromBranch(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase mb-1">To Intake Branch / Warehouse *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ngezi Extraction Hub"
                    value={tfToBranch}
                    onChange={(e) => setTfToBranch(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase mb-1">Item Description / Parts *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., replacement alternator, drill head tips"
                    value={tfItemDescription}
                    onChange={(e) => setTfItemDescription(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase mb-1">Items Quantity Count *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={tfItemsCount || ''}
                    onChange={(e) => setTfItemsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-3.5 py-2 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-extrabold rounded"
                  >
                    Establish Transfer Run
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};
