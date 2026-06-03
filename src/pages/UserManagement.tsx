import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { UserRole } from '../types';
import { 
  Users, Shield, X, Plus, CheckCircle, Ban, Clock, Trash2
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { activeUser, users, updateUserRole, revokeUser, addUser, approveUser, deleteUser } = useFleet();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Driver');

  // Per-pending-user role assignment state
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});

  const pendingUsers = users.filter(u => u.status === 'Pending');
  const verifiedUsers = users.filter(u => u.status !== 'Pending');

  const getPendingRole = (u: typeof pendingUsers[0]) => pendingRoles[u.id] || u.role;

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
    setNewUserRole('Driver');
    setShowAddModal(false);
  };

  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const handleApprove = (userId: string, role: UserRole) => {
    updateUserRole(userId, role);
    approveUser(userId);
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    deleteUser(rejectTarget.id);
    setRejectTarget(null);
  };

  return (
    <Layout title="User Management">
      <div className="space-y-6 text-xs sm:text-sm">

        {/* PENDING VERIFICATION */}
        {pendingUsers.length > 0 && (
          <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
              <Clock size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">
                Pending Verification ({pendingUsers.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-slate-950 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 font-mono">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-bold text-white text-xs truncate max-w-[140px]">{u.name}</h4>
                        <span className="px-1 rounded text-[8.5px] font-mono text-amber-400 bg-amber-500/10">Pending</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500 font-mono">Role:</span>
                      <select
                        value={getPendingRole(u)}
                        onChange={(e) => setPendingRoles(prev => ({ ...prev, [u.id]: e.target.value as UserRole }))}
                        className="bg-zinc-950 border border-amber-500/30 p-1 rounded text-[10.5px] text-zinc-200 cursor-pointer min-w-[110px]"
                      >
                        <option value="Director">Director</option>
                        <option value="Manager">Manager</option>
                        <option value="Accounts">Accounts</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Driver">Driver</option>
                        <option value="Attendant">Attendant</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApprove(u.id, getPendingRole(u))}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                      >
                        <CheckCircle size={12} />
                        <span>Verify &amp; Activate</span>
                      </button>
                      <button
                        onClick={() => setRejectTarget({ id: u.id, name: u.name })}
                        className="px-2 py-1.5 bg-red-600/10 hover:bg-red-600/25 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        title="Reject and delete registration"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REJECT CONFIRMATION MODAL */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800 mb-4">
                <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <Trash2 size={14} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-400 font-mono uppercase">Reject Registration</h3>
                  <p className="text-zinc-500 mt-0.5">This action permanently deletes the user</p>
                </div>
              </div>
              <p className="text-zinc-300 font-mono text-[11px] mb-2">
                Are you sure you want to reject and delete <span className="text-white font-bold">{rejectTarget.name}</span>'s registration?
              </p>
              <p className="text-zinc-500 font-mono text-[10px] mb-6">
                This will remove their account from the system. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 font-mono">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs shadow-lg flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Delete Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALL VERIFIED USERS */}
        <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-orange-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">
                Registered Users ({verifiedUsers.length})
              </h3>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-semibold text-xs tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
            >
              <Plus size={14} />
              <span>Add User</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifiedUsers.map(u => (
              <div key={u.id} className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-4 flex items-center justify-between gap-4">
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
                    <p className="text-[9px] text-zinc-550 font-mono">Role: {u.role}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 items-end">
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                    disabled={activeUser?.id === u.id}
                    className="bg-zinc-950 border border-zinc-850 p-1 rounded text-[10.5px] text-zinc-300 cursor-pointer text-right min-w-[110px]"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Driver">Driver</option>
                    <option value="Attendant">Attendant</option>
                  </select>

                  {u.status === 'Verified' ? (
                    <button
                      onClick={() => revokeUser(u.id)}
                      disabled={activeUser?.id === u.id}
                      className="text-[9.5px] font-mono text-red-500 border border-red-500/15 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent hover:border-red-500 p-1 rounded font-bold px-2 cursor-pointer transition-all"
                    >
                      Suspend
                    </button>
                  ) : (
                    <p className="text-[10px] text-red-500 italic font-medium font-mono uppercase">Suspended</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Register New User</h3>
                <p className="text-zinc-555 mt-1">Add a verified user to the system</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Full Name</label>
                <input type="text" required placeholder="e.g., John Mandaza" value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Email Address</label>
                <input type="email" required placeholder="e.g., john.mandaza@fleetcommand.co.zw" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Security Clearance</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 outline-none focus:border-orange-500 cursor-pointer">
                  <option value="Administrator">Administrator</option>
                  <option value="Director">Director</option>
                  <option value="Manager">Manager</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Driver">Driver</option>
                  <option value="Attendant">Attendant</option>
                </select>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded font-semibold text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg">Register User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
