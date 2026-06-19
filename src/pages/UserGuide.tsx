import React from 'react';
import { Layout } from '../components/NavigationSidebar';
import {
  LayoutDashboard, Radio, Briefcase, Users, Truck, Wrench, Fuel, FileText,
  Landmark, User as UserIcon, Settings as SettingsIcon, ShieldAlert, CheckCircle,
  ThumbsUp, Eye, ArrowUp, ArrowDown, ArrowUpDown, Download, LogOut, BookOpen, Search,
  ArrowRight, Clock, AlertTriangle, Star, Printer, CreditCard, Droplet,
  Menu, X, Bell, MapPin, Hash, ChevronRight, Circle, CheckSquare, Info
} from 'lucide-react';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-[#101424] border border-zinc-800 rounded-xl p-5 space-y-4">
    <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
      <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const Step: React.FC<{ num: string; title: string; desc: string; color?: string }> = ({ num, title, desc, color = 'text-orange-400' }) => (
  <div className="flex gap-3 items-start">
    <span className={`h-6 w-6 rounded-full bg-orange-500/10 border border-orange-500/30 text-[10px] font-bold flex items-center justify-center shrink-0 ${color}`}>{num}</span>
    <div>
      <p className="text-xs font-semibold text-white">{title}</p>
      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{desc}</p>
    </div>
  </div>
);

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono ${color}`}>{label}</span>
);

export const UserGuide: React.FC = () => {
  return (
    <Layout title="User Guide">
      <div className="space-y-6 text-xs sm:text-sm max-w-4xl">

        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-600/10 to-amber-500/5 border border-orange-500/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <BookOpen size={28} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-mono uppercase tracking-wider">FleetCommand User Guide</h2>
              <p className="text-[11px] text-zinc-400 font-mono mt-1">Complete reference for the FleetCommand Operations Control System — role-based workflows, approval pipelines, and fuel management</p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <Section title="Getting Started" icon={<Info size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            FleetCommand is a logistics operations platform for managing heavy machinery fleets, driver personnel, cargo dispatch, maintenance, and fuel token requisitions. Each user has a role-based view — the sidebar only shows modules you have permission to access.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 text-center">
              <LogOut size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-white font-mono">Login</p>
              <p className="text-[9px] text-zinc-500 mt-1">Use credentials provided by your Administrator</p>
            </div>
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 text-center">
              <Search size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-white font-mono">Navigate</p>
              <p className="text-[9px] text-zinc-500 mt-1">Use the sidebar to access your assigned modules</p>
            </div>
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 text-center">
              <CheckCircle size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-white font-mono">Act</p>
              <p className="text-[9px] text-zinc-500 mt-1">Perform actions based on your role permissions</p>
            </div>
          </div>
        </Section>

        {/* Roles & Permissions */}
        <Section title="User Roles & Permissions" icon={<ShieldAlert size={16} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono border border-zinc-800 rounded-lg">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60">
                  <th className="p-2 text-zinc-400 font-bold">Role</th>
                  <th className="p-2 text-zinc-400 font-bold">Key Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-orange-400 font-bold">Administrator</td><td className="p-2 text-zinc-300">Full access — all modules, user management, settings, final approval</td></tr>
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-sky-400 font-bold">Manager</td><td className="p-2 text-zinc-300">Operations oversight, final approval of fuel requisitions</td></tr>
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-amber-400 font-bold">Accounts</td><td className="p-2 text-zinc-300">Edit fuel quantities, final approval of requisitions, financial modules</td></tr>
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-purple-400 font-bold">Treasurer</td><td className="p-2 text-zinc-300">First reviewer of fuel requisitions, financial modules</td></tr>
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-zinc-300 font-bold">Driver</td><td className="p-2 text-zinc-300">Create fuel requests, view own fleet, jobs, maintenance</td></tr>
                <tr className="hover:bg-zinc-950/30"><td className="p-2 text-zinc-400 font-bold">Attendant</td><td className="p-2 text-zinc-300">Fuel token redemption console only</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Sidebar Navigation */}
        <Section title="Sidebar Navigation" icon={<Menu size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            The sidebar displays modules based on your role. Click any item to navigate. The active page is highlighted with an orange left border. Use the hamburger menu <Menu size={12} className="inline" /> on mobile to toggle the sidebar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {[
              { icon: <LayoutDashboard size={14} />, label: 'Dashboard', desc: 'Executive summary KPI overview', color: 'text-zinc-300' },
              { icon: <Radio size={14} />, label: 'Dispatch', desc: 'Assign jobs to drivers & trucks', color: 'text-zinc-300' },
              { icon: <Briefcase size={14} />, label: 'Jobs', desc: 'Create and manage transport orders', color: 'text-zinc-300' },
              { icon: <Truck size={14} />, label: 'Fleet', desc: 'Register and track heavy machinery', color: 'text-zinc-300' },
              { icon: <Users size={14} />, label: 'Drivers', desc: 'Driver personnel records', color: 'text-zinc-300' },
              { icon: <Wrench size={14} />, label: 'Maintenance', desc: 'Service bay work orders', color: 'text-zinc-300' },
              { icon: <Fuel size={14} />, label: 'Fuel Tracking', desc: 'Fuel logs, prepaid balance, top-ups', color: 'text-zinc-300' },
              { icon: <FileText size={14} />, label: 'Requisitions Pipeline', desc: 'Fuel token request & approval workflow', color: 'text-zinc-300' },
              { icon: <Landmark size={14} />, label: 'Fuel Redemption', desc: 'Attendant token verification & pump dispensing', color: 'text-zinc-300' },
              { icon: <FileText size={14} />, label: 'Reports', desc: 'Downloadable PDF & CSV reports', color: 'text-zinc-300' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5">
                <span className="text-orange-400">{item.icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-white font-mono">{item.label}</p>
                  <p className="text-[8px] text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Fuel Requisition Approval Pipeline */}
        <Section title="Fuel Requisition Approval Pipeline" icon={<FileText size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Fuel requisitions go through a 2-stage approval workflow. Each stage must be completed by the designated role before the next stage unlocks.
          </p>

          <div className="relative mt-4">
            {/* Pipeline visual */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 sm:rounded-r-none">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <Clock size={12} className="text-yellow-400" />
                  </div>
                  <div>
                    <Badge label="Pending" color="bg-yellow-500/10 text-yellow-500" />
                    <p className="text-[9px] text-zinc-500 mt-0.5">Requisition created, awaiting action</p>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 hidden sm:block" />
              <ArrowRight size={16} className="text-zinc-600 sm:hidden rotate-90 mx-auto" />
              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 sm:rounded-none sm:border-l-0 sm:border-r-0">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Eye size={12} className="text-blue-400" />
                  </div>
                  <div>
                    <Badge label="1st: Treasurer Review" color="bg-blue-500/10 text-blue-400" />
                    <p className="text-[9px] text-zinc-500 mt-0.5">Treasurer reviews and marks as Reviewed</p>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-600 hidden sm:block" />
              <ArrowRight size={16} className="text-zinc-600 sm:hidden rotate-90 mx-auto" />
              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 sm:rounded-l-none">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <ThumbsUp size={12} className="text-emerald-400" />
                  </div>
                  <div>
                    <Badge label="Final: Accounts/Manager" color="bg-emerald-500/10 text-emerald-400" />
                    <p className="text-[9px] text-zinc-500 mt-0.5">Accounts or Manager approves, token generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <p className="text-[10px] font-bold text-white font-mono uppercase">How to create a fuel request:</p>
            <Step num="1" title="Navigate to Requisitions Pipeline" desc="Click 'Requisitions Pipeline' in the sidebar" />
            <Step num="2" title="Click 'New Request'" desc="Fill in truck, driver, litres, fuel type, and branch" />
            <Step num="3" title="Submit" desc="Request appears as Pending — wait for Treasurer review" />
            <Step num="4" title="Track Progress" desc="Status shows who is currently responsible (Treasurer → Accounts/Manager)" />
            <Step num="5" title="Redeem" desc="Once Approved, use the 6-digit token at the fuel station. Attendant enters it on the Fuel Redemption page." />
          </div>
        </Section>

        {/* Quick Fuel Request */}
        <Section title="Quick Fuel Request (Dashboard)" icon={<Droplet size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            The Quick Fuel Request form on the Requisitions Pipeline page allows fast submission of fuel requests. Select a branch, destination, license plate, fuel type (Diesel/Petrol), litres, and add a purpose note.
          </p>
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 mt-2">
            <p className="text-[10px] text-orange-400 font-mono font-bold">TIP: <span className="text-zinc-300 font-normal">The 'Edit Qty' button (visible to Accounts) lets you adjust litres and cost on Pending or Reviewed requisitions before they reach the Director.</span></p>
          </div>
        </Section>

        {/* Fuel Redemption Console */}
        <Section title="Fuel Redemption (Attendant)" icon={<Landmark size={16} />}>
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
              The Mineazy Fuel Redemption view is for Attendants at fuel stations. Enter the 6-digit token from the approved voucher to verify and dispense fuel.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
                <p className="text-[10px] font-bold text-white font-mono mb-2">Redemption Steps:</p>
                <div className="space-y-2">
                  <Step num="1" title="Enter Token" desc="Type the 6-digit code from the approved voucher" color="text-yellow-400" />
                  <Step num="2" title="Verify Details" desc="Check truck, driver, volume, and cost match" color="text-yellow-400" />
                  <Step num="3" title="Enter Actuals" desc="Input actual litres dispensed, cost, and odometer reading" color="text-yellow-400" />
                  <Step num="4" title="Select Station" desc="Choose from the dropdown or add a new station" color="text-yellow-400" />
                  <Step num="5" title="Dispense" desc="Click the button to complete the transaction" color="text-yellow-400" />
                </div>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
                <p className="text-[10px] font-bold text-white font-mono mb-2">Prepaid Balance:</p>
                <p className="text-[10px] text-zinc-300 font-mono">The top KPI card shows the prepaid fuel balance remaining in the company account. Diesel and Petrol balances are displayed separately. When fuel is redeemed, the balance is automatically deducted.</p>
                <div className="flex gap-3 mt-2">
                  <div className="flex-1 bg-blue-500/5 border border-blue-500/20 rounded p-2 text-center">
                    <p className="text-[8px] text-zinc-500 font-mono">Diesel</p>
                    <p className="text-xs font-bold text-blue-400 font-mono">(live)</p>
                  </div>
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded p-2 text-center">
                    <p className="text-[8px] text-zinc-500 font-mono">Petrol</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono">(live)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Fuel Tracking */}
        <Section title="Fuel Tracking & Prepaid Top-Up" icon={<Fuel size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            The Fuel Tracking page shows a live dashboard of diesel and petrol prepaid balances. Financial users (Treasurer, Accounts) can top up the prepaid balance, which records a transaction in the history table below.
          </p>
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2 text-[10px]">
              <ArrowUp size={12} className="text-emerald-400" />
              <span className="text-zinc-300 font-mono"><span className="text-emerald-400 font-bold">Top-Up</span> — Add prepaid fuel balance</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-1">
              <ArrowDown size={12} className="text-red-400" />
              <span className="text-zinc-300 font-mono"><span className="text-red-400 font-bold">Deduction</span> — Automatically logged when fuel is redeemed</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-1">
              <ArrowUpDown size={12} className="text-orange-400" />
              <span className="text-zinc-300 font-mono"><span className="text-orange-400 font-bold">Usage</span> — Manual fuel usage entries</span>
            </div>
          </div>
        </Section>

        {/* Fleet Management */}
        <Section title="Fleet & Driver Management" icon={<Truck size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] font-bold text-white font-mono mb-2">Fleet Page</p>
              <p className="text-[10px] text-zinc-300 font-mono">Register new trucks (heavy/light), assign drivers, track mileage and service intervals. The category filter lets you view Heavy vs Light vehicles.</p>
            </div>
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] font-bold text-white font-mono mb-2">Drivers Page</p>
              <p className="text-[10px] text-zinc-300 font-mono">Register driver personnel, assign to trucks, track trip count and safety ratings. Drivers can view their own profile.</p>
            </div>
          </div>
        </Section>

        {/* Maintenance */}
        <Section title="Maintenance" icon={<Wrench size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Schedule and track maintenance work orders. Each order has a priority (High/Medium/Low) and status (Scheduled/In Progress/Completed). High priority items show a badge on the sidebar.
          </p>
        </Section>

        {/* Jobs & Dispatch */}
        <Section title="Jobs & Dispatch" icon={<Radio size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Create transport orders in the Jobs module with cargo details, origin/destination, weight, and income. In the Dispatch view, assign jobs to drivers and trucks to move them to 'In Transit'.
          </p>
        </Section>

        {/* Reports */}
        <Section title="Reports" icon={<FileText size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Click the 'Generate Report' button in the top bar to download a CSV report for the current module. The Reports page offers PDF downloads for Dispatch, Jobs, Drivers, Fleet, Maintenance, Fuel, and Requisitions.
          </p>
        </Section>

        {/* Profile */}
        <Section title="Profile & Password Change" icon={<UserIcon size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Your Profile page shows your account details and activity log. Use the 'Security & Password' section to change your password (current password required).
          </p>
        </Section>

        {/* User Management */}
        <Section title="User Management (Admin Only)" icon={<Users size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Administrators can create new users, suspend/reactivate accounts, change roles, and delete suspended users. New users receive a default password set by the Admin.
          </p>
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 mt-2">
            <p className="text-[10px] text-orange-400 font-mono font-bold">NOTE: <span className="text-zinc-300 font-normal">Suspended users can be restored (status changes to Verified) or permanently deleted from the system.</span></p>
          </div>
        </Section>

        {/* Settings */}
        <Section title="Settings (Admin Only)" icon={<SettingsIcon size={16} />}>
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
            Configure the app theme (Slate/Blue/Emerald/Crimson), custom logo text and emoji, and manage branch depot locations used throughout the system.
          </p>
        </Section>

        {/* Keyboard Shortcuts / Tips */}
        <Section title="Tips & Best Practices" icon={<Star size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5">
              <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Hash size={10} className="text-orange-400" />
              </div>
              <p className="text-[10px] text-zinc-300 font-mono"><span className="text-white font-bold">Tokens</span> — 6-digit codes are generated upon Accounts/Manager approval. Only the requestor can see the token on the Approved requisition.</p>
            </div>
            <div className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5">
              <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Download size={10} className="text-orange-400" />
              </div>
              <p className="text-[10px] text-zinc-300 font-mono"><span className="text-white font-bold">PDF</span> — Approved requisitions can be downloaded as PDF by the requestor for physical record-keeping.</p>
            </div>
            <div className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5">
              <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={10} className="text-orange-400" />
              </div>
              <p className="text-[10px] text-zinc-300 font-mono"><span className="text-white font-bold">Notifications</span> — The bell icon shows counts for critical maintenance, pending dispatch, and workshop warnings.</p>
            </div>
            <div className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5">
              <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Printer size={10} className="text-orange-400" />
              </div>
              <p className="text-[10px] text-zinc-300 font-mono"><span className="text-white font-bold">Reports</span> — Use 'Generate Report' in the top bar for instant CSV export of the current module's data.</p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[9px] text-zinc-600 font-mono">FleetCommand Operations Control System v2.3 &mdash; &copy; 2026 Mineazy Logistics</p>
        </div>

      </div>
    </Layout>
  );
};
