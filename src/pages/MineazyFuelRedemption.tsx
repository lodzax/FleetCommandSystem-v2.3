import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { 
  Landmark, Droplet, CreditCard
} from 'lucide-react';
import { FuelRequisition } from '../types';

export const MineazyFuelRedemption: React.FC = () => {
  const { fuelRequisitions, redeemRequisition } = useFleet();

  const [verifyToken, setVerifyToken] = useState('');
  const [matchedReq, setMatchedReq] = useState<FuelRequisition | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  
  const [gasStationName, setGasStationName] = useState('Puma Energy Cadoma');
  const [actualLitres, setActualLitres] = useState(200);
  const [actualCost, setActualCost] = useState(4400);
  const [attendantSig, setAttendantSig] = useState('');

  const handleVerifyTokenInput = (tokenStr: string) => {
    setVerifyToken(tokenStr);
    setRedeemError('');
    if (tokenStr.trim().length === 6) {
      const match = fuelRequisitions.find(r => r.redeemToken === tokenStr.trim());
      if (match) {
        if (match.status === 'Redeemed') {
          setRedeemError(`Voucher token ${tokenStr} was already redeemed on ${match.redeemDate} at ${match.redeemedByGasStation}`);
          setMatchedReq(null);
        } else if (match.status === 'Rejected') {
          setRedeemError(`Voucher token ${tokenStr} was rejected by head office`);
          setMatchedReq(null);
        } else if (match.status === 'Pending') {
          setRedeemError(`Voucher token ${tokenStr} is still Pending admin review`);
          setMatchedReq(null);
        } else if (match.status === 'Reviewed') {
          setRedeemError(`Voucher token ${tokenStr} has been reviewed but is awaiting final Treasurer/Director approval`);
          setMatchedReq(null);
        } else {
          setMatchedReq(match);
          setActualLitres(match.litresRequested);
          setActualCost(match.estimatedCost);
        }
      } else {
        setRedeemError('No active voucher found matching token');
        setMatchedReq(null);
      }
    } else {
      setMatchedReq(null);
    }
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedReq) return;
    if (!gasStationName || !attendantSig) {
      setRedeemError("Please enter the Gas Station Name and sign the attendant signature.");
      return;
    }

    redeemRequisition(matchedReq.id, {
      redeemedByGasStation: gasStationName,
      redeemedAttendantSignature: attendantSig,
      redeemedActualLitres: actualLitres,
      redeemedActualCost: actualCost
    });

    setRedeemSuccess(`Successfully verified token & preloaded ${actualLitres}L of fuel into Truck!`);
    setTimeout(() => {
      setRedeemSuccess(null);
    }, 5000);
    
    setVerifyToken('');
    setMatchedReq(null);
    setAttendantSig('');
  };

  const redeemedDiesel = fuelRequisitions.filter(r => r.status === 'Redeemed' && (r.fuelType === 'Diesel' || !r.fuelType));
  const redeemedPetrol = fuelRequisitions.filter(r => r.status === 'Redeemed' && r.fuelType === 'Petrol');
  const totalRedeemedDiesel = redeemedDiesel.reduce((sum, r) => sum + (r.redeemedActualLitres || r.litresRequested), 0);
  const totalRedeemedPetrol = redeemedPetrol.reduce((sum, r) => sum + (r.redeemedActualLitres || r.litresRequested), 0);
  const approvedDiesel = fuelRequisitions.filter(r => (r.status === 'Approved' || r.status === 'Redeemed') && (r.fuelType === 'Diesel' || !r.fuelType));
  const approvedPetrol = fuelRequisitions.filter(r => (r.status === 'Approved' || r.status === 'Redeemed') && r.fuelType === 'Petrol');
  const totalApprovedDiesel = approvedDiesel.reduce((sum, r) => sum + r.litresRequested, 0);
  const totalApprovedPetrol = approvedPetrol.reduce((sum, r) => sum + r.litresRequested, 0);
  const fuelBalanceDiesel = totalApprovedDiesel - totalRedeemedDiesel;
  const fuelBalancePetrol = totalApprovedPetrol - totalRedeemedPetrol;

  return (
    <Layout title="Mineazy Fuel Redemption">
      <div className="space-y-6 text-xs sm:text-sm">

        {/* KPI METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">REDEEMED VOUCHERS</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{(redeemedDiesel.length + redeemedPetrol.length).toLocaleString()}</p>
                <p className="text-[10px] text-zinc-450 font-mono">vouchers physically fueled</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="flex gap-4 text-[11px] font-mono border-t border-zinc-800 pt-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-zinc-400">Diesel:</span>
                <span className="text-white font-bold">{redeemedDiesel.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-zinc-400">Petrol:</span>
                <span className="text-white font-bold">{redeemedPetrol.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">TOTAL FUEL VOLUME</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{(totalRedeemedDiesel + totalRedeemedPetrol).toLocaleString()} L</p>
                <p className="text-[10px] text-zinc-450 font-mono">cumulative litres dispensed</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Droplet size={16} />
              </div>
            </div>
            <div className="flex gap-4 text-[11px] font-mono border-t border-zinc-800 pt-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-zinc-400">Diesel:</span>
                <span className="text-white font-bold">{totalRedeemedDiesel.toLocaleString()} L</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-zinc-400">Petrol:</span>
                <span className="text-white font-bold">{totalRedeemedPetrol.toLocaleString()} L</span>
              </div>
            </div>
          </div>

          <div className="bg-[#101424] border border-zinc-808 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">BALANCE REMAINING</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{(fuelBalanceDiesel + fuelBalancePetrol).toLocaleString()} L</p>
                <p className="text-[10px] text-zinc-450 font-mono">approved fuel yet to dispense</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Landmark size={16} />
              </div>
            </div>
            <div className="flex gap-4 text-[11px] font-mono border-t border-zinc-800 pt-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-zinc-400">Diesel:</span>
                <span className="text-white font-bold">{fuelBalanceDiesel.toLocaleString()} L</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-zinc-400">Petrol:</span>
                <span className="text-white font-bold">{fuelBalancePetrol.toLocaleString()} L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline feedback notifications */}
        {redeemSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-mono shadow-md">
            <span className="font-extrabold text-sm">✔</span>
            <span>{redeemSuccess}</span>
          </div>
        )}

        {/* VOUCHER REDEMPTION CONSOLE */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl space-y-4 max-w-2xl w-full">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Landmark className="text-orange-400" size={16} />
            <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase">Voucher Redemption Console</h4>
          </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Verify 6-Digit Fuel Token</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyToken}
                  onChange={(e) => handleVerifyTokenInput(e.target.value)}
                  placeholder="Enter e.g. 6428135"
                  className="w-full tracking-widest text-center bg-zinc-950 border border-zinc-800 rounded py-2 text-sm font-bold font-mono text-yellow-400 focus:outline-none focus:border-orange-500 animate-pulse"
                />
                {redeemError && (
                  <p className="text-[10px] text-red-400 mt-1.5 font-mono">{redeemError}</p>
                )}
              </div>

              {matchedReq ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded space-y-3">
                  <div className="flex justify-between text-[11px] border-b border-zinc-900 pb-1.5">
                    <span className="text-emerald-400 font-mono font-bold">✔ VALID FUEL VOUCHER</span>
                    <span className="text-zinc-450 font-mono">{matchedReq.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-zinc-300 font-mono">
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Operated Truck ID</span>
                      <p className="text-white uppercase font-bold text-xs">{matchedReq.truckPlate}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Authorized Driver</span>
                      <p className="text-white font-bold text-xs">{matchedReq.driverName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Approved Volume</span>
                      <p className="text-orange-400 font-bold text-xs">{matchedReq.litresRequested} Litres</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Estimated Cost</span>
                      <p className="text-indigo-400 font-bold text-xs">${matchedReq.estimatedCost}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Requisition Date</span>
                      <p className="text-white font-bold text-xs">{matchedReq.fuelDate || matchedReq.dateRequested}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Fuel Type</span>
                      <p className="text-white font-bold text-xs">{matchedReq.fuelType || 'Diesel'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase font-bold text-[9px]">Branch Depot</span>
                      <p className="text-white font-bold text-xs">{matchedReq.branchName || matchedReq.branchId || '-'}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-455 bg-zinc-950/40 p-2 rounded">
                    <span className="font-semibold text-zinc-550 italic">Purpose Note:</span> {matchedReq.purpose}
                  </div>

                  {matchedReq.qrCodeData && (
                    <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded border border-zinc-800">
                      <img 
                        src={matchedReq.qrCodeData} 
                        alt="Verification QR" 
                        className="w-20 h-20 rounded border border-zinc-700"
                      />
                      <div className="text-[10px] text-zinc-400 font-mono space-y-1">
                        <p className="text-orange-400 font-bold text-xs">Approver Verification QR</p>
                        <p>Approved by: <span className="text-emerald-400">{matchedReq.approvedBy}</span></p>
                        <p>Date: <span className="text-zinc-300">{matchedReq.approvedDate}</span></p>
                        <p className="text-zinc-500 text-[9px] italic">Scan to verify authenticity</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleRedeemSubmit} className="space-y-3.5 pt-2 border-t border-zinc-900">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Actual Volume (Litres)</label>
                        <input
                          type="number"
                          required
                          value={actualLitres}
                          onChange={(e) => setActualLitres(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Actual Cost (USD)</label>
                        <input
                          type="number"
                          required
                          value={actualCost}
                          onChange={(e) => setActualCost(parseInt(e.target.value) || 0)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Filling Station & Vendor Name</label>
                      <input
                        type="text"
                        required
                        value={gasStationName}
                        onChange={(e) => setGasStationName(e.target.value)}
                        placeholder="e.g. Puma Energy Cadoma"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-zinc-500 font-mono uppercase font-bold">Station Attendant Signature Confirmation</label>
                      <input
                        type="text"
                        required
                        value={attendantSig}
                        onChange={(e) => setAttendantSig(e.target.value)}
                        placeholder="e.g. Cleophas Sithole (Puma Attendant)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-white font-mono italic text-[11px]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs tracking-wider rounded cursor-pointer transition-colors mt-2 uppercase font-bold"
                    >
                      dispense fuel & charge voucher token
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center border border-zinc-800 border-dashed rounded text-zinc-650 font-mono text-xs">
                  Enter a valid 6-digit head-office approved token to unlock the fuel pump dispenser form.
                </div>
              )}
            </div>
        </div>

      </div>
    </Layout>
  );
};
