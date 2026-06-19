import React from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { jsPDF } from 'jspdf';
import {
  Radio, Briefcase, Users, Truck, Wrench, Droplet, FileText, Download
} from 'lucide-react';
import {
  drawFrame, docHeader, docFooter, kpiRow,
  tableHeader, tableRow, checkPage, sectionTitle, pw, ph
} from '../utils/pdfHelpers';

export const Reports: React.FC = () => {
  const { trucks, drivers, jobs, maintenance, fuelLogs, fuelRequisitions, dispatches, branches, activeUser } = useFleet();

  const startReport = (title: string, subtitle: string) => {
    const doc = new jsPDF('landscape');
    drawFrame(doc);
    const y = docHeader(doc, title, subtitle, activeUser?.name || 'System');
    return { doc, y };
  };

  const maybeBreak = (doc: jsPDF, y: number) => {
    if (y > ph(doc) - 16) {
      doc.addPage();
      drawFrame(doc);
      return 24;
    }
    return y;
  };

  // ── 1. DISPATCH REPORT ──
  const downloadDispatchReport = () => {
    const { doc, y: startY } = startReport(
      'DISPATCH OPERATIONS REPORT',
      'Active routes, cargo dispatches, and point-to-point delivery schedules.'
    );
    let y = startY;

    y = kpiRow(doc, [
      { label: 'Active Transit', value: String(jobs.filter(j => j.status === 'In Transit').length) },
      { label: 'Pending', value: String(jobs.filter(j => j.status === 'Pending').length) },
      { label: 'Assigned', value: String(jobs.filter(j => j.status === 'Assigned').length) },
      { label: 'Pending Revenue', value: `$${jobs.filter(j => j.status !== 'Completed').reduce((s, j) => s + j.income, 0).toLocaleString()}` },
    ], y);

    const cols = [22, 48, 95, 145, 172, 200, 228, 260];
    y = tableHeader(doc, cols, ['Job ID', 'Route', 'Cargo', 'Driver', 'Truck', 'Status', 'Income', 'Scheduled'], y);

    jobs.forEach((j, idx) => {
      y = maybeBreak(doc, y);
      const dName = j.driverName || drivers.find(d => d.id === j.driverId)?.name || '-';
      const tPlate = j.truckPlate || trucks.find(t => t.id === j.truckId)?.plateNumber || '-';
      y = tableRow(doc, cols, [
        j.id, `${j.source} → ${j.destination}`, `${j.cargoType} (${j.weight}T)`,
        dName, tPlate, j.status, `$${j.income.toLocaleString()}`, j.scheduledDate
      ], y, idx);
    });

    docFooter(doc);
    doc.save('Dispatch_Report.pdf');
  };

  // ── 2. ORDERS REPORT ──
  const downloadJobsReport = () => {
    const { doc, y: startY } = startReport(
      'CARGO BOOKING & ORDERS REPORT',
      'Contract bookings, payloads, freight class logs, and revenue payouts.'
    );
    let y = startY;

    const totalRev = jobs.filter(j => j.status === 'Completed').reduce((s, j) => s + j.income, 0);
    const pendingRev = jobs.filter(j => j.status !== 'Completed').reduce((s, j) => s + j.income, 0);
    y = kpiRow(doc, [
      { label: 'Total Jobs', value: String(jobs.length) },
      { label: 'Completed', value: String(jobs.filter(j => j.status === 'Completed').length) },
      { label: 'Revenue (Completed)', value: `$${totalRev.toLocaleString()}` },
      { label: 'Pending Revenue', value: `$${pendingRev.toLocaleString()}` },
    ], y);

    const cols = [22, 48, 78, 138, 165, 192, 215, 242, 268];
    y = tableHeader(doc, cols, ['Job ID', 'Cargo', 'Title / Route', 'Source → Dest', 'Weight', 'Status', 'Income', 'Scheduled', 'Est. Hrs'], y);

    jobs.forEach((j, idx) => {
      y = maybeBreak(doc, y);
      y = tableRow(doc, cols, [
        j.id, j.cargoType, j.title, `${j.source} → ${j.destination}`,
        `${j.weight}T`, j.status, `$${j.income.toLocaleString()}`, j.scheduledDate, `${j.estimatedHours}h`
      ], y, idx);
    });

    docFooter(doc);
    doc.save('Orders_Report.pdf');
  };

  // ── 3. DRIVER DETAILS REPORT ──
  const downloadDriversReport = () => {
    const { doc, y: startY } = startReport(
      'DRIVER PERSONNEL REPORT',
      'Staff registration, vetting audits, trip scores, and status tallies.'
    );
    let y = startY;

    const avgRating = drivers.length > 0 ? (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(2) : '0.00';
    y = kpiRow(doc, [
      { label: 'Total Drivers', value: String(drivers.length) },
      { label: 'On Route', value: String(drivers.filter(d => d.status === 'On Route').length) },
      { label: 'Active', value: String(drivers.filter(d => d.status === 'Active').length) },
      { label: 'Avg Rating', value: avgRating },
    ], y);

    const cols = [22, 48, 88, 120, 148, 175, 200, 225, 248, 270];
    y = tableHeader(doc, cols, ['ID', 'Name', 'License', 'Truck', 'Phone', 'Trips', 'Rating', 'Status', 'Last Active', 'Verified'], y);

    drivers.forEach((d, idx) => {
      y = maybeBreak(doc, y);
      const tPlate = d.assignedTruckPlate || trucks.find(t => t.id === d.assignedTruckId)?.plateNumber || '-';
      y = tableRow(doc, cols, [
        d.id, d.name, d.licenseClass, tPlate, d.phone || '-',
        `${d.tripsCompleted}`, d.rating.toFixed(1), d.status, d.lastActive || '-', d.isVerified ? 'Yes' : 'No'
      ], y, idx);
    });

    docFooter(doc);
    doc.save('Driver_Details_Report.pdf');
  };

  // ── 4. FLEET DETAILS REPORT ──
  const downloadFleetReport = () => {
    const { doc, y: startY } = startReport(
      'FLEET MACHINERY REPORT',
      'Technical specifications, machine ratings, service mileage, and active states.'
    );
    let y = startY;

    y = kpiRow(doc, [
      { label: 'Total Trucks', value: String(trucks.length) },
      { label: 'Active', value: String(trucks.filter(t => t.status === 'Active').length) },
      { label: 'Maintenance', value: String(trucks.filter(t => t.status === 'Maintenance').length) },
      { label: 'Idle', value: String(trucks.filter(t => t.status === 'Idle').length) },
    ], y);

    const cols = [22, 48, 78, 135, 162, 188, 212, 236, 256, 274];
    y = tableHeader(doc, cols, ['ID', 'Plate', 'Type', 'Model', 'Capacity', 'Odometer', 'Next Service', 'Fuel Rate', 'Status', 'Driver'], y);

    trucks.forEach((t, idx) => {
      y = maybeBreak(doc, y);
      y = tableRow(doc, cols, [
        t.id, t.plateNumber, t.type, t.model, t.capacity,
        `${t.mileage.toLocaleString()} km`, `${t.nextServiceMileage.toLocaleString()} km`,
        `${t.fuelRate} L/100km`, t.status,
        t.assignedDriverName || drivers.find(d => d.id === t.driverId)?.name || '-'
      ], y, idx);
    });

    docFooter(doc);
    doc.save('Fleet_Details_Report.pdf');
  };

  // ── 5. MAINTENANCE REPORT ──
  const downloadMaintenanceReport = () => {
    const { doc, y: startY } = startReport(
      'FLEET MAINTENANCE REPORT',
      'Workshop schedules, technical overhauls, expenditures, and priority alerts.'
    );
    let y = startY;

    const totalCost = maintenance.reduce((s, m) => s + m.cost, 0);
    y = kpiRow(doc, [
      { label: 'In Progress', value: String(maintenance.filter(m => m.status === 'In Progress').length) },
      { label: 'Scheduled', value: String(maintenance.filter(m => m.status === 'Scheduled').length) },
      { label: 'Completed', value: String(maintenance.filter(m => m.status === 'Completed').length) },
      { label: 'Total Cost', value: `$${totalCost.toLocaleString()}` },
    ], y);

    const cols = [22, 50, 78, 138, 172, 200, 228, 252, 272];
    y = tableHeader(doc, cols, ['WO ID', 'Truck', 'Service Type', 'Technician', 'Scheduled', 'Cost', 'Priority', 'Status', 'Completed'], y);

    maintenance.forEach((m, idx) => {
      y = maybeBreak(doc, y);
      const tPlate = m.truckPlate || trucks.find(t => t.id === m.truckId)?.plateNumber || m.truckId;
      y = tableRow(doc, cols, [
        m.id, tPlate, m.serviceType, m.technicianName, m.scheduledDate,
        `$${m.cost.toLocaleString()}`, m.priority, m.status, m.completedDate || '-'
      ], y, idx);
    });

    docFooter(doc);
    doc.save('Maintenance_Report.pdf');
  };

  // ── 6. FUEL RECONCILIATION REPORT ──
  const downloadFuelReconciliationReport = () => {
    const { doc, y: startY } = startReport(
      'FUEL RECONCILIATION REPORT',
      'Petroleum dispensing logs, fuel costs, depot stations, and consumption analysis.'
    );
    let y = startY;

    const totalLitres = fuelLogs.reduce((s, f) => s + f.litres, 0);
    const totalCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
    const avgPL = totalLitres > 0 ? totalCost / totalLitres : 0;
    y = kpiRow(doc, [
      { label: 'Total Transactions', value: String(fuelLogs.length) },
      { label: 'Total Litres', value: `${totalLitres.toLocaleString()} L` },
      { label: 'Total Cost', value: `$${totalCost.toLocaleString()}` },
      { label: 'Avg $/L', value: `$${avgPL.toFixed(2)}` },
    ], y);

    const cols = [22, 50, 82, 115, 142, 168, 192, 218, 245, 270];
    y = tableHeader(doc, cols, ['Log ID', 'Truck', 'Driver', 'Litres', 'Cost', 'Fuel Type', 'Odometer', 'Location', 'Date'], y);

    fuelLogs.forEach((f, idx) => {
      y = maybeBreak(doc, y);
      const tPlate = f.truckPlate || trucks.find(t => t.id === f.truckId)?.plateNumber || f.truckId;
      y = tableRow(doc, cols, [
        f.id, tPlate, f.driverName || f.driverId, `${f.litres.toLocaleString()} L`,
        `$${f.cost.toLocaleString()}`, f.fuelType,
        f.odometer ? `${f.odometer.toLocaleString()} km` : '-', f.location, f.date
      ], y, idx);
    });

    // Fuel Consumption by Truck section
    y = maybeBreak(doc, y + 4);
    if (y > ph(doc) - 40) { doc.addPage(); drawFrame(doc); y = 24; }
    y = sectionTitle(doc, 'Fuel Consumption by Truck', y);

    const truckFuel: Record<string, { l: number; c: number }> = {};
    fuelLogs.forEach(f => {
      if (!truckFuel[f.truckId]) truckFuel[f.truckId] = { l: 0, c: 0 };
      truckFuel[f.truckId].l += f.litres;
      truckFuel[f.truckId].c += f.cost;
    });

    const tCols = [22, 100, 175, 240];
    y = tableHeader(doc, tCols, ['Truck', 'Total Litres', 'Total Cost', 'Avg $/L'], y, 7);
    Object.entries(truckFuel).forEach(([tid, d], idx) => {
      y = maybeBreak(doc, y);
      const p = trucks.find(t => t.id === tid)?.plateNumber || tid;
      y = tableRow(doc, tCols, [
        p, `${d.l.toLocaleString()} L`, `$${d.c.toLocaleString()}`, `$${(d.c / (d.l || 1)).toFixed(2)}`
      ], y, idx, 7);
    });

    docFooter(doc);
    doc.save('Fuel_Reconciliation_Report.pdf');
  };

  // ── 7. REQUISITIONS REPORT ──
  const downloadRequisitionsReport = () => {
    const { doc, y: startY } = startReport(
      'FUEL REQUISITIONS REPORT',
      'Authorized fuel dispensing vouchers, approval pipeline, and redemption tracking.'
    );
    let y = startY;

    y = kpiRow(doc, [
      { label: 'Total', value: String(fuelRequisitions.length) },
      { label: 'Pending', value: String(fuelRequisitions.filter(r => r.status === 'Pending').length) },
      { label: 'Approved', value: String(fuelRequisitions.filter(r => r.status === 'Approved').length) },
      { label: 'Redeemed', value: String(fuelRequisitions.filter(r => r.status === 'Redeemed').length) },
    ], y);

    const cols = [22, 48, 72, 94, 110, 126, 142, 163, 182, 202, 222, 240, 256];
    y = tableHeader(doc, cols, [
      'Req ID', 'Truck', 'Driver', 'Litres', 'Cost', 'Fuel', 'Branch', 'Date',
      'Status', 'Reviewer', 'Approver', 'Rejector', 'Reason'
    ], y, 5.5);

    fuelRequisitions.forEach((r, idx) => {
      y = maybeBreak(doc, y);
      y = tableRow(doc, cols, [
        r.id, r.truckPlate || r.truckId, r.driverName || r.driverId,
        `${r.litresRequested} L`, `$${r.estimatedCost}`, r.fuelType || 'Diesel',
        r.branchName || r.branchId || '-', r.fuelDate || r.dateRequested,
        r.status, r.reviewedBy || '-', r.approvedBy || '-',
        r.rejectedBy || '-', r.rejectionReason || '-'
      ], y, idx, 5);
    });

    docFooter(doc);
    doc.save('Requisitions_Report.pdf');
  };

  const reportCards = [
    { icon: Radio, title: 'Dispatch Report', desc: 'Active routes, cargo dispatches, point-to-point schedules', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', action: downloadDispatchReport },
    { icon: Briefcase, title: 'Orders Report', desc: 'Contract bookings, freight class logs, revenue payouts', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', action: downloadJobsReport },
    { icon: Users, title: 'Driver Details', desc: 'Staff registration, vetting audits, trip scores, status', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', action: downloadDriversReport },
    { icon: Truck, title: 'Fleet Details', desc: 'Technical specs, machine ratings, service mileage', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', action: downloadFleetReport },
    { icon: Wrench, title: 'Fleet Maintenance', desc: 'Workshop overhauls, expenditures, priority alerts', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', action: downloadMaintenanceReport },
    { icon: Droplet, title: 'Fuel Reconciliation', desc: 'Dispensing logs, costs, consumption by truck', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', action: downloadFuelReconciliationReport },
    { icon: FileText, title: 'Requisitions', desc: 'Fuel vouchers, approval pipeline, redemption tracking', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', action: downloadRequisitionsReport },
  ];

  return (
    <Layout title="Reports">
      <div className="space-y-6 text-xs sm:text-sm">

        <div className="bg-[#101424] border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
            <FileText className="text-orange-400" size={18} />
            <div>
              <h3 className="text-sm font-bold text-zinc-200 font-mono uppercase">Operational Reports</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Download system reports in PDF format</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportCards.map((card, i) => (
              <div key={i} className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${card.color}`}>
                    <card.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{card.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
                <button
                  onClick={card.action}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};
