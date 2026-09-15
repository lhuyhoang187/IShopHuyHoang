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
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { RepairTicket, RepairStatus, SparePartItem } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

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
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

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
  };

  const handleUpdateStep = (newStatus: RepairStatus) => {
    if (!selectedTicket) return;
    IShopStore.updateRepairStatus(
      selectedTicket.id,
      newStatus,
      stepNote,
      'KTV ' + (selectedTicket.technicianName || 'Nghĩa')
    );
    setStepNote('');
    // Refresh active ticket view
    const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
    if (updated) setSelectedTicket(updated);
  };

  const handleUseSparePart = () => {
    if (!selectedTicket || !selectedPartId) return;
    try {
      IShopStore.useSparePart(selectedTicket.id, selectedPartId, 1);
      setSelectedPartId('');
      const updated = IShopStore.getRepairByCode(selectedTicket.ticketCode);
      if (updated) setSelectedTicket(updated);
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
    received: { label: '1. Tiếp nhận', color: 'badge-glow-cyan' },
    inspecting: { label: '2. Kiểm tra/Báo giá', color: 'badge-glow-violet' },
    repairing: { label: '3. Đang sửa', color: 'badge-glow-gold' },
    qc_checking: { label: '4. Kiểm tra QC', color: 'badge-glow-cyan' },
    ready_for_pickup: { label: '5. Sẵn sàng giao', color: 'badge-glow-emerald' },
    delivered: { label: '6. Đã bàn giao', color: 'bg-white/10 text-gray-400 border border-white/10' },
    cancelled: { label: 'Hủy sửa', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Phân Hệ Kỹ Thuật & Sửa Chữa (iCare Desk)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">
            Tiếp nhận trong 30s, in phiếu K80 có Mã QR, xuất kho linh kiện và quản lý 6 bước kỹ thuật.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Lập Biên Nhận Máy Mới (30 Giây)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-3xl border-white/[0.08] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu (SC-xxxx), tên khách, SĐT, dòng máy..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
          />
        </div>

        {/* Status Filters with 2026 Pills */}
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
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                filterStatus === item.key
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/[0.03] text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Repairs Table */}
      <div className="glass-panel rounded-3xl border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#070b14]/90 text-gray-400 uppercase text-[11px] border-b border-white/[0.08] font-bold">
              <tr>
                <th className="p-4 sm:p-5">Mã Phiếu & Ngày</th>
                <th className="p-4 sm:p-5">Khách Hàng</th>
                <th className="p-4 sm:p-5">Thiết Bị & Mật Khẩu</th>
                <th className="p-4 sm:p-5">Tình Trạng Lỗi</th>
                <th className="p-4 sm:p-5">Trạng Thái Kỹ Thuật</th>
                <th className="p-4 sm:p-5 text-right">Chi Phí</th>
                <th className="p-4 sm:p-5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredRepairs.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 sm:p-5 font-mono">
                    <span className="font-bold text-amber-400 block">{ticket.ticketCode}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{ticket.receivedAt.split(' ')[0]}</span>
                  </td>

                  <td className="p-4 sm:p-5">
                    <span className="font-bold text-white block">{ticket.customerName}</span>
                    <span className="text-xs text-gray-400 font-mono">{ticket.customerPhone}</span>
                  </td>

                  <td className="p-4 sm:p-5">
                    <span className="font-bold text-white block">{ticket.deviceModel}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Pass: <strong className="text-amber-300">{ticket.unlockPasscode}</strong>
                    </span>
                  </td>

                  <td className="p-4 sm:p-5 max-w-[200px]">
                    <p className="text-xs text-gray-300 truncate font-medium" title={ticket.issueDescription}>
                      {ticket.issueDescription}
                    </p>
                    <span className="text-[10px] text-gray-500 truncate block">
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

                  <td className="p-4 sm:p-5 text-right font-black text-amber-400">
                    {formatVND(ticket.totalAmount)}
                  </td>

                  <td className="p-4 sm:p-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-black text-cyan-300 text-xs font-bold transition-all"
                      >
                        Xử lý
                      </button>
                      <button
                        onClick={() => setPrintTicket(ticket)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 transition-colors"
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
                  <td colSpan={7} className="p-12 text-center text-gray-500 text-xs font-mono">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c1220] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Tiếp Nhận Sửa Chữa Tại Quầy (30s)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Tên khách hàng *:</label>
                  <input
                    type="text"
                    required
                    value={intakeForm.customerName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Số điện thoại *:</label>
                  <input
                    type="tel"
                    required
                    value={intakeForm.customerPhone}
                    onChange={(e) => setIntakeForm({ ...intakeForm, customerPhone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Model máy *:</label>
                  <input
                    type="text"
                    required
                    value={intakeForm.deviceModel}
                    onChange={(e) => setIntakeForm({ ...intakeForm, deviceModel: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max"
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Số IMEI/Serial:</label>
                  <input
                    type="text"
                    value={intakeForm.imeiOrSerial}
                    onChange={(e) => setIntakeForm({ ...intakeForm, imeiOrSerial: e.target.value })}
                    placeholder="15 số IMEI..."
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Mật khẩu mở máy:</label>
                  <input
                    type="text"
                    value={intakeForm.unlockPasscode}
                    onChange={(e) => setIntakeForm({ ...intakeForm, unlockPasscode: e.target.value })}
                    placeholder="VD: 123456 (hoặc vẽ L)"
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold mb-1.5 block">Tình trạng lỗi cần xử lý *:</label>
                <textarea
                  rows={2}
                  required
                  value={intakeForm.issueDescription}
                  onChange={(e) => setIntakeForm({ ...intakeForm, issueDescription: e.target.value })}
                  placeholder="Rơi nứt kính, sọc màn hình, pin chai phồng, sạc không vào..."
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Ngoại quan & phụ kiện gửi kèm:</label>
                  <input
                    type="text"
                    value={intakeForm.appearanceCondition}
                    onChange={(e) => setIntakeForm({ ...intakeForm, appearanceCondition: e.target.value })}
                    placeholder="Móp góc, trầy viền, không phụ kiện..."
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Tiền công dịch vụ (ước tính):</label>
                  <input
                    type="number"
                    value={intakeForm.laborFee}
                    onChange={(e) => setIntakeForm({ ...intakeForm, laborFee: Number(e.target.value) || 0 })}
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-amber-400 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Kỹ thuật viên phụ trách:</label>
                  <input
                    type="text"
                    value={intakeForm.technicianName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, technicianName: e.target.value })}
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold mb-1.5 block">Dự kiến giao máy:</label>
                  <input
                    type="text"
                    value={intakeForm.estimatedDeliveryDate}
                    onChange={(e) => setIntakeForm({ ...intakeForm, estimatedDeliveryDate: e.target.value })}
                    className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-gold w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl"
                >
                  <Printer className="w-4 h-4 text-black" />
                  <span>XÁC NHẬN TIẾP NHẬN & IN BIÊN NHẬN QR CODE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Xử Lý Kỹ Thuật: Chuyển bước & Xuất linh kiện */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c1220] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                  {selectedTicket.ticketCode}
                </span>
                <h3 className="font-black text-white text-base mt-2">
                  {selectedTicket.deviceModel} - {selectedTicket.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Change Status Step */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
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
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      selectedTicket.status === st
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
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
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Spare Parts Deduct From Inventory */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Xuất Kho Linh Kiện Vào Phiếu:</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="flex-1 p-3 bg-[#070b14] border border-white/15 rounded-xl text-xs text-white focus:outline-none"
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
                  className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Xuất kho (-1)
                </button>
              </div>

              {/* List of parts already used */}
              {selectedTicket.partsUsed.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                  <span className="text-gray-400 block text-[11px] font-semibold">Linh kiện đã dùng:</span>
                  {selectedTicket.partsUsed.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl">
                      <span className="text-white font-medium">{p.partName}</span>
                      <span className="text-amber-400 font-bold">{formatVND(p.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total summary & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
              <div>
                <span className="text-gray-400 block">Tổng chi phí sửa chữa:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatVND(selectedTicket.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintTicket(selectedTicket)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu K80 (QR)</span>
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-gold px-5 py-3 rounded-xl text-xs font-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] no-print">
              <span className="text-xs font-bold text-white">Phiếu Tiếp Nhận Sửa Chữa</span>
              <button
                onClick={() => setPrintTicket(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable K80 Repair Canvas */}
            <div
              id="printable-repair-receipt"
              className="bg-white text-black p-5 rounded-2xl mx-auto font-mono text-[11px] max-w-[320px] shadow-inner"
            >
              <div className="text-center space-y-1 pb-3 border-b border-black border-dashed">
                <h2 className="font-bold text-sm uppercase">iShop Huy Hoàng - iCare</h2>
                <p className="text-[9px]">168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức</p>
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
                className="btn-gold flex-1 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>In Phiếu K80 (Ctrl + P)</span>
              </button>
              <button
                onClick={() => setPrintTicket(null)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
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
