import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Key, Mail, User, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { api, setToken } from '../api';
import logoImg from '../../assets/logo.png';
import toast from 'react-hot-toast';

export const Auth: React.FC = () => {
  const { users, addUser, activeUser, setActiveUser } = useFleet();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Try API login first
      const result = await api.login(email, password);
      if (result.success && result.user) {
        setToken(result.token);
        setActiveUser(result.user);
        toast.success(`Welcome back, ${result.user.name}!`);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Only fall back to local state on network error, not on invalid credentials
      if (err instanceof TypeError) {
        // Network error — API unreachable, try local fallback
        const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!matched) {
          toast.error('Invalid email or password');
          setLoading(false);
          return;
        }
        if (matched.status === 'Suspended') {
          toast.error('Account suspended by administrator');
          setLoading(false);
          return;
        }
        // Warn user that writes won't sync to server
        toast('Offline mode — data will sync when server is available', { icon: '⚠️' });
        setActiveUser(matched);
        setLoading(false);
        return;
      }
      // API returned an error (invalid credentials, server error, etc.)
      toast.error('Invalid email or password');
      setLoading(false);
      return;
    }

    // API login succeeded but returned success:false (shouldn't normally happen)
    toast.error('Invalid email or password');
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Check duplicate email locally first
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      toast.error('Email already registered');
      setLoading(false);
      return;
    }

    try {
      // Try API signup (role is assigned by admin, default to Driver)
      const result = await api.signup(name, email, password, 'Driver');
      // Auto-login via API after successful signup
      try {
        const loginResult = await api.login(email, password);
        if (loginResult.success && loginResult.user) {
          setToken(loginResult.token);
          setActiveUser(loginResult.user);
          setLoading(false);
          return; // App.tsx will show PendingVerification
        }
      } catch {
        // Login after signup failed — stay on auth page with success message
      }
      toast.success(result.message || 'Registration submitted! Pending admin approval.');
      setName('');
      setEmail('');
      setPassword('');
      setIsSignUp(false);
      setLoading(false);
      return;
    } catch {
      // API unavailable — fall back to local
    }

    const newUserId = `usr-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name,
      email,
      role: 'Driver' as const,
      status: 'Pending' as const,
      memberSince: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      password
    };

    addUser(newUser);
    setActiveUser(newUser);
    setLoading(false);
    // App.tsx will now show PendingVerification
  };

  return (
    <div className="min-h-screen bg-[#090b14] text-zinc-100 flex items-center justify-center p-4">
      {/* Glow Effect Accents */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl rounded-b-none pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl rounded-t-none pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d1120] border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden p-8 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <img src={logoImg} alt="Logo" className="h-12 mx-auto" />
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Operations Registry Portal</p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="grid grid-cols-2 bg-[#060914] p-1 rounded-lg border border-zinc-950">
          <button
            onClick={() => setIsSignUp(false)}
            className={`py-2 text-xs font-bold font-mono tracking-wider rounded-md transition-all cursor-pointer ${
              !isSignUp ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LOG IN
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`py-2 text-xs font-bold font-mono tracking-wider rounded-md transition-all cursor-pointer ${
              isSignUp ? 'bg-orange-600 text-black shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SIGN UP
          </button>
        </div>

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
                  placeholder="email@example.com"
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
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold text-xs tracking-widest font-mono rounded-lg transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">AUTHENTICATING...</span> : <><span>ACCESS CONTROL DESK</span><ArrowRight size={14} /></>}
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
                  placeholder="Full name"
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
                    placeholder="email@example.com"
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

            <div className="bg-[#060914] p-3 rounded border border-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-500 flex items-start gap-2">
              <Lock size={12} className="text-orange-500 shrink-0 mt-0.5" />
              <span>
                Your account will be registered in <span className="text-orange-400 font-bold">Pending status</span>. An administrator will assign your role and verify your access.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-extrabold text-xs tracking-widest font-mono rounded-lg transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">REGISTERING...</span> : <><span>SUBMIT REGISTRY APPLICATION</span><ArrowRight size={14} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
