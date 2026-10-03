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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121826] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Security Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
            VIETQR NAPAS 247
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Xác thực tự động
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Thanh Toán Chuyển Khoản</h3>
        <p className="text-xs text-gray-400 mb-3">
          Quét mã bằng ứng dụng bất kỳ ngân hàng nào để thanh toán chuẩn xác
        </p>

        {/* Real-time Webhook Radar Indicator */}
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium mb-3">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Hệ thống đang chờ tín hiệu biến động số dư 24/7...</span>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto w-60 h-60 bg-white p-3 rounded-2xl shadow-lg border-2 border-blue-500/40 flex items-center justify-center mb-3">
          <img
            src={qrUrl}
            alt="VietQR Napas 247"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Amount & Bank Info Details */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 mb-3 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Số tiền cần thanh toán:</span>
            <span className="text-base font-bold text-amber-400">{formatVND(amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Ngân hàng thụ hưởng:</span>
            <span className="font-semibold text-white">MB Bank (Quân Đội)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Số tài khoản:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-white">
              <span>{DEFAULT_STORE_BANK.accountNo}</span>
              <button
                onClick={copyAccount}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                title="Sao chép số tài khoản"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Chủ tài khoản:</span>
            <span className="font-semibold text-white">{DEFAULT_STORE_BANK.accountName}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/5 pt-2">
            <span className="text-gray-400">Nội dung chuyển khoản:</span>
            <span className="font-mono font-bold text-blue-400">IShop {orderCode}</span>
          </div>
        </div>

        {/* Action buttons & Simulator */}
        <div className="space-y-2">
          <button
            onClick={handleConfirmPaid}
            disabled={confirmed || isSimulating}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              confirmed
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
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
            className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            title="Mô phỏng Webhook ngân hàng bắn callback tiền về tài khoản tức thì"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý Webhook Napas 247...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Demo: Giả Lập Ngân Hàng Báo &quot;Có&quot; (Webhook 0s)</span>
              </>
            )}
          </button>

          <a
            href={qrUrl}
            download={`VietQR_${orderCode}.png`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white py-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Tải ảnh mã QR về máy
          </a>
        </div>
      </div>
    </div>
  );
}
