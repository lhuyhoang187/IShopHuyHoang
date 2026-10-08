'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Headphones, ShoppingCart, Check, Filter } from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const loadData = () => {
    setAccessories(IShopStore.getAccessories());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const categories = [
    { key: 'all', label: 'Tất Cả' },
    { key: 'charger', label: 'Củ Sạc GaN' },
    { key: 'cable', label: 'Cáp Sạc Nhanh' },
    { key: 'powerbank', label: 'Pin MagSafe' },
    { key: 'screen_protector', label: 'Kính Cường Lực' },
    { key: 'audio', label: 'Tai Nghe' },
    { key: 'case', label: 'Ốp Lưng' },
  ];

  const filtered = accessories.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const handleAddToCart = (acc: AccessoryProduct) => {
    IShopStore.addToCart({
      productId: acc.id,
      type: 'accessory',
      name: acc.name,
      slug: acc.slug,
      imageUrl: acc.imageUrl,
      price: acc.sellingPrice,
      originalPrice: acc.originalPrice,
      quantity: 1,
    });
    setAddedToast(acc.name);
    setTimeout(() => setAddedToast(null), 2500);
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(c.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              selectedCategory === c.key
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((acc) => (
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

            <Link href={`/accessories/${acc.slug}`} className="block my-3 text-center">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200/80 p-3">
                <img
                  src={acc.imageUrl}
                  alt={acc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </Link>

            <div className="space-y-3">
              <span className="text-[11px] text-slate-500 font-bold uppercase">
                {acc.brand} • {acc.categoryName}
              </span>

              <Link href={`/accessories/${acc.slug}`}>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[40px]">
                  {acc.name}
                </h3>
              </Link>

              <p className="text-[11px] text-slate-600 line-clamp-2 font-medium">
                {acc.specs}
              </p>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-400 line-through block font-medium">
                    {formatVND(acc.originalPrice)}
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {formatVND(acc.sellingPrice)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">Còn {acc.stock} cái</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href={`/accessories/${acc.slug}`}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors"
                >
                  Chi Tiết
                </Link>
                <button
                  onClick={() => handleAddToCart(acc)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Mua</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>Đã thêm &quot;{addedToast}&quot; vào giỏ hàng!</span>
        </div>
      )}
    </div>
  );
}
