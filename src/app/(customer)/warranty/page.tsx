'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Smartphone,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneStockItem } from '@/lib/types';

export default function WarrantyPage() {
  const [imeiInput, setImeiInput] = useState('');
  const [result, setResult] = useState<PhoneStockItem | null | undefined>(undefined);
  const [searchedImei, setSearchedImei] = useState('');

  const handleSearch = (imeiToSearch?: string) => {
    const query = (imeiToSearch || imeiInput).trim();
    if (!query) return;
    setSearchedImei(query);
    const item = IShopStore.lookupImei(query);
    setResult(item || null);
  };

  const sampleImeis = [
    { imei: '358921104999888', label: 'iPhone 16 Pro Max (Đang bảo hành)', status: 'Đã bán' },
    { imei: '358921104829104', label: 'iPhone 16 Pro Max Sa Mạc (Chưa kích hoạt)', status: 'Máy mới' },
    { imei: '357288102948201', label: 'Samsung S24 Ultra Xám (Chưa kích hoạt)', status: 'Máy mới' },
  ];

  // Calculate warranty expiry
  let isExpired = false;
  let remainingDays = 0;
  let expiryDateString = '';

  if (result && result.soldAt) {
    const soldDate = new Date(result.soldAt);
    const expiryDate = new Date(soldDate);
    expiryDate.setMonth(expiryDate.getMonth() + (result.warrantyMonths || 12));
    expiryDateString = expiryDate.toISOString().substring(0, 10);

    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = remainingDays <= 0;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-glow-gold text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>HỆ THỐNG TRA CỨU BẢO HÀNH ĐIỆN TỬ 2026</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Tra Cứu Bảo Hành Theo Số IMEI
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto font-light">
          Mỗi chiếc điện thoại tại iShop Huy Hoàng đều được quản lý bằng số IMEI 15 chữ số duy nhất, kích hoạt bảo hành điện tử chính ngạch ngay khi xuất bán tại quầy POS.
        </p>
      </div>

      {/* Search Input Box with Cyber Glow */}
      <div className="glass-panel rounded-3xl p-6 sm:p-9 border-white/[0.12] shadow-2xl space-y-5">
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
              value={imeiInput}
              onChange={(e) => setImeiInput(e.target.value)}
              placeholder="Nhập 15 chữ số IMEI của máy (VD: 358921104999888)..."
              className="w-full pl-5 pr-12 py-4 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono text-sm sm:text-base transition-colors"
              maxLength={18}
            />
            {imeiInput && (
              <button
                type="button"
                onClick={() => setImeiInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-semibold"
              >
                Xóa
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-gold w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4 text-black" />
            <span>Tra Cứu Ngay</span>
          </button>
        </form>

        {/* Quick test sample IMEI links */}
        <div className="pt-2">
          <span className="text-xs text-gray-400 font-bold block mb-2.5">
            Mẫu IMEI để bạn thử nghiệm nhanh:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleImeis.map((item) => (
              <button
                key={item.imei}
                type="button"
                onClick={() => {
                  setImeiInput(item.imei);
                  handleSearch(item.imei);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-amber-500/15 text-gray-300 hover:text-amber-300 border border-white/[0.08] hover:border-amber-400/40 text-xs text-left transition-all"
              >
                <span className="font-mono font-bold">{item.imei}</span>
                <span className="text-[10px] text-gray-400 ml-1.5 font-medium">({item.label})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Display: Cyber Tech Certificate Card */}
      {result !== undefined && (
        <div className="animate-in fade-in duration-300">
          {result ? (
            <div className="glass-panel rounded-3xl p-7 sm:p-9 border-amber-500/30 shadow-[0_0_40px_rgba(226,183,116,0.15)] space-y-7 relative overflow-hidden bg-gradient-to-b from-[#0a101f] to-[#06080f]">
              {/* Card top banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-300 flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(226,183,116,0.2)]">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                      CHỨNG NHẬN BẢO HÀNH ĐIỆN TỬ
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {result.phoneName}
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">IMEI: {result.imei}</p>
                  </div>
                </div>

                <div>
                  {result.status === 'sold' ? (
                    isExpired ? (
                      <span className="px-4 py-2 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        ĐÃ HẾT HẠN BẢO HÀNH
                      </span>
                    ) : (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-xs">
                          ✓
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                            BẢO HÀNH CÒN HIỆU LỰC
                          </span>
                          <span className="text-sm font-black text-white">
                            Còn {remainingDays} ngày
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      MÁY MỚI 100% CHƯA KÍCH HOẠT
                    </span>
                  )}
                </div>
              </div>

              {/* Warranty Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400">Phiên bản & Màu sắc:</span>
                  <p className="text-sm font-bold text-white">
                    {result.color} • Dung lượng {result.capacity}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400">Thời hạn gói bảo hành:</span>
                  <p className="text-sm font-bold text-white">
                    {result.warrantyMonths} Tháng Chính Hãng (1 đổi 1 trong 30 ngày)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400">Ngày kích hoạt / Mua máy:</span>
                  <p className="text-sm font-bold text-white">
                    {result.soldAt ? result.soldAt : 'Chưa xuất bán (Sẵn sàng kích hoạt)'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400">Ngày hết hạn bảo hành:</span>
                  <p className="text-sm font-bold text-amber-400">
                    {expiryDateString ? expiryDateString : '12 tháng kể từ ngày mua'}
                  </p>
                </div>

                {result.soldToCustomerName && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-gray-400">Chủ sở hữu máy:</span>
                    <p className="text-sm font-bold text-white">
                      {result.soldToCustomerName} ({result.soldToCustomerPhone?.slice(0, 4)}***{result.soldToCustomerPhone?.slice(-3)})
                    </p>
                  </div>
                )}

                {result.soldInvoiceId && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-gray-400">Mã hóa đơn mua hàng POS:</span>
                    <p className="text-sm font-bold text-cyan-400 font-mono">
                      {result.soldInvoiceId}
                    </p>
                  </div>
                )}
              </div>

              {/* Service Center Info */}
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-gray-300">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Trung tâm bảo hành iShop: 168 Đường 3/2, Quận 10 & 45 Lê Văn Việt, TP. Thủ Đức
                  </span>
                </div>
                <a
                  href="tel:0988888999"
                  className="font-bold text-white hover:text-cyan-400 shrink-0 font-mono"
                >
                  Hotline: 0988.888.999
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-9 border border-red-500/30 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white">
                Không Tìm Thấy Số IMEI: {searchedImei}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Số IMEI này không tồn tại trong hệ thống quản lý kho của iShop Huy Hoàng. Vui lòng kiểm tra lại dãy 15 chữ số bằng cách bấm <strong>*#06#</strong> trên bàn phím điện thoại.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guide how to check IMEI */}
      <div className="glass-panel rounded-3xl p-6 border-white/[0.08] space-y-3 text-xs text-gray-300">
        <h3 className="font-bold text-white text-sm">Hướng dẫn cách lấy số IMEI trên điện thoại:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-400">
          <li>Mở ứng dụng <strong>Điện Thoại</strong> và bấm cú pháp: <strong className="text-white">*#06#</strong> để xem IMEI ngay lập tức.</li>
          <li>Vào <strong>Cài đặt</strong> ➔ <strong>Cài đặt chung</strong> ➔ <strong>Giới thiệu</strong> ➔ Cuộn xuống tìm mục <strong>IMEI</strong>.</li>
          <li>Xem trên khay SIM hoặc mặt sau vỏ hộp máy mới nguyên seal.</li>
        </ol>
      </div>
    </div>
  );
}
