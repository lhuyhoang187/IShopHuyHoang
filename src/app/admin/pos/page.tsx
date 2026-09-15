'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Smartphone,
  Headphones,
  Search,
  Trash2,
  Printer,
  CheckCircle2,
  Zap,
  CreditCard,
  User,
  Plus,
  Minus,
  Barcode,
  X,
  Sparkles,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneStockItem, AccessoryProduct, Role, Invoice, InvoiceItem } from '@/lib/types';
import { formatVND, generateVietQRUrl, DEFAULT_STORE_BANK } from '@/lib/vietqr';

export default function POSPage() {
  const [role, setRole] = useState<Role>('admin');
  const [activeTab, setActiveTab] = useState<'phones' | 'accessories'>('phones');

  const [availablePhones, setAvailablePhones] = useState<PhoneStockItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);

  // Search queries
  const [phoneSearch, setPhoneSearch] = useState('');
  const [accessorySearch, setAccessorySearch] = useState('');

  // POS Order State
  const [posItems, setPosItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState('Khách Mua Tại Quầy');
  const [customerPhone, setCustomerPhone] = useState('0909123456');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Print Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'k80' | 'a5'>('k80');

  const loadStock = () => {
    setRole(IShopStore.getRole());
    setAvailablePhones(IShopStore.getAvailablePhones());
    setAccessories(IShopStore.getAccessories());
  };

  useEffect(() => {
    loadStock();
    const listener = () => loadStock();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Filtered lists
  const filteredPhones = availablePhones.filter(
    (p) =>
      p.imei.includes(phoneSearch.trim()) ||
      p.phoneName.toLowerCase().includes(phoneSearch.toLowerCase()) ||
      p.color.toLowerCase().includes(phoneSearch.toLowerCase())
  );

  const filteredAccessories = accessories.filter(
    (a) =>
      a.barcode.includes(accessorySearch.trim()) ||
      a.name.toLowerCase().includes(accessorySearch.toLowerCase())
  );

  // Add phone by specific IMEI
  const addPhoneToOrder = (stockItem: PhoneStockItem) => {
    const isAlreadyIn = posItems.some((i) => i.imei === stockItem.imei);
    if (isAlreadyIn) {
      alert('Cây máy có số IMEI này đã được thêm vào đơn hàng!');
      return;
    }

    const newItem: InvoiceItem = {
      type: 'phone',
      id: stockItem.phoneId,
      name: stockItem.phoneName,
      variant: `${stockItem.color} - ${stockItem.capacity}`,
      imei: stockItem.imei,
      quantity: 1,
      unitPrice: stockItem.sellingPrice,
      costPrice: stockItem.costPrice,
      discount: 0,
      total: stockItem.sellingPrice,
    };

    setPosItems([...posItems, newItem]);
  };

  // Add accessory
  const addAccessoryToOrder = (acc: AccessoryProduct) => {
    const existing = posItems.find((i) => i.type === 'accessory' && i.id === acc.id);
    if (existing) {
      setPosItems(
        posItems.map((i) =>
          i.type === 'accessory' && i.id === acc.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      const newItem: InvoiceItem = {
        type: 'accessory',
        id: acc.id,
        name: acc.name,
        barcode: acc.barcode,
        quantity: 1,
        unitPrice: acc.sellingPrice,
        costPrice: acc.costPrice,
        discount: 0,
        total: acc.sellingPrice,
      };
      setPosItems([...posItems, newItem]);
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setPosItems(posItems.filter((_, idx) => idx !== index));
    } else {
      setPosItems(
        posItems.map((item, idx) =>
          idx === index ? { ...item, quantity: newQty, total: newQty * item.unitPrice } : item
        )
      );
    }
  };

  const subtotal = posItems.reduce((sum, i) => sum + i.total, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, cashGiven - totalAmount);

  // Process payment & create invoice
  const handleCheckout = () => {
    if (posItems.length === 0) {
      alert('Vui lòng chọn sản phẩm trước khi thanh toán!');
      return;
    }

    const cashierName =
      role === 'admin' ? 'Chủ shop Huy Hoàng' : role === 'cashier' ? 'Thu ngân quầy' : 'KTV quầy';

    const invoice = IShopStore.createInvoice({
      customerName: customerName.trim() || 'Khách Mua Tại Quầy',
      customerPhone: customerPhone.trim() || '0900000000',
      items: posItems,
      subtotal,
      discount: discountAmount,
      totalAmount,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashGiven : undefined,
      cashChange: paymentMethod === 'cash' ? changeAmount : undefined,
      cashierName,
      warrantyNote: 'Bảo hành 12 tháng máy mới / 12 tháng phụ kiện 1 đổi 1.',
    });

    setCompletedInvoice(invoice);
    setPosItems([]);
    setDiscountAmount(0);
    setCashGiven(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            <span>Màn Hình Bán Hàng POS Siêu Tốc 2026</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Bán máy theo số IMEI cụ thể (tự động kích hoạt bảo hành) & Quét mã vạch phụ kiện.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('phones')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'phones'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Kho Máy Mới IMEI ({availablePhones.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('accessories')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'accessories'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Kho Phụ Kiện Barcode ({accessories.length})</span>
          </button>
        </div>
      </div>

      {/* POS Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab 1: Phones by IMEI */}
          {activeTab === 'phones' ? (
            <div className="glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4 shadow-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Quét hoặc nhập 15 số IMEI, tên máy (VD: 358921104829104, iPhone 16...)"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredPhones.map((unit) => {
                  const isInOrder = posItems.some((i) => i.imei === unit.imei);

                  return (
                    <div
                      key={unit.imei}
                      onClick={() => !isInOrder && addPhoneToOrder(unit)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isInOrder
                          ? 'border-amber-500/50 bg-amber-500/10 opacity-70 cursor-not-allowed'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/40 hover:scale-[1.005]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {unit.phoneName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                            {unit.color} • {unit.capacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="font-mono text-amber-300 font-bold">
                            IMEI: {unit.imei}
                          </span>
                          <span>• Nhập: {unit.importDate}</span>
                          <span>• NCC: {unit.supplierName.split(' ')[0]}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-400 block">
                          {formatVND(unit.sellingPrice)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isInOrder ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isInOrder ? '✓ Đã trong đơn' : '+ Chọn bán'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredPhones.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-xs font-mono">
                    Không tìm thấy cây máy nào khớp với &quot;{phoneSearch}&quot;
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Accessories by Barcode */
            <div className="glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4 shadow-xl">
              <div className="relative">
                <Barcode className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accessorySearch}
                  onChange={(e) => setAccessorySearch(e.target.value)}
                  placeholder="Quét mã vạch Barcode máy quét hoặc gõ tên phụ kiện..."
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredAccessories.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => addAccessoryToOrder(acc)}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-400/40 cursor-pointer transition-all flex items-center justify-between gap-3 hover:scale-[1.005]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.imageUrl}
                        alt={acc.name}
                        className="w-11 h-11 object-contain rounded-xl bg-black/40 p-1.5 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {acc.name}
                        </h4>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400 font-bold">{acc.barcode}</span>
                          <span>• Tồn: <strong className="text-white">{acc.stock} cái</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-400 block">
                        {formatVND(acc.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">+ Thêm giỏ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: High-Contrast POS Cashier Terminal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border-white/[0.12] space-y-4 shadow-2xl bg-[#090e1a]/95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Đơn Hàng Hiện Tại ({posItems.length} món)</span>
              </h2>
              {posItems.length > 0 && (
                <button
                  onClick={() => setPosItems([])}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Xóa hết
                </button>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Tên khách hàng:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white font-medium"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">SĐT (kích hoạt BH):</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white font-mono font-bold text-amber-300"
                />
              </div>
            </div>

            {/* Items Table in POS Bill */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border-t border-b border-white/[0.08] py-3">
              {posItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-mono">
                  Chưa có sản phẩm nào. Chọn máy theo IMEI hoặc phụ kiện bên trái.
                </div>
              ) : (
                posItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <h4 className="font-bold text-white truncate">{item.name}</h4>
                      {item.imei && (
                        <span className="text-[10px] font-mono text-amber-300 font-bold block">
                          IMEI: {item.imei}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="text-[10px] font-mono text-gray-400 block">
                          Barcode: {item.barcode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.type === 'accessory' ? (
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                          <button
                            onClick={() => updateQuantity(idx, item.quantity - 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-white px-1 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, item.quantity + 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          1 Cây
                        </span>
                      )}

                      <span className="font-black text-amber-400 text-xs">
                        {formatVND(item.total)}
                      </span>

                      <button
                        onClick={() => setPosItems(posItems.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discounts */}
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Tổng tiền hàng:</span>
                <span className="font-bold text-white">{formatVND(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Chiết khấu / Giảm giá:</span>
                <div className="flex items-center gap-1.5 w-36">
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-right p-1.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-amber-400 font-bold"
                  />
                  <span className="font-bold text-gray-400">đ</span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-white/[0.08] pt-2 text-white">
                <span>Khách phải trả:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-1 text-xs">
              <label className="text-gray-400 font-bold block">Phương thức thanh toán:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>💵 Tiền Mặt</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
                    paymentMethod === 'vietqr'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>📱 VietQR Napas</span>
                </button>
              </div>

              {/* Cash given calculation */}
              {paymentMethod === 'cash' ? (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-semibold">Tiền khách đưa:</span>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                      placeholder="Nhập số tiền..."
                      className="w-40 text-right p-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white font-bold text-sm"
                    />
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1.5 border-t border-white/5">
                    <span className="text-gray-400">Tiền thừa trả khách:</span>
                    <span className="text-emerald-400 text-sm">{formatVND(changeAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-blue-300 font-bold block mb-1">
                    Mã QR tự động sinh sau khi bấm thanh toán
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Khách quét app ngân hàng MB, VCB, Techcombank, VPBank...
                  </span>
                </div>
              )}
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleCheckout}
              disabled={posItems.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <Printer className="w-5 h-5" />
              <span>THANH TOÁN & IN HÓA ĐƠN K80</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal (K80 & A5) */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Khổ in:</span>
                <button
                  onClick={() => setPrintFormat('k80')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    printFormat === 'k80' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Nhiệt K80 (80mm)
                </button>
                <button
                  onClick={() => setPrintFormat('a5')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    printFormat === 'a5' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Khổ A5
                </button>
              </div>

              <button
                onClick={() => setCompletedInvoice(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Canvas */}
            <div
              id="printable-receipt"
              className={`bg-white text-black p-5 rounded-2xl mx-auto font-mono text-xs shadow-inner ${
                printFormat === 'k80' ? 'max-w-[320px] text-[11px]' : 'max-w-md text-xs'
              }`}
            >
              <div className="text-center space-y-1 pb-3 border-b border-black border-dashed">
                <h2 className="font-bold text-base tracking-wider uppercase">iShop Huy Hoàng</h2>
                <p className="text-[10px]">Đ/C: 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức</p>
                <p className="text-[10px]">Hotline: 0988.888.999</p>
                <h3 className="font-bold text-sm mt-2 uppercase">HÓA ĐƠN BÁN HÀNG</h3>
                <p className="text-[10px]">Số HĐ: {completedInvoice.invoiceCode}</p>
                <p className="text-[10px]">Ngày: {completedInvoice.createdAt}</p>
              </div>

              <div className="py-2 space-y-1 border-b border-black border-dashed text-[11px]">
                <p>Khách hàng: <strong>{completedInvoice.customerName}</strong></p>
                <p>SĐT: <strong>{completedInvoice.customerPhone}</strong></p>
                <p>Thu ngân: {completedInvoice.cashierName}</p>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-black border-dashed space-y-2">
                {completedInvoice.items.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{item.name}</span>
                      <span>{formatVND(item.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>SL: {item.quantity} x {formatVND(item.unitPrice)}</span>
                    </div>
                    {item.imei && (
                      <div className="text-[10px] font-bold text-red-600">
                        * IMEI: {item.imei}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="py-2 space-y-1 border-b border-black border-dashed text-[11px]">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatVND(completedInvoice.subtotal)}</span>
                </div>
                {completedInvoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Chiết khấu:</span>
                    <span>-{formatVND(completedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1">
                  <span>TỔNG CỘNG:</span>
                  <span>{formatVND(completedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>Phương thức:</span>
                  <span className="uppercase font-bold">{completedInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* QR Code in receipt for payment or warranty lookup */}
              <div className="py-3 text-center space-y-1">
                {completedInvoice.paymentMethod === 'vietqr' ? (
                  <>
                    <img
                      src={generateVietQRUrl(completedInvoice.totalAmount, completedInvoice.invoiceCode)}
                      alt="VietQR"
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-[9px]">Quét mã VietQR Napas 247 để chuyển khoản</p>
                  </>
                ) : (
                  <p className="text-[10px] font-semibold text-gray-700">
                    Đã thanh toán tiền mặt đủ.
                  </p>
                )}
                <p className="text-[9px] italic mt-2">
                  {completedInvoice.warrantyNote}
                </p>
                <p className="text-[9px] font-bold mt-1">Xin cảm ơn và hẹn gặp lại quý khách!</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 no-print">
              <button
                onClick={handlePrint}
                className="btn-gold flex-1 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>In Hóa Đơn Ngay (Ctrl + P)</span>
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
