import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { Plus, Search, Star, Phone, Mail, FileCheck2, UserCheck, Shield, X, Award, Truck as TruckIcon, Trash2, Pencil } from 'lucide-react';
import { Driver, DriverStatus } from '../types';
import { compressAndGetBase64 } from '../utils/compress';

export const Drivers: React.FC = () => {
  const { drivers, trucks, addDriver, updateDriver, updateDriverStatus, assignDriverToTruck, deleteDriver } = useFleet();

  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [licenseClass, setLicenseClass] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [avatar, setAvatar] = useState('');
  const [enrollTruckId, setEnrollTruckId] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLicenseClass, setEditLicenseClass] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');

  // Selected driver assign truck inputs
  const [assignTruckId, setAssignTruckId] = useState('');

  // Filter
  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseClass.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = idNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalAvatar = avatar || undefined;

    addDriver({
      name,
      licenseClass,
      phone,
      email,
      idNumber: generatedId,
      avatar: finalAvatar,
      assignedTruckId: enrollTruckId || null,
      isVerified
    });

    // Reset Form
    setName('');
    setLicenseClass('');
    setPhone('');
    setEmail('');
    setIdNumber('');
    setAvatar('');
    setEnrollTruckId('');
    setIsVerified(true);
    setShowAddModal(false);
  };

  const handleTruckAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    assignDriverToTruck(assignTruckId, selectedDriver.id);
    setAssignTruckId('');
    
    // Refresh detailed panel selection state
    const dId = selectedDriver.id;
    setTimeout(() => {
      setSelectedDriver(drivers.find(d => d.id === dId) || null);
    }, 100);
  };

  const openEditModal = (d: Driver) => {
    setEditName(d.name);
    setEditLicenseClass(d.licenseClass);
    setEditPhone(d.phone);
    setEditEmail(d.email);
    setEditIdNumber(d.idNumber || '');
    setShowEditModal(true);
  };

  const handleEditDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    updateDriver(selectedDriver.id, {
      name: editName,
      licenseClass: editLicenseClass,
      phone: editPhone,
      email: editEmail,
      idNumber: editIdNumber
    });
    setSelectedDriver(prev => prev ? { ...prev, name: editName, licenseClass: editLicenseClass, phone: editPhone, email: editEmail, idNumber: editIdNumber } : null);
    setShowEditModal(false);
  };

  const selectedDriverTruck = selectedDriver ? trucks.find(t => t.id === selectedDriver.assignedTruckId) : null;
  const idleTrucks = trucks.filter(t => t.status === 'Idle' && !t.driverId);

  return (
    <Layout title="Drivers">
      <div className="space-y-6">
        
        {/* TOP CONTROLS */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search truck operators..."
              className="w-full bg-[#0c0f1d] border border-zinc-850 text-xs px-3.5 py-2 pl-9 rounded-lg focus:border-zinc-700 text-zinc-200 outline-none placeholder-zinc-500 font-mono"
            />
            <Search className="absolute left-3 top-2.5 text-zinc-555" size={14} />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer"
          >
            <Plus size={15} />
            <span>Enroll Driver</span>
          </button>
        </div>

        {/* TWO COLUMN PANEL SPLIT: DRIVERS LIST | DETAILED VIEWS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: OPERATOR ROSTER */}
          <div className="lg:col-span-2 bg-[#101424] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-3 border-b border-zinc-800 mb-4">
              LICENSED STAFF DIRECTORY ({filteredDrivers.length})
            </h3>

            <div className="overflow-x-auto">
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 font-medium">No personnel registered in control systems.</div>
              ) : (
                <table className="w-full text-left text-xs bg-zinc-950/20 border border-zinc-850 rounded">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                      <th className="p-3 pl-4">Operator ID</th>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">License Class</th>
                      <th className="p-3">Trips Completed</th>
                      <th className="p-3">Operations Rating</th>
                      <th className="p-3 pr-4">Active Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredDrivers.map(d => {
                      const isSelected = selectedDriver?.id === d.id;
                      const activeTruck = d.assignedTruckId ? trucks.find(t => t.id === d.assignedTruckId) : null;

                      return (
                        <tr 
                          key={d.id} 
                          onClick={() => setSelectedDriver(d)}
                          className={`cursor-pointer transition-colors text-zinc-300 hover:bg-zinc-900/40 ${
                            isSelected ? 'bg-orange-500/5 hover:bg-orange-500/5 border-l-2 border-orange-500' : ''
                          }`}
                        >
                          <td className="p-3 pl-4 font-mono text-orange-400 font-semibold">{d.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold font-mono text-[10px] text-zinc-400 overflow-hidden">
                                {d.avatar ? (
                                  <img src={d.avatar} alt={d.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span>{d.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-white text-xs">{d.name}</p>
                                  {d.isVerified && (
                                    <span className="px-1 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-bold rounded flex items-center gap-0.5 font-mono">
                                      <Shield size={8} className="fill-emerald-400/20" /> VERIFIED
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                                  <span>ID: {d.idNumber || 'N/A'}</span>
                                  <span>•</span>
                                  <span>{d.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-400">{d.licenseClass}</td>
                          <td className="p-3 font-mono">{d.tripsCompleted}</td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-white">{d.rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="p-3 pr-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold font-mono ${
                              d.status === 'On Route' ? 'bg-orange-500/10 text-orange-400' :
                              d.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-zinc-800 text-zinc-450'
                            }`}>{d.status}</span>
                            {activeTruck && (
                              <p className="text-[9px] text-zinc-500 font-mono font-bold mt-1 uppercase">Asset: {activeTruck.plateNumber}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SELECTED INTERFACE CARD PANEL */}
          <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-3 border-b border-zinc-800 mb-4">
              OPERATIONAL TELEMETRY PREVIEW
            </h3>

            {!selectedDriver ? (
              <div className="py-20 text-center text-zinc-550 border border-zinc-850 border-dashed rounded bg-zinc-950/20 text-xs font-mono">
                Select an operator from the roster directory to analyze real-time mechanical pairings and performance metrics.
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* Profile Header card info */}
                <div className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-lg border border-zinc-850">
                  <div className="h-12 w-12 rounded-lg bg-orange-600 font-black text-black font-mono text-lg flex items-center justify-center overflow-hidden">
                    {selectedDriver.avatar ? (
                      <img src={selectedDriver.avatar} alt={selectedDriver.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{selectedDriver.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white leading-snug flex items-center gap-1.5">
                      <span>{selectedDriver.name}</span>
                      {selectedDriver.isVerified && <span className="text-emerald-400 font-mono text-xs" title="Verified Driver">✔</span>}
                    </h4>
                    <span className="text-[10px] text-orange-400 font-mono">{selectedDriver.id} • {selectedDriver.isVerified ? 'Verified Operator' : 'Awaiting Check'}</span>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-semibold font-mono">
                      <Star size={11} className="fill-yellow-500" />
                      <span>{selectedDriver.rating} Rating</span>
                      <span className="text-zinc-500 font-normal ml-1">({selectedDriver.tripsCompleted} heavy-loads done)</span>
                    </div>
                  </div>
                </div>

                {/* Operator Details List */}
                <div className="space-y-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Contact & Licensing</p>
                  
                  <div className="bg-[#0b0f19] border border-zinc-850 rounded p-3 space-y-2.5 text-[11px] text-zinc-400 font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">License Class:</span>
                      <span className="text-zinc-300 font-semibold">{selectedDriver.licenseClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">National ID Card:</span>
                      <span className="text-zinc-300 font-semibold">{selectedDriver.idNumber || 'Not Logged'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Background Clearance:</span>
                      <span className={`font-semibold ${selectedDriver.isVerified ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {selectedDriver.isVerified ? '✔ SECURE & CLEARED' : '✖ UNVERIFIED STAFF'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1"><Phone size={11} /> Mobile:</span>
                      <span className="text-zinc-300 font-semibold">{selectedDriver.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 flex items-center gap-1"><Mail size={11} /> Email:</span>
                      <span className="text-zinc-300 font-semibold truncate max-w-[170px]">{selectedDriver.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(selectedDriver)}
                    className="w-full mt-2 py-1.5 bg-zinc-900 hover:bg-orange-600/20 border border-zinc-800 hover:border-orange-500/40 text-zinc-400 hover:text-orange-400 font-mono text-[10px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={11} />
                    <span>Edit Details</span>
                  </button>
                </div>

                {/* Dynamic Status Adjust */}
                <div className="space-y-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Duty Status Modifier</p>
                  
                  <div className="flex gap-2">
                    {(['Active', 'Off Duty', 'Restricted'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          updateDriverStatus(selectedDriver.id, st);
                          // instant update detailed view element
                          setSelectedDriver(prev => ({ ...prev!, status: st }));
                        }}
                        className={`flex-1 py-1.5 rounded font-mono text-[10px] font-semibold transition-all cursor-pointer border ${
                          selectedDriver.status === st
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                            : 'bg-zinc-950/40 border-zinc-850 hover:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Truck Partnership Module */}
                <div className="space-y-2.5 border-t border-zinc-850 pt-4">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Assigned Machinery Partnership</p>
                    {selectedDriver.assignedTruckId && (
                      <button
                        onClick={() => {
                          assignDriverToTruck(selectedDriver.assignedTruckId!, null);
                          setSelectedDriver(prev => ({ ...prev!, assignedTruckId: null }));
                        }}
                        className="text-[10px] text-red-500 hover:text-red-400 font-bold font-mono"
                      >
                        Detrench Pair
                      </button>
                    )}
                  </div>

                  {selectedDriverTruck ? (
                    <div className="bg-[#171d33] border border-zinc-800/80 rounded p-3 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <p className="font-mono font-black text-xs text-orange-400 uppercase">{selectedDriverTruck.plateNumber}</p>
                        <p className="text-[10px] text-zinc-400">{selectedDriverTruck.type}</p>
                        <p className="text-[9px] text-zinc-550 font-mono">DUMPER ID: {selectedDriverTruck.id} | Mileage: {selectedDriverTruck.mileage.toLocaleString()} km</p>
                      </div>
                      <div className="h-8 w-8 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                        <TruckIcon size={14} />
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleTruckAssignment} className="space-y-2 bg-[#0c0f1d] border border-zinc-850 p-3 rounded">
                      <p className="text-[10px] text-zinc-500">Currently has no specialized truck paired inside dispatch logs. Assign a workshop pairing:</p>
                      
                      <div className="flex gap-2">
                        <select
                          required
                          value={assignTruckId}
                          onChange={(e) => setAssignTruckId(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-850 text-xs p-1.5 rounded outline-none focus:border-zinc-700 text-zinc-200"
                        >
                          <option value="">-- Idle Machinery --</option>
                          {idleTrucks.map(t => (
                            <option key={t.id} value={t.id}>{t.plateNumber} ({t.id} / {t.capacity})</option>
                          ))}
                        </select>
                        
                        <button
                          type="submit"
                          disabled={!assignTruckId}
                          className="px-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 text-black font-bold text-[11px] rounded transition-all cursor-pointer"
                        >
                          Assign Pair
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Danger Zone / Deletion */}
                <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
                  <p className="text-[10px] text-red-500 uppercase tracking-widest font-mono font-bold">Terminal Safety & Deletion</p>
                  <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg flex flex-col gap-2">
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Purging this operator deletes all records from active crew registers. Warning: This cannot be undone.
                    </p>
                    {confirmDeleteId === selectedDriver.id ? (
                      <div className="space-y-2 mt-1">
                        <p className="text-[10px] text-red-400 font-bold font-mono text-center uppercase">CONFIRM REMOVAL OF {selectedDriver.name}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              deleteDriver(selectedDriver.id);
                              setSelectedDriver(null);
                              setConfirmDeleteId(null);
                            }}
                            className="flex-1 py-1.5 bg-red-650 hover:bg-red-605 text-white font-mono text-[10px] font-black rounded cursor-pointer text-center"
                          >
                            Yes, Purge Operator
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
                          setConfirmDeleteId(selectedDriver.id);
                        }}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 font-mono text-[10px] font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        <span>Delete Operator Register</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* ENROLL DRIVER OVERLAY CARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Enroll System Heavy Haul Driver</h3>
                <p className="text-zinc-550 mt-1">Registers state permit and contacts into active RF logs</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Full Personnel Name</label>
                <input
                  type="text"
                  required
                  placeholder="Driver full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Specialized Driving Permit Type</label>
                <select
                  value={licenseClass}
                  onChange={(e) => setLicenseClass(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Class 2 Heavy Duty">Class 2 Heavy Duty (Default)</option>
                  <option value="Class 2 Heavy Duty + HAZMAT">Class 2 Heavy Duty + HAZMAT Special</option>
                  <option value="Class 4 Standard Heavy">Class 4 Standard Heavy</option>
                  <option value="Heavy Machinery Excavator Cert">Heavy Machinery Excavator Cert</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Mobile Telephone Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., +263 77 345 6112"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">National ID Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 56-291752-K-19"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">
                  Operator Portrait Image (From Local Drive)
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
                        setAvatar(base64);
                      } catch (err) {
                        console.error('Failed to compress driver image:', err);
                      }
                    }
                  }}
                  onClick={() => {
                    document.getElementById('driver-avatar-input')?.click();
                  }}
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-[#0c0f1d] p-4 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[100px] text-zinc-400 hover:text-zinc-200 group relative"
                >
                  <input
                    type="file"
                    id="driver-avatar-input"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await compressAndGetBase64(file);
                          setAvatar(base64);
                        } catch (err) {
                          console.error('Failed to compress driver image:', err);
                        }
                      }
                    }}
                    className="hidden"
                  />
                  
                  {avatar ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-12 w-12 rounded bg-zinc-900 border border-zinc-805 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">Portrait Loaded</p>
                        <p className="text-[9px] text-zinc-500 font-mono truncate leading-normal">Ready to register into database</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvatar('');
                          const el = document.getElementById('driver-avatar-input') as HTMLInputElement;
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
                      <p className="font-mono text-[10px] text-zinc-400 group-hover:text-orange-500 font-bold">Click to select portrait</p>
                      <p className="text-[9px] text-zinc-500 font-mono uppercase">or drag photo file here</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Initial Machinery Assignment (Optional)</label>
                <select
                  value={enrollTruckId}
                  onChange={(e) => setEnrollTruckId(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">-- No Machinery Assigned Yet --</option>
                  {idleTrucks.map(t => (
                    <option key={t.id} value={t.id}>{t.plateNumber} ({t.id} / Capacity: {t.capacity})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#0d101e] border border-zinc-850 p-3 rounded">
                <input
                  type="checkbox"
                  id="enrollIsVerified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="h-4 w-4 bg-zinc-950 border border-zinc-800 text-orange-500 focus:ring-0 focus:ring-offset-0 rounded outline-none cursor-pointer"
                />
                <label htmlFor="enrollIsVerified" className="text-zinc-400 font-mono text-[10px] uppercase select-none cursor-pointer">
                  Operator passes background permit verification checks
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Confirm Staff Enrollment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {showEditModal && selectedDriver && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Edit Driver Details</h3>
                <p className="text-zinc-500 mt-1 font-mono">{selectedDriver.id} · {selectedDriver.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEditDriver} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Full Personnel Name</label>
                <input type="text" required value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">License Class</label>
                <select value={editLicenseClass} onChange={(e) => setEditLicenseClass(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer">
                  <option value="Class 2 Heavy Duty">Class 2 Heavy Duty (Default)</option>
                  <option value="Class 2 Heavy Duty + HAZMAT">Class 2 Heavy Duty + HAZMAT Special</option>
                  <option value="Class 4 Standard Heavy">Class 4 Standard Heavy</option>
                  <option value="Heavy Machinery Excavator Cert">Heavy Machinery Excavator Cert</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Phone</label>
                <input type="text" required value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Email</label>
                <input type="email" required value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">National ID Number</label>
                <input type="text" value={editIdNumber}
                  onChange={(e) => setEditIdNumber(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono outline-none focus:border-orange-500" />
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowEditModal(false)}
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

    </Layout>
  );
};
