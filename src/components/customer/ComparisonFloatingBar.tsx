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
    <aside aria-label="So sánh sản phẩm" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-3 sm:px-5 flex items-center justify-between gap-3 text-slate-800 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-700 shrink-0">
          <Scale className="w-4 h-4" />
          <span>So Sánh ({compareIds.length}/3):</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedPhones.map((phone) => (
            <div
              key={phone.id}
              className="relative flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 shrink-0 text-slate-800 shadow-sm"
            >
              <img
                src={phone.colors[0]?.imageUrl}
                alt={phone.name}
                className="w-7 h-7 object-cover rounded bg-white p-0.5 border border-slate-200"
              />
              <span className="max-w-[100px] truncate font-bold text-slate-900">{phone.name.split(' ')[0]} {phone.name.split(' ')[1]}</span>
              <button
                onClick={() => IShopStore.toggleComparison(phone.id)}
                className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
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
          className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 font-medium cursor-pointer"
        >
          Xóa
        </button>
        <Link
          href="/compare"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-md hover:scale-105"
        >
          <span>So sánh ngay</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </Link>
      </div>
    </aside>
  );
}
