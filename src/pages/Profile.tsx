import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { api } from '../api';
import { Layout } from '../components/NavigationSidebar';
import { UserRole } from '../types';
import { 
  User, Shield, Activity, Users, Settings, LogOut, CheckCircle, 
  HelpCircle, Trash, Ban, Mail, RadioTower, Globe, ShieldAlert, Sparkles, X, Plus, KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { 
    activeUser, users, activities, updateUserRole, revokeUser, addUser, setActiveUser
  } = useFleet();

  const [activeSubTab, setActiveSubTab] = useState<'details' | 'logs'>('details');
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

              {/* PASSWORD CHANGE */}
              <div className="bg-zinc-950/20 border border-zinc-850/60 p-5 rounded-lg space-y-4 mt-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <KeyRound size={14} className="text-orange-500" />
                    Security & Password
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Update your login password.</p>
                </div>
                <PasswordChangeForm />
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
                  <p className="text-zinc-500 font-mono italic">No activity records found.</p>
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

        </div>

      </div>

    </Layout>
  );
};

const PasswordChangeForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Current Password</label>
        <input type="password" required value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-xs" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">New Password</label>
        <input type="password" required value={newPassword} minLength={6}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-xs" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Confirm New Password</label>
        <input type="password" required value={confirmPassword} minLength={6}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-xs" />
      </div>
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold font-mono text-[10.5px] rounded transition-all shadow-lg shadow-orange-500/5 cursor-pointer disabled:opacity-50">
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};
