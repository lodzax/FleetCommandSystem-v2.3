import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { jsPDF } from 'jspdf';
import { 
  Plus, X, Eye, ThumbsUp, ThumbsDown, Download, Fuel
} from 'lucide-react';
import { FuelRequisition } from '../types';
import logoImg from '../../assets/logo.png';

export const RequisitionsPipeline: React.FC = () => {
  const { fuelRequisitions, trucks, drivers, branches, activeUser, addFuelRequisition, updateRequisitionStatus, reviewRequisition, approveRequisition, rejectRequisition, prepaidFuelBalance } = useFleet();

  const [showReqModal, setShowReqModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRequisition, setViewRequisition] = useState<FuelRequisition | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const logoBase64Ref = useRef('');

  useEffect(() => {
    fetch(logoImg)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => { logoBase64Ref.current = reader.result as string; };
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  const [reqTruckId, setReqTruckId] = useState('');
  const [reqDriverId, setReqDriverId] = useState('');
  const [reqLitres, setReqLitres] = useState(200);
  const [reqCost, setReqCost] = useState(436);
  const [reqPurpose, setReqPurpose] = useState('Ngezi Platinum heavy haul dispatch run');
  const [reqFuelDate, setReqFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqFuelType, setReqFuelType] = useState<'Diesel' | 'Petrol'>('Diesel');
  const [reqBranchId, setReqBranchId] = useState('');
  const [showQuickReq, setShowQuickReq] = useState(false);
  const [qrLitres, setQrLitres] = useState(200);
  const [qrBranchId, setQrBranchId] = useState('');

  const isDriverRole = activeUser?.role === 'Driver';
  const activeDriverRecord = isDriverRole
    ? drivers.find(d => d.name === activeUser?.name)
      || drivers.find(d => d.email === activeUser?.email)
      || null
    : null;

  const myRequisitions = fuelRequisitions.filter(r => r.submittedById === activeUser?.id || r.driverName === activeUser?.name);
  const pendingReq = myRequisitions.filter(r => r.status === 'Pending' || r.status === 'Reviewed').length;
  const approvedReq = myRequisitions.filter(r => r.status === 'Approved').length;
  const myTruck = activeDriverRecord ? trucks.find(t => t.id === activeDriverRecord.assignedTruckId) : null;

  const handleQuickReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrBranchId) return;
    const branch = branches.find(b => b.id === qrBranchId);
    addFuelRequisition({
      truckId: myTruck?.id || '',
      truckPlate: myTruck?.plateNumber,
      driverId: activeDriverRecord?.id || activeUser!.id,
      driverName: activeDriverRecord?.name || activeUser?.name,
      litresRequested: qrLitres,
      estimatedCost: Math.round(qrLitres * 2.18),
      purpose: 'Fuel request from dashboard',
      fuelDate: new Date().toISOString().split('T')[0],
      fuelType: 'Diesel',
      branchId: qrBranchId,
      branchName: branch?.name
    });
    setShowQuickReq(false);
    setQrLitres(200);
    setQrBranchId('');
  };

  useEffect(() => {
    if (showReqModal) {
      if (isDriverRole) {
        if (activeDriverRecord) {
          setReqDriverId(activeDriverRecord.id);
          if (activeDriverRecord.assignedTruckId) {
            setReqTruckId(activeDriverRecord.assignedTruckId);
          }
        } else {
          setReqDriverId(activeUser!.name);
        }
      }
    } else {
      setReqTruckId('');
      setReqDriverId('');
      setReqLitres(200);
      setReqCost(436);
      setReqPurpose('Ngezi Platinum heavy haul dispatch run');
      setReqFuelDate(new Date().toISOString().split('T')[0]);
      setReqFuelType('Diesel');
      setReqBranchId('');
    }
  }, [showReqModal, isDriverRole, activeDriverRecord, activeUser]);

  const driverOptions = isDriverRole && activeDriverRecord
    ? [activeDriverRecord]
    : drivers;

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTruckId || !reqDriverId || !reqBranchId) return;

    const truck = trucks.find(t => t.id === reqTruckId);
    const driver = drivers.find(d => d.id === reqDriverId);
    const branch = branches.find(b => b.id === reqBranchId);

    addFuelRequisition({
      truckId: reqTruckId,
      truckPlate: truck?.plateNumber,
      driverId: driver?.id || activeUser!.id,
      driverName: driver?.name || activeUser?.name,
      litresRequested: reqLitres,
      estimatedCost: reqCost,
      purpose: reqPurpose,
      fuelDate: reqFuelDate,
      fuelType: reqFuelType,
      branchId: reqBranchId,
      branchName: branch?.name
    });

    setShowReqModal(false);
  };

  const isAdmin = activeUser?.role === 'Administrator';
  const isDirector = activeUser?.role === 'Director';
  const isManager = activeUser?.role === 'Manager';
  const isAccounts = activeUser?.role === 'Accounts';
  const isTreasurer = activeUser?.role === 'Treasurer';
  const isDriver = activeUser?.role === 'Driver';
  const canReview = isManager || isAccounts;
  const canApprove = isAdmin || isDirector || isTreasurer;

  const filteredRequisitions = isDriver 
    ? fuelRequisitions.filter(r => r.submittedById === activeUser?.id || r.driverName === activeUser?.name)
    : fuelRequisitions;

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectRequisition(rejectTargetId, rejectReason.trim());
    setShowRejectModal(false);
    setRejectTargetId('');
    setRejectReason('');
  };

  const downloadPdf = (r: FuelRequisition) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    if (logoBase64Ref.current) {
      doc.addImage(logoBase64Ref.current, 'PNG', 14, y, 40, 16);
      y += 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FUEL REQUISITION VOUCHER', pageW / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('FleetCommand Operations Control Center', pageW / 2, y, { align: 'center' });
    y += 6;
    y += 10;

    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Requisition: ${r.id}`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const addRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 65, y);
      y += 6;
    };

    addRow('Status', r.status.toUpperCase());
    addRow('Truck Asset', r.truckPlate || r.truckId);
    addRow('Driver / Pilot', r.driverName || r.driverId);
    addRow('Fuel Type', r.fuelType || 'Diesel');
    addRow('Litres Requested', `${r.litresRequested} L`);
    addRow('Estimated Cost', `$${r.estimatedCost.toLocaleString()}`);
    addRow('Fuel Date', r.fuelDate || r.dateRequested);
    addRow('Branch / Depot', r.branchName || r.branchId || '-');
    addRow('Purpose', r.purpose);
    y += 4;

    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('APPROVAL VERIFICATION', 14, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addRow('Approved By', r.approvedBy || '-');
    addRow('Approved Date', r.approvedDate || '-');
    addRow('Redeem Token', r.redeemToken || '-');
    y += 4;

    if (r.qrCodeData) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Digital Verification QR:', 14, y);
      y += 6;
      try {
        doc.addImage(r.qrCodeData, 'PNG', 14, y, 40, 40);
        y += 44;
      } catch { y += 4; }
    }

    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated: ${new Date().toLocaleString()} | FleetCommand System v2.3`, 14, y);
    doc.text('This document serves as an official fuel dispensing authorization.', 14, y + 4);

    doc.save(`Fuel_Requisition_${r.id}.pdf`);
  };

  return (
    <Layout title="Requisitions Pipeline">
      <div className="space-y-6 text-xs sm:text-sm">
        
        {/* MY FUEL REQUISITIONS */}
        <div className="bg-[#101424] border border-orange-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                  <Fuel size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">My Fuel Requisitions</h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {myTruck ? `Assigned: ${myTruck.plateNumber} (${myTruck.id})` : activeDriverRecord ? `Driver: ${activeDriverRecord.name}` : `Account: ${activeUser?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickReq(true)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-[10px] rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
              >
                <Plus size={13} />
                <span className="font-mono">Quick Request</span>
              </button>
            </div>
            {myRequisitions.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-yellow-400">{pendingReq}</p>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1">Awaiting</p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald-400">{approvedReq}</p>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1">Approved</p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-blue-400">{myRequisitions.filter(r => r.status === 'Redeemed').length}</p>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1">Redeemed</p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-zinc-300">{myRequisitions.length}</p>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1">Total</p>
                </div>
              </div>
            )}
            {myRequisitions.length === 0 && (
              <div className="mt-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
                <p className="text-zinc-500 font-mono text-[11px]">No fuel requisitions yet. Create your first one above.</p>
              </div>
            )}
          </div>

        {/* QUICK REQUEST MODAL */}
        {showQuickReq && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Quick Fuel Request</h3>
                  <p className="text-zinc-500 mt-1 font-mono text-[10px]">{myTruck ? `${myTruck.plateNumber} · ${activeDriverRecord?.name || activeUser?.name}` : activeUser?.name}</p>
                </div>
                <button onClick={() => setShowQuickReq(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleQuickReq} className="space-y-4">
                <div className="bg-zinc-950/30 border border-zinc-850 rounded p-3 text-[10px] text-zinc-400 font-mono space-y-1">
                  <p><span className="text-zinc-500">Truck:</span> {myTruck ? `${myTruck.plateNumber} (${myTruck.type})` : 'No assigned truck'}</p>
                  <p><span className="text-zinc-500">Driver:</span> {activeDriverRecord?.name || activeUser?.name}</p>
                  <p><span className="text-zinc-500">Fuel:</span> Diesel @ $2.18/L</p>
                  <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-0.5">
                    <p><span className="text-zinc-500">Prepaid Diesel:</span> <span className="text-blue-400 font-bold">{prepaidFuelBalance.diesel.toLocaleString()} L</span></p>
                    <p><span className="text-zinc-500">Prepaid Petrol:</span> <span className="text-emerald-400 font-bold">{prepaidFuelBalance.petrol.toLocaleString()} L</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Litres</label>
                    <input type="number" min="1" max="1000" required value={qrLitres}
                      onChange={(e) => setQrLitres(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Est. Cost</label>
                    <input type="number" readOnly value={Math.round(qrLitres * 2.18)}
                      className="w-full bg-[#181e35] border border-zinc-850 p-2.5 rounded text-zinc-500 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Branch</label>
                  <select required value={qrBranchId} onChange={(e) => setQrBranchId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                  <button type="button" onClick={() => setShowQuickReq(false)}
                    className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REQUISITIONS TABLE */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-zinc-950/25 border border-zinc-850 rounded">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                  <th className="p-3 pl-4">Req Token</th>
                  <th className="p-3">Asset Plate</th>
                  <th className="p-3">Request Pilot</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fuel Type</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Est. Litres</th>
                  <th className="p-3 font-mono">Est. USD</th>
                  <th className="p-3">Purpose / Note</th>
                  <th className="p-3 text-right">Approval Status</th>
                  <th className="p-3 pr-4 text-center">Action Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredRequisitions.map(r => (
                  <tr key={r.id} className="text-zinc-350 hover:bg-zinc-900/10">
                    <td className="p-3 pl-4 font-mono font-bold text-orange-400">{r.id}</td>
                    <td className="p-3 font-mono text-white text-xs uppercase font-bold">{r.truckPlate || r.truckId}</td>
                    <td className="p-3">{r.driverName}</td>
                    <td className="p-3 font-mono text-zinc-300">{r.fuelDate || r.dateRequested}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                        r.fuelType === 'Petrol' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{r.fuelType || 'Diesel'}</span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-zinc-400">{r.branchName || r.branchId || '-'}</td>
                    <td className="p-3 font-mono">{r.litresRequested} L</td>
                    <td className="p-3 font-mono text-amber-500">${r.estimatedCost.toLocaleString()}</td>
                    <td className="p-3 font-sans text-zinc-500 italic max-w-xs truncate">{r.purpose}</td>
                    <td className="p-3 text-right">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold font-mono ${
                          r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-400' :
                          r.status === 'Redeemed' ? 'bg-zinc-800 text-zinc-400 font-light' :
                          r.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                        }`}>{r.status}</span>
                      </div>
                      {r.status === 'Reviewed' && r.reviewedBy && (
                        <div className="mt-1 text-[9px] text-blue-400 font-mono">by: {r.reviewedBy}</div>
                      )}
                      {r.status === 'Approved' && r.redeemToken && (
                        <div className="mt-1 text-[10px] text-yellow-400 font-bold font-mono">
                          Token: <span className="underline select-all tracking-widest">{r.redeemToken}</span>
                        </div>
                      )}
                      {r.status === 'Approved' && r.qrCodeData && (
                        <div className="mt-1.5">
                          <img 
                            src={r.qrCodeData} 
                            alt="Verification QR" 
                            className="w-16 h-16 rounded border border-zinc-700"
                            title="Scan to verify approver authenticity"
                          />
                        </div>
                      )}
                      {r.status === 'Approved' && r.approvedBy && (
                        <div className="mt-1 text-[9px] text-emerald-400 font-mono">by: {r.approvedBy}</div>
                      )}
                      {r.status === 'Rejected' && r.rejectionReason && (
                        <div className="mt-1 text-[9px] text-red-400 font-mono italic max-w-[140px] truncate" title={r.rejectionReason}>
                          "{r.rejectionReason}"
                        </div>
                      )}
                      {r.status === 'Rejected' && r.rejectedBy && (
                        <div className="mt-1 text-[9px] text-zinc-500 font-mono">by: {r.rejectedBy}</div>
                      )}
                      {r.status === 'Redeemed' && r.redeemedByGasStation && (
                        <div className="mt-1 text-[9px] text-zinc-500 font-mono italic">
                          At: {r.redeemedByGasStation}
                        </div>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-center">
                      <button
                        onClick={() => { setViewRequisition(r); setShowViewModal(true); }}
                        className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1 mb-1 mx-auto"
                        title="View full details"
                      >
                        <Eye size={10} /> View
                      </button>
                      {r.status === 'Pending' && canReview ? (
                        <div className="flex justify-center gap-1.5 font-mono">
                          <button
                            onClick={() => reviewRequisition(r.id)}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-blue-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                            title="Review this requisition"
                          >
                            <Eye size={10} /> Review
                          </button>
                          <button
                            onClick={() => openRejectModal(r.id)}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                            title="Reject this requisition"
                          >
                            <ThumbsDown size={10} /> Reject
                          </button>
                        </div>
                      ) : r.status === 'Pending' ? (
                        <span className="text-zinc-600 font-mono text-[10px] italic">Awaiting Review</span>
                      ) : r.status === 'Reviewed' && canApprove ? (
                        <div className="flex justify-center gap-1.5 font-mono">
                          <button
                            onClick={() => approveRequisition(r.id)}
                            className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                            title="Approve this requisition"
                          >
                            <ThumbsUp size={10} /> Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(r.id)}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                            title="Reject this requisition"
                          >
                            <ThumbsDown size={10} /> Reject
                          </button>
                        </div>
                      ) : r.status === 'Reviewed' ? (
                        <span className="text-zinc-500 font-mono text-[10px] italic">Awaiting Approval</span>
                      ) : r.status === 'Approved' ? (
                        <div className="flex justify-center gap-1.5 font-mono">
                          <button
                            onClick={() => downloadPdf(r)}
                            className="px-2 py-0.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                            title="Download requisition as PDF"
                          >
                            <Download size={10} /> PDF
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[10px] italic">{r.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REQUEST FUEL REQUISITION MODAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Request Fuel Token Requisition</h3>
                <p className="text-zinc-555 mt-1">Requires supervisor authorization before releasing fuel dispensing parameters</p>
              </div>
              <button 
                onClick={() => setShowReqModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-4">
              
              {isDriverRole && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2.5 text-[10px] text-orange-300 font-mono">
                  Driver self-service: the assigned operator and rig are pre-selected from your activeUser record.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Target Dumper Asset</label>
                  <select
                    required
                    value={reqTruckId}
                    onChange={(e) => setReqTruckId(e.target.value)}
                    disabled={isDriverRole && !!activeDriverRecord?.assignedTruckId}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Vehicles --</option>
                    {trucks.map(t => (
                      <option key={`reqt-${t.id}`} value={t.id}>{t.id} - {t.plateNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Active Staff Captain</label>
                  <select
                    required
                    value={reqDriverId}
                    onChange={(e) => setReqDriverId(e.target.value)}
                    disabled={isDriverRole}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Operator --</option>
                    {drivers.map(d => (
                      <option key={`reqd-${d.id}`} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Requisition Volume (Litres)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={reqLitres}
                    onChange={(e) => {
                      const litres = parseInt(e.target.value) || 0;
                      setReqLitres(litres);
                      setReqCost(Math.round(litres * (reqFuelType === 'Petrol' ? 2.16 : 2.18)));
                    }}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1 text-sans">Calculated Estimate (USD)</label>
                  <input
                    type="number"
                    readOnly
                    value={reqCost}
                    className="w-full bg-[#181e35] border border-zinc-850 p-2.5 rounded text-zinc-500 outline-none"
                    title={`Computed at $${reqFuelType === 'Petrol' ? '2.16' : '2.18'}/Litre rate`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Requisition Date</label>
                  <input
                    type="date"
                    required
                    value={reqFuelDate}
                    onChange={(e) => setReqFuelDate(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Type of Fuel</label>
                  <select
                    required
                    value={reqFuelType}
                    onChange={(e) => {
                      const type = e.target.value as 'Diesel' | 'Petrol';
                      setReqFuelType(type);
                      setReqCost(Math.round(reqLitres * (type === 'Petrol' ? 2.16 : 2.18)));
                    }}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Branch / Depot</label>
                <select
                  required
                  value={reqBranchId}
                  onChange={(e) => setReqBranchId(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map(b => (
                    <option key={`reqb-${b.id}`} value={b.id}>{b.name} ({b.locationName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Requisition Statement Purpose</label>
                <textarea
                  required
                  placeholder="e.g., Coal Ore Transport Express Run from Hwange Fields to Bulawayo Depot"
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  className="w-full bg-[#0c0f1d] border border-[#2d3748] p-2.5 rounded text-zinc-200 h-20 resize-none outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg"
                >
                  Submit Requisition Order
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-red-400 font-mono uppercase flex items-center gap-2">
                  <ThumbsDown size={16} /> Reject Requisition
                </h3>
                <p className="text-zinc-555 mt-1">Provide a reason for rejecting requisition {rejectTargetId}</p>
              </div>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleReject(); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Rejection Reason</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Insufficient budget allocation, duplicate request, fuel quota exceeded..."
                  className="w-full bg-[#0c0f1d] border border-[#2d3748] p-2.5 rounded text-zinc-200 h-24 resize-none outline-none focus:border-red-500"
                  autoFocus
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs shadow-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* VIEW REQUISITION DETAIL MODAL */}
      {showViewModal && viewRequisition && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#121625] border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl p-6 text-xs max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Requisition Details</h3>
                <p className="text-zinc-555 mt-1">{viewRequisition.id}</p>
              </div>
              <button 
                onClick={() => setShowViewModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                  viewRequisition.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                  viewRequisition.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-400' :
                  viewRequisition.status === 'Redeemed' ? 'bg-zinc-800 text-zinc-400' :
                  viewRequisition.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500'
                }`}>{viewRequisition.status}</span>
                <span className="text-zinc-500 font-mono text-[10px]">| Created: {viewRequisition.dateRequested}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Truck Asset</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5 uppercase">{viewRequisition.truckPlate || viewRequisition.truckId}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Driver / Pilot</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5">{viewRequisition.driverName || viewRequisition.driverId}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Fuel Type</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5">{viewRequisition.fuelType || 'Diesel'}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Volume Requested</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5">{viewRequisition.litresRequested} Litres</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Estimated Cost</span>
                  <p className="text-amber-400 font-bold font-mono text-xs mt-0.5">${viewRequisition.estimatedCost.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Fuel Date</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5">{viewRequisition.fuelDate || viewRequisition.dateRequested}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Branch / Depot</span>
                  <p className="text-white font-bold font-mono text-xs mt-0.5">{viewRequisition.branchName || viewRequisition.branchId || '-'}</p>
                </div>
              </div>

              <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
                <span className="text-[9px] text-zinc-500 uppercase font-mono">Purpose / Note</span>
                <p className="text-zinc-300 font-mono text-[11px] mt-0.5">{viewRequisition.purpose}</p>
              </div>

              {(viewRequisition.reviewedBy || viewRequisition.approvedBy || viewRequisition.rejectedBy) && (
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Approval Trail</span>
                  {viewRequisition.reviewedBy && (
                    <div className="flex justify-between text-[10px] bg-blue-500/5 border border-blue-500/10 p-2 rounded">
                      <span className="text-blue-400 font-mono">Reviewed by {viewRequisition.reviewedBy}</span>
                      <span className="text-zinc-500">{viewRequisition.reviewedDate}</span>
                    </div>
                  )}
                  {viewRequisition.approvedBy && (
                    <div className="flex justify-between text-[10px] bg-emerald-500/5 border border-emerald-500/10 p-2 rounded">
                      <span className="text-emerald-400 font-mono">Approved by {viewRequisition.approvedBy}</span>
                      <span className="text-zinc-500">{viewRequisition.approvedDate}</span>
                    </div>
                  )}
                  {viewRequisition.rejectedBy && (
                    <div className="flex justify-between text-[10px] bg-red-500/5 border border-red-500/10 p-2 rounded">
                      <span className="text-red-400 font-mono">Rejected by {viewRequisition.rejectedBy}</span>
                      <span className="text-zinc-500">{viewRequisition.rejectedDate}</span>
                    </div>
                  )}
                </div>
              )}

              {viewRequisition.status === 'Approved' && viewRequisition.redeemToken && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Redeem Token</span>
                  <p className="text-yellow-400 font-bold font-mono text-sm tracking-widest mt-1">{viewRequisition.redeemToken}</p>
                </div>
              )}

              {viewRequisition.rejectionReason && (
                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded">
                  <span className="text-[9px] text-red-400 uppercase font-mono font-bold">Rejection Reason</span>
                  <p className="text-zinc-300 text-[11px] mt-1 italic">{viewRequisition.rejectionReason}</p>
                </div>
              )}

              {viewRequisition.status === 'Redeemed' && (
                <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Redemption Details</span>
                  <p className="text-zinc-300 font-mono text-[10px]">Station: {viewRequisition.redeemedByGasStation}</p>
                  <p className="text-zinc-300 font-mono text-[10px]">Actual Litres: {viewRequisition.redeemedActualLitres} L</p>
                  <p className="text-zinc-300 font-mono text-[10px]">Actual Cost: ${viewRequisition.redeemedActualCost?.toLocaleString()}</p>
                  <p className="text-zinc-300 font-mono text-[10px]">Attendant: {viewRequisition.redeemedAttendantSignature}</p>
                  <p className="text-zinc-300 font-mono text-[10px]">Date: {viewRequisition.redeemDate}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
};
