import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { PaginatedTable, Column } from '../components/PaginatedTable';
import { 
  Wrench, ShieldAlert, CheckCircle, Clock, AlertTriangle, 
  Search, Plus, DollarSign, Calendar, Landmark, Check, X
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus } from '../types';
import toast from 'react-hot-toast';

export const Maintenance: React.FC = () => {
  const { maintenance, trucks, addMaintenanceRecord, updateMaintenanceStatus } = useFleet();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<MaintenanceStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [truckId, setTruckId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [cost, setCost] = useState(0);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [technicianName, setTechnicianName] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [notes, setNotes] = useState('');

  // Total cost calculations
  const totalCost = maintenance
    .filter(m => m.status === 'Completed')
    .reduce((add, m) => add + m.cost, 0);

  // Overdue count: Mileage exceeded nextServiceMileage but no completed/ongoing workshop logged
  const overdueTrucksCount = trucks.filter(t => t.mileage >= t.nextServiceMileage).length;
  
  // Pending records
  const scheduledCount = maintenance.filter(m => m.status === 'Scheduled').length;
  const inProgressCount = maintenance.filter(m => m.status === 'In Progress').length;

  // Filter
  const filteredRecords = maintenance.filter(m => {
    const matchesSearch = m.serviceType.toLowerCase().includes(search.toLowerCase()) ||
                          m.truckId.toLowerCase().includes(search.toLowerCase()) ||
                          m.technicianName.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' ? true : m.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckId) return;

    addMaintenanceRecord({
      truckId,
      serviceType,
      cost,
      scheduledDate,
      technicianName,
      priority,
      notes
    });

    // Reset Form
    setTruckId('');
    setServiceType('');
    setCost(0);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setTechnicianName('');
    setPriority('Medium');
    setNotes('');
    setShowModal(false);
    toast.success('Service scheduled');
  };

  return (
    <Layout title="Maintenance">
      <div className="space-y-6 text-xs sm:text-sm">
        
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Overdue */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-red-400 uppercase tracking-widest font-mono font-bold">OVERDUE SERVICE WARNINGS</span>
              <p className="text-3xl font-extrabold font-mono text-red-500 mt-1">{overdueTrucksCount}</p>
              <p className="text-[10px] text-zinc-400 font-mono">truck assets requiring maintenance bay</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>

          {/* Active Workorders */}
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-mono font-bold">ACTIVE WORK ORDERS</span>
              <p className="text-3xl font-extrabold font-mono text-yellow-500 mt-1">{scheduledCount + inProgressCount}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{scheduledCount} Scheduled | {inProgressCount} In Workshop</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center">
              <Wrench size={18} />
            </div>
          </div>

          {/* Cumulative Spending */}
          <div className="bg-[#101424] border border-zinc-805 rounded-xl p-5 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">TOTAL BAY COST CALCULATED</span>
              <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                ${totalCost.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">from all completed services</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Landmark size={18} />
            </div>
          </div>

        </div>

        {/* WORKSHOP GRID FILTER CONTROL ROW */}
        <div className="bg-[#101424] border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {(['All', 'Scheduled', 'In Progress', 'Completed'] as const).map(tab => {
              const tabCount = tab === 'All' ? maintenance.length : maintenance.filter(m => m.status === tab).length;
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

          {/* Search box and schedule bay button */}
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, mechanic or dumper..."
                className="w-full bg-[#0c0f1d] border border-zinc-850 text-xs px-3.5 py-2 pl-9 rounded-lg focus:border-zinc-700 text-zinc-200 outline-none placeholder-zinc-500 font-mono"
              />
              <Search className="absolute left-3 top-2.5 text-zinc-555" size={14} />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              <span>Schedule Service</span>
            </button>
          </div>

        </div>

        {/* SERVICE LEDGER RECORDS LISTING */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
          
          <div className="overflow-x-auto">
            <PaginatedTable
              data={filteredRecords}
              searchFields={['id', 'truckId', 'serviceType', 'technicianName']}
              pageSize={15}
              keyExtractor={m => m.id}
              emptyMessage="No service bay work orders filed."
              columns={[
                { header: 'Workorder ID', accessor: 'id', sortable: true, className: 'font-mono font-bold text-orange-400', headerClassName: 'pl-4' },
                { header: 'Asset Code', accessor: 'truckId', sortable: true, className: 'font-mono text-white text-xs font-black uppercase' },
                {
                  header: 'Servicing Mechanics',
                  render: m => (
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-xs">{m.serviceType}</p>
                      <span className="text-[10px] text-zinc-500 font-semibold">Mechanic: {m.technicianName}</span>
                    </div>
                  )
                },
                { header: 'Cost (USD)', accessor: 'cost', sortable: true, className: 'font-mono text-emerald-400 font-semibold', render: m => <span>${m.cost.toLocaleString()}</span> },
                { header: 'Scheduled Date', accessor: 'scheduledDate', sortable: true, className: 'text-zinc-400 font-mono' },
                {
                  header: 'Risk Level',
                  sortable: true,
                  render: m => (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${m.priority === 'High' ? 'bg-red-500/10 text-red-400' : m.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}>{m.priority}</span>
                  )
                },
                {
                  header: 'Status Label',
                  sortable: true,
                  render: m => (
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : m.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-500 animate-pulse' : 'bg-red-500/10 text-zinc-400'}`}>{m.status}</span>
                  )
                },
                {
                  header: 'Interactive Telemetry Trigger',
                  headerClassName: 'text-center',
                  className: 'text-center',
                  render: m => (
                    <div className="flex justify-center gap-1.5">
                      {m.status === 'Scheduled' && (
                        <button onClick={() => { updateMaintenanceStatus(m.id, 'In Progress'); toast.success('Service started'); }} className="px-2 py-1 bg-yellow-500 text-black font-bold text-[10px] font-mono tracking-wide rounded hover:bg-yellow-400 cursor-pointer">Overhaul</button>
                      )}
                      {m.status === 'In Progress' && (
                        <button onClick={() => { updateMaintenanceStatus(m.id, 'Completed'); toast.success('Service completed'); }} className="px-2.5 py-1 bg-emerald-500 text-black font-extrabold text-[10px] font-mono tracking-wide rounded hover:bg-emerald-400 flex items-center gap-0.5 cursor-pointer">
                          <Check size={11} strokeWidth={3} />
                          <span>Discharge</span>
                        </button>
                      )}
                      {m.status === 'Completed' && <span className="text-zinc-550 font-mono text-[10px] italic">Released Bay</span>}
                    </div>
                  )
                },
              ]}
            />
          </div>
        </div>

      </div>

      {/* SCHEDULE WORKSHOP SERVICE FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Schedule Vehicle Maintenance</h3>
                <p className="text-zinc-550 mt-1">Add a new record to schedule a vehicle for maintenance</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Select Truck / Vehicle</label>
                <select
                  required
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">-- Active Vehicles --</option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.id}>{t.id} — {t.plateNumber} ({t.type.substring(0, 22)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Service Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Engine Diagnostics, Brake Calibrations, Oil & Filters"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Estimated Cost (USD)</label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={cost}
                    onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Scheduled Service Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Lead Mechanic</label>
                  <input
                    type="text"
                    required
                    placeholder="Technician name"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="High">🚨 High Urgency</option>
                    <option value="Medium">⚡ Medium Diagnostic</option>
                    <option value="Low">🛠️ Low Routine Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Maintenance Notes</label>
                <textarea
                  placeholder="Specify any fault lines, diagnostics, or additional notes here."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 h-20 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Confirm Work Order Log
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};
