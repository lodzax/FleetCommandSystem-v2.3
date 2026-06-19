import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { Layout } from '../components/NavigationSidebar';
import { jsPDF } from 'jspdf';
import { 
  Plus, X, Eye, ThumbsUp, ThumbsDown, Download, Fuel
} from 'lucide-react';
import { FuelRequisition } from '../types';
import { PaginatedTable } from '../components/PaginatedTable';
import { Barcode } from '../components/Barcode';
import JsBarcode from 'jsbarcode';
import logoImg from '../../assets/logo.png';
import toast from 'react-hot-toast';

export const RequisitionsPipeline: React.FC = () => {
  const { fuelRequisitions, trucks, drivers, branches, activeUser, addFuelRequisition, updateRequisitionStatus, editRequisitionQuantity, reviewRequisition, approveRequisition, rejectRequisition, prepaidFuelBalance, fuelPrices } = useFleet();

  const [showReqModal, setShowReqModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditQtyModal, setShowEditQtyModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FuelRequisition | null>(null);
  const [editLitres, setEditLitres] = useState(0);
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
  const QUICK_BRANCHES = ['Belmont', 'Mthwakazi', 'Mswela', 'VID', 'Thobelani'];
  const [showQuickReq, setShowQuickReq] = useState(false);
  const [qrLitres, setQrLitres] = useState(200);
  const [qrPlate, setQrPlate] = useState('');
  const [qrFuelType, setQrFuelType] = useState<'Diesel' | 'Petrol'>('Diesel');
  const [qrBranch, setQrBranch] = useState('');
  const [qrDestination, setQrDestination] = useState('');
  const [qrOdometer, setQrOdometer] = useState(0);
  const [qrPurpose, setQrPurpose] = useState('');
  const [qrDriverId, setQrDriverId] = useState('');
  const [qrCustomDriver, setQrCustomDriver] = useState('');
  const [qrCustomPlate, setQrCustomPlate] = useState('');
  const [qrCustomBranch, setQrCustomBranch] = useState('');
  const [qrFillingStation, setQrFillingStation] = useState('Glow Petroleum (Plumtree Rd)');
  const [qrCustomStation, setQrCustomStation] = useState('');
  const [insufficientMsg, setInsufficientMsg] = useState('');

  const checkFuelBalance = (litres: number, type: 'Diesel' | 'Petrol'): boolean => {
    const balance = type === 'Diesel' ? prepaidFuelBalance.diesel : prepaidFuelBalance.petrol;
    if (balance < litres) {
      setInsufficientMsg(`The prepaid balance of ${type} is insufficient (${balance.toLocaleString()}L available, ${litres}L requested). Contact the Accounts department for a top-up.`);
      return false;
    }
    return true;
  };

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

  // Default quick request driver to logged-in user's driver record
  useEffect(() => {
    if (!qrDriverId && activeDriverRecord) {
      setQrDriverId(activeDriverRecord.id);
    }
  }, [activeDriverRecord]);

  const handleQuickReq = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlate = qrPlate === 'custom' ? qrCustomPlate.trim() : qrPlate;
    const finalBranch = qrBranch === 'custom' ? qrCustomBranch.trim() : qrBranch;
    const finalStation = qrFillingStation === 'custom' ? qrCustomStation.trim() : qrFillingStation;
    if (!finalPlate || !finalBranch || !qrDriverId) return;
    if (!checkFuelBalance(qrLitres, qrFuelType)) return;
    if (qrDriverId === 'custom' && !qrCustomDriver.trim()) return;
    const selectedTruck = trucks.find(t => t.plateNumber === finalPlate);
    const selectedDriver = qrDriverId === 'custom'
      ? null
      : drivers.find(d => d.id === qrDriverId);
    const rate = qrFuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel;
    addFuelRequisition({
      truckId: selectedTruck?.id || '',
      truckPlate: finalPlate,
      driverId: qrDriverId,
      driverName: selectedDriver?.name || qrCustomDriver.trim() || activeUser?.name || '',
      litresRequested: qrLitres,
      estimatedCost: Math.round(qrLitres * rate),
      purpose: qrPurpose || 'Fuel request from dashboard',
      fuelDate: new Date().toISOString().split('T')[0],
      fuelType: qrFuelType,
      branchId: finalBranch,
      branchName: finalBranch,
      destination: qrDestination,
      odometerReading: qrOdometer,
      fillingStation: finalStation
    });
    setShowQuickReq(false);
    setQrLitres(200);
    setQrFuelType('Diesel');
    setQrBranch('');
    setQrDestination('');
    setQrOdometer(0);
    setQrPurpose('');
    setQrPlate('');
    setQrDriverId(activeDriverRecord?.id || '');
    setQrCustomDriver('');
    setQrFillingStation('Glow Petroleum (Plumtree Rd)');
    setQrCustomStation('');
    setQrCustomPlate('');
    setQrCustomBranch('');
    toast.success('Fuel request submitted');
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
    if (!checkFuelBalance(reqLitres, reqFuelType)) return;

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
    toast.success('Requisition submitted');
  };

  const isAdmin = activeUser?.role === 'Administrator';
  const isManager = activeUser?.role === 'Manager';
  const isAccounts = activeUser?.role === 'Accounts';
  const isTreasurer = activeUser?.role === 'Treasurer';
  const isDriver = activeUser?.role === 'Driver';
  const canReview = isTreasurer;
  const canApprove = isAccounts || isManager;

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
    toast.success('Requisition rejected');
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

    if (r.qrCodeData || r.redeemToken) {
      const rowY = y;
      let rowH = 6;

      if (r.qrCodeData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Verification QR:', 14, rowY);
        try {
          doc.addImage(r.qrCodeData, 'PNG', 14, rowY + 2, 30, 30);
          rowH = 34;
        } catch {}
      }

      if (r.redeemToken) {
        const barcodeW = 56;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Redeem Barcode:', pageW - 14, rowY, { align: 'right' });
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, r.redeemToken, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 4,
        });
        const barcodeDataUrl = canvas.toDataURL('image/png');
        doc.addImage(barcodeDataUrl, 'PNG', pageW - 14 - barcodeW, rowY + 2, barcodeW, 18);
        rowH = Math.max(rowH, 22);
      }

      y = rowY + rowH + 4;
    } else {
      addRow('Redeem Token', '-');
      y += 4;
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
                  <p><span className="text-zinc-500">Requestor:</span> {activeUser?.name}</p>
                  <p><span className="text-zinc-500">Fuel:</span> {qrFuelType} @ ${qrFuelType === 'Petrol' ? fuelPrices.petrol.toFixed(2) : fuelPrices.diesel.toFixed(2)}/L</p>
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
                    <input type="number" readOnly value={Math.round(qrLitres * (qrFuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel))}
                      className="w-full bg-[#181e35] border border-zinc-850 p-2.5 rounded text-zinc-500 font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Fuel Type</label>
                  <select required value={qrFuelType} onChange={(e) => setQrFuelType(e.target.value as 'Diesel' | 'Petrol')}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="Diesel">Diesel (${fuelPrices.diesel.toFixed(2)}/L)</option>
                    <option value="Petrol">Petrol (${fuelPrices.petrol.toFixed(2)}/L)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Filling Station</label>
                  <select value={qrFillingStation} onChange={(e) => setQrFillingStation(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="Glow Petroleum (Plumtree Rd)">Glow Petroleum (Plumtree Rd)</option>
                    <option value="Glow Petroleum">Glow Petroleum</option>
                    <option value="Total Energies">Total Energies</option>
                    <option value="Engen">Engen</option>
                    <option value="Zuva Petroleum">Zuva Petroleum</option>
                    <option value="Puma Energy">Puma Energy</option>
                    <option value="Redan">Redan</option>
                    <option value="Sakunda">Sakunda</option>
                    <option value="custom">✦ Other Station...</option>
                  </select>
                  {qrFillingStation === 'custom' && (
                    <input type="text" required placeholder="Enter station name" value={qrCustomStation || ''}
                      onChange={(e) => setQrCustomStation(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Driver Name</label>
                  <select required value={qrDriverId} onChange={(e) => setQrDriverId(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="">-- Select Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    <option value="custom">✦ Register Temporary Custom Driver...</option>
                  </select>
                  {qrDriverId === 'custom' && (
                    <input type="text" required placeholder="Enter driver name" value={qrCustomDriver}
                      onChange={(e) => setQrCustomDriver(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">License Plate</label>
                  <select required value={qrPlate} onChange={(e) => setQrPlate(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="">-- Select Plate --</option>
                    {trucks.map(t => (
                      <option key={t.id} value={t.plateNumber}>{t.plateNumber} ({t.model || t.type})</option>
                    ))}
                    <option value="custom">✦ Custom Plate...</option>
                  </select>
                  {qrPlate === 'custom' && (
                    <input type="text" required placeholder="Enter license plate" value={qrCustomPlate}
                      onChange={(e) => setQrCustomPlate(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Branch</label>
                  <select required value={qrBranch} onChange={(e) => setQrBranch(e.target.value)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 cursor-pointer">
                    <option value="">-- Select Branch --</option>
                    {QUICK_BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="custom">✦ Other Branch...</option>
                  </select>
                  {qrBranch === 'custom' && (
                    <input type="text" required placeholder="Enter branch name" value={qrCustomBranch}
                      onChange={(e) => setQrCustomBranch(e.target.value)}
                      className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Destination</label>
                  <input type="text" required value={qrDestination}
                    onChange={(e) => setQrDestination(e.target.value)}
                    placeholder="Enter destination"
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Odometer (km)</label>
                  <input type="number" min="0" required value={qrOdometer}
                    onChange={(e) => setQrOdometer(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Purpose / Note</label>
                  <textarea value={qrPurpose}
                    onChange={(e) => setQrPurpose(e.target.value)}
                    placeholder="e.g. Trip to Bulawayo"
                    rows={2}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono text-[11px] resize-none" />
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

        {/* EDIT QUANTITY MODAL (Accounts) */}
        {showEditQtyModal && editTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-[#121625] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-orange-400 font-mono uppercase">Adjust Fuel Quantity</h3>
                  <p className="text-zinc-500 mt-1 font-mono text-[10px]">{editTarget.id} · {editTarget.truckPlate || editTarget.truckId}</p>
                </div>
                <button onClick={() => setShowEditQtyModal(false)} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); editRequisitionQuantity(editTarget.id, editLitres, Math.round(editLitres * (editTarget.fuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel))); setShowEditQtyModal(false); toast.success('Quantity updated'); }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Litres Requested</label>
                  <input type="number" min="1" required value={editLitres}
                    onChange={(e) => setEditLitres(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0c0f1d] border border-zinc-850 p-2.5 rounded text-zinc-200 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">New Estimated Cost</label>
                  <input type="number" readOnly value={Math.round(editLitres * (editTarget.fuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel))}
                    className="w-full bg-[#181e35] border border-zinc-850 p-2.5 rounded text-zinc-500 font-mono" />
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                  <button type="button" onClick={() => setShowEditQtyModal(false)}
                    className="px-4 py-2 hover:bg-zinc-850 border border-zinc-800 hover:text-white rounded text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                    Update Quantity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INSUFFICIENT BALANCE MODAL */}
        {insufficientMsg && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-[#121625] border border-red-800 w-full max-w-md rounded-xl shadow-2xl p-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-red-800 mb-4">
                <h3 className="text-sm font-bold text-red-400 font-mono uppercase">Insufficient Balance</h3>
                <button onClick={() => setInsufficientMsg('')} className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <div className="bg-zinc-950/30 border border-red-900/30 rounded p-4 text-zinc-300 font-mono text-xs leading-relaxed">
                {insufficientMsg}
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3 font-mono">
                <button onClick={() => setInsufficientMsg('')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-semibold rounded text-xs shadow-lg cursor-pointer">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REQUISITIONS TABLE */}
        <div className="bg-[#101424] border border-zinc-800 p-6 rounded-xl overflow-hidden">
          <PaginatedTable
            data={filteredRequisitions}
            searchFields={['id', 'truckPlate', 'driverName', 'purpose', 'branchName']}
            pageSize={15}
            keyExtractor={r => r.id}
            emptyMessage="No requisitions match the current filters."
            columns={[
              { header: 'Req Token', accessor: 'id', sortable: true, className: 'font-mono font-bold text-orange-400', headerClassName: 'pl-4' },
              { header: 'Asset Plate', accessor: 'truckPlate', sortable: true, className: 'font-mono text-white text-xs uppercase font-bold', render: r => r.truckPlate || r.truckId },
              { header: 'Request Pilot', accessor: 'driverName', sortable: true },
              { header: 'Date', accessor: 'fuelDate', sortable: true, className: 'font-mono text-zinc-300', render: r => r.fuelDate || r.dateRequested },
              {
                header: 'Fuel Type',
                sortable: true,
                render: r => (
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                    r.fuelType === 'Petrol' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{r.fuelType || 'Diesel'}</span>
                )
              },
              { header: 'Branch', accessor: 'branchName', className: 'font-mono text-[10px] text-zinc-400', render: r => r.branchName || r.branchId || '-' },
              { header: 'Est. Litres', accessor: 'litresRequested', sortable: true, className: 'font-mono', render: r => <span>{r.litresRequested} L</span> },
              { header: 'Est. USD', accessor: 'estimatedCost', sortable: true, className: 'font-mono text-amber-500', render: r => <span>${r.estimatedCost.toLocaleString()}</span> },
              { header: 'Purpose / Note', render: r => <span className="font-sans text-zinc-500 italic max-w-xs truncate block">{r.purpose}</span> },
              {
                header: 'Approval Status',
                sortable: true,
                render: r => (
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold font-mono ${
                      r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-400' :
                      r.status === 'Verified' ? 'bg-sky-500/10 text-sky-400' :
                      r.status === 'Redeemed' ? 'bg-zinc-800 text-zinc-400 font-light' :
                      r.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                    }`}>{r.status}</span>
                    {r.status === 'Reviewed' && r.reviewedBy && (
                      <div className="mt-1 text-[9px] text-blue-400 font-mono">by: {r.reviewedBy}</div>
                    )}
                    {r.status === 'Verified' && r.verifiedBy && (
                      <div className="mt-1 text-[9px] text-sky-400 font-mono">by: {r.verifiedBy}</div>
                    )}
                    {r.status === 'Approved' && r.approvedBy && (
                      <div className="mt-1 text-[9px] text-emerald-400 font-mono">by: {r.approvedBy}</div>
                    )}
                    {r.status === 'Rejected' && r.rejectionReason && (
                      <div className="mt-1 text-[9px] text-red-400 font-mono italic max-w-[140px] truncate" title={r.rejectionReason}>"{r.rejectionReason}"</div>
                    )}
                    {r.status === 'Rejected' && r.rejectedBy && (
                      <div className="mt-1 text-[9px] text-zinc-500 font-mono">by: {r.rejectedBy}</div>
                    )}
                    {r.status === 'Redeemed' && r.redeemedByGasStation && (
                      <div className="mt-1 text-[9px] text-zinc-500 font-mono italic">At: {r.redeemedByGasStation}</div>
                    )}
                  </div>
                )
              },
              {
                header: 'Action Trigger',
                render: r => (
                  <div className="text-center">
                    <button
                      onClick={() => { setViewRequisition(r); setShowViewModal(true); }}
                      className="px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1 mb-1 mx-auto"
                      title="View full details"
                    >
                      <Eye size={10} /> View
                    </button>
                    {isTreasurer && (
                      <button
                        onClick={() => downloadPdf(r)}
                        className="px-2 py-0.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1 mb-1 mx-auto"
                        title="Download requisition as PDF"
                      >
                        <Download size={10} /> PDF
                      </button>
                    )}
                    {r.status === 'Pending' && canReview ? (
                      <div className="flex justify-center gap-1.5 font-mono">
                        <button onClick={() => { reviewRequisition(r.id); toast.success('Requisition reviewed'); }}
                          className="px-2 py-0.5 bg-blue-500 hover:bg-blue-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                          title="Review this requisition"><Eye size={10} /> Review</button>
                        <button onClick={() => openRejectModal(r.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                          title="Reject this requisition"><ThumbsDown size={10} /> Reject</button>
                      </div>
                    ) : r.status === 'Pending' ? (
                      <span className="text-zinc-600 font-mono text-[10px] italic">Awaiting <span className="text-orange-400 not-italic">Treasurer</span></span>
                    ) : r.status === 'Reviewed' && canApprove ? (
                      <div className="flex justify-center gap-1.5 font-mono">
                        <button onClick={() => { approveRequisition(r.id); toast.success('Requisition approved'); }}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                          title="Approve this requisition"><ThumbsUp size={10} /> Approve</button>
                        <button onClick={() => openRejectModal(r.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                          title="Reject this requisition"><ThumbsDown size={10} /> Reject</button>
                      </div>
                    ) : r.status === 'Reviewed' ? (
                      <span className="text-zinc-500 font-mono text-[10px] italic">Awaiting <span className="text-sky-400 not-italic">Accounts/Manager</span></span>
                    ) : r.status === 'Approved' && (r.submittedById === activeUser?.id || r.driverId === activeUser?.id) ? (
                      <div className="flex justify-center gap-1.5 font-mono">
                        <button onClick={() => downloadPdf(r)}
                          className="px-2 py-0.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1"
                          title="Download requisition as PDF"><Download size={10} /> PDF</button>
                      </div>
                    ) : r.status === 'Approved' ? (
                      <span className="text-zinc-600 font-mono text-[10px]"><span className="text-emerald-400 font-bold">Approved</span> by {r.approvedBy || 'Accounts'}</span>
                    ) : r.status === 'Redeemed' ? (
                      <span className="text-zinc-500 font-mono text-[10px]"><span className="text-zinc-400">Redeemed</span> by: {r.driverName || r.driverId}</span>
                    ) : (
                      <span className="text-zinc-600 font-mono text-[10px] italic">{r.status}</span>
                    )}
                    {(r.status === 'Pending' || r.status === 'Reviewed') && isAccounts ? (
                      <button onClick={() => { setEditTarget(r); setEditLitres(r.litresRequested); setShowEditQtyModal(true); }}
                        className="mt-1.5 px-2 py-0.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold rounded text-[9.5px] cursor-pointer flex items-center gap-1 mx-auto"
                        title="Edit fuel quantity">
                        <span className="text-[10px]">✏️</span> Edit Qty
                      </button>
                    ) : null}
                  </div>
                )
              },
            ]}
          />
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
                      setReqCost(Math.round(litres * (reqFuelType === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel)));
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
                    title={`Computed at $${reqFuelType === 'Petrol' ? fuelPrices.petrol.toFixed(2) : fuelPrices.diesel.toFixed(2)}/Litre rate`}
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
                      setReqCost(Math.round(reqLitres * (type === 'Petrol' ? fuelPrices.petrol : fuelPrices.diesel)));
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

              {viewRequisition.status === 'Approved' && viewRequisition.redeemToken && (viewRequisition.submittedById === activeUser?.id || viewRequisition.driverId === activeUser?.id) && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 rounded text-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Redeem Token</span>
                  <p className="text-yellow-400 font-bold font-mono text-sm tracking-widest mt-1">{viewRequisition.redeemToken}</p>
                  <div className="flex justify-center mt-2">
                    <Barcode value={viewRequisition.redeemToken} className="bg-white rounded" />
                  </div>
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

              {isTreasurer && (
                <div className="pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => downloadPdf(viewRequisition)}
                    className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold rounded text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
};
