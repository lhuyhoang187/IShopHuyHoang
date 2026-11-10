'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Scale,
  ShoppingCart,
  Zap,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct, PhoneColor, PhoneCapacity, AccessoryProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import VietQRModal from '@/components/customer/VietQRModal';

export default function PhoneDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [phone, setPhone] = useState<PhoneProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState<PhoneColor | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<PhoneCapacity | null>(null);
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);
  const [availableStockCount, setAvailableStockCount] = useState<number>(0);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderCode] = useState(() => `DH${Date.now().toString().slice(-6)}`);

  const updateVariantStock = (p: PhoneProduct, col: PhoneColor | null, cap: PhoneCapacity | null) => {
    const stock = IShopStore.getProductAvailableStock({
      productId: p.id,
      type: 'phone',
      color: col?.name,
      capacity: cap?.size,
    });
    setAvailableStockCount(stock);
  };

  const loadData = () => {
    if (!slug) return;
    const found = IShopStore.getPhoneBySlug(slug);
    if (found) {
      setPhone(found);
      const col = found.colors.find((c) => c.id === selectedColor?.id) || found.colors[0];
      const cap = found.capacities.find((c) => c.size === selectedCapacity?.size) || found.capacities[0];
      setSelectedColor(col);
      setSelectedCapacity(cap);

      updateVariantStock(found, col, cap);
    }
    setAccessories(IShopStore.getAccessories());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, [slug]);

  if (!phone || !selectedColor || !selectedCapacity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Đang tải thông tin sản phẩm...</h2>
        <Link href="/phones" className="text-sm text-blue-600 hover:underline font-bold">
          Quay lại danh sách điện thoại
        </Link>
      </div>
    );
  }

  // Calculate combo discounts
  const comboItems = accessories.slice(0, 3);
  const comboTotalAdd = comboItems
    .filter((c) => selectedCombos.includes(c.id))
    .reduce((sum, item) => sum + Math.round(item.sellingPrice * 0.85), 0); // 15% off

  const finalPrice = selectedCapacity.price + comboTotalAdd;

  const toggleCombo = (id: string) => {
    setSelectedCombos((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const result = IShopStore.addToCart({
      productId: phone.id,
      type: 'phone',
      name: phone.name,
      slug: phone.slug,
      imageUrl: selectedColor.imageUrl,
      color: selectedColor.name,
      capacity: selectedCapacity.size,
      price: selectedCapacity.price,
      originalPrice: selectedCapacity.originalPrice,
      quantity: quantity,
    });

    if (!result.success) {
      setToastMessage({
        message: result.message,
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const failedCombos: string[] = [];
    comboItems
      .filter((c) => selectedCombos.includes(c.id))
      .forEach((combo) => {
        const comboRes = IShopStore.addToCart({
          productId: combo.id,
          type: 'accessory',
          name: `${combo.name} (Mua kèm máy -15%)`,
          slug: combo.slug,
          imageUrl: combo.imageUrl,
          price: Math.round(combo.sellingPrice * 0.85),
          originalPrice: combo.originalPrice,
          quantity: 1,
          isComboDiscount: true,
        });
        if (!comboRes.success) {
          failedCombos.push(combo.name);
        }
      });

    if (failedCombos.length > 0) {
      setToastMessage({
        message: `Đã thêm máy vào giỏ, tuy nhiên phụ kiện "${failedCombos.join(', ')}" đã hết hàng trong kho!`,
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({
        message: `Đã thêm ${quantity} máy ${phone.name} (${selectedCapacity.size} - ${selectedColor.name}) vào giỏ hàng thành công!`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const isComparing = IShopStore.getComparisonList().includes(phone.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/" className="hover:text-slate-900 transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/phones" className="hover:text-slate-900 transition-colors">Điện thoại</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-amber-700 font-bold truncate">{phone.name}</span>
      </nav>

      {/* Main Product Layout with Ambient Lighting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Ambient Glow Showcase Gallery */}
        <div className="lg:col-span-6 space-y-5">
          <div
            style={{
              boxShadow: `0 10px 40px -10px ${selectedColor.hex}33`,
            }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center relative overflow-hidden shadow-lg transition-all duration-500"
          >
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                100% NGUYÊN SEAL
              </span>
            </div>

            {/* Product Active Image */}
            <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden my-4 bg-gradient-to-b from-slate-100 to-slate-200/80 border border-slate-200 p-6 flex items-center justify-center">
              <img
                key={selectedColor.imageUrl}
                src={selectedColor.imageUrl}
                alt={`${phone.name} ${selectedColor.name}`}
                className="w-full h-full object-contain transition-all duration-500 animate-in fade-in"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <span>Đang xem phiên bản màu:</span>
              <strong className="text-amber-800 font-bold">{selectedColor.name}</strong>
            </div>
          </div>

          {/* Color Thumbnails Selector */}
          <div className="grid grid-cols-4 gap-3">
            {phone.colors.map((c) => {
              const isColOut = Boolean(c.isOutOfStock || c.stock === 0);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedColor(c);
                    updateVariantStock(phone, c, selectedCapacity);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all relative overflow-hidden cursor-pointer ${
                    selectedColor.id === c.id
                      ? isColOut
                        ? 'border-red-400 bg-red-50 text-slate-900 shadow-sm scale-[1.03]'
                        : 'border-amber-500 bg-amber-50 text-slate-900 shadow-sm scale-[1.03]'
                      : isColOut
                      ? 'border-slate-200 bg-slate-100/80 text-slate-400 hover:bg-slate-100 opacity-70'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    style={{ backgroundColor: c.hex }}
                    className="w-6 h-6 rounded-full mx-auto mb-1.5 border border-slate-300 shadow-sm"
                  />
                  <span className={`text-[11px] font-bold block truncate ${isColOut ? 'line-through text-slate-400' : ''}`}>
                    {c.name.split(' ')[0]}
                  </span>
                  {isColOut && (
                    <span className="block text-[8px] font-black text-red-600 mt-0.5 leading-none">
                      Hết hàng
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Value Commitments */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <ShieldCheck className="w-5 h-5 mx-auto text-amber-600 mb-1" />
              <span className="font-bold block text-slate-900">Bảo Hành 12T</span>
              <span className="text-[10px] text-slate-500">Apple AAR Chuẩn</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <RotateCcw className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
              <span className="font-bold block text-slate-900">1 Đổi 1 30 Ngày</span>
              <span className="text-[10px] text-slate-500">Lỗi là đổi mới</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <Truck className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <span className="font-bold block text-slate-900">Giao 1 Giờ</span>
              <span className="text-[10px] text-slate-500">Hỏa tốc TP.HCM</span>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration & Purchase */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-700 font-bold">
              Hãng {phone.brand} • Phân Phối Chính Ngạch
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 leading-tight">
              {phone.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Model: {phone.slug.toUpperCase()} • Quản lý theo từng số IMEI trong kho
            </p>
          </div>

          {/* Luxury Pricing Box with Live Stock Status */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-5 sm:p-6 rounded-3xl border border-amber-200 shadow-md space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 line-through block font-medium">
                  {formatVND(selectedCapacity.originalPrice * quantity)}
                </span>
                <span className="text-3xl sm:text-4xl font-black text-amber-700">
                  {formatVND(finalPrice * quantity)}
                </span>
                {quantity > 1 && (
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    Đơn giá: {formatVND(finalPrice)}/máy
                  </span>
                )}
              </div>

              {availableStockCount <= 0 ? (
                <div className="text-right">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300 shadow-sm animate-pulse inline-block">
                    ✕ TẠM HẾT HÀNG
                  </span>
                  <div className="text-[11px] text-red-600 mt-2 flex items-center gap-1.5 justify-end font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Phiên bản này tạm hết hàng</span>
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                    Tiết kiệm {formatVND((selectedCapacity.originalPrice - selectedCapacity.price) * quantity)}
                  </span>
                  <div className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1.5 justify-end font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Còn {availableStockCount} máy sẵn IMEI</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hiển thị điểm thưởng theo tỷ lệ 100k = 10 điểm */}
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-300 px-3.5 py-2 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Điểm tích lũy khi mua:</span>
              </div>
              <span className="text-sm font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-xl border border-amber-300">
                +{Math.floor((finalPrice * quantity) / 10000).toLocaleString('vi-VN')} điểm
              </span>
            </div>
          </div>

          {/* Storage selector with Stock Count & In/Out-of-Stock Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                1. Chọn Dung Lượng Bộ Nhớ:
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Tình trạng: {selectedCapacity.isOutOfStock || availableStockCount <= 0 ? (
                  <span className="font-bold text-red-600">Hết hàng</span>
                ) : (
                  <span className="font-bold text-emerald-600">Còn hàng ({availableStockCount} máy)</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {phone.capacities.map((cap) => {
                const isSelected = selectedCapacity.size === cap.size;
                const diff = cap.price - phone.capacities[0].price;

                const capStock = IShopStore.getProductAvailableStock({
                  productId: phone.id,
                  type: 'phone',
                  capacity: cap.size,
                });
                const isCapOut = Boolean(cap.isOutOfStock || cap.stock === 0 || capStock === 0);

                return (
                  <button
                    key={cap.size}
                    type="button"
                    onClick={() => {
                      setSelectedCapacity(cap);
                      updateVariantStock(phone, selectedColor, cap);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? isCapOut
                          ? 'border-red-400 bg-red-50/70 text-slate-900 shadow-sm scale-[1.02]'
                          : 'border-amber-500 bg-amber-50 text-slate-900 shadow-sm scale-[1.02]'
                        : isCapOut
                        ? 'border-slate-200 bg-slate-100/70 text-slate-500 hover:bg-slate-100 opacity-80'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className={`font-black text-base ${isCapOut ? 'line-through text-slate-500' : ''}`}>
                        {cap.size}
                      </div>
                      {isCapOut ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {capStock > 0 ? `Còn ${capStock}` : 'Sẵn hàng'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-amber-700 font-black mt-1">
                      {formatVND(cap.price)}
                    </div>
                    {diff > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        +{formatVND(diff)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color selector with Stock Count & In/Out-of-Stock Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                2. Chọn Màu Sắc Máy:
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedColor.name} &bull; {selectedColor.isOutOfStock || availableStockCount <= 0 ? (
                  <span className="font-bold text-red-600">Tạm hết hàng</span>
                ) : (
                  <span className="font-bold text-emerald-600">Sẵn hàng</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {phone.colors.map((c) => {
                const isSelected = selectedColor.id === c.id;

                const colStock = IShopStore.getProductAvailableStock({
                  productId: phone.id,
                  type: 'phone',
                  color: c.name,
                  capacity: selectedCapacity.size,
                });
                const isColOut = Boolean(c.isOutOfStock || c.stock === 0 || colStock === 0);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      updateVariantStock(phone, c, selectedCapacity);
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? isColOut
                          ? 'border-red-400 bg-red-50/70 text-slate-900 shadow-sm'
                          : 'border-amber-500 bg-amber-50 text-slate-900 shadow-sm'
                        : isColOut
                        ? 'border-slate-200 bg-slate-100/70 text-slate-500 hover:bg-slate-100 opacity-80'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: c.hex }}
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                      />
                      <span className={`truncate ${isColOut ? 'line-through text-slate-500' : ''}`}>
                        {c.name}
                      </span>
                    </div>

                    {isColOut ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200 shrink-0">
                        Hết hàng
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {colStock > 0 ? `Còn ${colStock}` : 'Sẵn hàng'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Combo accessory deals */}
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ưu Đãi Mua Kèm Máy (Giảm 15%):</span>
            </label>

            <div className="space-y-2">
              {comboItems.map((combo) => {
                const isChecked = selectedCombos.includes(combo.id);
                const discounted = Math.round(combo.sellingPrice * 0.85);

                return (
                  <div
                    key={combo.id}
                    onClick={() => toggleCombo(combo.id)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white font-black'
                            : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-10 h-10 object-contain rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 p-1"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {combo.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">{combo.brand}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 line-through block font-medium">
                        {formatVND(combo.sellingPrice)}
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        +{formatVND(discounted)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bộ chọn số lượng đặt mua dấu cộng (+) và trừ (-) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Số lượng máy:</span>
              <span className="text-[11px] text-slate-500">Tùy chọn đặt nhiều sản phẩm cùng lúc</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Giảm số lượng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-slate-900 w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  if (quantity >= availableStockCount) {
                    setToastMessage({
                      message: `Kho hiện chỉ còn ${availableStockCount} máy cho phiên bản ${selectedCapacity.size} - ${selectedColor.name}. Không thể chọn thêm!`,
                      type: 'error',
                    });
                    setTimeout(() => setToastMessage(null), 3500);
                    return;
                  }
                  setQuantity((q) => q + 1);
                }}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Tăng số lượng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Buy now with VietQR */}
              <button
                disabled={availableStockCount <= 0}
                onClick={() => {
                  if (availableStockCount <= 0) {
                    setToastMessage({
                      message: `Phiên bản ${selectedCapacity.size} - ${selectedColor.name} hiện đã hết hàng trong kho!`,
                      type: 'error',
                    });
                    setTimeout(() => setToastMessage(null), 3500);
                    return;
                  }
                  if (quantity > availableStockCount) {
                    setToastMessage({
                      message: `Kho chỉ còn ${availableStockCount} máy. Vui lòng giảm số lượng đặt mua!`,
                      type: 'error',
                    });
                    setTimeout(() => setToastMessage(null), 3500);
                    return;
                  }
                  setIsVietQROpen(true);
                }}
                className={`w-full py-4 px-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all ${
                  availableStockCount <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'btn-gold cursor-pointer hover:scale-[1.01]'
                }`}
              >
                {availableStockCount <= 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>TẠM HẾT HÀNG</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white fill-current" />
                    <span>MUA NGAY (VIETQR 247)</span>
                  </>
                )}
              </button>

              {/* Add to Cart */}
              <button
                disabled={availableStockCount <= 0}
                onClick={handleAddToCart}
                className={`w-full py-4 px-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  availableStockCount <= 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer hover:scale-[1.01]'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-amber-300" />
                <span>{availableStockCount <= 0 ? 'Tạm Hết Hàng Trong Kho' : 'Thêm Vào Giỏ Hàng'}</span>
              </button>
            </div>

            {/* Compare button */}
            <button
              onClick={() => IShopStore.toggleComparison(phone.id)}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all shadow-sm cursor-pointer ${
                isComparing
                  ? 'border-sky-400 bg-sky-50 text-sky-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>
                {isComparing
                  ? '✓ Đã thêm vào khay so sánh (Bấm xem so sánh)'
                  : 'So sánh cấu hình máy này với model khác'}
              </span>
            </button>

            {/* Toast feedback */}
            {toastMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-3 border animate-in slide-in-from-bottom duration-200 ${
                  toastMessage.type === 'error'
                    ? 'bg-red-950 text-red-100 border-red-500 shadow-red-950/50'
                    : 'bg-emerald-700 text-white border-emerald-400 shadow-emerald-950/50'
                }`}
              >
                {toastMessage.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                ) : (
                  <Check className="w-5 h-5 text-emerald-200 shrink-0" />
                )}
                <span className="leading-relaxed">{toastMessage.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Sheet Table */}
      <section className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <Layers className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-black text-slate-900">
            Bảng Thông Số Kỹ Thuật Chi Tiết
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3">
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Màn hình:</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.screen}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Vi xử lý (CPU):</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.chip}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Bộ nhớ RAM:</span>
              <span className="font-bold text-slate-900 text-right">{phone.specs.ram}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Bộ nhớ trong:</span>
              <span className="font-bold text-slate-900 text-right">{phone.specs.storage}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Hệ điều hành:</span>
              <span className="font-bold text-slate-900 text-right">{phone.specs.os}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Camera sau:</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.rearCamera}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Camera trước:</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.frontCamera}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Dung lượng pin:</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.battery}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Công nghệ sạc:</span>
              <span className="font-bold text-slate-900 text-right max-w-[60%]">{phone.specs.charging}</span>
            </div>
            <div className="flex justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Kháng nước & bụi:</span>
              <span className="font-bold text-slate-900 text-right">{phone.specs.waterResistant}</span>
            </div>
          </div>
        </div>
      </section>

      {/* VietQR Quick Payment Modal */}
      <VietQRModal
        isOpen={isVietQROpen}
        onClose={() => setIsVietQROpen(false)}
        amount={finalPrice * quantity}
        orderCode={orderCode}
        onPaymentSuccess={() => {
          alert('Cảm ơn quý khách! iShop Huy Hoàng đã ghi nhận thanh toán và sẽ liên hệ giao hàng trong 15 phút.');
        }}
      />
    </div>
  );
}
