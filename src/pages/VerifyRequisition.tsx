import React from 'react';
import { useFleet } from '../context/FleetContext';
import { CheckCircle, XCircle, Shield, Hash, Calendar, User2, Fuel, Building2, FileText, Truck } from 'lucide-react';

export const VerifyRequisition: React.FC = () => {
  const { fuelRequisitions } = useFleet();

  const getHashParam = (name: string): string => {
    const hash = window.location.hash;
    const idx = hash.indexOf('?');
    if (idx === -1) return '';
    const query = hash.substring(idx + 1);
    const params = new URLSearchParams(query);
    return decodeURIComponent(params.get(name) || '');
  };

  const reqId = getHashParam('id');
  const approvedBy = getHashParam('approvedBy');
  const approvedDate = getHashParam('date');
  const redeemToken = getHashParam('token');

  const requisition = fuelRequisitions.find(r => r.id === reqId);

  const isValid = !!(
    requisition &&
    requisition.status === 'Approved' &&
    requisition.redeemToken === redeemToken
  );

  const isRedeemed = requisition?.status === 'Redeemed';

  return (
    <div className="min-h-screen bg-[#0c0f1a] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 text-xs sm:text-sm">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="h-10 w-10 bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto rounded flex items-center justify-center text-[#0d1222] font-black text-lg shadow-lg">
            🚛
          </div>
          <h1 className="text-sm font-black tracking-widest text-orange-500 font-mono uppercase mt-2">FLEETCOMMAND</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Digital Verification System</p>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-6 rounded-xl border ${
          isValid ? 'bg-emerald-500/5 border-emerald-500/30' : 
          isRedeemed ? 'bg-amber-500/5 border-amber-500/30' :
          'bg-red-500/5 border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {isValid ? (
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
            ) : isRedeemed ? (
              <div className="h-12 w-12 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
                <Shield size={28} className="text-amber-400" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                <XCircle size={28} className="text-red-400" />
              </div>
            )}
            <div>
              <h2 className={`text-lg font-black font-mono uppercase tracking-wider ${
                isValid ? 'text-emerald-400' : isRedeemed ? 'text-amber-400' : 'text-red-400'
              }`}>
                {isValid ? 'Digitally Verified' : isRedeemed ? 'Voucher Redeemed' : 'Verification Failed'}
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                {isValid 
                  ? 'This fuel requisition voucher is authentic and approved.' 
                  : isRedeemed
                  ? 'This voucher has already been redeemed and is no longer valid.'
                  : !requisition 
                  ? `Requisition ${reqId || 'unknown'} not found in the system.`
                  : requisition.status === 'Rejected'
                  ? 'This requisition was rejected.'
                  : requisition.status === 'Pending'
                  ? 'This requisition is still pending review.'
                  : requisition.status === 'Reviewed'
                  ? 'This requisition has been reviewed but is awaiting final approval.'
                  : 'The verification data does not match an active approved requisition.'}
              </p>
            </div>
          </div>
        </div>

        {/* Requisition Details */}
        {requisition && (
          <div className="bg-[#101424] border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText className="text-orange-400" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">Requisition Voucher Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Hash size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Requisition ID</span>
                </div>
                <p className="text-sm font-bold font-mono text-orange-400">{reqId}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Approval Date</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{approvedDate}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <User2 size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Approved By</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{approvedBy}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Redeem Token</span>
                </div>
                <p className="text-sm font-bold font-mono tracking-widest text-yellow-400">{redeemToken}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Fuel size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Fuel Type</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{requisition.fuelType || '-'}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Branch / Depot</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{requisition.branchName || requisition.branchId || '-'}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Truck size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Truck Asset</span>
                </div>
                <p className="text-sm font-bold font-mono text-white uppercase">{requisition.truckPlate || requisition.truckId}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <User2 size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Driver / Pilot</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{requisition.driverName || requisition.driverId}</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Fuel size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Requested Volume</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">{requisition.litresRequested} Litres</p>
              </div>

              <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield size={12} className="text-orange-400" />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Estimated Cost</span>
                </div>
                <p className="text-sm font-bold font-mono text-white">${requisition.estimatedCost.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-850">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={12} className="text-orange-400" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Purpose / Note</span>
              </div>
              <p className="text-sm font-mono text-zinc-300">{requisition.purpose}</p>
            </div>
          </div>
        )}

        {/* Verification Footer */}
        <div className="bg-[#101424] border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-zinc-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Digital Verification Record</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Status</p>
              <p className={`text-xs font-bold font-mono ${isValid ? 'text-emerald-400' : isRedeemed ? 'text-amber-400' : 'text-red-400'}`}>
                {isValid ? 'PASSED' : isRedeemed ? 'EXPIRED' : 'FAILED'}
              </p>
            </div>
            <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Timestamp</p>
              <p className="text-xs font-bold font-mono text-zinc-300">{new Date().toLocaleString()}</p>
            </div>
            <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Signed By</p>
              <p className="text-xs font-bold font-mono text-white">{approvedBy || '-'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
