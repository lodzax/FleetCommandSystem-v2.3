import React from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { jsPDF } from 'jspdf';
import {
  Radio, Briefcase, Users, Truck, Wrench, Droplet, FileText, Download
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { trucks, drivers, jobs, maintenance, fuelLogs, fuelRequisitions, dispatches, branches, activeUser } = useFleet();

  const M = 14;
  const sep = (doc: jsPDF, y: number) => {
    const w = doc.internal.pageSize.getWidth();
    doc.setDrawColor(180);
    doc.line(M, y, w - M, y);
  };

  const header = (doc: jsPDF, title: string, subtitle: string, y: number): number => {
    const w = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, w / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, w / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toLocaleString()} | By: ${activeUser?.name || 'System'} | FleetCommand v2.3`, w / 2, y, { align: 'center' });
    y += 5;
    sep(doc, y);
    return y + 5;
  };

  const footer = (doc: jsPDF) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.text(`Page ${i} of ${pages} | FleetCommand Operations`, w / 2, h - 8, { align: 'center' });
    }
  };

  const headerRow = (doc: jsPDF, cols: number[], headers: string[], y: number, fontSize = 7) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => doc.text(h, cols[i], y));
  };

  const checkPage = (doc: jsPDF, y: number): number => {
    const h = doc.internal.pageSize.getHeight();
    if (y > h - 16) {
      doc.addPage();
      return 18;
    }
    return y;
  };

  // ── 1. DISPATCH REPORT ──
  const downloadDispatchReport = () => {
    const doc = new jsPDF('landscape');
    const w = doc.internal.pageSize.getWidth();
    let y = header(doc, 'DISPATCH OPERATIONS REPORT', 'Active routes, cargo dispatches, and point-to-point delivery schedules.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Active Transit: ${jobs.filter(j => j.status === 'In Transit').length}  |  Pending: ${jobs.filter(j => j.status === 'Pending').length}  |  Assigned: ${jobs.filter(j => j.status === 'Assigned').length}  |  Pending Revenue: $${jobs.filter(j => j.status !== 'Completed').reduce((s, j) => s + j.income, 0).toLocaleString()}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 35, 80, 130, 165, 195, 220, 250];
    headerRow(doc, cols, ['Job ID', 'Route', 'Cargo', 'Driver', 'Truck', 'Status', 'Income', 'Scheduled'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    jobs.forEach(j => {
      y = checkPage(doc, y);
      const dName = j.driverName || drivers.find(d => d.id === j.driverId)?.name || '-';
      const tPlate = j.truckPlate || trucks.find(t => t.id === j.truckId)?.plateNumber || '-';
      doc.text(j.id, cols[0], y);
      doc.text(`${j.source} → ${j.destination}`, cols[1], y);
      doc.text(`${j.cargoType} (${j.weight}T)`, cols[2], y);
      doc.text(dName, cols[3], y);
      doc.text(tPlate, cols[4], y);
      doc.text(j.status, cols[5], y);
      doc.text(`$${j.income.toLocaleString()}`, cols[6], y);
      doc.text(j.scheduledDate, cols[7], y);
      y += 4.5;
    });

    footer(doc);
    doc.save('Dispatch_Report.pdf');
  };

  // ── 2. ORDERS REPORT ──
  const downloadJobsReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'CARGO BOOKING & ORDERS REPORT', 'Contract bookings, payloads, freight class logs, and revenue payouts.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Jobs: ${jobs.length}  |  Completed: ${jobs.filter(j => j.status === 'Completed').length}  |  Revenue: $${jobs.reduce((s, j) => s + (j.status === 'Completed' ? j.income : 0), 0).toLocaleString()}  |  Pending: $${jobs.filter(j => j.status !== 'Completed').reduce((s, j) => s + j.income, 0).toLocaleString()}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 35, 65, 140, 165, 190, 215, 245, 265];
    headerRow(doc, cols, ['Job ID', 'Cargo', 'Title / Route', 'Source → Dest', 'Weight(T)', 'Status', 'Income', 'Scheduled', 'Est. Hrs'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    jobs.forEach(j => {
      y = checkPage(doc, y);
      doc.text(j.id, cols[0], y);
      doc.text(j.cargoType, cols[1], y);
      doc.text(j.title, cols[2], y);
      doc.text(`${j.source} → ${j.destination}`, cols[3], y);
      doc.text(`${j.weight}`, cols[4], y);
      doc.text(j.status, cols[5], y);
      doc.text(`$${j.income.toLocaleString()}`, cols[6], y);
      doc.text(j.scheduledDate, cols[7], y);
      doc.text(`${j.estimatedHours}h`, cols[8], y);
      y += 4.5;
    });

    footer(doc);
    doc.save('Orders_Report.pdf');
  };

  // ── 3. DRIVER DETAILS REPORT ──
  const downloadDriversReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'DRIVER PERSONNEL REPORT', 'Staff registration, vetting audits, trip scores, and status tallies.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${drivers.length}  |  On Route: ${drivers.filter(d => d.status === 'On Route').length}  |  Active: ${drivers.filter(d => d.status === 'Active').length}  |  Avg Rating: ${(drivers.reduce((s, d) => s + d.rating, 0) / (drivers.length || 1)).toFixed(2)}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 35, 75, 110, 140, 165, 190, 220, 250, 270];
    headerRow(doc, cols, ['ID', 'Name', 'License', 'Truck', 'Phone', 'Trips', 'Rating', 'Status', 'Last Active', 'Verified'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    drivers.forEach(d => {
      y = checkPage(doc, y);
      const tPlate = d.assignedTruckPlate || trucks.find(t => t.id === d.assignedTruckId)?.plateNumber || '-';
      doc.text(d.id, cols[0], y);
      doc.text(d.name, cols[1], y);
      doc.text(d.licenseClass, cols[2], y);
      doc.text(tPlate, cols[3], y);
      doc.text(d.phone || '-', cols[4], y);
      doc.text(`${d.tripsCompleted}`, cols[5], y);
      doc.text(d.rating.toFixed(1), cols[6], y);
      doc.text(d.status, cols[7], y);
      doc.text(d.lastActive || '-', cols[8], y);
      doc.text(d.isVerified ? 'Yes' : 'No', cols[9], y);
      y += 4.5;
    });

    footer(doc);
    doc.save('Driver_Details_Report.pdf');
  };

  // ── 4. FLEET DETAILS REPORT ──
  const downloadFleetReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'FLEET MACHINERY REPORT', 'Technical specifications, machine ratings, service mileage, and active states.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${trucks.length}  |  Active: ${trucks.filter(t => t.status === 'Active').length}  |  Maintenance: ${trucks.filter(t => t.status === 'Maintenance').length}  |  Idle: ${trucks.filter(t => t.status === 'Idle').length}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 35, 62, 120, 148, 175, 200, 225, 250, 270];
    headerRow(doc, cols, ['ID', 'Plate', 'Type', 'Model', 'Capacity', 'Odometer', 'Next Service', 'Fuel Rate', 'Status', 'Driver'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    trucks.forEach(t => {
      y = checkPage(doc, y);
      doc.text(t.id, cols[0], y);
      doc.text(t.plateNumber, cols[1], y);
      doc.text(t.type, cols[2], y);
      doc.text(t.model, cols[3], y);
      doc.text(t.capacity, cols[4], y);
      doc.text(`${t.mileage.toLocaleString()}`, cols[5], y);
      doc.text(`${t.nextServiceMileage.toLocaleString()}`, cols[6], y);
      doc.text(`${t.fuelRate} L/100km`, cols[7], y);
      doc.text(t.status, cols[8], y);
      doc.text(t.assignedDriverName || drivers.find(d => d.id === t.driverId)?.name || '-', cols[9], y);
      y += 4.5;
    });

    footer(doc);
    doc.save('Fleet_Details_Report.pdf');
  };

  // ── 5. MAINTENANCE REPORT ──
  const downloadMaintenanceReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'FLEET MAINTENANCE REPORT', 'Workshop schedules, technical overhauls, expenditures, and priority alerts.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Active: ${maintenance.filter(m => m.status === 'In Progress').length}  |  Scheduled: ${maintenance.filter(m => m.status === 'Scheduled').length}  |  Completed: ${maintenance.filter(m => m.status === 'Completed').length}  |  Total Cost: $${maintenance.reduce((s, m) => s + m.cost, 0).toLocaleString()}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 30, 55, 120, 155, 185, 215, 240, 265];
    headerRow(doc, cols, ['WO ID', 'Truck', 'Service Type', 'Technician', 'Scheduled', 'Cost', 'Priority', 'Status', 'Completed'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    maintenance.forEach(m => {
      y = checkPage(doc, y);
      const tPlate = m.truckPlate || trucks.find(t => t.id === m.truckId)?.plateNumber || m.truckId;
      doc.text(m.id, cols[0], y);
      doc.text(tPlate, cols[1], y);
      doc.text(m.serviceType, cols[2], y);
      doc.text(m.technicianName, cols[3], y);
      doc.text(m.scheduledDate, cols[4], y);
      doc.text(`$${m.cost.toLocaleString()}`, cols[5], y);
      doc.text(m.priority, cols[6], y);
      doc.text(m.status, cols[7], y);
      doc.text(m.completedDate || '-', cols[8], y);
      y += 4.5;
    });

    footer(doc);
    doc.save('Maintenance_Report.pdf');
  };

  // ── 6. FUEL RECONCILIATION REPORT ──
  const downloadFuelReconciliationReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'FUEL RECONCILIATION REPORT', 'Petroleum dispensing logs, fuel costs, depot stations, and consumption analysis.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Litres: ${fuelLogs.reduce((s, f) => s + f.litres, 0).toLocaleString()} L  |  Total Cost: $${fuelLogs.reduce((s, f) => s + f.cost, 0).toLocaleString()}  |  Avg: $${(fuelLogs.reduce((s, f) => s + f.cost, 0) / (fuelLogs.reduce((s, f) => s + f.litres, 0) || 1)).toFixed(2)}/L`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 35, 65, 100, 130, 155, 180, 220, 245, 270];
    headerRow(doc, cols, ['Log ID', 'Truck', 'Driver', 'Litres', 'Cost', 'Fuel', 'Odometer', 'Location', 'Date'], y);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    fuelLogs.forEach(f => {
      y = checkPage(doc, y);
      const tPlate = f.truckPlate || trucks.find(t => t.id === f.truckId)?.plateNumber || f.truckId;
      doc.text(f.id, cols[0], y);
      doc.text(tPlate, cols[1], y);
      doc.text(f.driverName || f.driverId, cols[2], y);
      doc.text(`${f.litres}`, cols[3], y);
      doc.text(`$${f.cost.toLocaleString()}`, cols[4], y);
      doc.text(f.fuelType, cols[5], y);
      doc.text(`${f.odometer?.toLocaleString() || '-'}`, cols[6], y);
      doc.text(f.location, cols[7], y);
      doc.text(f.date, cols[8], y);
      y += 4.5;
    });

    // Consumption by Truck
    y = checkPage(doc, y + 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fuel Consumption by Truck', M, y);
    y += 6;

    const truckFuel: Record<string, { l: number; c: number }> = {};
    fuelLogs.forEach(f => {
      if (!truckFuel[f.truckId]) truckFuel[f.truckId] = { l: 0, c: 0 };
      truckFuel[f.truckId].l += f.litres;
      truckFuel[f.truckId].c += f.cost;
    });

    const tCols = [M, 70, 140, 210];
    headerRow(doc, tCols, ['Truck', 'Total Litres', 'Total Cost', 'Avg $/L'], y, 8);
    y += 4;
    sep(doc, y);
    y += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    Object.entries(truckFuel).forEach(([tid, d]) => {
      y = checkPage(doc, y);
      const p = trucks.find(t => t.id === tid)?.plateNumber || tid;
      doc.text(p, tCols[0], y);
      doc.text(`${d.l.toLocaleString()} L`, tCols[1], y);
      doc.text(`$${d.c.toLocaleString()}`, tCols[2], y);
      doc.text(`$${(d.c / (d.l || 1)).toFixed(2)}`, tCols[3], y);
      y += 5;
    });

    footer(doc);
    doc.save('Fuel_Reconciliation_Report.pdf');
  };

  // ── 7. REQUISITIONS REPORT ──
  const downloadRequisitionsReport = () => {
    const doc = new jsPDF('landscape');
    let y = header(doc, 'FUEL REQUISITIONS REPORT', 'Authorized fuel dispensing vouchers, approval pipeline, and redemption tracking.', 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${fuelRequisitions.length}  |  Pending: ${fuelRequisitions.filter(r => r.status === 'Pending').length}  |  Reviewed: ${fuelRequisitions.filter(r => r.status === 'Reviewed').length}  |  Approved: ${fuelRequisitions.filter(r => r.status === 'Approved').length}  |  Redeemed: ${fuelRequisitions.filter(r => r.status === 'Redeemed').length}`, M, y);
    y += 7;
    sep(doc, y);
    y += 5;

    const cols = [M, 32, 58, 82, 100, 118, 136, 158, 178, 200, 228, 250, 272];
    headerRow(doc, cols, ['Req ID', 'Truck', 'Driver', 'Litres', 'Cost', 'Fuel', 'Branch', 'Date', 'Status', 'Reviewed', 'Approved', 'Rejected', 'Reason'], y, 6);
    y += 3;
    sep(doc, y);
    y += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    fuelRequisitions.forEach(r => {
      y = checkPage(doc, y);
      doc.text(r.id, cols[0], y);
      doc.text((r.truckPlate || r.truckId), cols[1], y);
      doc.text((r.driverName || r.driverId), cols[2], y);
      doc.text(`${r.litresRequested}`, cols[3], y);
      doc.text(`$${r.estimatedCost}`, cols[4], y);
      doc.text(r.fuelType || 'Diesel', cols[5], y);
      doc.text((r.branchName || r.branchId || '-'), cols[6], y);
      doc.text(r.fuelDate || r.dateRequested, cols[7], y);
      doc.text(r.status, cols[8], y);
      doc.text(r.reviewedBy || '-', cols[9], y);
      doc.text(r.approvedBy || '-', cols[10], y);
      doc.text(r.rejectedBy || '-', cols[11], y);
      doc.text((r.rejectionReason || '-'), cols[12], y);
      y += 4;
    });

    footer(doc);
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
