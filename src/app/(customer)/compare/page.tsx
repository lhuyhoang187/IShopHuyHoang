'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  Plus,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function ComparePage() {
  const [allPhones, setAllPhones] = useState<PhoneProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);

  const loadData = () => {
    const list = IShopStore.getComparisonList();
    const phones = IShopStore.getPhones();
    setAllPhones(phones);
    setSelectedIds(list.length > 0 ? list : ['p-1', 'p-3']); // Default iPhone 16 Pro Max vs S24 Ultra
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const selectedPhones = allPhones.filter((p) => selectedIds.includes(p.id));

  const removePhone = (id: string) => {
    IShopStore.toggleComparison(id);
  };

  const addPhone = (id: string) => {
    IShopStore.toggleComparison(id);
    setShowAddPicker(false);
  };

  // Specs definitions
  const specRows = [
    { key: 'price', label: 'Giá khởi điểm niêm yết', getVal: (p: PhoneProduct) => formatVND(p.capacities[0].price) },
    { key: 'screen', label: 'Màn hình & Tần số quét', getVal: (p: PhoneProduct) => p.specs.screen },
    { key: 'chip', label: 'Vi xử lý (CPU 3nm)', getVal: (p: PhoneProduct) => p.specs.chip },
    { key: 'ram', label: 'Bộ nhớ RAM', getVal: (p: PhoneProduct) => p.specs.ram },
    { key: 'storage', label: 'Các phiên bản bộ nhớ', getVal: (p: PhoneProduct) => p.capacities.map((c) => c.size).join(', ') },
    { key: 'rearCamera', label: 'Hệ thống Camera sau', getVal: (p: PhoneProduct) => p.specs.rearCamera },
    { key: 'frontCamera', label: 'Camera Selfie trước', getVal: (p: PhoneProduct) => p.specs.frontCamera },
    { key: 'battery', label: 'Dung lượng pin', getVal: (p: PhoneProduct) => p.specs.battery },
    { key: 'charging', label: 'Công nghệ sạc nhanh', getVal: (p: PhoneProduct) => p.specs.charging },
    { key: 'os', label: 'Hệ điều hành', getVal: (p: PhoneProduct) => p.specs.os },
    { key: 'waterResistant', label: 'Chuẩn kháng nước & bụi', getVal: (p: PhoneProduct) => p.specs.waterResistant },
    { key: 'weight', label: 'Trọng lượng thân máy', getVal: (p: PhoneProduct) => p.specs.weight },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-amber-700 font-bold">So Sánh Điện Thoại</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-600" />
            <span>So Sánh Song Song 2 - 3 Điện Thoại</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Đặt các siêu phẩm lên cùng bàn cân thông số kỹ thuật, màn hình, chip và giá bán.
          </p>
        </div>

        {/* Action Toggle "Only Differences" */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOnlyDifferences(!onlyDifferences)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm ${
              onlyDifferences
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {onlyDifferences ? <EyeOff className="w-4 h-4 text-sky-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{onlyDifferences ? 'Đang chỉ xem điểm khác biệt' : 'Chỉ xem điểm khác biệt'}</span>
          </button>

          {selectedPhones.length < 3 && (
            <button
              onClick={() => setShowAddPicker(true)}
              className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm text-white"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Thêm máy thứ {selectedPhones.length + 1}</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto shadow-md">
        <table className="w-full text-left border-collapse min-w-[750px]">
          {/* Header Row with Phone Cards */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="p-5 sm:p-6 w-1/4 align-top text-xs text-slate-700 uppercase font-black tracking-wider">
                Sản phẩm so sánh
              </th>
              {selectedPhones.map((phone) => (
                <th key={phone.id} className="p-5 sm:p-6 w-1/4 align-top text-center">
                  <div className="relative bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group">
                    <button
                      onClick={() => removePhone(phone.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-slate-200 transition-colors"
                      title="Bỏ máy này"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <Link href={`/phones/${phone.slug}`}>
                      <div className="w-32 h-32 mx-auto mb-3 bg-gradient-to-b from-slate-100 to-slate-200/80 border border-slate-200 rounded-2xl p-2 flex items-center justify-center">
                        <img
                          src={phone.colors[0]?.imageUrl}
                          alt={phone.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px]">
                        {phone.name}
                      </h3>
                    </Link>

                    <div className="mt-2 text-base font-black text-amber-700">
                      {formatVND(phone.capacities[0].price)}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/phones/${phone.slug}`}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                      >
                        <span>Mua ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </th>
              ))}

              {/* Slot placeholder if less than 3 phones */}
              {selectedPhones.length < 3 && (
                <th className="p-5 sm:p-6 w-1/4 align-top text-center">
                  <button
                    onClick={() => setShowAddPicker(true)}
                    className="w-full h-[270px] rounded-3xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-700 transition-all bg-slate-50/50 hover:bg-amber-50/30"
                  >
                    <Plus className="w-8 h-8 text-amber-600" />
                    <span className="text-xs font-bold">Thêm máy thứ {selectedPhones.length + 1}</span>
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {specRows.map((row) => {
              const values = selectedPhones.map((p) => row.getVal(p));
              const isDifferent = new Set(values).size > 1;

              if (onlyDifferences && !isDifferent) {
                return null;
              }

              return (
                <tr
                  key={row.key}
                  className={`hover:bg-slate-50 transition-colors ${
                    isDifferent ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <td className="p-4 sm:p-5 font-bold text-slate-800 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      {isDifferent && (
                        <span className="w-2 h-2 rounded-full bg-sky-600 shadow-sm" title="Điểm khác biệt" />
                      )}
                      <span>{row.label}</span>
                    </div>
                  </td>
                  {selectedPhones.map((phone) => (
                    <td
                      key={phone.id}
                      className={`p-4 sm:p-5 text-center ${
                        isDifferent ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
                      }`}
                    >
                      {row.getVal(phone)}
                    </td>
                  ))}
                  {selectedPhones.length < 3 && <td className="p-4 text-center text-slate-400">-</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add Phone to Compare */}
      {showAddPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Chọn Điện Thoại Để Đưa Lên Bàn Cân</h3>
              <button
                onClick={() => setShowAddPicker(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {allPhones
                .filter((p) => !selectedIds.includes(p.id))
                .map((phone) => (
                  <div
                    key={phone.id}
                    onClick={() => addPhone(phone.id)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={phone.colors[0]?.imageUrl}
                        alt={phone.name}
                        className="w-12 h-12 object-contain rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 p-1"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{phone.name}</h4>
                        <p className="text-xs text-slate-500">{phone.specs.chip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-700">
                        {formatVND(phone.capacities[0].price)}
                      </span>
                      <span className="block text-[11px] text-sky-700 font-bold mt-0.5">+ Chọn So Sánh</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
