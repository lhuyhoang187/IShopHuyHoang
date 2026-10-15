'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Clock,
  Sparkles,
  Copy,
  Check,
  Plus,
  Calendar,
  Tag,
  AlertCircle,
  Percent,
  Coins,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PromoQRCode } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

function calculateTimeRemaining(endDateStr: string) {
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) {
    return { isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { isExpired: false, days, hours, minutes, seconds };
}

export function PromoQRSection() {
  const [promos, setPromos] = useState<PromoQRCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [timers, setTimers] = useState<Record<string, ReturnType<typeof calculateTimeRemaining>>>({});

  // Form setup QR mới
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'fixed_amount' | 'percentage'>('fixed_amount');
  const [formValue, setFormValue] = useState(200000);
  const [formMinOrder, setFormMinOrder] = useState(2000000);
  const [formDays, setFormDays] = useState(3);

  const loadPromos = () => {
    const list = IShopStore.getPromoQRCodes();
    setPromos(list);
  };

  useEffect(() => {
    loadPromos();
    const interval = setInterval(() => {
      const list = IShopStore.getPromoQRCodes();
      const updatedTimers: Record<string, ReturnType<typeof calculateTimeRemaining>> = {};
      list.forEach((p) => {
        updatedTimers[p.id] = calculateTimeRemaining(p.endDate);
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formTitle.trim()) return;

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + formDays * 24 * 3600 * 1000).toISOString();

    IShopStore.createPromoQRCode({
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      description: formDesc.trim() || `Ưu đãi áp dụng cho đơn từ ${formatVND(formMinOrder)}`,
      discountType: formType,
      discountValue: formValue,
      minOrderValue: formMinOrder,
      startDate,
      endDate,
      isActive: true,
      qrPayload: `https://ishop.vn/promo/${formCode.trim().toUpperCase()}`,
      bannerColor: 'from-blue-600 to-indigo-700',
    });

    loadPromos();
    setShowSetupModal(false);
    setFormCode('');
    setFormTitle('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Mã QR Khuyến Mãi Flash Sale (Thời Gian Thực)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
                LIVE COUNTDOWN
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quét mã QR tại quầy thu ngân hoặc nhập mã khi đặt hàng online để nhận ưu đãi tức thì trước khi hết hạn!
            </p>
          </div>
        </div>

        {/* Nút Setup thêm mã QR */}
        <button
          onClick={() => setShowSetupModal(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>Setup Thời Gian & Thêm Mã QR</span>
        </button>
      </div>

      {/* Grid danh sách Mã QR Khuyến Mãi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promos.map((promo) => {
          const t = timers[promo.id] || calculateTimeRemaining(promo.endDate);
          const isExpired = t.isExpired;

          // Sinh QR SVG đơn giản tương phản cao
          const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
            promo.qrPayload || promo.code
          )}&margin=4`;

          return (
            <div
              key={promo.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                isExpired
                  ? 'border-slate-200 bg-slate-50 opacity-60'
                  : 'border-slate-200 hover:border-blue-400 hover:shadow-lg bg-white'
              }`}
            >
              {/* Card Header với Countdown Timer */}
              <div
                className={`p-4 text-white ${
                  isExpired
                    ? 'bg-slate-600'
                    : promo.bannerColor
                    ? `bg-gradient-to-r ${promo.bannerColor}`
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest font-black uppercase text-amber-300">
                    {promo.code}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {isExpired ? (
                      <span className="text-red-200">Đã hết hạn</span>
                    ) : (
                      <span>Còn lại:</span>
                    )}
                  </div>
                </div>

                {/* Đồng hồ đếm ngược */}
                {!isExpired && (
                  <div className="grid grid-cols-4 gap-1 text-center mt-3 pt-2 border-t border-white/20">
                    <div className="bg-black/25 rounded-lg py-1 px-0.5">
                      <span className="block text-sm font-black font-mono leading-none">{t.days}</span>
                      <span className="text-[9px] uppercase opacity-75 font-semibold">Ngày</span>
                    </div>
                    <div className="bg-black/25 rounded-lg py-1 px-0.5">
                      <span className="block text-sm font-black font-mono leading-none">{t.hours}</span>
                      <span className="text-[9px] uppercase opacity-75 font-semibold">Giờ</span>
                    </div>
                    <div className="bg-black/25 rounded-lg py-1 px-0.5">
                      <span className="block text-sm font-black font-mono leading-none">{t.minutes}</span>
                      <span className="text-[9px] uppercase opacity-75 font-semibold">Phút</span>
                    </div>
                    <div className="bg-black/25 rounded-lg py-1 px-0.5">
                      <span className="block text-sm font-black font-mono leading-none text-amber-300">{t.seconds}</span>
                      <span className="text-[9px] uppercase opacity-75 font-semibold text-amber-300">Giây</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thân mã QR & Chi tiết ưu đãi */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3.5">
                  {/* Khối QR Code */}
                  <div className="w-24 h-24 p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                    <img
                      src={qrSvgUrl}
                      alt={promo.code}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{promo.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {promo.description}
                    </p>
                    <div className="mt-2 text-xs font-black text-amber-600">
                      Giảm:{' '}
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}%`
                        : formatVND(promo.discountValue)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    Hạn dùng: {new Date(promo.endDate).toLocaleDateString('vi-VN')} {new Date(promo.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <button
                    onClick={() => handleCopy(promo.code)}
                    disabled={isExpired}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Chép mã</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Setup QR Code Khuyến Mãi */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Setup Mã QR Khuyến Mãi & Thời Hạn Hiệu Lực</span>
              </h4>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã Khuyến Mãi (Voucher Code):</label>
                <input
                  type="text"
                  required
                  placeholder="VD: FLASH-SUMMER-300K"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase text-slate-900 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu Đề Khuyến Mãi:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 300.000đ khi đặt mua iPhone mới"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại Giảm Giá:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold"
                  >
                    <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                    <option value="percentage">Phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức Giảm:</label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn Hàng Tối Thiểu:</label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời Hạn Hiệu Lực (Số ngày):</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formDays}
                    onChange={(e) => setFormDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô Tả Chi Tiết:</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú điều kiện áp dụng..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Lưu & Kích Hoạt QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
