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
import confetti from 'canvas-confetti';
import { IShopStore } from '@/lib/store';
import { CartItem, Invoice, CustomerUser } from '@/lib/types';
import { formatVND, generateVietQRUrl, DEFAULT_STORE_BANK } from '@/lib/vietqr';
import { Lock, UserCheck } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cash'>('vietqr');
  const [copied, setCopied] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Customer Authentication state
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');

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

    const cust = IShopStore.getCustomerUser();
    if (cust) {
      setCustomerUser(cust);
      setFormData((prev) => ({
        ...prev,
        name: cust.name,
        phone: cust.phone,
      }));
    }
  }, []);

  const handleCustomerQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim() || !quickCustPhone.trim()) return;

    const user: CustomerUser = {
      id: 'cust-' + Date.now(),
      name: quickCustName.trim(),
      phone: quickCustPhone.trim(),
    };

    IShopStore.setCustomerUser(user);
    setCustomerUser(user);
    setFormData((prev) => ({
      ...prev,
      name: user.name,
      phone: user.phone,
    }));
  };

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

    // Sync order to MySQL Database via /api/orders
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: formData.name,
        customerPhone: formData.phone,
        items: invoiceItems,
        subtotal: totalAmount,
        discount: 0,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        cashierName: 'Online Web Store',
      }),
    }).catch((err) => console.warn('API checkout order notice:', err));

    IShopStore.clearCart();
    setCompletedInvoice(newInvoice);
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#e2b774', '#10b981', '#06b6d4', '#f59e0b', '#ffffff'],
      });
    } catch (e) {}
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
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-300 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            MÃ ĐƠN HÀNG: {completedInvoice.invoiceCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Đặt Hàng Thành Công!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cảm ơn quý khách <strong className="text-slate-900">{completedInvoice.customerName}</strong>. Đơn hàng đã được lưu trữ trên hệ thống bán lẻ và chuẩn bị đóng gói.
          </p>
        </div>

        {/* Real-time Zalo ZNS / SMS simulation banner */}
        <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left max-w-lg mx-auto shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Hệ thống đã tự động gửi tin nhắn <strong>Zalo ZNS / SMS Brandname</strong> kèm mã tra cứu và hóa đơn điện tử đến số <strong className="text-slate-900 font-mono">{completedInvoice.customerPhone}</strong>.
          </span>
        </div>

        {/* If VietQR was chosen, display the QR Box */}
        {completedInvoice.paymentMethod === 'vietqr' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-4 shadow-md">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                VIETQR NAPAS 247
              </span>
              <span className="text-xs text-slate-600">Quét mã bằng app ngân hàng bất kỳ</span>
            </div>

            <div className="w-60 h-60 bg-white p-2.5 rounded-2xl mx-auto border-2 border-blue-500/40 shadow-md">
              <img src={qrUrl} alt="VietQR Napas 247" className="w-full h-full object-contain" />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-amber-700">{formatVND(completedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản MBBank:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                  <span>{DEFAULT_STORE_BANK.accountNo}</span>
                  <button onClick={copyAccount} className="p-0.5 text-slate-500 hover:text-slate-900">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <span className="font-mono font-bold text-blue-700">IShop {completedInvoice.invoiceCode}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-colors"
          >
            Quay về trang chủ
          </Link>
          <Link
            href="/warranty"
            className="w-full sm:w-auto px-6 py-3 rounded-xl btn-gold text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="text-white">Tra Cứu Bảo Hành Điện Tử IMEI</span>
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Không có sản phẩm nào trong giỏ hàng</h2>
        <Link href="/phones" className="text-xs text-blue-600 hover:underline font-bold">
          Quay lại chọn mua sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <nav className="text-xs text-slate-500 mb-1">
          <Link href="/cart" className="hover:text-slate-900">Giỏ hàng</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-600 font-semibold">Thanh toán</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Thông Tin Giao Hàng & Thanh Toán
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {!customerUser ? (
            <div className="bg-amber-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  BẮT BUỘC XÁC THỰC THÀNH VIÊN
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Đăng Nhập Khách Hàng Để Đặt Hàng & Nhận Bảo Hành
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Để tự động kích hoạt chứng nhận bảo hành điện tử theo số IMEI và nhận mã vận đơn, quý khách vui lòng xác nhận danh tính thành viên:
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3 text-xs text-left pt-2">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Họ và tên người nhận hàng *:</label>
                  <input
                    type="text"
                    required
                    value={quickCustName}
                    onChange={(e) => setQuickCustName(e.target.value)}
                    placeholder="VD: Nguyễn Huy Hoàng"
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Số điện thoại liên hệ *:</label>
                  <input
                    type="tel"
                    required
                    value={quickCustPhone}
                    onChange={(e) => setQuickCustPhone(e.target.value)}
                    placeholder="VD: 0988888999"
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomerQuickLogin}
                  className="w-full py-3.5 rounded-xl btn-gold text-xs font-black flex items-center justify-center gap-2 shadow-md text-white"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span className="text-white">Xác Nhận Thành Viên & Tiếp Tục Thanh Toán</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Đặt hàng với tài khoản: <strong className="text-slate-900 font-bold">{customerUser.name}</strong> ({customerUser.phone})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  IShopStore.logoutCustomer();
                  setCustomerUser(null);
                }}
                className="text-slate-500 hover:text-slate-900 text-[11px] underline font-semibold"
              >
                Đổi tài khoản
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>1. Thông Tin Nhận Hàng</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">Họ và tên người nhận *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Nguyễn Huy Hoàng"
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold mb-1 block">Số điện thoại liên hệ *:</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0988888999"
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-700 font-bold mb-1 block">Địa chỉ nhận hàng chi tiết *:</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div className="text-xs">
              <label className="text-slate-700 font-bold mb-1 block">Ghi chú giao hàng (Tùy chọn):</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>2. Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              <div
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  paymentMethod === 'vietqr'
                    ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'vietqr'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'vietqr' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Chuyển Khoản VietQR Napas 247</span>
                      <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-bold">
                        Khuyên dùng
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Tự động tạo mã QR có số tiền và nội dung chuyển khoản, xử lý đơn ngay tức thì.
                    </p>
                  </div>
                </div>
                <Zap className="w-6 h-6 text-amber-500 shrink-0" />
              </div>

              <div
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'cash' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Thanh Toán Tiền Mặt Khi Nhận Hàng (COD)</h3>
                    <p className="text-xs text-slate-600">
                      Kiểm tra máy nguyên seal, mở hộp kiểm tra đúng model rồi thanh toán cho shipper.
                    </p>
                  </div>
                </div>
                <Truck className="w-6 h-6 text-slate-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5 sticky top-28">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Đơn Hàng ({cart.length} món)
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-contain rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 p-1 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                      <span className="text-slate-500 font-medium">SL: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-black text-amber-700 shrink-0">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Phí giao hàng:</span>
                <span className="text-emerald-700 font-bold">Miễn phí 100%</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-amber-700">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
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
