'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Smartphone, Scale, ArrowRight, Filter } from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function PhonesPage() {
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStorage, setSelectedStorage] = useState<string>('All');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const loadData = () => {
    setPhones(IShopStore.getPhones());
    setCompareIds(IShopStore.getComparisonList());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Filter & Sort
  const filteredPhones = phones
    .filter((p) => (selectedBrand === 'All' ? true : p.brand === selectedBrand))
    .filter((p) => {
      if (selectedStorage === 'All') return true;
      return p.capacities.some((c) => c.size.includes(selectedStorage));
    })
    .sort((a, b) => {
      if (priceSort === 'asc') return a.capacities[0].price - b.capacities[0].price;
      if (priceSort === 'desc') return b.capacities[0].price - a.capacities[0].price;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header breadcrumb */}
      <div>
        <nav className="text-xs text-gray-400 mb-2">
          <Link href="/" className="hover:text-white">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-blue-400">Điện Thoại Mới 100%</span>
        </nav>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Điện Thoại Mới 100% Nguyên Seal
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Cam kết hàng chính hãng Apple VN/A, Samsung Vina, Xiaomi Digiworld. Mỗi máy đều quản lý theo số IMEI riêng biệt.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Brand filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Hãng:
          </span>
          {['All', 'Apple', 'Samsung', 'Xiaomi'].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedBrand === b
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {b === 'All' ? 'Tất cả' : b}
            </button>
          ))}
        </div>

        {/* Storage filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Dung lượng:</span>
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="All" className="bg-[#121826]">Tất cả bộ nhớ</option>
            <option value="128GB" className="bg-[#121826]">128GB</option>
            <option value="256GB" className="bg-[#121826]">256GB</option>
            <option value="512GB" className="bg-[#121826]">512GB</option>
            <option value="1TB" className="bg-[#121826]">1TB</option>
          </select>
        </div>

        {/* Sort price */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Sắp xếp:</span>
          <select
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value as any)}
            className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="default" className="bg-[#121826]">Mặc định</option>
            <option value="asc" className="bg-[#121826]">Giá tăng dần</option>
            <option value="desc" className="bg-[#121826]">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPhones.map((phone) => {
          const isComparing = compareIds.includes(phone.id);
          const lowestCapacity = phone.capacities[0];

          return (
            <div
              key={phone.id}
              className="glass-card rounded-3xl p-5 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Compare button */}
              <button
                onClick={() => IShopStore.toggleComparison(phone.id)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
                  isComparing
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                title={isComparing ? 'Đang so sánh' : 'Thêm vào so sánh'}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isComparing ? 'Đang so sánh' : 'So sánh'}</span>
              </button>

              {/* Image */}
              <Link href={`/phones/${phone.slug}`} className="block my-4 text-center">
                <div className="relative aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-black/40 p-2">
                  <img
                    src={phone.colors[0]?.imageUrl}
                    alt={phone.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 justify-center">
                  {phone.colors.map((c) => (
                    <span
                      key={c.id}
                      style={{ backgroundColor: c.hex }}
                      className="w-3 h-3 rounded-full border border-white/40"
                      title={c.name}
                    />
                  ))}
                </div>

                <Link href={`/phones/${phone.slug}`}>
                  <h2 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[40px]">
                    {phone.name}
                  </h2>
                </Link>

                <div className="text-[11px] text-gray-400 space-y-1 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  <div className="truncate">Chip: {phone.specs.chip.split('(')[0]}</div>
                  <div className="truncate">Màn: {phone.specs.screen.split(',')[0]}</div>
                </div>

                <div className="pt-1 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-500 line-through block">
                      {formatVND(lowestCapacity.originalPrice)}
                    </span>
                    <span className="text-base font-black text-amber-400">
                      {formatVND(lowestCapacity.price)}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Bản {lowestCapacity.size}</span>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/phones/${phone.slug}`}
                    className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Xem Chi Tiết & Mua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
