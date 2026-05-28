import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  User, Shield, Activity, Users, Settings, LogOut, CheckCircle, 
  HelpCircle, Trash, Ban, Mail, RadioTower, Globe, ShieldAlert, Sparkles, X, Plus
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { 
    activeUser, users, activities, updateUserRole, revokeUser, addUser, setActiveUser
  } = useFleet();

  const [activeSubTab, setActiveSubTab] = useState<'details' | 'logs' | 'users'>('details');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Form states for add user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Dispatcher' | 'Maintenance Manager' | 'Operator'>('Dispatcher');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'Verified'
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Dispatcher');
    setShowAddUserModal(false);
  };

  return (
    <Layout title="Profile">
      <div className="space-y-6 text-xs sm:text-sm">
        
         {/* CARD OVERVIEW HEADER CARD */}
        <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6 flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 p-0.5 shadow-xl shadow-orange-500/10">
              {activeUser?.avatar ? (
                <img
                  src={activeUser.avatar}
                  alt={activeUser.name}
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center font-black text-xl text-orange-400 font-mono">
                  {activeUser?.name?.substring(0, 2).toUpperCase() || "US"}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-mono tracking-tight uppercase">{activeUser.name}</h2>
                <span className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono">
                  <CheckCircle size={10} /> Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{activeUser.email}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-550 font-semibold font-mono">
                <Shield size={11} className="text-orange-500" />
                <span className="text-zinc-300 uppercase tracking-widest bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">{activeUser.role}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-zinc-950/40 px-4 py-2 border border-zinc-850 rounded">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Verified Operators</span>
              <p className="text-base font-bold font-mono text-indigo-400">{users.filter(u => u.status === 'Verified').length} Active</p>
            </div>
            <div className="bg-zinc-950/40 px-4 py-2 border border-zinc-850 rounded text-right">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Action Logs Written</span>
              <p className="text-base font-bold font-mono text-orange-400">{activities.length} Entries</p>
            </div>
          </div>
        </div>

        {/* DETAILS OR LOGS OR SECURITY TABS LIST */}
        <div className="bg-[#101424] border border-zinc-805 p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('details')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'details'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <User size={14} />
              <span>Account Details</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <Activity size={14} />
              <span>Activity Log Tracker ({activities.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-[#0c0f1d] border border-zinc-850 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <Users size={14} />
              <span>User Operations Management</span>
            </button>
          </div>

          <div>
            {activeSubTab === 'users' && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer"
              >
                <Plus size={14} />
                <span>Verify Colleague</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB WORKSPACES CONTAINER */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl">
          
          {/* 1. VIEW DETAILED CREDENTIALS */}
          {activeSubTab === 'details' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-2 border-b border-zinc-800 mb-4 flex items-center gap-1.5">
                <Settings size={14} className="text-orange-500" />
                <span>ACCOUNT CLASSIFICATIONS DETAILS</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">FULL NAME LOGGED</span>
                  <p className="text-sm font-bold text-zinc-200 mt-1 font-mono">{activeUser.name}</p>
                </div>

                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">EMAIL ADDR</span>
                  <p className="text-sm font-bold text-zinc-200 mt-1 font-mono leading-none truncate">{activeUser.email}</p>
                </div>

                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">ROLE PRIVILEGE</span>
                  <p className="text-[#f97316] font-extrabold text-xs tracking-wider uppercase mt-1 font-mono">{activeUser.role}</p>
                </div>

                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">ACCOUNT STATUS</span>
                  <p className="text-emerald-400 font-bold text-xs uppercase mt-1 flex items-center gap-1 font-mono">
                    <CheckCircle size={12} /> {activeUser.status}
                  </p>
                </div>

                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">MEMBER ENROLLED SINCE</span>
                  <p className="text-sm font-bold text-zinc-300 mt-1 font-mono">{activeUser.memberSince}</p>
                </div>

                <div className="bg-zinc-950/30 p-4 border border-zinc-850 rounded">
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono font-bold">UID</span>
                  <p className="text-xs font-bold text-zinc-400 mt-1 font-mono">{activeUser.id}</p>
                </div>
              </div>

              {/* PROFILE IMAGE MANIPULATION FROM LOCAL DRIVES */}
              <div className="bg-zinc-950/20 border border-zinc-850/60 p-5 rounded-lg space-y-4 mt-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Profile Avatar Customization</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Choose an image from your local system drive to customize your operator avatar profile.</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 p-0.5 shadow-md">
                    {activeUser?.avatar ? (
                      <img
                        src={activeUser.avatar}
                        alt="Current Avatar"
                        className="h-full w-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center font-semibold text-lg text-orange-400 font-mono">
                        {activeUser?.name?.substring(0, 2).toUpperCase() || "US"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      id="local-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && activeUser) {
                              const base64Str = event.target.result as string;
                              const updatedUser = { ...activeUser, avatar: base64Str };
                              setActiveUser(updatedUser);
                              
                              const fc_users = localStorage.getItem('fc_users');
                              if (fc_users) {
                                try {
                                  const parsedUsers = JSON.parse(fc_users);
                                  const updatedUsersList = parsedUsers.map((u: any) =>
                                    u.id === activeUser.id ? { ...u, avatar: base64Str } : u
                                  );
                                  localStorage.setItem('fc_users', JSON.stringify(updatedUsersList));
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <label 
                        htmlFor="local-avatar-upload"
                        className="px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold font-mono text-[10.5px] rounded cursor-pointer transition-all inline-block shadow-lg shadow-orange-500/5 select-none"
                      >
                        📂 Select File From Local Drive
                      </label>
                      {activeUser?.avatar && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeUser) {
                              const updatedUser = { ...activeUser };
                              delete updatedUser.avatar;
                              setActiveUser(updatedUser);

                              const fc_users = localStorage.getItem('fc_users');
                              if (fc_users) {
                                try {
                                  const parsedUsers = JSON.parse(fc_users);
                                  const updatedUsersList = parsedUsers.map((u: any) => {
                                    if (u.id === activeUser.id) {
                                      const copy = { ...u };
                                      delete copy.avatar;
                                      return copy;
                                    }
                                    return u;
                                  });
                                  localStorage.setItem('fc_users', JSON.stringify(updatedUsersList));
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }
                          }}
                          className="px-3 py-2 bg-red-950/35 hover:bg-red-950/60 border border-red-900/45 text-red-400 rounded font-semibold font-mono text-[10.5px] cursor-pointer transition-colors"
                        >
                          Remove Avatar
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-550 font-mono">Supports JPG, PNG, WEBP. Max size 2MB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ACTIVITY LEDGER LOG */}
          {activeSubTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-2 border-b border-zinc-800 mb-4 flex items-center gap-1.5">
                <Activity size={14} className="text-orange-500 animate-pulse" />
                <span>OPERATIONAL LEDGER AUDIT TRAILS</span>
              </h3>

              <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-5 max-h-[500px] overflow-y-auto pr-2">
                {activities.length === 0 ? (
                  <p className="text-zinc-500 font-mono italic">No simulated action records exist inside temporary memory.</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="relative text-xs">
                      {/* Timeline dot marker */}
                      <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-orange-500 border border-[#0c0f1a]"></span>
                      
                      <div className="bg-zinc-950/30 border border-zinc-850 p-3 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 pb-1.5 border-b border-zinc-900 mb-1.5">
                          <span className="text-zinc-200 font-bold font-mono text-[11px] leading-snug">{act.action}</span>
                          <span className="text-[9.5px] text-zinc-500 font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">Operator IP: <span className="text-zinc-300 font-semibold">{act.userName}</span></p>
                        {act.details && (
                          <p className="text-[10px] text-zinc-550 mt-1">{act.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. MULTI-USER ROLES MANAGEMENT */}
          {activeSubTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono pb-2 border-b border-zinc-800 mb-4 flex items-center gap-1.5">
                <Users size={14} className="text-orange-500" />
                <span>USER MANAGEMENT OPERATIONS PANEL</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className="bg-[#171d2b] border border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-slate-950 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 font-mono">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold text-white text-xs truncate max-w-[140px]">{u.name}</h4>
                          <span className={`px-1 rounded text-[8.5px] font-mono leading-none ${
                            u.status === 'Verified' ? 'text-emerald-400 bg-emerald-500/10' :
                            'text-red-400 bg-red-500/10'
                          }`}>{u.status}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{u.email}</p>
                        <p className="text-[9px] text-zinc-550 font-mono">ID: {u.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 items-end">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                        disabled={activeUser.id === u.id} // Cannot edit own role
                        className="bg-zinc-950 border border-zinc-850 p-1 rounded text-[10.5px] text-zinc-300 cursor-pointer text-right min-w-[110px]"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Maintenance Manager">MNT Manager</option>
                        <option value="Operator">Operator</option>
                      </select>

                      {u.status === 'Verified' ? (
                        <button
                          onClick={() => revokeUser(u.id)}
                          disabled={activeUser.id === u.id} // Cannot revoke self
                          className="text-[9.5px] font-mono text-red-500 border border-red-500/15 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent hover:border-red-500 p-1 rounded font-bold px-2 cursor-pointer transition-all"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <p className="text-[10px] text-red-500 italic font-medium font-mono uppercase">Suspended Access</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* VERIFY USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Verify Colleague Access</h3>
                <p className="text-zinc-555 mt-1">Registers secure credentials and operational clearance</p>
              </div>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Personnel Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Mandaza"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., john.mandaza@fleetcommand.co.zw"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Assigned Security Clearance</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Admin">Admin (Full System clearances)</option>
                  <option value="Dispatcher">Dispatcher (Scheduling manifests)</option>
                  <option value="Maintenance Manager">Maintenance Manager (Workshop bay controls)</option>
                  <option value="Operator">Standard operator (Roster overview)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Authorize Colleague
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};
