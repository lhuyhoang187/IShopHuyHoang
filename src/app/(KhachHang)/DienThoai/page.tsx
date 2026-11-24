'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Smartphone, Scale, ArrowRight, Filter, ShoppingCart, Plus, Minus, Check, Sparkles, AlertCircle, PackageCheck, Boxes, Search, X } from 'lucide-react';
import { IShopStore } from '@/ThuVien/KhoDuLieu';
import { PhoneProduct } from '@/ThuVien/KieuDuLieu';
import { formatVND } from '@/ThuVien/ThanhToanVietQR';

export default function PhonesPage() {
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStorage, setSelectedStorage] = useState<string>('All');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [phoneQuantities, setPhoneQuantities] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    setPhones(IShopStore.getPhones());
    setCompareIds(IShopStore.getComparisonList());

    fetch(`/Api/DienThoai?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPhones(json.data);
        }
      })
      .catch((err) => console.warn('Phones live fetch notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => {
      setPhones(IShopStore.getPhones());
      setCompareIds(IShopStore.getComparisonList());
    };
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(phones.map((p) => p.brand).filter(Boolean)));
  }, [phones]);

  const availableStorages = useMemo(() => {
    const sizes = Array.from(
      new Set(phones.flatMap((p) => (p.capacities || []).map((c) => c.size)).filter(Boolean))
    );
    return sizes.sort((a, b) => {
      const toGb = (s: string) => (s.toUpperCase().includes('TB') ? (parseInt(s) || 1) * 1024 : parseInt(s) || 0);
      return toGb(a) - toGb(b);
    });
  }, [phones]);

  // Filter & Sort
  const filteredPhones = phones
    .filter((p) => (selectedBrand === 'All' ? true : p.brand === selectedBrand))
    .filter((p) => {
      if (selectedStorage === 'All') return true;
      return (p.capacities || []).some((c) => c.size.includes(selectedStorage));
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.specs?.chip && p.specs.chip.toLowerCase().includes(q)) ||
        (p.specs?.screen && p.specs.screen.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (priceSort === 'asc') return (a.capacities?.[0]?.price || 0) - (b.capacities?.[0]?.price || 0);
      if (priceSort === 'desc') return (b.capacities?.[0]?.price || 0) - (a.capacities?.[0]?.price || 0);
      return 0;
    });

  const handleQuickAddToCart = (phone: PhoneProduct) => {
    const qty = phoneQuantities[phone.id] || 1;
    const lowestCapacity = phone.capacities?.[0];
    const defaultColor = phone.colors?.[0];

    const result = IShopStore.addToCart({
      productId: phone.id,
      type: 'phone',
      name: phone.name,
      slug: phone.slug,
      imageUrl: defaultColor?.imageUrl,
      color: defaultColor?.name,
      capacity: lowestCapacity?.size,
      price: lowestCapacity?.price || 0,
      originalPrice: lowestCapacity?.originalPrice || lowestCapacity?.price || 0,
      quantity: qty,
    });

    setToastMessage({
      message: result.message,
      type: result.success ? 'success' : 'error',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800">
      {/* Header breadcrumb */}
      <div>
        <nav className="text-xs text-slate-500 mb-2 font-medium">
          <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-700 font-bold">Điện Thoại Mới 100%</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
          Điện Thoại Mới 100% Nguyên Seal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
          Cam kết hàng chính hãng Apple VN/A, Samsung Vina, Xiaomi Digiworld. Mỗi máy đều quản lý theo số IMEI riêng biệt.
        </p>
      </div>

      {/* Smart Filter Toolbar (List chọn thông minh) */}
      <div className="glass-panel rounded-2xl p-4 border border-amber-300/70 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Quick Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input autoComplete="off"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Smart Brand Dropdown */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Hãng:
            </span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            >
              <option value="All">Tất cả thương hiệu ({phones.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b} ({phones.filter((p) => p.brand === b).length} dòng máy)
                </option>
              ))}
            </select>
          </div>

          {/* Smart Storage Dropdown */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0">Bộ nhớ:</span>
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            >
              <option value="All">Tất cả bộ nhớ</option>
              {availableStorages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort price */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0">Giá:</span>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as any)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            >
              <option value="default">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Quick Brand Selection Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedBrand('All')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedBrand === 'All'
                  ? 'btn-gold text-white font-black shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả ({phones.length})
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedBrand === b
                    ? 'btn-gold text-white font-black shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b} ({phones.filter((p) => p.brand === b).length})
              </button>
            ))}
          </div>

          {(selectedBrand !== 'All' || selectedStorage !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('All');
                setSelectedStorage('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPhones.map((phone) => {
          const isComparing = compareIds.includes(phone.id);
          const lowestCapacity = phone.capacities?.[0] || { size: '256GB', price: 25990000, originalPrice: 27990000 };
          const qty = phoneQuantities[phone.id] || 1;
          const pointsEarned = Math.floor(((lowestCapacity.price || 0) * qty) / 10000);
          const availableStock = IShopStore.getProductAvailableStock({
            productId: phone.id,
            type: 'phone',
            color: phone.colors?.[0]?.name,
            capacity: lowestCapacity.size,
          });
          const isOutOfStock = availableStock <= 0;

          return (
            <div
              key={phone.id}
              className="glass-card rounded-3xl p-5 border border-amber-200/80 hover:border-amber-400/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Badge số lượng hiện đang có ở kho (Góc trên bên trái) */}
              <div className="absolute top-4 left-4 z-10">
                {availableStock > 5 ? (
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm flex items-center gap-1.5 backdrop-blur-xs">
                    <span>Còn {availableStock} máy sẵn kho</span>
                  </span>
                ) : availableStock > 0 ? (
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-sm flex items-center gap-1.5 backdrop-blur-xs">
                    <span>Chỉ còn {availableStock} máy</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300 shadow-sm flex items-center gap-1 backdrop-blur-xs">
                    <span>✕ Tạm hết hàng</span>
                  </span>
                )}
              </div>

              {/* Compare button */}
              <button
                onClick={() => IShopStore.toggleComparison(phone.id)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-xl text-xs transition-colors flex items-center gap-1 shadow-sm ${
                  isComparing
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title={isComparing ? 'Đang so sánh' : 'Thêm vào so sánh'}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isComparing ? 'Đang so sánh' : 'So sánh'}</span>
              </button>

              {/* Image */}
              <Link href={`/DienThoai/${phone.slug}`} className="block my-4 text-center">
                <div className="relative aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200/80 p-3 flex items-center justify-center">
                  {(phone.colors.find((c) => c.imageUrl)?.imageUrl) ? (
                    <img
                      src={phone.colors.find((c) => c.imageUrl)?.imageUrl}
                      alt={phone.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Smartphone className="w-12 h-12" />
                      <span className="text-[11px] font-semibold">Chưa có ảnh sản phẩm</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 justify-center">
                  {phone.colors.map((c) => (
                    <span
                      key={c.id}
                      style={{ backgroundColor: c.hex }}
                      className="w-3 h-3 rounded-full border border-slate-300 shadow-sm"
                      title={c.name}
                    />
                  ))}
                </div>

                <Link href={`/DienThoai/${phone.slug}`}>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 min-h-[40px]">
                    {phone.name}
                  </h2>
                </Link>

                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="truncate">Chip: {(phone.specs?.chip || 'Snapdragon 8 Gen 3').split('(')[0]}</div>
                  <div className="truncate">Màn: {(phone.specs?.screen || '6.7 inch OLED 120Hz').split(',')[0]}</div>
                </div>

                <div className="pt-1 flex items-baseline justify-between">
                  <div>
                    {lowestCapacity.originalPrice > lowestCapacity.price && (
                      <span className="text-xs text-slate-400 line-through block font-medium">
                        {formatVND(lowestCapacity.originalPrice)}
                      </span>
                    )}
                    <span className="text-base font-black text-amber-700">
                      {formatVND(lowestCapacity.price)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">Bản {lowestCapacity.size}</span>
                </div>

                {/* Thông tin số lượng hiện đang có ở kho */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[11px]">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kho hiện có:</span>
                  </span>
                  {availableStock > 0 ? (
                    <span className={`font-mono font-black ${availableStock <= 3 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      Còn <strong className="text-xs font-black underline">{availableStock}</strong> máy ({lowestCapacity.size})
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600">
                      Tạm hết hàng ({lowestCapacity.size})
                    </span>
                  )}
                </div>

                {/* Hiển thị điểm thưởng theo giá và số lượng */}
                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Tích lũy:
                  </span>
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                    +{pointsEarned.toLocaleString('vi-VN')} pts
                  </span>
                </div>

                {/* Bộ nút dấu cộng (+) và trừ (-) để tiện đặt 1 lần nhiều máy */}
                <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700">Số lượng mua:</span>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-sm">
                    <button
                      type="button"
                      disabled={isOutOfStock || qty <= 1}
                      onClick={() => {
                        setPhoneQuantities((prev) => ({
                          ...prev,
                          [phone.id]: Math.max(1, (prev[phone.id] || 1) - 1),
                        }));
                      }}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 cursor-pointer"
                      title="Giảm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-5 text-center">
                      {isOutOfStock ? 0 : qty}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock || qty >= availableStock}
                      onClick={() => {
                        const current = phoneQuantities[phone.id] || 1;
                        if (current >= availableStock) {
                          setToastMessage({
                            message: `Kho hiện chỉ còn ${availableStock} máy (${lowestCapacity.size}). Không thể chọn thêm!`,
                            type: 'error',
                          });
                          setTimeout(() => setToastMessage(null), 3000);
                          return;
                        }
                        setPhoneQuantities((prev) => ({
                          ...prev,
                          [phone.id]: current + 1,
                        }));
                      }}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 cursor-pointer"
                      title="Tăng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleQuickAddToCart(phone)}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-black text-white hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <ShoppingCart className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-slate-400' : 'text-amber-400'}`} />
                    <span>{isOutOfStock ? 'Hết Hàng' : 'Thêm Giỏ'}</span>
                  </button>

                  <Link
                    href={`/DienThoai/${phone.slug}`}
                    className="py-2.5 rounded-xl btn-gold text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm hover:scale-[1.02]"
                  >
                    <span>Chi Tiết</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast thông báo đặt hàng & cảnh báo tồn kho */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom duration-200 max-w-md ${
            toastMessage.type === 'error'
              ? 'bg-red-950/95 text-red-100 border-red-500/80 shadow-red-950/50'
              : 'bg-slate-900/95 text-white border-amber-400/40 shadow-slate-950/50'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
