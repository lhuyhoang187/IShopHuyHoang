'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  Smartphone,
  User,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { RepairTicket, RepairStatus } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function RepairTrackingPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 text-xs">Đang tải trang tra cứu sửa chữa...</div>}>
      <RepairTrackingContent />
    </Suspense>
  );
}

function RepairTrackingContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get('code') || '';

  const [inputQuery, setInputQuery] = useState(initialCode);
  const [ticket, setTicket] = useState<RepairTicket | null | undefined>(undefined);
  const [searchedKey, setSearchedKey] = useState('');

  const handleSearch = (keyToSearch?: string) => {
    const key = (keyToSearch || inputQuery).trim();
    if (!key) return;
    setSearchedKey(key);
    const found = IShopStore.getRepairByCode(key);
    setTicket(found || null);
  };

  useEffect(() => {
    if (initialCode) {
      setInputQuery(initialCode);
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const allSteps: { key: RepairStatus; label: string; desc: string }[] = [
    { key: 'received', label: '1. Tiếp Nhận Máy', desc: 'Tiếp nhận tại quầy & in biên nhận QR Code' },
    { key: 'inspecting', label: '2. Kiểm Tra & Báo Giá', desc: 'Kỹ thuật viên test chức năng & báo giá khách duyệt' },
    { key: 'repairing', label: '3. Đang Sửa Chữa', desc: 'Xuất kho linh kiện chính hãng & thực hiện thay thế' },
    { key: 'qc_checking', label: '4. Kiểm Tra QC', desc: 'Test áp suất kháng nước, dòng sạc, camera, FaceID' },
    { key: 'ready_for_pickup', label: '5. Sẵn Sàng Giao Máy', desc: 'Máy đã sửa xong hoàn tất, chờ khách đến nhận' },
    { key: 'delivered', label: '6. Đã Bàn Giao', desc: 'Khách kiểm tra hài lòng & kích hoạt bảo hành' },
  ];

  const getStepIndex = (status: RepairStatus) => {
    const map: Record<RepairStatus, number> = {
      received: 0,
      inspecting: 1,
      repairing: 2,
      qc_checking: 3,
      ready_for_pickup: 4,
      delivered: 5,
      cancelled: -1,
    };
    return map[status] ?? 0;
  };

  const currentStepIdx = ticket ? getStepIndex(ticket.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30">
          <QrCode className="w-4 h-4" />
          <span>TRA CỨU TIẾN ĐỘ THỜI GIAN THỰC</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Theo Dõi Tiến Độ Sửa Chữa Bằng Mã QR
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Nhập mã phiếu biên nhận (VD: <strong>SC-2608-001</strong>), Số điện thoại khách hàng hoặc quét mã QR in trên phiếu để xem trực tiếp các bước xử lý kỹ thuật.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Nhập mã phiếu (SC-2608-001) hoặc số điện thoại (0912345678)..."
              className="w-full pl-4 pr-10 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono text-sm sm:text-base"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                Xóa
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-105"
          >
            <Search className="w-4 h-4" />
            <span>Tra Cứu Tiến Độ</span>
          </button>
        </form>

        {/* Quick Click Samples */}
        <div className="pt-2">
          <span className="text-xs text-gray-400 font-semibold block mb-2">
            Thử nghiệm nhanh bằng các phiếu mẫu thực tế:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setInputQuery('SC-2608-001');
                handleSearch('SC-2608-001');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 border border-white/10 text-xs font-mono font-semibold transition-colors"
            >
              SC-2608-001 (iPhone 15 Pro Max - Đang sửa)
            </button>
            <button
              onClick={() => {
                setInputQuery('SC-2608-002');
                handleSearch('SC-2608-002');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border border-white/10 text-xs font-mono font-semibold transition-colors"
            >
              SC-2608-002 (iPhone 13 Pro Max - Sẵn sàng giao)
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Result Details */}
      {ticket !== undefined && (
        <div className="animate-in fade-in duration-300">
          {ticket ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-8">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                      {ticket.ticketCode}
                    </span>
                    <span className="text-xs text-gray-400">Tiếp nhận: {ticket.receivedAt}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {ticket.deviceModel}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    IMEI/Serial: {ticket.imeiOrSerial} • Khách hàng: {ticket.customerName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Tổng chi phí sửa chữa:</span>
                  <span className="text-2xl font-black text-amber-400">
                    {formatVND(ticket.totalAmount)}
                  </span>
                </div>
              </div>

              {/* 6-Step Stepper */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Quy Trình 6 Bước Xử Lý Kỹ Thuật</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allSteps.map((step, idx) => {
                    const isDone = idx < currentStepIdx || ticket.status === 'delivered';
                    const isCurrent = idx === currentStepIdx && ticket.status !== 'delivered';
                    const matchedHistory = ticket.statusHistory.find((h) => h.step === step.key);

                    return (
                      <div
                        key={step.key}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                            : isDone
                            ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                            : 'bg-white/[0.02] border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-black'
                                  : isCurrent
                                  ? 'bg-amber-500 text-black animate-pulse'
                                  : 'bg-white/10 text-gray-400'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-amber-300'
                                  : isDone
                                  ? 'text-emerald-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>

                          {matchedHistory && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {matchedHistory.time.split(' ')[1]}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 ml-8">{step.desc}</p>

                        {matchedHistory?.note && (
                          <div className="mt-2 ml-8 p-2 rounded-xl bg-black/40 text-[11px] text-gray-300 border border-white/5">
                            <strong>Ghi chú:</strong> {matchedHistory.note}
                            {matchedHistory.actor && (
                              <span className="text-gray-500 ml-2">({matchedHistory.actor})</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hardware Details & Parts Used */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Parts Used */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[11px]">
                    <Cpu className="w-4 h-4" />
                    <span>Linh Kiện Xuất Kho Sử Dụng:</span>
                  </div>
                  {ticket.partsUsed.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.partsUsed.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5">
                          <span className="text-white font-medium">{p.partName}</span>
                          <span className="text-amber-400 font-bold">{formatVND(p.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Đang kiểm tra, chưa xuất linh kiện.</p>
                  )}
                </div>

                {/* Device Diagnostics & Warranty */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Chẩn Đoán & Bảo Hành:</span>
                  </div>
                  <p className="text-gray-300">
                    <strong>Tình trạng máy:</strong> {ticket.issueDescription}
                  </p>
                  <p className="text-gray-300">
                    <strong>Ngoại quan:</strong> {ticket.appearanceCondition}
                  </p>
                  <p className="text-emerald-400 font-medium">
                    <strong>Gói bảo hành:</strong> {ticket.warrantyPeriod}
                  </p>
                </div>
              </div>

              {/* Technician In Charge */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-gray-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>
                    Kỹ thuật viên phụ trách: <strong className="text-white">{ticket.technicianName || 'Trần Trọng Nghĩa'}</strong>
                  </span>
                </div>
                <span>Dự kiến hoàn thành: <strong className="text-white">{ticket.estimatedDeliveryDate}</strong></span>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 border border-red-500/30 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                Không Tìm Thấy Phiếu Sửa Chữa Cho: &quot;{searchedKey}&quot;
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Vui lòng kiểm tra lại mã phiếu in trên biên nhận (dạng SC-xxxx-xxx) hoặc số điện thoại khi gửi máy.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
