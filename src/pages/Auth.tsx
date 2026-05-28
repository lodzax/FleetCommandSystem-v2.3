import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Shield, Key, Mail, User, Radio, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const { users, addUser, activeUser, setActiveUser } = useFleet();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Director' | 'Fleet Manager' | 'Dispatch Manager' | 'Driver'>('Driver');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!matched) {
      setError('Invalid email or password combination.');
      return;
    }
    
    if (matched.status === 'Suspended') {
      setError('Your account access has been suspended by an administrator.');
      return;
    }

    // Set active user
    setActiveUser(matched);
    setSuccess(`Welcome back, ${matched.name}!`);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Please fill in all registration fields.');
      return;
    }

    // Check if email already exists
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      setError('Email address is already registered in the operations center.');
      return;
    }

    // Create pending user account
    const newUser = {
      name,
      email,
      role,
      status: 'Pending' as const, // Awaiting admin approval
      memberSince: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      password
    };

    addUser(newUser);
    
    // Find newly added user to log in automatically
    setTimeout(() => {
      const storedUsersStr = localStorage.getItem('fc_users');
      if (storedUsersStr) {
        const storedUsers = JSON.parse(storedUsersStr);
        const added = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (added) {
          setActiveUser(added);
          setSuccess('Account created! Awaiting administrator validation approval.');
        }
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#090b14] text-zinc-100 flex items-center justify-center p-4">
      {/* Glow Effect Accents */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl rounded-b-none pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl rounded-t-none pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d1120] border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden p-8 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="h-10 w-10 bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto rounded flex items-center justify-center text-[#0d1222] font-black text-xl shadow-lg shadow-orange-600/10">
            🚛
          </div>
          <h2 className="text-lg font-black tracking-widest text-orange-500 font-mono uppercase">FLEETCOMMAND</h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Operations Registry Portal</p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="grid grid-cols-2 bg-[#060914] p-1 rounded-lg border border-zinc-950">
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`py-2 text-xs font-bold font-mono tracking-wider rounded-md transition-all cursor-pointer ${
              !isSignUp ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LOG IN
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`py-2 text-xs font-bold font-mono tracking-wider rounded-md transition-all cursor-pointer ${
              isSignUp ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Message indicators */}
        {error && (
          <p className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded text-red-400 text-xs font-mono font-bold">
            ⚠ {error}
          </p>
        )}
        {success && (
          <div className="p-3 bg-emerald-500/10 border-l-2 border-emerald-500 rounded text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* FORMS */}
        {!isSignUp ? (
          // Log In Form
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Console Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@fleetcommand.co.zw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-200 pl-9 font-mono"
                />
                <Mail className="absolute left-3 top-3 text-zinc-600" size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Staff Security Key</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-200 pl-9 font-mono"
                />
                <Key className="absolute left-3 top-3 text-zinc-600" size={14} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold text-xs tracking-widest font-mono rounded-lg transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>ACCESS CONTROL DESK</span>
              <ArrowRight size={14} />
            </button>
            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-500 font-mono">Precoded logins: admin email + <span className="text-orange-400">password</span></p>
            </div>
          </form>
        ) : (
          // Sign Up Form
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Your Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Tadiwa Magora"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-200 pl-9"
                />
                <User className="absolute left-3 top-3 text-zinc-600" size={14} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Console Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@fleetcommand.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-200 pl-9 font-mono"
                  />
                  <Mail className="absolute left-3 top-3 text-zinc-600" size={14} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Create Security Key</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Choose password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-200 pl-9 font-mono"
                />
                <Key className="absolute left-3 top-3 text-zinc-600" size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Assigned Corporate Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-[#060914] border border-zinc-900 focus:border-orange-500/55 p-2.5 rounded text-xs outline-none text-zinc-300 pl-9 cursor-pointer font-mono"
                >
                  <option value="Director">Director (Executive Access)</option>
                  <option value="Fleet Manager">Fleet Manager (Machinery & Operators)</option>
                  <option value="Dispatch Manager">Dispatch Manager (Transit & Routes)</option>
                  <option value="Driver">Driver (Operational Hauler Personnel)</option>
                </select>
                <Shield className="absolute left-3 top-3 text-zinc-600" size={14} />
              </div>
            </div>

            <div className="bg-[#060914] p-3 rounded border border-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-500 flex items-start gap-2">
              <Lock size={12} className="text-orange-500 shrink-0 mt-0.5" />
              <span>
                Safety Lock: Fresh operational roles register in <span className="text-orange-400 font-bold">Pending status</span> and are locked out of secure channels. Access unlocks once verified by an Admin.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold text-xs tracking-widest font-mono rounded-lg transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>SUBMIT REGISTRY APPLICATION</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
