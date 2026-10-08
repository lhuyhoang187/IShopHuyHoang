'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Download, ShieldCheck, Smartphone, Zap, Radio, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateVietQRUrl, DEFAULT_STORE_BANK, formatVND } from '@/lib/vietqr';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderCode: string;
  onPaymentSuccess?: () => void;
}

export default function VietQRModal({
  isOpen,
  onClose,
  amount,
  orderCode,
  onPaymentSuccess,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmed(false);
      setIsSimulating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const qrUrl = generateVietQRUrl(amount, orderCode);

  const copyAccount = () => {
    navigator.clipboard.writeText(DEFAULT_STORE_BANK.accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e2b774', '#10b981', '#06b6d4', '#f59e0b', '#ffffff'],
    });
  };

  const handleConfirmPaid = () => {
    setConfirmed(true);
    fireConfetti();
    setTimeout(() => {
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    }, 1500);
  };

  const handleSimulateWebhook = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setConfirmed(true);
      fireConfetti();
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden text-center text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Security Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            VIETQR NAPAS 247
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Xác thực tự động
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-1">Thanh Toán Chuyển Khoản</h3>
        <p className="text-xs text-slate-500 mb-3">
          Quét mã bằng ứng dụng bất kỳ ngân hàng nào để thanh toán chuẩn xác
        </p>

        {/* Real-time Webhook Radar Indicator */}
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-medium mb-3">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-600" />
          <span>Hệ thống đang chờ tín hiệu biến động số dư 24/7...</span>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto w-60 h-60 bg-white p-3 rounded-2xl shadow-md border-2 border-amber-400/80 flex items-center justify-center mb-3">
          <img
            src={qrUrl}
            alt="VietQR Napas 247"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Amount & Bank Info Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-3 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Số tiền cần thanh toán:</span>
            <span className="text-base font-black text-amber-600">{formatVND(amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
            <span className="font-bold text-slate-900">MB Bank (Quân Đội)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Số tài khoản:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
              <span>{DEFAULT_STORE_BANK.accountNo}</span>
              <button
                onClick={copyAccount}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
                title="Sao chép số tài khoản"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Chủ tài khoản:</span>
            <span className="font-bold text-slate-900">{DEFAULT_STORE_BANK.accountName}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <span className="text-slate-500">Nội dung chuyển khoản:</span>
            <span className="font-mono font-bold text-blue-600">IShop {orderCode}</span>
          </div>
        </div>

        {/* Action buttons & Simulator */}
        <div className="space-y-2">
          <button
            onClick={handleConfirmPaid}
            disabled={confirmed || isSimulating}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              confirmed
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black shadow-md shadow-amber-500/25'
            }`}
          >
            {confirmed ? (
              <>
                <Check className="w-4 h-4" /> Đã xác nhận thành công!
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" /> Tôi Đã Chuyển Khoản Xong
              </>
            )}
          </button>

          {/* Webhook Fast Test Simulator */}
          <button
            onClick={handleSimulateWebhook}
            disabled={confirmed || isSimulating}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Mô phỏng Webhook ngân hàng bắn callback tiền về tài khoản tức thì"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý Webhook Napas 247...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo: Giả Lập Ngân Hàng Báo &quot;Có&quot; (Webhook 0s)</span>
              </>
            )}
          </button>

          <a
            href={qrUrl}
            download={`VietQR_${orderCode}.png`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-800 py-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Tải ảnh mã QR về máy
          </a>
        </div>
      </div>
    </div>
  );
}
