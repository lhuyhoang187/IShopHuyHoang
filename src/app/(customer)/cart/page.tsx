'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { CartItem } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadCart = () => {
    setCart(IShopStore.getCart());
  };

  useEffect(() => {
    loadCart();
    const listener = () => loadCart();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalOriginal = cart.reduce((sum, i) => sum + i.originalPrice * i.quantity, 0);
  const totalSaved = Math.max(0, totalOriginal - totalAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <nav className="text-xs text-slate-500 mb-1">
          <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-600 font-semibold">Giỏ Hàng</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <span>Giỏ Hàng Của Bạn ({cart.length} món)</span>
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Khám phá các dòng điện thoại mới 100% nguyên seal hoặc phụ kiện chính hãng để nhận ưu đãi ngay hôm nay.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/phones"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-md"
            >
              Xem Điện Thoại Mới
            </Link>
            <Link
              href="/accessories"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
            >
              Xem Phụ Kiện
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200/80 border border-slate-200 p-2 shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                    {(item.color || item.capacity) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.color} {item.capacity ? `• ${item.capacity}` : ''}
                      </p>
                    )}
                    {item.isComboDiscount && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ưu đãi mua kèm máy -15%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => {
                        IShopStore.updateCartQuantity(item.id, item.quantity - 1);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Giảm số lượng"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-900 px-2">{item.quantity}</span>
                    <button
                      onClick={() => {
                        const res = IShopStore.updateCartQuantity(item.id, item.quantity + 1);
                        if (!res.success) {
                          setToastMessage({
                            message: res.message,
                            type: 'error',
                          });
                          setTimeout(() => setToastMessage(null), 3500);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Tăng số lượng"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price & Points */}
                  <div className="text-right">
                    <span className="text-base font-black text-amber-700">
                      {formatVND(item.price * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-slate-500 block font-medium">
                        {formatVND(item.price)}/cái
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      +{Math.floor((item.price * item.quantity) / 10000).toLocaleString('vi-VN')} pts
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => IShopStore.updateCartQuantity(item.id, 0)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa món này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => IShopStore.clearCart()}
                className="text-xs text-slate-500 hover:text-red-600 font-medium cursor-pointer"
              >
                Xóa toàn bộ giỏ hàng
              </button>
              <Link
                href="/phones"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {/* Checkout Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5 sticky top-28">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Tóm Tắt Đơn Hàng
              </h2>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tạm tính ({cart.length} món):</span>
                  <span className="font-semibold text-slate-800">{formatVND(totalOriginal)}</span>
                </div>
                {totalSaved > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Khuyến mãi & Combo giảm:</span>
                    <span>-{formatVND(totalSaved)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Phí giao hàng:</span>
                  <span className="text-emerald-700 font-bold">Miễn phí toàn quốc</span>
                </div>

                {/* Điểm thưởng tích lũy theo tỷ lệ 100k = 10 điểm */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-300">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Tích lũy đơn hàng:
                  </span>
                  <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 text-xs">
                    +{Math.floor(totalAmount / 10000).toLocaleString('vi-VN')} điểm
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="font-bold text-slate-900">Tổng cộng:</span>
                  <span className="text-xl font-black text-amber-700">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-current" />
                  <span>TIẾN HÀNH ĐẶT HÀNG</span>
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quyền lợi khách hàng tại iShop:</span>
                </div>
                <p>• Kiểm tra hàng trước khi thanh toán (Đồng kiểm).</p>
                <p>• Bảo hành 1 đổi 1 trong 30 ngày nếu có lỗi phần cứng.</p>
                <p>• Hỗ trợ thanh toán VietQR Napas 247 tự động.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast cảnh báo số lượng tồn kho */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom duration-200 max-w-md ${
            toastMessage.type === 'error'
              ? 'bg-red-950/95 text-red-100 border-red-500/80 shadow-red-950/50'
              : 'bg-emerald-800/95 text-white border-emerald-400/40 shadow-emerald-950/50'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-200 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
