import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { FuelRequisition } from '../types';

export const MineazyFuelRedemption: React.FC = () => {
  const { fuelRequisitions, redeemRequisition, prepaidFuelBalance, activeUser, logout } = useFleet();

  const [verifyToken, setVerifyToken] = useState('');
  const [matchedReq, setMatchedReq] = useState<FuelRequisition | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [gasStationName, setGasStationName] = useState('');
  const [actualLitres, setActualLitres] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [licensePlate, setLicensePlate] = useState('');
  const [attendantSig, setAttendantSig] = useState(() => activeUser?.name || '');
  const [gasStations, setGasStations] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fc_gasStations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return ['Glow Petroleum'];
  });
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStation, setNewStation] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const tokenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tokenRef.current?.focus();
  }, []);

  useEffect(() => {
    if (redeemSuccess) {
      const t = setTimeout(() => {
        setRedeemSuccess(null);
        setVerifyToken('');
        setMatchedReq(null);
        setActualLitres(0);
        setActualCost(0);
        setLicensePlate('');
        setGasStationName('');
        setAttendantSig(activeUser?.name || '');
        tokenRef.current?.focus();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [redeemSuccess, activeUser]);

  const addGasStation = () => {
    const name = newStation.trim();
    if (!name || gasStations.includes(name)) return;
    const updated = [...gasStations, name];
    setGasStations(updated);
    localStorage.setItem('fc_gasStations', JSON.stringify(updated));
    setNewStation('');
    setShowAddStation(false);
  };

  const handleTokenChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setVerifyToken(cleaned);
    setRedeemError('');
    if (cleaned.length === 6) {
      const match = fuelRequisitions.find(r => r.redeemToken === cleaned);
      if (match) {
        if (match.status === 'Redeemed') {
          setRedeemError(`Already redeemed on ${match.redeemDate} at ${match.redeemedByGasStation}`);
          setMatchedReq(null);
        } else if (match.status === 'Rejected') {
          setRedeemError('Voucher was rejected by head office');
          setMatchedReq(null);
        } else if (match.status === 'Pending' || match.status === 'Reviewed' || match.status === 'Verified') {
          setRedeemError('Voucher has not been fully approved yet');
          setMatchedReq(null);
        } else {
          setMatchedReq(match);
          setActualLitres(match.litresRequested);
          setActualCost(match.estimatedCost);
        }
      } else {
        setRedeemError('No active voucher found');
        setMatchedReq(null);
      }
    } else {
      setMatchedReq(null);
    }
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedReq) return;
    if (!gasStationName || !attendantSig) {
      setRedeemError('Fill in gas station and attendant name');
      return;
    }
    redeemRequisition(matchedReq.id, {
      redeemedByGasStation: gasStationName,
      redeemedAttendantSignature: attendantSig,
      redeemedActualLitres: actualLitres,
      redeemedActualCost: actualCost,
      licensePlate
    });
    setRedeemSuccess(`${actualLitres}L dispensed to ${matchedReq.truckPlate}. Plate: ${licensePlate}`);
  };

  return (
    <div className="min-h-screen bg-[#070912] text-white font-mono">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0c0f1d] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-black text-sm">FUEL SCANNER</span>
          <span className="text-zinc-600 text-[10px]">{activeUser?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-[10px] cursor-pointer"
          >
            {showMenu ? 'CLOSE' : 'MENU'}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-[10px] cursor-pointer"
          >
            EXIT
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="bg-[#0c0f1d] border-b border-zinc-800 px-4 py-3 space-y-2">
          <div className="flex gap-3 text-[11px]">
            <div className="flex-1 bg-zinc-950/50 rounded p-2 text-center">
              <p className="text-zinc-500">Diesel</p>
              <p className="text-blue-400 font-bold text-lg">{prepaidFuelBalance.diesel.toLocaleString()} L</p>
            </div>
            <div className="flex-1 bg-zinc-950/50 rounded p-2 text-center">
              <p className="text-zinc-500">Petrol</p>
              <p className="text-emerald-400 font-bold text-lg">{prepaidFuelBalance.petrol.toLocaleString()} L</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Success banner */}
        {redeemSuccess && (
          <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-center text-sm font-bold animate-pulse">
            {redeemSuccess}
          </div>
        )}

        {/* Token input */}
        <div className="bg-[#0c0f1d] border border-zinc-800 rounded-xl p-5">
          <label className="block text-zinc-500 text-[10px] uppercase tracking-wider mb-2 text-center">
            Scan or enter 6-digit voucher token
          </label>
          <input
            ref={tokenRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verifyToken}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] bg-zinc-950 border-2 border-zinc-700 rounded-xl py-4 text-yellow-400 font-black outline-none focus:border-orange-500 transition-colors"
            autoFocus
          />
          {redeemError && (
            <p className="text-red-400 text-[11px] mt-2 text-center">{redeemError}</p>
          )}
          {!matchedReq && !redeemError && (
            <p className="text-zinc-600 text-[10px] mt-2 text-center">
              Point barcode scanner at QR code or type token manually
            </p>
          )}
        </div>

        {/* Matched voucher */}
        {matchedReq && (
          <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-sm">✔ VALID VOUCHER</p>
              <p className="text-zinc-500 text-[10px]">{matchedReq.id}</p>
            </div>

            <div className="bg-zinc-950/50 rounded-lg p-4 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Truck:</span>
                <span className="text-white font-bold">{matchedReq.truckPlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Driver:</span>
                <span className="text-white font-bold">{matchedReq.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fuel:</span>
                <span className="text-white font-bold">{matchedReq.fuelType || 'Diesel'} · {matchedReq.litresRequested}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branch:</span>
                <span className="text-white font-bold">{matchedReq.branchName || '-'}</span>
              </div>
            </div>

            {matchedReq.qrCodeData && (
              <div className="flex justify-center">
                <img src={matchedReq.qrCodeData} alt="QR" className="w-24 h-24 rounded border-2 border-zinc-700" />
              </div>
            )}

            {/* Redemption form */}
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Litres</label>
                  <input type="number" required value={actualLitres}
                    onChange={(e) => setActualLitres(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm text-center font-bold" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Cost ($)</label>
                  <input type="number" required value={actualCost}
                    onChange={(e) => setActualCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm text-center font-bold" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">License Plate</label>
                  <input type="text" required value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm text-center font-bold"
                    placeholder="ABC123" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Gas Station</label>
                <div className="flex gap-2">
                  <select required value={gasStationName} onChange={(e) => setGasStationName(e.target.value)}
                    className="flex-1 bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm">
                    <option value="">-- Select --</option>
                    {gasStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddStation(!showAddStation)}
                    className="px-3 bg-orange-600 text-black font-bold rounded-lg text-sm cursor-pointer">
                    +
                  </button>
                </div>
                {showAddStation && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newStation} onChange={(e) => setNewStation(e.target.value)}
                      placeholder="Station name"
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white text-sm" />
                    <button type="button" onClick={addGasStation}
                      className="px-4 bg-orange-600 text-black font-bold rounded cursor-pointer text-sm">
                      ADD
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Attendant Name</label>
                <input type="text" required value={attendantSig}
                  onChange={(e) => setAttendantSig(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm"
                  placeholder="Your name" />
              </div>

              <button type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-sm rounded-xl uppercase tracking-wider cursor-pointer transition-colors active:scale-[0.98]">
                DISPENSE & REDEEM
              </button>
            </form>
          </div>
        )}

        {/* Quick stats footer */}
        <div className="text-center text-zinc-600 text-[9px] pt-2">
          <p>FleetCommand Fuel Scanner v2.3</p>
        </div>
      </div>
    </div>
  );
};
