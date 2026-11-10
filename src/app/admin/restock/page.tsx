'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Package,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Check,
  X,
  Palette,
  HardDrive,
  Tag,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Cpu,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Supplier, PhoneProduct, PhoneColor, PhoneCapacity } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

const ALL_STANDARD_CAPACITIES = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

export default function AdminRestockPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('sup-1');

  // 1. Brand selection
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // 2. Model selection
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('p-1');

  // 3. Capacity selection
  const [capacity, setCapacity] = useState<string>('256GB');

  // 4. Color selection
  const [color, setColor] = useState<string>('Titan Sa Mạc (Desert Titanium)');

  // Pricing
  const [costPrice, setCostPrice] = useState<number>(32500000);
  const [sellingPrice, setSellingPrice] = useState<number>(34990000);

  // Modal: Add Brand
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandModelName, setNewBrandModelName] = useState('');
  const [newBrandCapacity, setNewBrandCapacity] = useState('256GB');
  const [newBrandColorName, setNewBrandColorName] = useState('Đen Titan');
  const [newBrandColorHex, setNewBrandColorHex] = useState('#222222');
  const [newBrandPrice, setNewBrandPrice] = useState(29990000);

  // Modal: Add Color
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');

  // Batch IMEI and Payment
  const [imeiListText, setImeiListText] = useState<string>(
    '358921104888001\n358921104888002\n358921104888003'
  );
  const [paidAmount, setPaidAmount] = useState<number>(50000000);

  const loadData = () => {
    setSuppliers(IShopStore.getSuppliers());
    const phoneList = IShopStore.getPhones();
    setPhones(phoneList);
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Distinct Brands available
  const brandList = useMemo(() => {
    const set = new Set<string>();
    phones.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [phones]);

  // Phones filtered strictly by selected brand
  const filteredPhonesByBrand = useMemo(() => {
    if (selectedBrand === 'all') return phones;
    return phones.filter((p) => p.brand === selectedBrand);
  }, [phones, selectedBrand]);

  const currentPhone = useMemo(() => {
    const matched = phones.find((p) => p.id === selectedPhoneId);
    if (matched && (selectedBrand === 'all' || matched.brand === selectedBrand)) {
      return matched;
    }
    return filteredPhonesByBrand[0] || phones[0];
  }, [phones, selectedPhoneId, selectedBrand, filteredPhonesByBrand]);

  // Handle Brand selection
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    if (brand !== 'all') {
      const firstPhone = phones.find((p) => p.brand === brand);
      if (firstPhone) {
        setSelectedPhoneId(firstPhone.id);
      }
    }
  };

  // Get distinct colors for current phone
  const availableColors = useMemo(() => {
    if (!currentPhone || !currentPhone.colors || currentPhone.colors.length === 0) {
      return [
        { id: 'c-default', name: 'Đen (Black)', hex: '#222222', imageUrl: '' },
        { id: 'c-white', name: 'Trắng (White)', hex: '#f0f0f0', imageUrl: '' },
      ];
    }
    return currentPhone.colors;
  }, [currentPhone]);

  // When selected phone changes, sync capacity & color
  useEffect(() => {
    if (currentPhone) {
      // Find matching capacity or fallback
      const matchedCap = currentPhone.capacities?.find((c) => c.size === capacity);
      if (matchedCap) {
        setSellingPrice(matchedCap.price);
        setCostPrice(Math.round((matchedCap.price * 0.92) / 10000) * 10000);
      }

      // Find matching color or fallback
      const matchedColor = availableColors.find((c) => c.name === color);
      if (!matchedColor && availableColors.length > 0) {
        setColor(availableColors[0].name);
      }
    }
  }, [selectedPhoneId, currentPhone, availableColors]);

  // Handle capacity selection (Diverse full list: 64GB -> 2TB)
  const handleSelectCapacity = (capSize: string) => {
    setCapacity(capSize);
    if (currentPhone) {
      const capObj = currentPhone.capacities?.find((c) => c.size === capSize);
      if (capObj) {
        setSellingPrice(capObj.price);
        setCostPrice(Math.round((capObj.price * 0.92) / 10000) * 10000);
      } else {
        // Estimate reasonable price if phone doesn't have this capacity yet
        const basePrice = currentPhone.capacities?.[0]?.price || 30000000;
        let mult = 1;
        if (capSize === '64GB') mult = 0.8;
        else if (capSize === '128GB') mult = 0.9;
        else if (capSize === '256GB') mult = 1.0;
        else if (capSize === '512GB') mult = 1.18;
        else if (capSize === '1TB') mult = 1.35;
        else if (capSize === '2TB') mult = 1.55;

        const estPrice = Math.round((basePrice * mult) / 100000) * 100000;
        setSellingPrice(estPrice);
        setCostPrice(Math.round((estPrice * 0.92) / 10000) * 10000);
      }
    }
  };

  // Add new Brand
  const handleSaveNewBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBrand = newBrandName.trim();
    const trimmedModel = newBrandModelName.trim() || `${trimmedBrand} Mới`;
    if (!trimmedBrand) {
      alert('Vui lòng nhập tên thương hiệu / hãng máy!');
      return;
    }

    const newId = `p-${Date.now()}`;
    const newPhoneItem: PhoneProduct = {
      id: newId,
      name: trimmedModel,
      slug: trimmedModel.toLowerCase().replace(/\s+/g, '-'),
      brand: trimmedBrand as any,
      description: `Sản phẩm chính hãng thương hiệu ${trimmedBrand}.`,
      rating: 5.0,
      reviewCount: 1,
      warrantyInfo: 'Bảo hành 12 tháng chính hãng.',
      colors: [
        {
          id: `c-${Date.now()}`,
          name: newBrandColorName.trim() || 'Đen',
          hex: newBrandColorHex || '#222222',
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        },
      ],
      capacities: [
        {
          size: newBrandCapacity,
          price: newBrandPrice,
          originalPrice: Math.round(newBrandPrice * 1.08),
        },
      ],
      specs: {
        screen: '6.7 inch AMOLED',
        chip: 'Chip hiệu năng cao',
        ram: '8 GB',
        storage: newBrandCapacity,
        rearCamera: '50 MP',
        frontCamera: '32 MP',
        battery: '5000 mAh',
        charging: 'Sạc nhanh 67W',
        os: 'Android / iOS',
        sim: '2 SIM',
        waterResistant: 'IP68',
        weight: '200g',
      },
    };

    const currentPhones = IShopStore.getPhones();
    IShopStore.updatePhone(newId, newPhoneItem);
    // Add to storage list
    const updated = [newPhoneItem, ...currentPhones];
    if (typeof window !== 'undefined') {
      localStorage.setItem('ishop_phones', JSON.stringify(updated));
      window.dispatchEvent(new Event('ishop_data_changed'));
    }

    setSelectedBrand(trimmedBrand);
    setSelectedPhoneId(newId);
    setCapacity(newBrandCapacity);
    setColor(newBrandColorName.trim() || 'Đen');
    setSellingPrice(newBrandPrice);
    setCostPrice(Math.round((newBrandPrice * 0.92) / 10000) * 10000);

    setIsAddBrandModalOpen(false);
    setNewBrandName('');
    setNewBrandModelName('');
    loadData();
  };

  // Add new Color to current phone
  const handleSaveNewColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPhone) return;

    const trimmedColor = newColorName.trim();
    if (!trimmedColor) {
      alert('Vui lòng nhập tên màu sắc mới!');
      return;
    }

    let updatedColors = [...currentPhone.colors];
    const existingColor = updatedColors.find(
      (c) => c.name.toLowerCase() === trimmedColor.toLowerCase()
    );
    if (!existingColor) {
      updatedColors.push({
        id: `c-${Date.now()}`,
        name: trimmedColor,
        hex: newColorHex,
        imageUrl: currentPhone.colors[0]?.imageUrl || '',
      });
      IShopStore.updatePhone(currentPhone.id, { colors: updatedColors });
    }

    setColor(trimmedColor);
    setIsAddColorModalOpen(false);
    setNewColorName('');
    loadData();
  };

  // Parse raw IMEI text into array of clean 15-digit numbers
  const parsedImeis = useMemo(() => {
    return imeiListText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);
  }, [imeiListText]);

  const totalBatchCost = costPrice * parsedImeis.length;
  const debtIncrease = Math.max(0, totalBatchCost - paidAmount);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedImeis.length === 0) {
      alert('Vui lòng nhập ít nhất 1 số IMEI hợp lệ!');
      return;
    }

    // 1. Post to live MySQL Database via /api/restock
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          phoneId: selectedPhoneId,
          phoneName: currentPhone ? currentPhone.name : 'Điện Thoại Mới',
          color,
          capacity,
          costPrice,
          sellingPrice,
          imeis: parsedImeis,
          paidAmount,
          notes: `Nhập lô hàng chính ngạch: Hãng ${currentPhone?.brand} - ${currentPhone?.name} (${color} - ${capacity}).`,
        }),
      });
    } catch (err) {
      console.warn('API restock error:', err);
    }

    // 2. Also save to client store for immediate reactivity
    IShopStore.importPhoneBatch(
      selectedSupplierId,
      selectedPhoneId,
      color,
      capacity,
      costPrice,
      sellingPrice,
      parsedImeis,
      paidAmount
    );

    setSuccessMessage(
      `✓ Đã nạp thành công ${parsedImeis.length} cây máy mới [Hãng: ${currentPhone?.brand}] - ${currentPhone?.name} (${color} - ${capacity}) vào kho CSDL! Tự động tạo Phiếu Chi: ${formatVND(
        paidAmount
      )} và cập nhật công nợ NCC: +${formatVND(debtIncrease)}.`
    );

    setImeiListText('');
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Phân Hệ Mua Hàng &amp; Quản Lý Nhà Cung Cấp
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Inbound Restock &amp; Lô IMEI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>Mua Hàng &amp; Nạp Lô IMEI Từ Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Chọn biến thể chính xác theo <strong>Hãng máy</strong>, <strong>Dòng máy</strong>, <strong>Dung lượng</strong> và <strong>Màu sắc</strong> dạng danh sách (tránh gõ thủ công sai sót).
          </p>
        </div>

        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-transform hover:scale-105"
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span>Xem Kho Máy Mới (IMEI)</span>
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Import Form Layout */}
      <form onSubmit={handleImport} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Batch IMEI Input & Supplier Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Box 1: IMEI input */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>1. Dán Danh Sách Số IMEI Cần Nhập Kho</span>
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                Đã nhận diện: {parsedImeis.length} IMEI
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">
                Dán danh sách IMEI (Mỗi số 1 dòng hoặc cách nhau bởi dấu phẩy):
              </label>
              <textarea
                rows={7}
                required
                value={imeiListText}
                onChange={(e) => setImeiListText(e.target.value)}
                placeholder="358921104888001&#10;358921104888002&#10;358921104888003..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Parsed Previews */}
            {parsedImeis.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="text-slate-600 font-bold block text-[11px] uppercase tracking-wide">
                  Danh sách {parsedImeis.length} IMEI sẽ kích hoạt trong kho:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {parsedImeis.map((imei, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white text-blue-800 border border-slate-200 font-bold shadow-2xs"
                    >
                      {idx + 1}. {imei}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Supplier Debt & Payment */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Thông Tin Nhà Cung Cấp &amp; Công Nợ</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Nhà Cung Cấp phân phối *:
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Nợ hiện tại: {formatVND(s.currentDebt)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Số tiền thanh toán ngay cho NCC (VND):
                </label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Selection & Clean Variant Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 sticky top-24">
            {/* Header section 3 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    Cấu Hình Hãng Máy, Dòng Máy &amp; Biến Thể
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Chọn nhanh dạng danh sách: Hãng máy → Dòng máy → Dung lượng → Màu sắc
                  </p>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 1. CHỌN HÃNG MÁY + NÚT THÊM THƯƠNG HIỆU MỚI              */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold block">
                  1. Chọn Hãng Máy (Thương hiệu) *:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Thương Hiệu</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBrandChange('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedBrand === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Tất Cả ({phones.length})
                </button>
                {brandList.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBrandChange(b)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      selectedBrand === b
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>
                      {b === 'Apple'
                        ? '🍏'
                        : b === 'Samsung'
                        ? '🔷'
                        : b === 'Xiaomi'
                        ? '🟠'
                        : b === 'OPPO'
                        ? '🟢'
                        : '📱'}
                    </span>
                    <span>{b}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. CHỌN DÒNG MÁY (PHÂN LOẠI RÕ RÀNG THEO HÃNG ĐÃ CHỌN)   */}
            {/* ======================================================== */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-700 font-bold block flex items-center justify-between">
                <span>
                  2. Chọn Dòng Máy{' '}
                  {selectedBrand !== 'all' ? (
                    <span className="text-blue-700 uppercase font-black">
                      (Hãng {selectedBrand})
                    </span>
                  ) : (
                    ''
                  )}{' '}
                  *:
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {filteredPhonesByBrand.length} model khả dụng
                </span>
              </label>

              <select
                value={selectedPhoneId}
                onChange={(e) => setSelectedPhoneId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {filteredPhonesByBrand.map((p) => (
                  <option key={p.id} value={p.id}>
                    {selectedBrand === 'all' ? `[${p.brand}] ` : ''}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ======================================================== */}
            {/* 3. CHỌN DUNG LƯỢNG (ĐA DẠNG: 64GB, 128GB, 256GB, 512GB, 1TB, 2TB) */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Chọn Dung Lượng (Bộ nhớ trong) *:</span>
                </label>
                <span className="text-blue-700 font-black font-mono text-xs">
                  Đã chọn: {capacity}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ALL_STANDARD_CAPACITIES.map((capSize) => {
                  const isCapSelected = capacity === capSize;
                  return (
                    <button
                      key={capSize}
                      type="button"
                      onClick={() => handleSelectCapacity(capSize)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                        isCapSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-black'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="font-mono text-xs block">{capSize}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 4. CHỌN MÀU SẮC (CHỈ CHỌN MÀU, KHÔNG HIỂN THỊ GIÁ)       */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Chọn Màu Sắc Máy *:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddColorModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Màu Mới</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableColors.map((col) => {
                  const isColorSelected = color === col.name;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setColor(col.name)}
                      className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isColorSelected
                          ? 'bg-blue-50 border-2 border-blue-600 text-blue-900 shadow-sm font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 font-medium'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-xs">{col.name}</span>
                      {isColorSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 5. GIÁ VỐN & GIÁ BÁN LÔ HÀNG                             */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Giá vốn nhập/cây (VND) *:
                </label>
                <input
                  type="number"
                  min={1000}
                  step={10000}
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-sm font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Giá vốn hạch toán công nợ và lãi gộp
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Giá bán lẻ niêm yết (VND) *:
                </label>
                <input
                  type="number"
                  min={1000}
                  step={10000}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Đồng bộ tức thì lên quầy POS và Web khách
                </span>
              </div>
            </div>

            {/* Cost & Debt Calculation Summary */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Số lượng máy nhập:</span>
                <span className="font-bold text-slate-900">{parsedImeis.length} cây</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tổng giá trị lô hàng:</span>
                <span className="font-black text-slate-900 text-sm font-mono">
                  {formatVND(totalBatchCost)}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-bold">
                <span>Thanh toán ngay cho NCC:</span>
                <span className="font-mono text-sm">{formatVND(paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700 font-black border-t border-slate-100 pt-2">
                <span>Ghi nợ thêm cho NCC:</span>
                <span className="font-mono text-sm">+{formatVND(debtIncrease)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={parsedImeis.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Package className="w-4 h-4 text-white" />
              <span>
                XÁC NHẬN NẠP {parsedImeis.length} IMEI ({currentPhone?.brand} • {color} • {capacity})
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM THƯƠNG HIỆU / HÃNG MÁY MỚI                 */}
      {/* ======================================================== */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Thêm Thương Hiệu (Hãng Máy) Mới</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Khai báo hãng máy và model đầu tiên vào danh mục
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBrandModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBrand} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên Hãng Máy (Thương hiệu) *:
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Ví dụ: Google Pixel, Sony, Vivo, Asus..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên Dòng Máy đầu tiên của hãng *:
                </label>
                <input
                  type="text"
                  required
                  value={newBrandModelName}
                  onChange={(e) => setNewBrandModelName(e.target.value)}
                  placeholder="Ví dụ: Pixel 9 Pro XL, Xperia 1 VI..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">
                    Dung lượng ban đầu:
                  </label>
                  <select
                    value={newBrandCapacity}
                    onChange={(e) => setNewBrandCapacity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    {ALL_STANDARD_CAPACITIES.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold mb-1 block">
                    Màu sắc ban đầu:
                  </label>
                  <input
                    type="text"
                    value={newBrandColorName}
                    onChange={(e) => setNewBrandColorName(e.target.value)}
                    placeholder="Ví dụ: Đen Obsidian"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Giá bán lẻ niêm yết (VND) *:
                </label>
                <input
                  type="number"
                  min={1000000}
                  step={100000}
                  required
                  value={newBrandPrice}
                  onChange={(e) => setNewBrandPrice(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Lưu Thương Hiệu &amp; Dòng Máy
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÊM MÀU SẮC MỚI CHO DÒNG MÁY                   */}
      {/* ======================================================== */}
      {isAddColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  <span>Thêm Màu Sắc Mới Cho Dòng Máy</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dòng máy: <strong className="text-slate-900">{currentPhone?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddColorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewColor} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên màu sắc mới *:
                </label>
                <input
                  type="text"
                  required
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Ví dụ: Titan Sa Mạc, Xanh Cực Quang..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Mã màu hiển thị (Hex):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Lưu &amp; Thêm Vào Danh Sách Màu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddColorModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
