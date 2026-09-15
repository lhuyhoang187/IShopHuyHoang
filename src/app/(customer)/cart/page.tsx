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
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { CartItem } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

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
        <nav className="text-xs text-gray-400 mb-1">
          <Link href="/" className="hover:text-white">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-400">Giỏ Hàng</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-400" />
          <span>Giỏ Hàng Của Bạn ({cart.length} món)</span>
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-4">
          <ShoppingCart className="w-16 h-16 text-gray-500 mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-white">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Khám phá các dòng điện thoại mới 100% nguyên seal hoặc phụ kiện chính hãng để nhận ưu đãi ngay hôm nay.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/phones"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              Xem Điện Thoại Mới
            </Link>
            <Link
              href="/accessories"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
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
                className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-black/40 p-2 shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.name}</h3>
                    {(item.color || item.capacity) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.color} {item.capacity ? `• ${item.capacity}` : ''}
                      </p>
                    )}
                    {item.isComboDiscount && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ưu đãi mua kèm máy -15%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => IShopStore.updateCartQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                    <button
                      onClick={() => IShopStore.updateCartQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <span className="text-base font-black text-amber-400">
                      {formatVND(item.price * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-gray-400 block">
                        {formatVND(item.price)}/cái
                      </span>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => IShopStore.updateCartQuantity(item.id, 0)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
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
                className="text-xs text-gray-400 hover:text-red-400"
              >
                Xóa toàn bộ giỏ hàng
              </button>
              <Link
                href="/phones"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {/* Checkout Summary Card */}
          <div className="lg:col-span-4">
            <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-5 sticky top-28">
              <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                Tóm Tắt Đơn Hàng
              </h2>

              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tạm tính ({cart.length} món):</span>
                  <span>{formatVND(totalOriginal)}</span>
                </div>
                {totalSaved > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Khuyến mãi & Combo giảm:</span>
                    <span>-{formatVND(totalSaved)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Phí giao hàng:</span>
                  <span className="text-emerald-400 font-semibold">Miễn phí toàn quốc</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="font-bold text-white">Tổng cộng:</span>
                  <span className="text-xl font-black text-amber-400">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-current" />
                  <span>TIẾN HÀNH ĐẶT HÀNG</span>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
    </div>
  );
}
