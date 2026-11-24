'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Headphones, ShoppingCart, Check, Filter, Plus, Minus, Sparkles, AlertCircle, Gift, Search, X } from 'lucide-react';
import { IShopStore } from '@/ThuVien/KhoDuLieu';
import { AccessoryProduct, AccessoryCategoryItem } from '@/ThuVien/KieuDuLieu';
import { formatVND } from '@/ThuVien/ThanhToanVietQR';

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [dbCategories, setDbCategories] = useState<AccessoryCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [accQuantities, setAccQuantities] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    setAccessories(IShopStore.getAccessories());
    setDbCategories(IShopStore.getAccessoryCategories());

    fetch(`/Api/KhoHang/PhuKien?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAccessories(json.data);
        }
      })
      .catch((err) => console.warn('Accessories live fetch notice:', err));

    fetch(`/Api/KhoHang/PhuKien/DanhMuc?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setDbCategories(json.data);
        }
      })
      .catch((err) => console.warn('Accessory categories fetch notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => {
      setAccessories(IShopStore.getAccessories());
      setDbCategories(IShopStore.getAccessoryCategories());
    };
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    dbCategories.forEach((c) => map.set(c.code, c.name));
    accessories.forEach((a) => {
      if (a.category && !map.has(a.category)) {
        map.set(a.category, a.categoryName || a.category);
      }
    });
    return [
      { key: 'all', label: 'Tất Cả Danh Mục', count: accessories.length },
      ...Array.from(map.entries()).map(([key, label]) => ({
        key,
        label,
        count: accessories.filter((a) => a.category === key).length,
      })),
    ];
  }, [dbCategories, accessories]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set(accessories.map((a) => a.brand).filter(Boolean)));
  }, [accessories]);

  const filtered = accessories
    .filter((item) => (selectedCategory === 'all' ? true : item.category === selectedCategory))
    .filter((item) => (selectedBrand === 'all' ? true : item.brand === selectedBrand))
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.specs && item.specs.toLowerCase().includes(q)) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (priceSort === 'asc') return (a.sellingPrice || 0) - (b.sellingPrice || 0);
      if (priceSort === 'desc') return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      return 0;
    });

  const handleAddToCart = (acc: AccessoryProduct) => {
    const qty = accQuantities[acc.id] || 1;
    const result = IShopStore.addToCart({
      productId: acc.id,
      type: 'accessory',
      name: acc.name,
      slug: acc.slug,
      imageUrl: acc.imageUrl,
      price: acc.sellingPrice,
      originalPrice: acc.originalPrice,
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
      <div>
        <nav className="text-xs text-slate-500 mb-1 font-medium">
          <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-emerald-700 font-bold">Phụ Kiện Chính Hãng</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
          <Headphones className="w-8 h-8 text-emerald-600" />
          <span>Phụ Kiện Smartphone Chính Hãng</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
          Củ sạc GaN, pin sạc không dây MagSafe, cáp dù bọc thép, tai nghe cao cấp. Bảo hành 12 tháng 1 đổi 1.
        </p>
      </div>

      {/* Smart Category & Brand Filter Bar (List chọn thông minh) */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input autoComplete="off"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
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

          {/* Smart Category Dropdown */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Danh mục:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Smart Brand Dropdown */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0">Hãng:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">Tất cả hãng</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold shrink-0">Giá:</span>
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as any)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="default">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === c.key
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.label} ({c.count})
              </button>
            ))}
          </div>

          {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedBrand('all');
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
        {filtered.map((acc) => {
          const qty = accQuantities[acc.id] || 1;
          const pointsEarned = Math.floor(((acc.sellingPrice || 0) * qty) / 10000);

          return (
            <div
              key={acc.id}
              className="glass-card rounded-3xl p-5 border border-slate-200/90 hover:border-emerald-400/60 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative"
            >
              {/* 15% discount badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm">
                  GIẢM 15% MUA KÈM MÁY
                </span>
              </div>

              <Link href={`/PhuKien/${acc.slug}`} className="block my-3 text-center">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200/80 p-3 flex items-center justify-center">
                  {acc.imageUrl ? (
                    <img
                      src={acc.imageUrl}
                      alt={acc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Headphones className="w-12 h-12 text-slate-400" />
                  )}
                </div>
              </Link>

              <div className="space-y-3">
                <span className="text-[11px] text-slate-500 font-bold uppercase">
                  {acc.brand} • {acc.categoryName}
                </span>

                <Link href={`/PhuKien/${acc.slug}`}>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[40px]">
                    {acc.name}
                  </h3>
                </Link>

                <p className="text-[11px] text-slate-600 line-clamp-2 font-medium">
                  {acc.specs}
                </p>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    {acc.originalPrice > acc.sellingPrice && (
                      <span className="text-xs text-slate-400 line-through block font-medium">
                        {formatVND(acc.originalPrice)}
                      </span>
                    )}
                    <span className="text-base font-black text-emerald-700">
                      {formatVND(acc.sellingPrice)}
                    </span>
                  </div>
                  {acc.stock > 0 ? (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Còn {acc.stock} cái
                    </span>
                  ) : (
                    <span className="text-[11px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-bold border border-red-200">
                      Tạm hết hàng
                    </span>
                  )}
                </div>

                {/* Hiển thị điểm thưởng theo giá và số lượng */}
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Tích lũy mua:
                  </span>
                  <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                    +{pointsEarned.toLocaleString('vi-VN')} pts
                  </span>
                </div>

                {/* Hoặc đổi bằng điểm VIP */}
                {acc.pointsToRedeem ? (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-xl">
                    <Link
                      href="/TaiKhoan?tab=loyalty"
                      className="text-[11px] font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1 hover:underline"
                    >
                      <Gift className="w-3 h-3 text-amber-600" /> Hoặc đổi điểm:
                    </Link>
                    <span className="text-[11px] font-black text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                      {acc.pointsToRedeem.toLocaleString('vi-VN')} pts
                    </span>
                  </div>
                ) : null}

                {/* Bộ nút dấu cộng (+) và trừ (-) để tiện đặt 1 lần nhiều phụ kiện */}
                <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700">Số lượng:</span>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setAccQuantities((prev) => ({
                          ...prev,
                          [acc.id]: Math.max(1, (prev[acc.id] || 1) - 1),
                        }));
                      }}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Giảm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-5 text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = accQuantities[acc.id] || 1;
                        const available = acc.stock ?? 0;
                        if (available <= 0) {
                          setToastMessage({
                            message: `Sản phẩm "${acc.name}" hiện đã hết hàng trong kho!`,
                            type: 'error',
                          });
                          setTimeout(() => setToastMessage(null), 3000);
                          return;
                        }
                        if (current >= available) {
                          setToastMessage({
                            message: `Kho hiện chỉ còn ${available} cái. Không thể chọn thêm!`,
                            type: 'error',
                          });
                          setTimeout(() => setToastMessage(null), 3000);
                          return;
                        }
                        setAccQuantities((prev) => ({
                          ...prev,
                          [acc.id]: current + 1,
                        }));
                      }}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Tăng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/PhuKien/${acc.slug}`}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors"
                  >
                    Chi Tiết
                  </Link>
                  <button
                    onClick={() => handleAddToCart(acc)}
                    disabled={acc.stock <= 0}
                    className={`py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
                      acc.stock > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] cursor-pointer'
                        : 'bg-slate-400 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{acc.stock > 0 ? `Mua (${qty})` : 'Hết Hàng'}</span>
                  </button>
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
