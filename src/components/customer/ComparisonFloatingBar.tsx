'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, X, ArrowRight } from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct } from '@/lib/types';

export default function ComparisonFloatingBar() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [phones, setPhones] = useState<PhoneProduct[]>([]);

  const loadData = () => {
    setCompareIds(IShopStore.getComparisonList());
    setPhones(IShopStore.getPhones());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  if (compareIds.length === 0) return null;

  const selectedPhones = phones.filter((p) => compareIds.includes(p.id));

  return (
    <aside aria-label="So sánh sản phẩm" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[#161f30]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-3 sm:px-5 flex items-center justify-between gap-3 text-white animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-blue-400 shrink-0">
          <Scale className="w-4 h-4" />
          <span>So Sánh ({compareIds.length}/3):</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedPhones.map((phone) => (
            <div
              key={phone.id}
              className="relative flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-xl text-xs border border-white/10 shrink-0"
            >
              <img
                src={phone.colors[0]?.imageUrl}
                alt={phone.name}
                className="w-7 h-7 object-cover rounded"
              />
              <span className="max-w-[100px] truncate font-medium">{phone.name.split(' ')[0]} {phone.name.split(' ')[1]}</span>
              <button
                onClick={() => IShopStore.toggleComparison(phone.id)}
                className="text-gray-400 hover:text-red-400 p-0.5"
                title="Bỏ chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => IShopStore.clearComparison()}
          className="text-xs text-gray-400 hover:text-white px-2 py-1"
        >
          Xóa
        </button>
        <Link
          href="/compare"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/30"
        >
          <span>So sánh ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
