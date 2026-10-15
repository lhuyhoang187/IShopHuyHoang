'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Crown,
  Radio,
  ScanLine,
  Maximize2,
  Copy,
  Check,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { MembershipTierConfig } from '@/lib/loyalty';
import { Barcode } from './Barcode';

interface MembershipCardProps {
  customerName: string;
  customerPhone: string;
  points: number;
  currentTier: MembershipTierConfig;
}

export function MembershipCard({
  customerName,
  customerPhone,
  points,
  currentTier,
}: MembershipCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isBarcodeZoomed, setIsBarcodeZoomed] = useState(false);

  // Chuẩn hóa mã thẻ từ số điện thoại (ví dụ: 0986898197 -> IS-0986898197)
  const rawDigits = customerPhone.replace(/[^0-9]/g, '') || '0986898197';
  const cardCode = `IS-${rawDigits}`;

  // Định dạng hiển thị số thẻ phân cụm 4 số như thẻ VIP quốc tế
  const formattedCardNumber =
    rawDigits.length >= 10
      ? `${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6)}`
      : rawDigits;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cardCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {/* KHỐI THẺ VIP APPLE FLAGSHIP CHÍNH */}
      <div className="relative max-w-lg mx-auto w-full group select-none">
        {/* Glow ambient background aura */}
        <div
          className={`absolute -inset-1 rounded-[32px] blur-xl opacity-60 transition duration-700 group-hover:opacity-85 ${
            currentTier.tier.includes('Vàng')
              ? 'bg-gradient-to-r from-amber-500/40 via-yellow-400/30 to-amber-600/40'
              : currentTier.tier.includes('Bạch Kim')
              ? 'bg-gradient-to-r from-sky-500/40 via-cyan-400/30 to-blue-600/40'
              : currentTier.tier.includes('Kim Cương')
              ? 'bg-gradient-to-r from-purple-500/40 via-pink-400/30 to-violet-600/40'
              : currentTier.tier.includes('Bạc')
              ? 'bg-gradient-to-r from-slate-400/30 via-zinc-300/30 to-slate-500/30'
              : 'bg-gradient-to-r from-slate-600/30 via-zinc-700/20 to-slate-800/30'
          }`}
        />

        {/* Bề mặt thẻ chính (Aspect ratio tiêu chuẩn ISO 7810 ID-1 card) */}
        <div
          className={`relative rounded-[28px] p-6 sm:p-7 overflow-hidden text-white transition-all duration-300 shadow-2xl border ${
            currentTier.tier.includes('Vàng')
              ? 'bg-gradient-to-br from-[#1c1408] via-[#241a0b] to-[#120d04] border-amber-400/70 shadow-amber-950/40'
              : currentTier.tier.includes('Bạch Kim')
              ? 'bg-gradient-to-br from-[#041628] via-[#082645] to-[#020e1a] border-sky-400/70 shadow-sky-950/40'
              : currentTier.tier.includes('Kim Cương')
              ? 'bg-gradient-to-br from-[#1a072f] via-[#280c48] to-[#10031e] border-purple-400/70 shadow-purple-950/40'
              : currentTier.tier.includes('Bạc')
              ? 'bg-gradient-to-br from-[#1e232a] via-[#29303a] to-[#15191f] border-slate-300/60 shadow-slate-900/40'
              : 'bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#0b0f17] border-slate-700 shadow-black/50'
          }`}
        >
          {/* Lớp vân kim loại xước & hoa văn sóng laser chìm */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Vệt sáng chéo phản quang ánh kim (Metallic sheen shimmer) */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-400/[0.06] blur-3xl pointer-events-none" />

          {/* Vạch ruy băng ánh sáng chéo cao cấp */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none transform -skew-x-12" />

          {/* 1. HEADER THẺ: Logo Flagship & Sóng Contactless */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-mono font-bold text-amber-400 drop-shadow-sm">
                    APPLE FLAGSHIP VIP
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 drop-shadow">
                  iShop Huy Hoàng
                </h3>
              </div>
            </div>

            {/* Sóng không tiếp xúc Contactless NFC */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold tracking-wider text-amber-200">
                NFC / POS
              </span>
            </div>
          </div>

          {/* 2. CHIP EMV 18K & HUY HIỆU HẠNG THẺ */}
          <div className="flex items-center justify-between pt-5 relative z-10">
            {/* Smart EMV Chip Gold 18K */}
            <div className="relative w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 p-[1px] shadow-md shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 p-1 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-center opacity-80">
                  <div className="w-3 h-2 border-r border-b border-amber-900/50 rounded-tl" />
                  <div className="w-3 h-2 border-l border-b border-amber-900/50 rounded-tr" />
                </div>
                <div className="w-full h-2.5 border-t border-b border-amber-900/40 rounded flex items-center justify-center">
                  <div className="w-2.5 h-full border-l border-r border-amber-900/40" />
                </div>
                <div className="flex justify-between items-center opacity-80">
                  <div className="w-3 h-2 border-r border-t border-amber-900/50 rounded-bl" />
                  <div className="w-3 h-2 border-l border-t border-amber-900/50 rounded-br" />
                </div>
              </div>
            </div>

            {/* Tier Badge lấp lánh */}
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-lg backdrop-blur-md font-bold text-xs ${
                currentTier.tier.includes('Vàng')
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-amber-500/20'
                  : currentTier.tier.includes('Bạch Kim')
                  ? 'bg-sky-400/20 text-sky-300 border-sky-400/60 shadow-sky-500/20'
                  : currentTier.tier.includes('Kim Cương')
                  ? 'bg-purple-400/20 text-purple-200 border-purple-400/60 shadow-purple-500/20'
                  : currentTier.tier.includes('Bạc')
                  ? 'bg-slate-300/20 text-slate-200 border-slate-300/50 shadow-slate-500/20'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTier.tier}</span>
            </div>
          </div>

          {/* 3. THÔNG TIN CHỦ THẺ DẬP NỔI ÁNH KIM */}
          <div className="pt-4 space-y-1 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-slate-400">
                CHỦ SỞ HỮU THẺ
              </span>
              <span className="text-[10px] tracking-widest font-mono text-slate-400">
                SỐ THẺ: {formattedCardNumber}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 drop-shadow-md">
              {customerName || 'KHÁCH HÀNG THÂN THIẾT'}
            </p>
          </div>

          {/* 4. CHỈ SỐ: ĐIỂM TÍCH LŨY & CHIẾT KHẤU ĐẶC QUYỀN */}
          <div className="grid grid-cols-2 gap-3 pt-3.5 pb-2 relative z-10">
            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-300 block mb-0.5">
                Điểm Tích Lũy
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono tracking-tight text-amber-300 drop-shadow">
                  {points.toLocaleString('vi-VN')}
                </span>
                <span className="text-[11px] font-bold text-amber-400/80 font-mono">pts</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5">
                Chiết Khấu Mua Hàng
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl font-black font-mono tracking-tight text-emerald-400 drop-shadow">
                  {currentTier.discountPercent}%
                </span>
                <span className="text-[11px] font-bold text-emerald-300/80 font-mono">OFF</span>
              </div>
            </div>
          </div>

          {/* 5. KHỐI MÃ VẠCH (BARCODE) CHUẨN MÁY QUÉT POS TẠI QUẦY */}
          <div className="pt-3 relative z-10">
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-white/90 text-slate-900">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <ScanLine className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Mã Vạch Quét Thẻ POS (Code 39)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Sao chép mã thẻ"
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBarcodeZoomed(true)}
                    title="Phóng to mã vạch để quét"
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition flex items-center gap-0.5 text-[10px] font-bold"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Vạch Barcode thực tế */}
              <div
                onClick={() => setIsBarcodeZoomed(true)}
                className="cursor-pointer bg-white px-2 py-1 rounded border border-slate-100 hover:border-amber-300 transition-colors flex flex-col items-center"
              >
                <Barcode value={cardCode} height={42} barColor="#020617" />
                <span className="font-mono text-[11px] tracking-[0.2em] font-bold text-slate-800 mt-1 select-all">
                  {cardCode}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] text-slate-500 text-center font-medium">
                <span>⚡ Đưa mã này cho thu ngân quét máy để tích điểm tức thì</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO MÃ VẠCH (ZOOMED BARCODE CHO MÁY QUÉT POS XA / MÀN HÌNH TỐI) */}
      {isBarcodeZoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6">
            <button
              onClick={() => setIsBarcodeZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                <ScanLine className="w-4 h-4 text-amber-700" />
                <span>MÃ QUÉT TÍCH ĐIỂM TẠI QUẦY</span>
              </div>
              <h4 className="text-lg font-black text-slate-900">
                Thẻ Hội Viên iShop Huy Hoàng
              </h4>
              <p className="text-xs text-slate-500">
                {customerName} &bull; SĐT: {customerPhone}
              </p>
            </div>

            {/* Khối Barcode khổ lớn tương phản tối đa */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-900/10 shadow-inner flex flex-col items-center justify-center space-y-3">
              <div className="w-full">
                <Barcode value={cardCode} height={76} barColor="#000000" />
              </div>
              <p className="font-mono text-base font-black tracking-[0.25em] text-black">
                {cardCode}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-900 space-y-1">
              <p className="font-bold">✨ Quyền lợi thành viên hiện tại:</p>
              <p className="text-slate-700">
                Hạng <strong>{currentTier.tier}</strong> &bull; Tích lũy <strong>{points.toLocaleString('vi-VN')} điểm</strong> &bull; Chiết khấu <strong>{currentTier.discountPercent}%</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsBarcodeZoomed(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm transition shadow-lg"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
