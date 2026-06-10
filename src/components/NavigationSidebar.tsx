import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { api } from '../api';
import { 
  LayoutDashboard, Radio, Briefcase, Users, Truck, Wrench, Fuel, User as UserIcon, 
  Bell, FileText, X, Printer, ShieldAlert, CheckCircle, Flame, BookOpen,
  Settings as SettingsIcon, Download, LogOut, Landmark, Menu, ScanLine
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { 
    activeUser, users, setActiveUser, trucks, drivers, jobs, maintenance, fuelLogs,
    fuelRequisitions, activities, branches, theme, logoText, logoEmoji, logout 
  } = useFleet();
  const location = useLocation();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const THEME_STYLES: { [key: string]: {
    primary: string;
    hover: string;
    hoverText: string;
    accent: string;
    accentBorder: string;
    accentLight: string;
    text: string;
    gradient: string;
    shadow: string;
    pulse: string;
  } } = {
    slate: {
      primary: 'text-orange-500',
      hover: 'hover:bg-orange-500',
      hoverText: 'hover:text-orange-500',
      accent: 'bg-orange-500',
      accentBorder: 'border-orange-550',
      accentLight: 'bg-orange-500/10',
      text: 'text-[#f97316]',
      gradient: 'from-orange-600 to-amber-500',
      shadow: 'shadow-orange-500/20',
      pulse: 'pulse-orange'
    },
    blue: {
      primary: 'text-blue-400',
      hover: 'hover:bg-blue-500',
      hoverText: 'hover:text-blue-400',
      accent: 'bg-blue-500',
      accentBorder: 'border-blue-500',
      accentLight: 'bg-blue-500/10',
      text: 'text-blue-400',
      gradient: 'from-blue-600 to-indigo-500',
      shadow: 'shadow-blue-500/20',
      pulse: 'pulse-blue'
    },
    emerald: {
      primary: 'text-emerald-400',
      hover: 'hover:bg-emerald-500',
      hoverText: 'hover:text-emerald-400',
      accent: 'bg-emerald-500',
      accentBorder: 'border-emerald-500',
      accentLight: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      gradient: 'from-emerald-600 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      pulse: 'pulse-emerald'
    },
    crimson: {
      primary: 'text-rose-400',
      hover: 'hover:bg-rose-500',
      hoverText: 'hover:text-rose-400',
      accent: 'bg-rose-500',
      accentBorder: 'border-rose-500',
      accentLight: 'bg-rose-500/10',
      text: 'text-rose-400',
      gradient: 'from-rose-600 to-red-500',
      shadow: 'shadow-rose-550/20',
      pulse: 'pulse-rose'
    }
  };

  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.slate;

  const navLinkClass = (isActive: boolean) => isActive 
    ? `${currentTheme.accentLight} ${currentTheme.primary} border-l-2 ${currentTheme.accentBorder === 'border-orange-550' ? 'border-orange-500' : currentTheme.accentBorder} font-semibold flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all`
    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all';

  // Get date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate high-level operations for notifications
  const criticalMaintenanceCount = maintenance.filter(m => m.priority === 'High' && m.status !== 'Completed').length;
  const pendingJobsCount = jobs.filter(j => j.status === 'Pending').length;
  const dispatchWarnings = trucks.filter(t => t.status === 'Maintenance').length;

  if (!activeUser) return null;

  const isPending = activeUser.status === 'Pending';
  const role = activeUser.role;
  const isAdminOrDirector = role === 'Administrator' || role === 'Director';
  const isOpsRole = isAdminOrDirector || role === 'Manager' || role === 'Treasurer';
  const isAttendant = role === 'Attendant';

  const showDispatch = !isPending && (isOpsRole || role === 'Accounts');
  const showJobs = !isPending && (isOpsRole || role === 'Accounts');
  const showDrivers = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const showFleet = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const showMaintenance = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const showFuel = !isPending && (isOpsRole || role === 'Accounts');
  const showRequisitions = !isPending && (isOpsRole || role === 'Accounts' || role === 'Driver');
  const showRedemption = !isPending && role === 'Attendant';
  const showReports = !isPending && (isAdminOrDirector || role === 'Manager' || role === 'Accounts' || role === 'Treasurer');
  const showSettings = !isPending && isAdminOrDirector;
  const showUserManagement = !isPending && role === 'Administrator';

  const getActiveReportConfig = () => {
    const path = location.pathname;
    const today = new Date();
    
    switch (path) {
      case '/dispatch':
        return {
          id: 'DISPATCH',
          title: 'LIVE DISPATCH OPERATIONS AUDIT',
          subtitle: 'Active routes, cargo dispatches, and Zimbabwe point-to-point delivery schedules.',
          kpis: [
            { label: 'Active Transit Routes', value: `${jobs.filter(j => j.status === 'In Transit').length} Active`, sub: 'Heavy machinery currently en-route' },
            { label: 'Awaiting Dispatch', value: `${jobs.filter(j => j.status === 'Pending').length} Pending`, sub: 'Awaiting pilot and truck assignment' },
            { label: 'Assigned Status', value: `${jobs.filter(j => j.status === 'Assigned').length} Assigned`, sub: 'Prepared for immediate departure' },
            { label: 'Total Pending Revenue', value: `$${jobs.filter(j => j.status !== 'Completed').reduce((sum, j) => sum + j.income, 0).toLocaleString()}`, sub: 'Unearned dispatcher backlog' }
          ]
        };
      case '/jobs':
        return {
          id: 'JOBS',
          title: 'CARGO BOOKING & CONTRACT REVENUE LEDGER',
          subtitle: 'Authorized transport bookings, payloads, freight class logs, and payouts.',
          kpis: [
            { label: 'Total Booked Jobs', value: `${jobs.length} Booked`, sub: 'Combined contracts registered' },
            { label: 'Completed Cargo', value: `${jobs.filter(j => j.status === 'Completed').length} Delivered`, sub: 'Safely closed transport orders' },
            { label: 'Accumulated Cargo Weight', value: `${jobs.reduce((sum, j) => sum + (j.status === 'Completed' ? j.weight : 0), 0).toLocaleString()} Tons`, sub: 'Total resource tonnage transported' },
            { label: 'Realized Revenue Payouts', value: `$${jobs.reduce((sum, j) => sum + (j.status === 'Completed' ? j.income : 0), 0).toLocaleString()}`, sub: 'Gross completed invoice earnings' }
          ]
        };
      case '/drivers':
        return {
          id: 'DRIVERS',
          title: 'STAFF LOGISTICS PERSONNEL & WORKPLACE AUDIT',
          subtitle: 'Staff crew registration, vetting audits, trip scores, and status tallies.',
          kpis: [
            { label: 'Registered Team', value: `${drivers.length} Drivers`, sub: 'Total certified personnel' },
            { label: 'Captains On Route', value: `${drivers.filter(d => d.status === 'On Route').length} Active`, sub: 'Currently piloting active machinery' },
            { label: 'Fleet Safety Rating', value: `${(drivers.reduce((sum, d) => sum + d.rating, 0) / (drivers.length || 1)).toFixed(2)} / 5.0`, sub: 'Calculated operator safety average' },
            { label: 'Highly Rated Crew', value: `${drivers.filter(d => d.rating >= 4.5).length} Captains`, sub: 'Safety score greater than 4.5' }
          ]
        };
      case '/fleet':
        return {
          id: 'FLEET',
          title: 'LOGISTICS FLEET HEAVY MACHINERY SPECIFICATIONS',
          subtitle: 'Technical specifications, machine ratings, service mileage limits, and active states.',
          kpis: [
            { label: 'Registered Machinery', value: `${trucks.length} Units`, sub: 'Total assets in system' },
            { label: 'Active Operations', value: `${trucks.filter(t => t.status === 'Active').length} Active`, sub: 'Fully commissioned and working' },
            { label: 'Workshop Service Bay', value: `${trucks.filter(t => t.status === 'Maintenance').length} Under Repair`, sub: 'Inoperable during technical overhaul' },
            { label: 'Service Limits Overdue', value: `${trucks.filter(t => t.mileage >= t.nextServiceMileage).length} Alerts`, sub: 'Immediate scheduled servicing required' }
          ]
        };
      case '/maintenance':
        return {
          id: 'MAINTENANCE',
          title: 'ENGINEERING WORKSERVICE BAY & OVERHAUL LEDGER',
          subtitle: 'Schedules, technical overhauls, mechanical expenditures, and priority alerts.',
          kpis: [
            { label: 'Active Repairs', value: `${maintenance.filter(m => m.status === 'In Progress').length} Repairing`, sub: 'Machinery in technical bays' },
            { label: 'Total Service Billings', value: `$${maintenance.reduce((sum, m) => sum + m.cost, 0).toLocaleString()}`, sub: 'Cumulative mechanical and parts spend' },
            { label: 'Upcoming Service Orders', value: `${maintenance.filter(m => m.status === 'Scheduled').length} Scheduled`, sub: 'Preventative maintenance scheduled' },
            { label: 'Critical Work Orders', value: `${maintenance.filter(m => m.priority === 'High' && m.status !== 'Completed').length} Crucial`, sub: 'Vehicles flagged with high urgency' }
          ]
        };
      case '/fuel':
        return {
          id: 'FUEL',
          title: 'FUEL DEPOT TELEMETRY & CONVERSION LEDGER',
          subtitle: 'Direct fuel logging, gas station redeemable tokens, and petroleum expenses across Zimbabwe depots.',
          kpis: [
            { label: 'Total Petroleum Used', value: `${fuelLogs.reduce((sum, f) => sum + f.litres, 0).toLocaleString()} Litres`, sub: 'Combined diesel/petrol fillings logged' },
            { label: 'Accumulated Fuel Payouts', value: `$${fuelLogs.reduce((sum, f) => sum + f.cost, 0).toLocaleString()}`, sub: 'Paid transactions at depot terminals' },
            { label: 'Pending Requisitions', value: `${fuelRequisitions.filter(r => r.status === 'Pending').length} Vouchers`, sub: 'Fuel requests awaiting authorization' },
            { label: 'Redeemed Allocations', value: `${fuelRequisitions.filter(r => r.status === 'Redeemed').length} Redeemed`, sub: 'Vouchers physically fueled' }
          ]
        };
      case '/requisitions':
        return {
          id: 'REQUISITIONS',
          title: 'FUEL TOKEN REQUISITIONS PIPELINE AUDIT',
          subtitle: 'Authorized fuel dispensing vouchers, approval pipeline, and redemption tracking across Zimbabwe fuel depots.',
          kpis: [
            { label: 'Pending Requisitions', value: `${fuelRequisitions.filter(r => r.status === 'Pending').length} Vouchers`, sub: 'Fuel requests awaiting authorization' },
            { label: 'Approved Vouchers', value: `${fuelRequisitions.filter(r => r.status === 'Approved').length} Approved`, sub: 'Ready for depot redemption' },
            { label: 'Redeemed Allocations', value: `${fuelRequisitions.filter(r => r.status === 'Redeemed').length} Redeemed`, sub: 'Vouchers physically fueled' },
            { label: 'Total Requisitions', value: `${fuelRequisitions.length} Records`, sub: 'All registered fuel vouchers' }
          ]
        };
      case '/redemption':
        return {
          id: 'REDEMPTION',
          title: 'MINEAZY FUEL REDEMPTION AUDIT',
          subtitle: 'Fuel voucher token verification, pump dispensing, and gas station redemption records for Zimbabwe fuel depots.',
          kpis: [
            { label: 'Approved Vouchers', value: `${fuelRequisitions.filter(r => r.status === 'Approved').length} Ready`, sub: 'Awaiting pump dispensing' },
            { label: 'Redeemed Vouchers', value: `${fuelRequisitions.filter(r => r.status === 'Redeemed').length} Fulfilled`, sub: 'Physically dispensed fuel tokens' },
            { label: 'Pending Approvals', value: `${fuelRequisitions.filter(r => r.status === 'Pending').length} Pending`, sub: 'Awaiting head office authorization' },
            { label: 'Total Voucher Volume', value: `${fuelRequisitions.reduce((sum, r) => sum + r.litresRequested, 0).toLocaleString()} Litres`, sub: 'Authorized fuel volume' }
          ]
        };
      case '/reports':
        return {
          id: 'REPORTS',
          title: 'OPERATIONAL REPORTS CONSOLE',
          subtitle: 'Downloadable PDF reports covering dispatch, orders, drivers, fleet, maintenance, fuel reconciliation, and requisitions.',
          kpis: [
            { label: 'Available Reports', value: '7 Categories', sub: 'Dispatch, Orders, Drivers, Fleet, Maintenance, Fuel, Requisitions' },
            { label: 'Total Records', value: `${jobs.length + drivers.length + trucks.length + maintenance.length + fuelLogs.length + fuelRequisitions.length}`, sub: 'Combined operational data points' },
            { label: 'Last Generated', value: new Date().toLocaleDateString(), sub: 'Current report session' },
            { label: 'Generated By', value: activeUser.name, sub: `Clearance: ${activeUser.role}` }
          ]
        };
      case '/profile':
        return {
          id: 'PROFILE',
          title: 'USER CREDENTIALS & ACCESS SECURITY REPORT',
          subtitle: 'Active authenticated operator profile, permissions, and security log parameters.',
          kpis: [
            { label: 'Account Verified Status', value: activeUser.status, sub: 'Identity validation clearance' },
            { label: 'Operator Privilege Rule', value: activeUser.role, sub: 'Control center system scope' },
            { label: 'Security Key', value: `FC-CS-${activeUser.id}`, sub: 'Unique clearance credential signature' },
            { label: 'Database Logs', value: `${activities.filter(a => a.userName === activeUser.name).length} Records`, sub: 'Actions performed by this profile' }
          ]
        };
      case '/settings':
        return {
          id: 'SETTINGS',
          title: 'ENTERPRISE SYSTEM PRESETS & DEPOT MAPPING LEDGER',
          subtitle: 'Registered regional depots, visual user presets, custom Zimbabwe map branding, and settings variables.',
          kpis: [
            { label: 'Active Regional Depots', value: `${branches.length} Depots`, sub: 'Custom branch depots registered' },
            { label: 'Custom App Branding', value: logoText, sub: `Assigned logo element: ${logoEmoji}` },
            { label: 'Interface Palette Theme', value: theme.toUpperCase(), sub: 'Computed visual spectrum' },
            { label: 'Total Operators Verified', value: `${users.filter(u => u.status === 'Verified').length} Accounts`, sub: 'Authorized admin & manager profiles' }
          ]
        };
      case '/':
      default:
        return {
          id: 'DASHBOARD',
          title: 'FLEETCOMMAND EXECUTIVE MANIFEST EXPORT',
          subtitle: 'General company-wide aggregate review of heavy logistics indicators and operational revenue.',
          kpis: [
            { label: 'Enterprise Freight Fleet', value: `${trucks.length} Heavy Haulers`, sub: `${trucks.filter(t => t.status === 'Active').length} currently active on Zimbabwe routes` },
            { label: 'Active Pilot Officers', value: `${drivers.length} Personnel`, sub: `${drivers.filter(d => d.status === 'On Route').length} captains actively in transport` },
            { label: 'Completed Dispatches', value: `${jobs.filter(j => j.status === 'Completed').length} Shipments`, sub: `${jobs.filter(j => j.status === 'In Transit').length} transits on path right now` },
            { label: 'Total Revenue Realized', value: `$${jobs.reduce((sum, j) => sum + (j.status === 'Completed' ? j.income : 0), 0).toLocaleString()}`, sub: `Outstanding pending: $${jobs.reduce((sum, j) => sum + (j.status !== 'Completed' ? j.income : 0), 0).toLocaleString()}` }
          ]
        };
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const reportKey = location.pathname;
    const config = getActiveReportConfig();
    
    csvContent += `REPORT,${config.title}\n`;
    csvContent += `Subtitle,${config.subtitle}\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += `Generated By,${activeUser?.name || 'Clerk'} (${activeUser?.role || 'Guest'})\n\n`;
    
    csvContent += "REPORT SUMMARY METRICS\n";
    config.kpis.forEach(k => {
      csvContent += `"${k.label}","${k.value}","${k.sub}"\n`;
    });
    csvContent += "\n";
    
    if (reportKey === '/dispatch') {
      csvContent += "LINE LEDGER: TRANSPORTS & ACTIVE ROUTE DISPATCHES\n";
      csvContent += "Job ID,Cargo,Route Title,Origin Station,Destination Station,Status,Income (USD),Pilot Crew,Hauler Asset\n";
      jobs.forEach(j => {
        const dName = j.driverName || drivers.find(d => d.id === j.driverId)?.name || 'Unassigned';
        const tPlate = j.truckPlate || trucks.find(t => t.id === j.truckId)?.plateNumber || 'None';
        csvContent += `"${j.id}","${j.cargoType} (${j.weight}T)","${j.title}","${j.source}","${j.destination}","${j.status}",$${j.income},"${dName}","${tPlate}"\n`;
      });
    } 
    else if (reportKey === '/jobs') {
      csvContent += "LINE LEDGER: CONTRACT CARGO BOOKINGS HISTORY\n";
      csvContent += "Job ID,Cargo Description,Cargo Type,Weight (Tons),Source Point,Destination Point,Income (USD),Status,Scheduled Date\n";
      jobs.forEach(j => {
        csvContent += `"${j.id}","${j.title}","${j.cargoType}",${j.weight},"${j.source}","${j.destination}",$${j.income},"${j.status}","${j.scheduledDate}"\n`;
      });
    }
    else if (reportKey === '/drivers') {
      csvContent += "LINE LEDGER: CERTIFIED STAFF PERSONNEL REGISTRY\n";
      csvContent += "Driver ID,Captain Name,License Standard,Assigned Vehicle Asset,Active Status,Trips Completed,Safety Rating\n";
      drivers.forEach(d => {
        const assignedTruck = d.assignedTruckId ? (trucks.find(t => t.id === d.assignedTruckId)?.plateNumber || d.assignedTruckId) : 'None';
        csvContent += `"${d.id}","${d.name}","${d.licenseClass}","${assignedTruck}","${d.status}",${d.tripsCompleted},${d.rating}\n`;
      });
    }
    else if (reportKey === '/fleet') {
      csvContent += "LINE LEDGER: FLEET MACHINERY ASSETS REGISTER\n";
      csvContent += "Machine ID,Model,Type,Plate Registration,Load Capacity,Odometer (km),Next Service (km),Fuel Burn (L/100km),Operational Status\n";
      trucks.forEach(t => {
        csvContent += `"${t.id}","${t.model}","${t.type}","${t.plateNumber}","${t.capacity}",${t.mileage},${t.nextServiceMileage},${t.fuelRate},"${t.status}"\n`;
      });
    }
    else if (reportKey === '/maintenance') {
      csvContent += "LINE LEDGER: ENGINEERING REPAIRS & PREVENTATIVE CHECKS\n";
      csvContent += "Workorder ID,Truck Plates,Technician Specialist,Service Bay Project,Cost Fee (USD),Scheduled Date,Status,Urgency Priority\n";
      maintenance.forEach(m => {
        const tPlate = m.truckPlate || trucks.find(t => t.id === m.truckId)?.plateNumber || m.truckId;
        csvContent += `"${m.id}","${tPlate}","${m.technicianName}","${m.serviceType}",$${m.cost},"${m.scheduledDate}","${m.status}","${m.priority}"\n`;
      });
    }
    else if (reportKey === '/fuel') {
      csvContent += "LINE LEDGER PART A: REFUELLING STATION LOGS\n";
      csvContent += "Log ID,Vehicle,Driver Pilot,Fuel Volume (Litres),Unit Price Cost (USD),Station Depot,Transaction Date,Fuel Choice\n";
      fuelLogs.forEach(f => {
        const tPlate = f.truckPlate || trucks.find(t => t.id === f.truckId)?.plateNumber || f.truckId;
        const dName = f.driverName || drivers.find(d => d.id === f.driverId)?.name || f.driverId;
        csvContent += `"${f.id}","${tPlate}","${dName}",${f.litres},$${f.cost},"${f.location}","${f.date}","${f.fuelType}"\n`;
      });
      csvContent += "\n";
      csvContent += "LINE LEDGER PART B: DEPOT REQUISITIONS VOUCHERS\n";
      csvContent += "Req ID,Vehicle,Driver,Requested (Litres),Est. Cost,Request Date,Clearance Status,Clearance Date,Token/Signature,Purpose\n";
      fuelRequisitions.forEach(r => {
        const tPlate = r.truckPlate || trucks.find(t => t.id === r.truckId)?.plateNumber || r.truckId;
        const dName = r.driverName || drivers.find(d => d.id === r.driverId)?.name || r.driverId;
        csvContent += `"${r.id}","${tPlate}","${dName}",${r.litresRequested},$${r.estimatedCost},"${r.dateRequested}","${r.status}","${r.approvedDate || 'N/A'}","${r.redeemToken || r.redeemedAttendantSignature || 'None'}"\n`;
      });
    }
    else if (reportKey === '/requisitions') {
      csvContent += "LINE LEDGER: FUEL TOKEN REQUISITIONS PIPELINE\n";
      csvContent += "Req ID,Vehicle,Driver,Requested (Litres),Est. Cost,Request Date,Fuel Date,Fuel Type,Branch,Clearance Status,Reviewed By,Approved By,Rejected By,Rejection Reason,Redeem Token,Redeemed At,Actual Litres,Actual Cost,Purpose\n";
      fuelRequisitions.forEach(r => {
        const tPlate = r.truckPlate || trucks.find(t => t.id === r.truckId)?.plateNumber || r.truckId;
        const dName = r.driverName || drivers.find(d => d.id === r.driverId)?.name || r.driverId;
        csvContent += `"${r.id}","${tPlate}","${dName}",${r.litresRequested},$${r.estimatedCost},"${r.dateRequested}","${r.fuelDate || r.dateRequested}","${r.fuelType || 'Diesel'}","${r.branchName || r.branchId || ''}","${r.status}","${r.reviewedBy || ''}","${r.approvedBy || ''}","${r.rejectedBy || ''}","${r.rejectionReason || ''}","${r.redeemToken || 'None'}","${r.redeemedByGasStation || ''}",${r.redeemedActualLitres || ''},${r.redeemedActualCost || ''},"${r.purpose}"\n`;
      });
    }
    else if (reportKey === '/redemption') {
      csvContent += "LINE LEDGER: MINEAZY FUEL REDEMPTION VOUCHERS\n";
      csvContent += "Req ID,Vehicle,Driver,Requested (Litres),Est. Cost,Request Date,Clearance Status,Redeem Token,Redeemed At,Actual Litres,Actual Cost,Attendant Signature,Purpose\n";
      fuelRequisitions.forEach(r => {
        const tPlate = r.truckPlate || trucks.find(t => t.id === r.truckId)?.plateNumber || r.truckId;
        const dName = r.driverName || drivers.find(d => d.id === r.driverId)?.name || r.driverId;
        csvContent += `"${r.id}","${tPlate}","${dName}",${r.litresRequested},$${r.estimatedCost},"${r.dateRequested}","${r.status}","${r.redeemToken || 'N/A'}","${r.redeemedByGasStation || ''}",${r.redeemedActualLitres || ''},${r.redeemedActualCost || ''},"${r.redeemedAttendantSignature || ''}","${r.purpose}"\n`;
      });
    }
    else if (reportKey === '/profile') {
      csvContent += "LINE LEDGER: ACCOUNT CREDENTIAL MATRIX\n";
      csvContent += "Profile Name,Active Email,Authorized Role,Identity Status,Member Since,Clearance Signature\n";
      csvContent += `"${activeUser.name}","${activeUser.email}","${activeUser.role}","${activeUser.status}","${activeUser.memberSince}","FC-CS-${activeUser.id}"\n\n`;
      csvContent += "USER RECENT ACTION TELEMETRY\n";
      csvContent += "Log ID,Time,Activity Description\n";
      activities.filter(a => a.userName === activeUser.name).forEach(a => {
        csvContent += `"${a.id}","${a.timestamp}","${a.action}"\n`;
      });
    }
    else if (reportKey === '/settings') {
      csvContent += "LINE LEDGER: SYSTEM REGISTERED REGIONAL DEPOTS\n";
      csvContent += "Depot ID,Depot Name,Location City,Latitude,Longitude\n";
      branches.forEach(b => {
        csvContent += `"${b.id}","${b.name}","${b.locationName}",${b.lat},${b.lng}\n`;
      });
    }
    else {
      csvContent += "SECTION,ACTIVE TRANSPORTATION & ROAD JOBS\n";
      csvContent += "Job ID,Origin,Destination,Driver Assigned,Truck Asset,Route Price (USD),Status\n";
      jobs.forEach(j => {
        const driverName = j.driverName || drivers.find(d => d.id === j.driverId)?.name || 'Unassigned';
        const truckPlate = j.truckPlate || trucks.find(t => t.id === j.truckId)?.plateNumber || 'None';
        csvContent += `"${j.id}","${j.source}","${j.destination}","${driverName}","${truckPlate}",$${j.income},"${j.status}"\n`;
      });
      csvContent += "\n";

      csvContent += "SECTION,LOGISTICS FLEET HEAVY MACHINERY ASSETS\n";
      csvContent += "Truck ID,Plate Number,Type,Model,Status,Last Driver\n";
      trucks.forEach(t => {
        const assignedDriver = t.driverId ? (drivers.find(d => d.id === t.driverId)?.name || t.driverId) : 'None';
        csvContent += `"${t.id}","${t.plateNumber}","${t.type}","${t.model}","${t.status}","${assignedDriver}"\n`;
      });
      csvContent += "\n";

      csvContent += "SECTION,ACTIVE CERTIFIED DRIVER PERSONNEL\n";
      csvContent += "Driver ID,Full Name,Verify Status,Assigned Vehicle\n";
      drivers.forEach(d => {
        csvContent += `"${d.id}","${d.name}","${d.status}","${d.assignedTruckId || 'None'}"\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeTitle = config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `FLEETCOMMAND_${safeTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex bg-[#0c0f1a] text-gray-100 selection:bg-zinc-800 selection:text-white">
      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d1222]/95 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          {/* Mobile close button */}
          <div className="flex justify-end p-2 lg:hidden">
            <button onClick={closeMobileSidebar} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center gap-3">
            <img src={logoImg} alt="Logo" className="h-8" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Ops Control Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1" onClick={closeMobileSidebar}>
            {!isAttendant && (
            <NavLink 
              to="/" 
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            )}

            {showDispatch && (
              <NavLink 
                to="/dispatch" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Radio size={18} />
                <span className="flex-1">Dispatch</span>
                {pendingJobsCount > 0 && (
                  <span className={`bg-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full pulse-orange`}>
                    {pendingJobsCount}
                  </span>
                )}
              </NavLink>
            )}

            {showJobs && (
              <NavLink 
                to="/jobs" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Briefcase size={18} />
                <span>Jobs</span>
              </NavLink>
            )}

            {showDrivers && (
              <NavLink 
                to="/drivers" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Users size={18} />
                <span>Drivers</span>
              </NavLink>
            )}

            {showFleet && (
              <NavLink 
                to="/fleet" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Truck size={18} />
                <span>Fleet</span>
              </NavLink>
            )}

            {showMaintenance && (
              <NavLink 
                to="/maintenance" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Wrench size={18} />
                <span className="flex-1">Maintenance</span>
                {criticalMaintenanceCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {criticalMaintenanceCount}
                  </span>
                )}
              </NavLink>
            )}

            {showFuel && (
              <NavLink 
                to="/fuel" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Fuel size={18} />
                <span>Fuel Tracking</span>
              </NavLink>
            )}

            {showRequisitions && (
              <NavLink 
                to="/requisitions" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <FileText size={18} />
                <span>Requisitions Pipeline</span>
              </NavLink>
            )}

            {showRedemption && (
              <NavLink 
                to="/redemption" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Landmark size={18} />
                <span>Mineazy Fuel Redemption</span>
              </NavLink>
            )}

            <NavLink 
              to="/scan" 
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <ScanLine size={18} />
              <span>Fuel Scanner</span>
            </NavLink>

            {showReports && (
              <NavLink 
                to="/reports" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <FileText size={18} />
                <span>Reports</span>
              </NavLink>
            )}

            {!isAttendant && (
            <NavLink 
              to="/profile" 
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <UserIcon size={18} />
              <span>Profile</span>
            </NavLink>
            )}

            <NavLink 
              to="/guide" 
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <BookOpen size={18} />
              <span>User Guide</span>
            </NavLink>

            {showSettings && (
              <NavLink 
                to="/settings" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <SettingsIcon size={18} />
                <span>Settings</span>
              </NavLink>
            )}

            {showUserManagement && (
              <NavLink 
                to="/users" 
                className={({ isActive }) => navLinkClass(isActive)}
              >
                <Users size={18} />
                <span>User Management</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Bottom Sidebar info */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          {/* Active User profile card */}
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/50">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-orange-500/20 to-orange-500 text-white border border-orange-500/40 flex items-center justify-center font-bold font-mono text-sm shadow-md">
              {activeUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-zinc-100 truncate">{activeUser.name}</p>
              <p className="text-[10px] text-orange-400 font-mono tracking-wider">{activeUser.role}</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button 
              onClick={() => logout()}
              className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 text-[9px] text-zinc-500 hover:text-red-400 transition-all flex items-center justify-center gap-0.5 shrink-0 cursor-pointer"
              title="Exit Console Session"
            >
              <LogOut size={10} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR */}
        <header className="h-16 px-4 md:px-8 bg-[#0c101e] border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700"
            >
              <Menu size={18} />
            </button>
            <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#f97316] font-mono">Operations Control Panel</span>
            <div className="flex items-baseline gap-3 mt-0.5">
              <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>

            </div>
          </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-4">
            {/* System Date Display */}
            <span className="text-xs text-zinc-400 font-mono hidden lg:inline">{formattedDate}</span>

            {/* Notification triggers */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80 transition-all cursor-pointer relative"
              >
                <Bell size={16} />
                {(criticalMaintenanceCount + pendingJobsCount) > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#121829] border border-zinc-800 rounded-lg shadow-2xl p-4 z-50 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <span className="font-bold text-zinc-200">Operations Warnings</span>
                    <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="space-y-3.5 mt-3">
                    {criticalMaintenanceCount > 0 ? (
                      <div className="flex items-start gap-2.5 bg-red-500/10 border-l-2 border-red-500 p-2 rounded">
                        <ShieldAlert size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-red-400">Critical Maintenance Overdue</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{criticalMaintenanceCount} trucks required in service bay.</p>
                        </div>
                      </div>
                    ) : null}

                    {pendingJobsCount > 0 ? (
                      <div className="flex items-start gap-2.5 bg-orange-500/10 border-l-2 border-orange-500 p-2 rounded">
                        <CheckCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-orange-400">Pending Dispatch Orders</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{pendingJobsCount} job requisitions awaiting driver allocation.</p>
                        </div>
                      </div>
                    ) : null}

                    {dispatchWarnings > 0 ? (
                      <div className="flex items-start gap-2.5 bg-yellow-500/10 border-l-2 border-yellow-500 p-2 rounded">
                        <Flame size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-yellow-400">Active Warning Limits</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{dispatchWarnings} trucks are currently in workshop.</p>
                        </div>
                      </div>
                    ) : null}

                    {criticalMaintenanceCount === 0 && pendingJobsCount === 0 && dispatchWarnings === 0 && (
                      <p className="text-center py-4 text-zinc-500">All heavy machinery and networks running nominally.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Print operations report trigger */}
            {!isAttendant && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-600/10"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Generate Report</span>
            </button>
            )}
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* REPORT GENERATION PANEL overlay */}
      {showReportModal && (() => {
        const config = getActiveReportConfig();
        const today = new Date();
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-orange-400 flex items-center gap-2">
                    <FileText className="text-orange-500 hover:rotate-12 transition-transform" />
                    <span>{config.title}</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Zimbabwe Logistics Center • Active Segment Target: {config.id}</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Printable summary sheet */}
              <div className="p-8 overflow-y-auto flex-1 space-y-6" id="fc-printable-area">
                <div className="flex justify-between items-start border-b border-zinc-900 pb-5">
                  <div>
                    <img src={logoImg} alt="Logo" className="h-10 mb-1" />
                    <p className="text-xs text-zinc-400 font-mono">{config.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">Logistics Reference: FC-REG-{config.id}-{today.getFullYear()}-{today.getMonth() + 1}-{today.getDate()}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-400 font-mono space-y-0.5">
                    <p>Officer: <span className="text-zinc-200">{activeUser.name}</span></p>
                    <p>Security clearance: <span className="text-orange-400 font-bold">{activeUser.role}</span></p>
                    <p>Timestamp: <span className="text-zinc-300">{today.toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 font-mono leading-relaxed bg-[#1b2035]/30 p-3.5 rounded-lg border border-zinc-800/60 flex flex-col gap-1">
                  <p className="text-orange-400 font-extrabold uppercase tracking-wide">Report Summary and Operational Briefing</p>
                  <p className="text-zinc-300">{config.subtitle}</p>
                </div>

                {/* KPI matrices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {config.kpis.map((k, index) => (
                    <div key={index} className="bg-zinc-950/60 p-4 rounded-lg border border-zinc-850/80 hover:border-zinc-800 transition-all">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">{k.label}</p>
                      <p className="text-xl font-black font-mono text-orange-400 mt-1.5">{k.value}</p>
                      <p className="text-[9px] text-zinc-400 mt-1.5 leading-normal">{k.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Dynamic Table Section based on Path */}
                {location.pathname === '/' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Active Heavy Haul Dispatches (Executive Overview)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Job ID</th>
                            <th className="p-3">Cargo / Route Stations</th>
                            <th className="p-3">Payload Specs</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Route Payout (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {jobs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Active Dispatches found in system</td>
                            </tr>
                          ) : (
                            jobs.map(j => (
                              <tr key={j.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-orange-400 font-bold">{j.id}</td>
                                <td className="p-3">
                                  <p className="text-white font-extrabold">{j.title}</p>
                                  <span className="text-[9px] text-zinc-500 font-mono">{j.source} ➔ {j.destination}</span>
                                </td>
                                <td className="p-3 font-mono text-[11px]">{j.weight}T {j.cargoType}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    j.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    j.status === 'In Transit' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse' :
                                    j.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800/40 text-zinc-400 border border-zinc-700/30'
                                  }`}>
                                    {j.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-400 font-bold">${j.income.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/dispatch' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Active Dispatch Manifest & Pilot Rosters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Job ID</th>
                            <th className="p-3">Transit Details / Coordinates</th>
                            <th className="p-3">Command Crew Assigned</th>
                            <th className="p-3">Truck Assigned Plate</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {jobs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Dispatch Records Assigned</td>
                            </tr>
                          ) : (
                            jobs.map(j => {
                              const dObj = drivers.find(d => d.id === j.driverId);
                              const tObj = trucks.find(t => t.id === j.truckId);
                              return (
                                <tr key={j.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                  <td className="p-3 px-4 font-mono text-orange-400 font-bold">{j.id}</td>
                                  <td className="p-3">
                                    <p className="text-white font-extrabold">{j.title}</p>
                                    <span className="text-[10px] text-zinc-500 font-mono">{j.source} ➔ {j.destination}</span>
                                  </td>
                                  <td className="p-3 font-mono text-orange-300 font-bold">
                                    {dObj ? dObj.name : <span className="text-zinc-650 italic">None Assigned</span>}
                                  </td>
                                  <td className="p-3">
                                    {tObj ? (
                                      <span className="font-mono bg-[#141a31] px-1.5 py-0.5 border border-zinc-800 text-zinc-300 text-[10px] font-bold">
                                        {tObj.plateNumber} ({tObj.type.split(' ')[0]})
                                      </span>
                                    ) : (
                                      <span className="text-zinc-650 italic text-[10px]">No Machine Assigned</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono ${
                                      j.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                      j.status === 'In Transit' ? 'bg-orange-500/10 text-orange-400 animate-pulse' :
                                      j.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                      {j.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/jobs' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Complete Contracts & Revenue Matrix</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Job ID</th>
                            <th className="p-3">Cargo Specification</th>
                            <th className="p-3">Route Stations</th>
                            <th className="p-3">Scheduled Date</th>
                            <th className="p-3 text-right font-mono">Route Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {jobs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Booked Contracts listed</td>
                            </tr>
                          ) : (
                            jobs.map(j => (
                              <tr key={j.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-orange-400 font-bold">{j.id}</td>
                                <td className="p-3">
                                  <p className="text-white font-extrabold">{j.title}</p>
                                  <span className="text-[10px] text-zinc-500 font-mono">{j.cargoType} • {j.weight} Tons</span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{j.source} ➔ {j.destination}</td>
                                <td className="p-3 text-zinc-400 font-mono text-[11px]">{j.scheduledDate}</td>
                                <td className="p-3 text-right font-mono text-emerald-400 font-bold">${j.income.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/drivers' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-855 pb-2">Certified Fleet Machinery Operators & Safety Audits</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Operator ID</th>
                            <th className="p-3">Name / Certification</th>
                            <th className="p-3">Assigned Vehicle</th>
                            <th className="p-3">Completed Trips</th>
                            <th className="p-3">Trips / Safety Rating</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {drivers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Driver Personnel accounts</td>
                            </tr>
                          ) : (
                            drivers.map(d => {
                              const associatedTruck = trucks.find(t => t.id === d.assignedTruckId);
                              return (
                                <tr key={d.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                  <td className="p-3 px-4 font-mono text-orange-400 font-bold">{d.id}</td>
                                  <td className="p-3 font-mono">
                                    <p className="text-white font-extrabold">{d.name}</p>
                                    <span className="text-[10px] text-zinc-500">{d.licenseClass}</span>
                                  </td>
                                  <td className="p-3 text-[11px] font-mono">
                                    {associatedTruck ? (
                                      <span className="text-zinc-300 bg-[#161c33] px-1.5 py-0.5 rounded border border-zinc-800">
                                        {associatedTruck.plateNumber}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-650 italic">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-zinc-300 text-center">{d.tripsCompleted}</td>
                                  <td className="p-3 font-mono text-orange-300 font-bold text-[11px]">★ {d.rating.toFixed(1)} / 5.0</td>
                                  <td className="p-3 text-right">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold font-mono ${
                                      d.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                      d.status === 'On Route' ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-450'
                                    }`}>{d.status}</span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/fleet' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Registered Freight Fleet & Operational Specs</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Machinery ID</th>
                            <th className="p-3">Rig Type / Model</th>
                            <th className="p-3">Odometer (km) / Service Limit</th>
                            <th className="p-3">Fuel Consumption Rate</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {trucks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Heavy Machinery Assets enrolled</td>
                            </tr>
                          ) : (
                            trucks.map(t => (
                              <tr key={t.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-orange-400 font-bold">{t.id}</td>
                                <td className="p-3">
                                  <p className="text-white font-extrabold">{t.type}</p>
                                  <span className="text-[10px] text-zinc-500 font-mono">Model: {t.model} • Tag: {t.plateNumber}</span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">
                                  <span>{t.mileage.toLocaleString()} km</span>
                                  <span className="text-[9px] text-zinc-500 block">Limit: {t.nextServiceMileage.toLocaleString()} km</span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{t.fuelRate} L/100km</td>
                                <td className="p-3 text-right">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold font-mono ${
                                    t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                    t.status === 'Maintenance' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-400'
                                  }`}>{t.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/maintenance' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Active Workshop Overhauls & Correctional Workorders</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Order ID</th>
                            <th className="p-3">Overhaul Project Context</th>
                            <th className="p-3">Expert Technician</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3 font-mono text-right font-bold text-orange-500">Job Cost Fee (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {maintenance.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No repair work orders discovered</td>
                            </tr>
                          ) : (
                            maintenance.map(m => {
                              const associat = trucks.find(t => t.id === m.truckId);
                              return (
                                <tr key={m.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                  <td className="p-3 px-4 font-mono text-orange-400 font-bold">{m.id}</td>
                                  <td className="p-3">
                                    <p className="text-white font-extrabold">{m.serviceType}</p>
                                    <span className="text-[10px] text-zinc-500 font-mono">Rig Plate: {associat ? associat.plateNumber : m.truckId} • Date: {m.scheduledDate}</span>
                                  </td>
                                  <td className="p-3 text-[10px] text-zinc-30 w-auto font-bold">{m.technicianName}</td>
                                  <td className="p-3 capitalize">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      m.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                                    }`}>{m.priority}</span>
                                  </td>
                                  <td className="p-3 text-right font-mono text-emerald-400 font-bold">${m.cost.toLocaleString()}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/fuel' && (
                  <div className="space-y-6">
                    {/* Part A of table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-800 pb-2">Part I: Verifiable Fuel Station Filling Receipts Log</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                              <th className="p-3 px-4">Receipt ID</th>
                              <th className="p-3">Fuel Depot Location</th>
                              <th className="p-3">Filling Details</th>
                              <th className="p-3 font-mono">Quantity Liter</th>
                              <th className="p-3 text-right leading-normal font-mono text-emerald-400">Transaction Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-855">
                            {fuelLogs.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No verifiable filling logs</td>
                              </tr>
                            ) : (
                              fuelLogs.map(l => (
                                <tr key={l.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                  <td className="p-3 px-4 font-mono text-[11px] text-orange-400 font-bold">{l.id}</td>
                                  <td className="p-3 font-mono text-[11px]">
                                    <span className="text-white font-extrabold">{l.location}</span>
                                    <span className="text-[10px] text-zinc-500 block">{l.date}</span>
                                  </td>
                                  <td className="p-3 text-[10px]">
                                    <p className="font-bold">Truck: {l.truckPlate || l.truckId}</p>
                                    <p className="text-zinc-500 text-[9px]">Pilot: {l.driverName || l.driverId}</p>
                                  </td>
                                  <td className="p-3 font-mono text-zinc-200 font-bold text-[11px]">{l.litres} L <span className="text-[9px] text-zinc-500">({l.fuelType})</span></td>
                                  <td className="p-3 text-right font-mono text-emerald-400 font-bold">${l.cost.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Part B of table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-800 pb-2">Part II: Authorized Fuel Dispensing Vouchers (Requisitions)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                              <th className="p-3 px-4">Voucher ID</th>
                              <th className="p-3">Authorized Pilot & Purpose</th>
                              <th className="p-3 font-mono">Requested Date</th>
                              <th className="p-3">Voucher Status</th>
                              <th className="p-3 text-right font-mono text-zinc-400">Est. Price (USD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850">
                            {fuelRequisitions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No pending fuel requisitions</td>
                              </tr>
                            ) : (
                              fuelRequisitions.map(r => (
                                <tr key={r.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                  <td className="p-3 px-4 font-mono text-[11px] text-orange-400 font-bold">{r.id}</td>
                                  <td className="p-3 text-[10px]">
                                    <p className="text-white font-extrabold">{r.driverName || r.driverId}</p>
                                    <p className="text-zinc-550 text-[9px]">Purpose: {r.purpose}</p>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-zinc-300">{r.dateRequested}</td>
                                  <td className="p-3 capitalize">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                      r.status === 'Redeemed' || r.status === 'Approved' || r.status === 'Reviewed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-555/20' :
                                      r.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>{r.status}</span>
                                  </td>
                                  <td className="p-3 text-right font-mono text-zinc-300 font-semibold">${r.estimatedCost.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {location.pathname === '/requisitions' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Fuel Token Requisitions Pipeline Ledger</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Voucher ID</th>
                            <th className="p-3">Authorized Pilot & Purpose</th>
                            <th className="p-3 font-mono">Requested Date</th>
                            <th className="p-3">Voucher Status</th>
                            <th className="p-3 text-right font-mono text-zinc-400">Est. Price (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {fuelRequisitions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No fuel requisitions registered</td>
                            </tr>
                          ) : (
                            fuelRequisitions.map(r => (
                              <tr key={r.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-[11px] text-orange-400 font-bold">{r.id}</td>
                                <td className="p-3 text-[10px]">
                                  <p className="text-white font-extrabold">{r.driverName || r.driverId}</p>
                                  <p className="text-zinc-550 text-[9px]">Purpose: {r.purpose}</p>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{r.dateRequested}</td>
                                <td className="p-3 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    r.status === 'Redeemed' || r.status === 'Approved' || r.status === 'Reviewed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-555/20' :
                                    r.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>{r.status}</span>
                                </td>
                                <td className="p-3 text-right font-mono text-zinc-300 font-semibold">${r.estimatedCost.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/redemption' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Mineazy Fuel Redemption Voucher Ledger</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Voucher ID</th>
                            <th className="p-3">Authorized Pilot & Purpose</th>
                            <th className="p-3 font-mono">Requested Date</th>
                            <th className="p-3">Voucher Status</th>
                            <th className="p-3 text-right font-mono text-zinc-400">Est. Price (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {fuelRequisitions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No fuel vouchers registered</td>
                            </tr>
                          ) : (
                            fuelRequisitions.map(r => (
                              <tr key={r.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-[11px] text-orange-400 font-bold">{r.id}</td>
                                <td className="p-3 text-[10px]">
                                  <p className="text-white font-extrabold">{r.driverName || r.driverId}</p>
                                  <p className="text-zinc-550 text-[9px]">Purpose: {r.purpose}</p>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">{r.dateRequested}</td>
                                <td className="p-3 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    r.status === 'Redeemed' || r.status === 'Approved' || r.status === 'Reviewed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-555/20' :
                                    r.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>{r.status}</span>
                                </td>
                                <td className="p-3 text-right font-mono text-zinc-300 font-semibold">${r.estimatedCost.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/profile' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Recent Profile Operations Security Log</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Session Log ID</th>
                            <th className="p-3">Action Executed</th>
                            <th className="p-3">Role Applied</th>
                            <th className="p-3 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {activities.filter(a => a.userName === activeUser.name).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No actions recorded for this session</td>
                            </tr>
                          ) : (
                            activities.filter(a => a.userName === activeUser.name).map(a => (
                              <tr key={a.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-orange-400 font-bold">{a.id}</td>
                                <td className="p-3 text-white text-[11px] font-semibold">{a.action}</td>
                                <td className="p-3 text-[10px] text-zinc-400">{activeUser.role}</td>
                                <td className="p-3 text-right font-mono text-[10px] text-zinc-500">{new Date(a.timestamp).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {location.pathname === '/settings' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono border-b border-zinc-850 pb-2">Registered Regional Cargo Depots & Mapping</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-zinc-950/40 border border-zinc-850 rounded-lg">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-[#121625] text-zinc-300 font-mono">
                            <th className="p-3 px-4">Depot ID</th>
                            <th className="p-3">Depot Station Name</th>
                            <th className="p-3">Zimbabwe Coordinates</th>
                            <th className="p-3 text-right">Branch Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-855">
                          {branches.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-zinc-550 font-mono uppercase text-[10px]">No Depots customized in settings</td>
                            </tr>
                          ) : (
                            branches.map(b => (
                              <tr key={b.id} className="text-zinc-400 hover:bg-zinc-900/30">
                                <td className="p-3 px-4 font-mono text-orange-400 font-bold">{b.id}</td>
                                <td className="p-3">
                                  <p className="text-white font-extrabold">{b.name}</p>
                                  <span className="text-[10px] text-zinc-500 font-mono">{b.locationName}</span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">
                                  Lat: {b.lat.toFixed(5)} / Lng: {b.lng.toFixed(5)}
                                </td>
                                <td className="p-3 text-right">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">ACTIVE BRANCH DEPOT</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with actions */}
              <div className="p-6 border-t border-zinc-800 bg-[#0c0f1d] flex justify-end gap-3 rounded-b-xl">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 hover:bg-zinc-800 border border-zinc-800 rounded font-semibold text-xs tracking-wide cursor-pointer transition-colors"
                >
                  Close View
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs tracking-wide rounded flex items-center gap-1.5 transition-all border border-zinc-700 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export ({config.id} CSV)</span>
                </button>
                <button 
                  onClick={printReport}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wide rounded flex items-center gap-1.5 transition-all shadow-lg cursor-pointer animate-pulse-orange"
                >
                  <Printer size={14} />
                  <span>Print segment ledger</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
