'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowRight,
  Zap,
  Copy,
  Check,
  Download,
  Smartphone,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { CartItem, Invoice } from '@/lib/types';
import { formatVND, generateVietQRUrl, DEFAULT_STORE_BANK } from '@/lib/vietqr';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cash'>('vietqr');
  const [copied, setCopied] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'TP. Hồ Chí Minh',
    notes: '',
  });

  useEffect(() => {
    const currentCart = IShopStore.getCart();
    setCart(currentCart);
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Check if any phone in cart has available in-stock IMEI
    const availablePhones = IShopStore.getAvailablePhones();

    const invoiceItems = cart.map((c) => {
      let matchedImei: string | undefined = undefined;
      if (c.type === 'phone') {
        const found = availablePhones.find((p) => p.phoneId === c.productId);
        if (found) matchedImei = found.imei;
      }

      return {
        type: c.type,
        id: c.productId,
        name: c.name,
        variant: `${c.color || ''} ${c.capacity || ''}`.trim(),
        imei: matchedImei,
        quantity: c.quantity,
        unitPrice: c.price,
        costPrice: Math.round(c.price * 0.85),
        discount: 0,
        total: c.price * c.quantity,
      };
    });

    const newInvoice = IShopStore.createInvoice({
      customerName: formData.name,
      customerPhone: formData.phone,
      items: invoiceItems,
      subtotal: totalAmount,
      discount: 0,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      cashierName: 'Online Web Store',
      warrantyNote: 'Bảo hành chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
    });

    IShopStore.clearCart();
    setCompletedInvoice(newInvoice);
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(DEFAULT_STORE_BANK.accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (completedInvoice) {
    const qrUrl = generateVietQRUrl(completedInvoice.totalAmount, completedInvoice.invoiceCode);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            MÃ ĐƠN HÀNG: {completedInvoice.invoiceCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Đặt Hàng Thành Công!
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Cảm ơn quý khách <strong>{completedInvoice.customerName}</strong>. Đơn hàng đã được lưu trữ trên hệ thống bán lẻ và chuẩn bị đóng gói.
          </p>
        </div>

        {/* If VietQR was chosen, display the QR Box */}
        {completedInvoice.paymentMethod === 'vietqr' && (
          <div className="glass-panel rounded-3xl p-6 border border-blue-500/30 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                VIETQR NAPAS 247
              </span>
              <span className="text-xs text-gray-300">Quét mã bằng app ngân hàng bất kỳ</span>
            </div>

            <div className="w-60 h-60 bg-white p-2.5 rounded-2xl mx-auto border-2 border-blue-500/40 shadow-xl">
              <img src={qrUrl} alt="VietQR Napas 247" className="w-full h-full object-contain" />
            </div>

            <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 text-xs text-left space-y-1.5 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền:</span>
                <span className="font-bold text-amber-400">{formatVND(completedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tài khoản MBBank:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-white">
                  <span>{DEFAULT_STORE_BANK.accountNo}</span>
                  <button onClick={copyAccount} className="p-0.5 text-gray-400 hover:text-white">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1">
                <span className="text-gray-400">Nội dung chuyển khoản:</span>
                <span className="font-mono font-bold text-blue-400">IShop {completedInvoice.invoiceCode}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Quay về trang chủ
          </Link>
          <Link
            href="/admin/pos"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs transition-colors shadow-lg"
          >
            Xem hóa đơn tại Màn hình Quản trị/POS
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Không có sản phẩm nào trong giỏ hàng</h2>
        <Link href="/phones" className="text-xs text-blue-400 hover:underline">
          Quay lại chọn mua sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <nav className="text-xs text-gray-400 mb-1">
          <Link href="/cart" className="hover:text-white">Giỏ hàng</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-400">Thanh toán</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Thông Tin Giao Hàng & Thanh Toán
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>1. Thông Tin Nhận Hàng</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Họ và tên người nhận *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Nguyễn Huy Hoàng"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Số điện thoại liên hệ *:</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0988888999"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-gray-300 font-semibold mb-1 block">Địa chỉ nhận hàng chi tiết *:</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-xs">
              <label className="text-gray-300 font-semibold mb-1 block">Ghi chú giao hàng (Tùy chọn):</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>2. Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              <div
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  paymentMethod === 'vietqr'
                    ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'vietqr'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-white/30'
                    }`}
                  >
                    {paymentMethod === 'vietqr' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Chuyển Khoản VietQR Napas 247</span>
                      <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded font-semibold">
                        Khuyên dùng
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Tự động tạo mã QR có số tiền và nội dung chuyển khoản, xử lý đơn ngay tức thì.
                    </p>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-amber-400 shrink-0" />
              </div>

              <div
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-white/30'
                    }`}
                  >
                    {paymentMethod === 'cash' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Thanh Toán Tiền Mặt Khi Nhận Hàng (COD)</h3>
                    <p className="text-xs text-gray-400">
                      Kiểm tra máy nguyên seal, mở hộp kiểm tra đúng model rồi thanh toán cho shipper.
                    </p>
                  </div>
                </div>
                <Truck className="w-6 h-6 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-5 sticky top-28">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/10">
              Đơn Hàng ({cart.length} món)
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="font-semibold text-white truncate">{item.name}</h4>
                      <span className="text-gray-400">SL: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-amber-400 shrink-0">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Phí giao hàng:</span>
                <span className="text-emerald-400 font-semibold">Miễn phí 100%</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                <span className="font-bold text-white">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>XÁC NHẬN ĐẶT HÀNG NGAY</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
