import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { FuelRequisition } from '../types';
import { jsPDF } from 'jspdf';
import { Html5Qrcode } from 'html5-qrcode';
import { drawFrame, docHeader, docFooter, kpiRow, tableHeader, tableRow, pw, ph } from '../utils/pdfHelpers';
import toast from 'react-hot-toast';

export const MineazyFuelRedemption: React.FC = () => {
  const { fuelRequisitions, redeemRequisition, prepaidFuelBalance, activeUser, logout, fuelPrices } = useFleet();

  const [verifyToken, setVerifyToken] = useState('');
  const [matchedReq, setMatchedReq] = useState<FuelRequisition | null>(null);
  const [gasStationName, setGasStationName] = useState('');
  const [drawdownVoucher, setDrawdownVoucher] = useState('');
  const [actualLitres, setActualLitres] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [actualDispersed, setActualDispersed] = useState(0);
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
  const [showDayEndReport, setShowDayEndReport] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setShowScanner(false);
    setScannerError('');
  };

  const startScanner = async () => {
    setScannerError('');
    setShowScanner(true);
    await new Promise(r => setTimeout(r, 150));
    try {
      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          const cleaned = decodedText.replace(/\D/g, '').slice(0, 6);
          if (cleaned.length === 6) {
            stopScanner();
            handleTokenChange(cleaned);
          }
        },
        () => {}
      );
    } catch (err: any) {
      setScannerError(err?.message || 'Camera access denied or unavailable');
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const redeemedReqs = fuelRequisitions.filter(r => r.status === 'Redeemed');
  const vouchersRedeemed = redeemedReqs.length;
  const dieselRedeemed = redeemedReqs.filter(r => r.fuelType === 'Diesel').reduce((s, r) => s + (r.redeemedActualLitres || 0), 0);
  const petrolRedeemed = redeemedReqs.filter(r => r.fuelType === 'Petrol').reduce((s, r) => s + (r.redeemedActualLitres || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const todayRedeemed = redeemedReqs.filter(r => r.redeemDate === today);
  const todayDiesel = todayRedeemed.filter(r => r.fuelType === 'Diesel').reduce((s, r) => s + (r.redeemedActualLitres || 0), 0);
  const todayPetrol = todayRedeemed.filter(r => r.fuelType === 'Petrol').reduce((s, r) => s + (r.redeemedActualLitres || 0), 0);
  const todayTotalCost = todayRedeemed.reduce((s, r) => s + (r.redeemedActualCost || 0), 0);

  const tokenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tokenRef.current?.focus();
  }, []);

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
    if (cleaned.length === 6) {
      const match = fuelRequisitions.find(r => r.redeemToken === cleaned);
      if (match) {
        if (match.status === 'Redeemed') {
          toast.error(`Already redeemed on ${match.redeemDate} at ${match.redeemedByGasStation}`);
          setMatchedReq(null);
        } else if (match.status === 'Rejected') {
          toast.error('Voucher was rejected by head office');
          setMatchedReq(null);
        } else if (match.status === 'Pending' || match.status === 'Reviewed') {
          toast.error('Voucher has not been fully approved yet');
          setMatchedReq(null);
        } else {
          setMatchedReq(match);
          setActualLitres(match.litresRequested);
          setActualCost(match.estimatedCost);
          setActualDispersed(match.litresRequested);
        }
      } else {
        toast.error('No active voucher found');
        setMatchedReq(null);
      }
    } else {
      setMatchedReq(null);
    }
  };

  const exportCSV = () => {
    const rows = [['Voucher ID','Truck','Driver','Fuel Type','Litres','Cost','Gas Station','License Plate']];
    todayRedeemed.forEach(r => rows.push([
      r.id, r.truckPlate || '', r.driverName || '', r.fuelType,
      String(r.redeemedActualLitres || 0), String(r.redeemedActualCost || 0),
      r.redeemedByGasStation || '', ''
    ]));
    rows.push(['','','','','','','','']);
    rows.push(['TOTAL VOUCHERS', String(todayRedeemed.length),'','','','','','']);
    rows.push(['TOTAL DIESEL', String(todayDiesel),'','','','','','']);
    rows.push(['TOTAL PETROL', String(todayPetrol),'','','','','','']);
    rows.push(['TOTAL COST', String(todayTotalCost),'','','','','','']);
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `DayEndReport_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    drawFrame(doc);
    let y = docHeader(doc, 'DAY END REPORT — FUEL REDEMPTION', `${today} · Daily dispensing summary and reconciliation`, activeUser?.name || 'System');

    if (todayRedeemed.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 125, 140);
      doc.text('No redemptions recorded today', pw(doc) / 2, y + 20, { align: 'center' });
    } else {
      y = kpiRow(doc, [
        { label: 'Vouchers Redeemed', value: String(todayRedeemed.length) },
        { label: 'Diesel Dispensed', value: `${todayDiesel.toLocaleString()} L` },
        { label: 'Petrol Dispensed', value: `${todayPetrol.toLocaleString()} L` },
        { label: 'Total Cost', value: `$${todayTotalCost.toLocaleString()}` },
      ], y);

      const cols = [22, 46, 72, 100, 122, 142, 166, pw(doc) - 16];
      y = tableHeader(doc, cols, ['Voucher', 'Truck', 'Driver', 'Fuel', 'Litres', 'Cost', 'Station', 'License'], y);

      todayRedeemed.forEach((r, idx) => {
        if (y > ph(doc) - 18) { doc.addPage(); drawFrame(doc); y = 24; }
        y = tableRow(doc, cols, [
          r.id.slice(-8), r.truckPlate || '', r.driverName || '', r.fuelType,
          String(r.redeemedActualLitres || 0), `$${r.redeemedActualCost || 0}`,
          r.redeemedByGasStation || '', r.licensePlate || ''
        ], y, idx);
      });
    }

    docFooter(doc);
    doc.save(`DayEndReport_${today}.pdf`);
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedReq) return;
    if (!gasStationName || !attendantSig) {
      toast.error('Fill in gas station and attendant name');
      return;
    }
    const rate = matchedReq.fuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel;
    redeemRequisition(matchedReq.id, {
      redeemedByGasStation: gasStationName,
      redeemedDrawdownVoucher: drawdownVoucher,
      redeemedAttendantSignature: attendantSig,
      redeemedActualLitres: actualDispersed,
      redeemedActualCost: Math.round(actualDispersed * rate),
      licensePlate: licensePlate,
    });
    toast.success(`${actualDispersed}L dispensed to ${matchedReq.truckPlate}`);
    setTimeout(() => {
      setVerifyToken('');
      setMatchedReq(null);
      setActualLitres(0);
      setActualCost(0);
      setLicensePlate('');
      setGasStationName('');
      setDrawdownVoucher('');
      setAttendantSig(activeUser?.name || '');
      tokenRef.current?.focus();
    }, 2000);
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
          <div className="border-t border-zinc-800 pt-2">
            <p className="text-zinc-600 text-[9px] uppercase tracking-wider mb-2 text-center">Redeemed Metrics</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-950/50 rounded p-2">
                <p className="text-zinc-500 text-[10px]">Vouchers</p>
                <p className="text-orange-400 font-bold text-lg">{vouchersRedeemed}</p>
              </div>
              <div className="bg-zinc-950/50 rounded p-2">
                <p className="text-zinc-500 text-[10px]">Diesel</p>
                <p className="text-blue-400 font-bold text-lg">{dieselRedeemed.toLocaleString()} L</p>
              </div>
              <div className="bg-zinc-950/50 rounded p-2">
                <p className="text-zinc-500 text-[10px]">Petrol</p>
                <p className="text-emerald-400 font-bold text-lg">{petrolRedeemed.toLocaleString()} L</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setShowDayEndReport(true); setShowMenu(false); }}
            className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded text-zinc-400 hover:text-orange-400 text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
          >
            DAY END REPORT
          </button>
        </div>
      )}

      {/* Day End Report modal */}
      {showDayEndReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-4 px-2 overflow-y-auto" onClick={() => setShowDayEndReport(false)}>
          <div className="bg-[#0c0f1d] border border-zinc-800 rounded-xl w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-orange-400 font-black text-sm uppercase tracking-wider">Day End Report</h2>
              <button onClick={() => setShowDayEndReport(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <p className="text-zinc-500 text-[10px]">{today} · {activeUser?.name}</p>

            {todayRedeemed.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No redemptions recorded today</p>
            ) : (
              <>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {todayRedeemed.map(r => (
                    <div key={r.id} className="bg-zinc-950/50 rounded-lg p-3 text-[11px] space-y-1">
                      <div className="flex justify-between text-zinc-400">
                        <span className="font-bold text-white">{r.truckPlate}</span>
                        <span>{r.fuelType}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>{r.driverName} · {r.redeemedByGasStation}</span>
                        <span className="text-white font-bold">{r.redeemedActualLitres}L · ${r.redeemedActualCost}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-3 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Vouchers</span>
                    <span className="text-white font-bold">{todayRedeemed.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Diesel Dispensed</span>
                    <span className="text-blue-400 font-bold">{todayDiesel.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Petrol Dispensed</span>
                    <span className="text-emerald-400 font-bold">{todayPetrol.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1">
                    <span className="text-zinc-400 font-bold">Total Cost</span>
                    <span className="text-orange-400 font-bold text-sm">${todayTotalCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-black font-black text-sm rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-black font-black text-sm rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
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
          <button
            onClick={startScanner}
            className="mt-3 w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-black text-sm rounded-xl uppercase tracking-wider cursor-pointer transition-colors active:scale-[0.98]"
          >
            SCAN BARCODE
          </button>
          {!matchedReq && (
            <p className="text-zinc-600 text-[10px] mt-2 text-center">
              Point barcode scanner at QR code or type token manually
            </p>
          )}
        </div>

        {/* Camera scanner overlay */}
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={stopScanner}>
            <div className="w-full max-w-sm mx-auto p-4" onClick={e => e.stopPropagation()}>
              <div className="bg-[#0c0f1d] border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-zinc-400 text-[11px] text-center uppercase tracking-wider">
                  Point camera at barcode
                </p>
                <div id="barcode-scanner" className="w-full aspect-video bg-black rounded-lg overflow-hidden" />
                {scannerError && (
                  <p className="text-red-400 text-[10px] text-center">{scannerError}</p>
                )}
                <button
                  onClick={stopScanner}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

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
              <div className="bg-zinc-950/50 rounded-lg p-3 text-[11px] text-zinc-400 font-mono flex justify-between">
                <span>Requested: <strong className="text-white">{actualLitres}L</strong></span>
                <span>Rate: <strong className="text-white">${(matchedReq.fuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel).toFixed(2)}/L</strong></span>
              </div>
              <div>
                <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Actual Qty Dispersed (L)</label>
                <input type="number" min="0" step="0.1" required value={actualDispersed}
                  onChange={(e) => setActualDispersed(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border-2 border-orange-500/50 focus:border-orange-400 rounded-lg px-3 py-3 text-white text-sm text-center font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Est. Cost ($)</label>
                  <input type="number" value={Math.round(actualDispersed * (matchedReq.fuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel))} readOnly
                    className="w-full bg-zinc-900 border-2 border-zinc-600 rounded-lg px-3 py-3 text-zinc-400 text-sm text-center font-bold cursor-not-allowed" />
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
                <label className="block text-zinc-500 text-[9px] uppercase font-bold mb-1">Drawdown Voucher #</label>
                <input type="text" required value={drawdownVoucher}
                  onChange={(e) => setDrawdownVoucher(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-lg px-3 py-3 text-white text-sm"
                  placeholder="e.g. DV-2024-001" />
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
