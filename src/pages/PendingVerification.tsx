import React, { useEffect, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, LogOut } from 'lucide-react';

export const PendingVerification: React.FC = () => {
  const { activeUser, setActiveUser, logout, users } = useFleet();
  const navigate = useNavigate();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const checkStatus = () => {
      const updated = users.find(u => u.id === activeUser?.id);
      if (updated?.status === 'Verified') {
        setActiveUser(updated);
      }
    };
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [activeUser?.id, users, setActiveUser]);

  useEffect(() => {
    if (activeUser?.status === 'Verified') {
      if (activeUser.role === 'Attendant') {
        navigate('/redemption', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [activeUser?.status, activeUser?.role, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#090b14] text-zinc-100 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d1120] border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden p-8 relative z-10 space-y-6 text-center">
        
        <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-orange-500 mx-auto rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Clock size={32} className="text-[#0d1222]" />
        </div>

        <div>
          <h2 className="text-lg font-black tracking-widest text-amber-400 font-mono uppercase">Account Pending</h2>
          <p className="text-[11px] text-zinc-500 mt-2 font-mono tracking-wide">VERIFICATION IN PROGRESS</p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Shield size={16} />
            <span className="text-xs font-bold font-mono uppercase">Awaiting Administrator Approval</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Your account has been registered as <span className="text-white font-bold">{activeUser?.name}</span> with the role of{' '}
            <span className="text-orange-400 font-bold">{activeUser?.role}</span>. An administrator must verify your identity
            before you can access the operations control center.
          </p>
          <p className="text-[10px] text-zinc-500 italic">
            Once verified, you will be automatically redirected to your workspace{dots}
          </p>
        </div>

        <div className="bg-[#060914] border border-zinc-950 rounded-lg p-4 text-[10px] text-zinc-500 font-mono leading-relaxed">
          <p className="font-bold text-zinc-400 mb-1">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1 text-left">
            <li>An administrator reviews your registration</li>
            <li>Your account status changes to <span className="text-emerald-400">Verified</span></li>
            <li>You gain access to your role-specific views</li>
            <li>This page will automatically redirect you</li>
          </ol>
        </div>

        <button
          onClick={() => logout()}
          className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 font-mono text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Return to Login</span>
        </button>

      </div>
    </div>
  );
};
