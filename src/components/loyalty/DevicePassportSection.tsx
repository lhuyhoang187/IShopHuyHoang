'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  ShieldCheck,
  Wrench,
  Calendar,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Sparkles,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { RegisteredDevice, RepairTicket } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

interface DevicePassportSectionProps {
  customerPhone: string;
  customerName: string;
}

export function DevicePassportSection({
  customerPhone,
  customerName,
}: DevicePassportSectionProps) {
  const devices = IShopStore.getRegisteredDevices(customerPhone);
  const allRepairs = IShopStore.getRepairs();
  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(null);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Hồ Sơ Thiết Bị Thống Nhất (Unified Device Passport)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                MÃ IMEI XUYÊN SUỐT
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý trọn vòng đời thiết bị: Từ lúc mua mới đến các lần bảo hành và sửa chữa iCare - Tất cả đồng bộ bằng <strong>1 mã IMEI duy nhất</strong>.
            </p>
          </div>
        </div>

        <Link
          href="/repair-progress"
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Tra Cứu Mã IMEI Trực Tuyến</span>
        </Link>
      </div>

      {/* Danh Sách Thiết Bị Của Khách Hàng */}
      {devices.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-xs">Chưa có thiết bị nào được đăng ký dưới số điện thoại này.</p>
          <p className="text-[11px] text-slate-500">
            Khi quý khách mua điện thoại tại iShop, máy sẽ tự động liên kết với mã IMEI và xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {devices.map((device) => {
            // Lấy các phiếu sửa chữa của đúng chiếc máy này (khớp IMEI)
            const deviceRepairs = allRepairs.filter(
              (r) =>
                r.imeiOrSerial.trim() === device.imei.trim() ||
                device.repairHistoryCodes.includes(r.ticketCode)
            );

            const isWarrantyValid = new Date(device.warrantyExpiryDate).getTime() > Date.now();

            return (
              <div
                key={device.id}
                className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-b from-slate-50/50 to-white hover:border-slate-300 transition-all shadow-sm space-y-4"
              >
                {/* Header Máy */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{device.productName}</h4>
                      <p className="text-xs text-slate-500">
                        {device.color ? `${device.color} • ` : ''}
                        {device.capacity || ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      isWarrantyValid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isWarrantyValid ? 'Đang Bảo Hành' : 'Hết Bảo Hành'}
                  </span>
                </div>

                {/* Khối Mã Định Danh Thống Nhất IMEI */}
                <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono uppercase tracking-wider font-bold">MÃ IMEI / PRODUCT ID DUY NHẤT:</span>
                    <span className="text-emerald-400 font-bold">CHUẨN ĐỒNG BỘ 100%</span>
                  </div>
                  <div className="font-mono text-base font-black tracking-widest text-amber-300 select-all">
                    {device.imei}
                  </div>
                </div>

                {/* Thông tin mua máy ban đầu */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-600 block font-medium">Hóa đơn mua hàng:</span>
                    <strong className="text-slate-900 font-mono">{device.purchaseInvoiceCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block font-medium">Ngày kích hoạt:</span>
                    <strong className="text-slate-900">
                      {new Date(device.purchaseDate).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block font-medium">Giá mua máy:</span>
                    <strong className="text-amber-700 font-black">{formatVND(device.purchasePrice)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block font-medium">Hạn bảo hành Apple:</span>
                    <strong className="text-slate-900">
                      {new Date(device.warrantyExpiryDate).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                </div>

                {/* Lịch Sử Sửa Chữa Của Chiếc Máy Này */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lịch sử sửa chữa iCare ({deviceRepairs.length} lần):</span>
                    </span>
                  </div>

                  {deviceRepairs.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Máy nguyên bản 100%, chưa từng qua sửa chữa hoặc can thiệp kỹ thuật.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {deviceRepairs.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700">{rep.ticketCode}</span>
                              <span className="text-[10px] text-slate-400">&bull;</span>
                              <span className="text-[11px] font-medium text-slate-700">{rep.issueDescription}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Ngày tiếp nhận: {rep.receivedAt.substring(0, 10)} &bull; Chi phí: {formatVND(rep.totalAmount)}
                            </span>
                          </div>

                          <Link
                            href={`/repair-progress?code=${rep.ticketCode}`}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] hover:bg-blue-100 transition shrink-0"
                          >
                            Xem Chi Tiết
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
