'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  QrCode,
  CheckCircle2,
  Clock,
  Cpu,
  User,
  X,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Activity,
  Zap,
  Download,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { RepairTicket, RepairStatus, SparePartItem } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportRepairsCsv } from '@/lib/exportUtils';

export default function AdminRepairsPage() {
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Intake Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deviceModel: 'iPhone 15 Pro Max',
    imeiOrSerial: '',
    unlockPasscode: '',
    appearanceCondition: 'Màn hình nứt kính, viền xước nhẹ',
    accessoriesIncluded: 'Không phụ kiện kèm theo, đã tháo SIM',
    issueDescription: 'Rơi va đập, màn hình sọc xanh loạn cảm ứng',
    laborFee: 200000,
    estimatedDeliveryDate: '2026-08-28 16:00:00',
    technicianName: 'Trần Trọng Nghĩa',
    warrantyPeriod: 'Bảo hành 06 tháng',
  });

  // Action / Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [stepNote, setStepNote] = useState('');

  // Print Receipt Modal
  const [printTicket, setPrintTicket] = useState<RepairTicket | null>(null);

  const loadData = () => {
    setRepairs(IShopStore.getRepairs());
    setSpareParts(IShopStore.getSpareParts());

    // Sync live from MySQL Database
    fetch('/api/repairs')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setRepairs(json.data);
        }
      })
      .catch((err) => console.warn('Repairs API notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Post to live MySQL Database
    try {
      await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: intakeForm.customerName,
          customerPhone: intakeForm.customerPhone,
          customerAddress: intakeForm.customerAddress,
          deviceModel: intakeForm.deviceModel,
          imeiOrSerial: intakeForm.imeiOrSerial || 'Chưa rõ',
          unlockPasscode: intakeForm.unlockPasscode || 'Không có',
          appearanceCondition: intakeForm.appearanceCondition,
          accessoriesIncluded: intakeForm.accessoriesIncluded,
          issueDescription: intakeForm.issueDescription,
          laborFee: Number(intakeForm.laborFee) || 0,
          estimatedDeliveryDate: intakeForm.estimatedDeliveryDate,
        }),
      });
    } catch (err) {
      console.warn('API repair ticket notice:', err);
    }

    // 2. Also save to client store for immediate receipt printing
    const created = IShopStore.createRepairTicket({
      customerName: intakeForm.customerName,
      customerPhone: intakeForm.customerPhone,
      customerAddress: intakeForm.customerAddress,
      deviceModel: intakeForm.deviceModel,
      imeiOrSerial: intakeForm.imeiOrSerial || 'Chưa rõ',
      unlockPasscode: intakeForm.unlockPasscode || 'Không có',
      appearanceCondition: intakeForm.appearanceCondition,
      accessoriesIncluded: intakeForm.accessoriesIncluded,
      issueDescription: intakeForm.issueDescription,
      status: 'received',
      laborFee: Number(intakeForm.laborFee) || 0,
      estimatedDeliveryDate: intakeForm.estimatedDeliveryDate,
      receivedAt: now,
      technicianName: intakeForm.technicianName,
      warrantyPeriod: intakeForm.warrantyPeriod,
    });

    setIsCreateModalOpen(false);
    setPrintTicket(created);
    loadData();
  };

  const handleUpdateStep = (newStatus: RepairStatus) => {
    if (!selectedTicket) return;
    const actor = 'KTV ' + (selectedTicket.technicianName || 'Nghĩa');
    IShopStore.updateRepairStatus(
      selectedTicket.id,
      newStatus,
      stepNote,
      actor
    );

    // Sync to MySQL Database via PUT /api/repairs
    fetch('/api/repairs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedTicket.id,
        ticketCode: selectedTicket.ticketCode,
        status: newStatus,
        note: stepNote,
        actor,
      }),
    }).catch((err) => console.warn('Failed to sync repair status to MySQL:', err));

    setStepNote('');
    // Refresh active ticket view
    const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
    if (updated) setSelectedTicket(updated);
  };

  const handleUseSparePart = () => {
    if (!selectedTicket || !selectedPartId) return;
    try {
      IShopStore.consumeSparePart(selectedTicket.id, selectedPartId, 1);
      setSelectedPartId('');
      const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
      if (updated) {
        setSelectedTicket(updated);

        // Sync to MySQL Database with partsUsed
        fetch('/api/repairs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updated.id,
            ticketCode: updated.ticketCode,
            partsUsed: updated.partsUsed,
            laborFee: updated.laborFee,
          }),
        }).catch((err) => console.warn('Failed to sync partsUsed to MySQL:', err));
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất linh kiện');
    }
  };

  const filteredRepairs = repairs
    .filter((r) => (filterStatus === 'all' ? true : r.status === filterStatus))
    .filter(
      (r) =>
        r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerPhone.includes(searchQuery.trim()) ||
        r.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const statusBadge: Record<RepairStatus, { label: string; color: string }> = {
    received: { label: '1. Tiếp nhận', color: 'bg-sky-50 text-sky-700 border border-sky-200' },
    inspecting: { label: '2. Kiểm tra/Báo giá', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
    repairing: { label: '3. Đang sửa', color: 'bg-amber-50 text-amber-800 border border-amber-300' },
    qc_checking: { label: '4. Kiểm tra QC', color: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
    ready_for_pickup: { label: '5. Sẵn sàng giao', color: 'bg-emerald-50 text-emerald-800 border border-emerald-300' },
    delivered: { label: '6. Đã bàn giao', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
    cancelled: { label: 'Hủy sửa', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Phân Hệ Kỹ Thuật</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Bàn Sửa Chữa iCare Lab 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Wrench className="w-6 h-6 text-amber-600" />
            <span>Phân Hệ Kỹ Thuật &amp; Sửa Chữa (iCare Desk)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Tiếp nhận trong 30s, in phiếu K80 có Mã QR, xuất kho linh kiện và quản lý 6 bước kỹ thuật.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportRepairsCsv(filteredRepairs)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Xuất danh sách phiếu sửa chữa ra file Excel CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Lập Biên Nhận Máy Mới (30 Giây)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu (SC-xxxx), tên khách, SĐT, dòng máy..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'received', label: 'Tiếp nhận' },
            { key: 'inspecting', label: 'Báo giá' },
            { key: 'repairing', label: 'Đang sửa' },
            { key: 'ready_for_pickup', label: 'Sẵn sàng' },
            { key: 'delivered', label: 'Đã giao' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                filterStatus === item.key
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
              <tr>
                <th className="p-4 sm:p-5">Mã Phiếu &amp; Ngày</th>
                <th className="p-4 sm:p-5">Khách Hàng</th>
                <th className="p-4 sm:p-5">Thiết Bị &amp; Mật Khẩu</th>
                <th className="p-4 sm:p-5">Tình Trạng Lỗi</th>
                <th className="p-4 sm:p-5">Trạng Thái Kỹ Thuật</th>
                <th className="p-4 sm:p-5 text-right">Chi Phí</th>
                <th className="p-4 sm:p-5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 sm:p-5 font-mono">
                    <span className="font-bold text-amber-700 block text-sm">{ticket.ticketCode}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{ticket.receivedAt.split(' ')[0]}</span>
                  </td>

                  <td className="p-4 sm:p-5">
                    <span className="font-bold text-slate-900 block text-sm">{ticket.customerName}</span>
                    <span className="text-xs text-blue-600 font-mono font-bold">{ticket.customerPhone}</span>
                  </td>

                  <td className="p-4 sm:p-5">
                    <span className="font-bold text-slate-900 block">{ticket.deviceModel}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Pass: <strong className="text-slate-800">{ticket.unlockPasscode}</strong>
                    </span>
                  </td>

                  <td className="p-4 sm:p-5 max-w-[200px]">
                    <p className="text-xs text-slate-800 truncate font-semibold" title={ticket.issueDescription}>
                      {ticket.issueDescription}
                    </p>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {ticket.appearanceCondition}
                    </span>
                  </td>

                  <td className="p-4 sm:p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        statusBadge[ticket.status].color
                      }`}
                    >
                      {statusBadge[ticket.status].label}
                    </span>
                  </td>

                  <td className="p-4 sm:p-5 text-right font-black text-slate-900 font-mono text-sm">
                    {formatVND(ticket.totalAmount)}
                  </td>

                  <td className="p-4 sm:p-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Xử lý
                      </button>
                      <button
                        onClick={() => setPrintTicket(ticket)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        title="In phiếu biên nhận K80 có QR"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRepairs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 text-xs font-mono">
                    Không tìm thấy phiếu sửa chữa nào khớp với tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal Lập Biên Nhận 30 Giây (Intake Form) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Tiếp Nhận Sửa Chữa Tại Quầy (30s)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Tên khách hàng *:</label>
                  <input
                    type="text"
                    required
                    value={intakeForm.customerName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Số điện thoại *:</label>
                  <input
                    type="tel"
                    required
                    value={intakeForm.customerPhone}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerPhone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-700 font-mono font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Model máy *:</label>
                  <input
                    type="text"
                    required
                    value={intakeForm.deviceModel}
                    onChange={(e) => setIntakeForm({ ...intakeForm, deviceModel: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Số IMEI/Serial:</label>
                  <input
                    type="text"
                    value={intakeForm.imeiOrSerial}
                    onChange={(e) => setIntakeForm({ ...intakeForm, imeiOrSerial: e.target.value })}
                    placeholder="15 số IMEI..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Mật khẩu mở máy:</label>
                  <input
                    type="text"
                    value={intakeForm.unlockPasscode}
                    onChange={(e) => setIntakeForm({ ...intakeForm, unlockPasscode: e.target.value })}
                    placeholder="VD: 123456 (hoặc vẽ L)"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1.5 block">Tình trạng lỗi cần xử lý *:</label>
                <textarea
                  rows={2}
                  required
                  value={intakeForm.issueDescription}
                  onChange={(e) => setIntakeForm({ ...intakeForm, issueDescription: e.target.value })}
                  placeholder="Rơi nứt kính, sọc màn hình, pin chai phồng, sạc không vào..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Ngoại quan &amp; phụ kiện gửi kèm:</label>
                  <input
                    type="text"
                    value={intakeForm.appearanceCondition}
                    onChange={(e) => setIntakeForm({ ...intakeForm, appearanceCondition: e.target.value })}
                    placeholder="Móp góc, trầy viền, không phụ kiện..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Tiền công dịch vụ (ước tính):</label>
                  <input
                    type="number"
                    value={intakeForm.laborFee}
                    onChange={(e) => setIntakeForm({ ...intakeForm, laborFee: Number(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-bold font-mono text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Kỹ thuật viên phụ trách:</label>
                  <input
                    type="text"
                    value={intakeForm.technicianName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, technicianName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1.5 block">Dự kiến giao máy:</label>
                  <input
                    type="text"
                    value={intakeForm.estimatedDeliveryDate}
                    onChange={(e) => setIntakeForm({ ...intakeForm, estimatedDeliveryDate: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>XÁC NHẬN TIẾP NHẬN &amp; IN BIÊN NHẬN QR CODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Xử Lý Kỹ Thuật: Chuyển bước & Xuất linh kiện */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  {selectedTicket.ticketCode}
                </span>
                <h3 className="font-black text-slate-900 text-base mt-2">
                  {selectedTicket.deviceModel} - {selectedTicket.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Change Status Step */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Chuyển Bước Kỹ Thuật:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {(
                  [
                    'received',
                    'inspecting',
                    'repairing',
                    'qc_checking',
                    'ready_for_pickup',
                    'delivered',
                  ] as RepairStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStep(st)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedTicket.status === st
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {statusBadge[st].label}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  value={stepNote}
                  onChange={(e) => setStepNote(e.target.value)}
                  placeholder="Ghi chú bước kỹ thuật (VD: Đã test áp suất đạt, thay pin xong...)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Spare Parts Deduct From Inventory */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Xuất Kho Linh Kiện Vào Phiếu:</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn linh kiện từ kho ({spareParts.length} mục) --</option>
                  {spareParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tồn: {p.stock} {p.unit} - Giá {formatVND(p.retailRepairPrice)})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleUseSparePart}
                  disabled={!selectedPartId}
                  className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Xuất kho (-1)
                </button>
              </div>

              {/* List of parts already used */}
              {selectedTicket.partsUsed.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[11px] font-semibold">Linh kiện đã dùng:</span>
                  {selectedTicket.partsUsed.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-800 font-medium">{p.partName}</span>
                      <span className="text-amber-700 font-black font-mono">{formatVND(p.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total summary & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Tổng chi phí sửa chữa:</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatVND(selectedTicket.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintTicket(selectedTicket)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu K80 (QR)</span>
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Printable Repair Receipt Modal with QR Code */}
      {printTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-black text-slate-900">Phiếu Tiếp Nhận Sửa Chữa (K80)</span>
              <button
                onClick={() => setPrintTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable K80 Repair Canvas */}
            <div
              id="printable-repair-receipt"
              className="bg-white text-black p-5 rounded-2xl mx-auto font-mono text-[11px] max-w-[320px] border border-slate-200 shadow-sm"
            >
              <div className="text-center space-y-1 pb-3 border-b border-black border-dashed">
                <h2 className="font-bold text-sm uppercase">iShop Huy Hoàng - iCare</h2>
                <p className="text-[9px]">168 Đường 3/2, Q.10 &amp; 45 Lê Văn Việt, TP. Thủ Đức</p>
                <p className="text-[9px]">Hotline: 0988.888.999</p>
                <h3 className="font-bold text-xs mt-2 uppercase">PHIẾU BIÊN NHẬN SỬA CHỮA</h3>
                <p className="text-[10px] font-bold">MÃ PHIẾU: {printTicket.ticketCode}</p>
                <p className="text-[9px]">Ngày nhận: {printTicket.receivedAt}</p>
              </div>

              <div className="py-2 space-y-1 border-b border-black border-dashed text-[10px]">
                <p>Khách hàng: <strong>{printTicket.customerName}</strong></p>
                <p>SĐT: <strong>{printTicket.customerPhone}</strong></p>
                <p>Model: <strong>{printTicket.deviceModel}</strong></p>
                <p>IMEI: {printTicket.imeiOrSerial}</p>
                <p>Mật khẩu máy: <strong>{printTicket.unlockPasscode}</strong></p>
                <p>Ngoại quan: {printTicket.appearanceCondition}</p>
                <p>Lỗi ghi nhận: <strong>{printTicket.issueDescription}</strong></p>
                <p>KTV phụ trách: {printTicket.technicianName}</p>
                <p>Hẹn trả máy: <strong>{printTicket.estimatedDeliveryDate}</strong></p>
              </div>

              <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Tiền công:</span>
                  <span>{formatVND(printTicket.laborFee)}</span>
                </div>
                {printTicket.partsUsed.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>+ {p.partName}:</span>
                    <span>{formatVND(p.unitPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black border-dashed">
                  <span>TỔNG CHI PHÍ:</span>
                  <span>{formatVND(printTicket.totalAmount)}</span>
                </div>
              </div>

              {/* QR Code in receipt for live tracking */}
              <div className="py-3 text-center space-y-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `https://ishophuyhoang.vn/repair/tracking?code=${printTicket.ticketCode}`
                  )}`}
                  alt="QR Tra cứu"
                  className="w-28 h-28 mx-auto"
                />
                <p className="text-[9px] font-bold">QUÉT MÃ QR ĐỂ XEM TIẾN ĐỘ THỜI GIAN THỰC</p>
                <p className="text-[8px] italic text-gray-700">
                  {printTicket.warrantyPeriod}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>In Phiếu K80 (Ctrl + P)</span>
              </button>
              <button
                onClick={() => setPrintTicket(null)}
                className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
