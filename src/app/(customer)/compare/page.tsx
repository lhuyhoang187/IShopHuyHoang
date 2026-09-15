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
          <nav className="text-xs text-gray-400 mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-amber-400 font-semibold">So Sánh Điện Thoại</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-400" />
            <span>So Sánh Song Song 2 - 3 Điện Thoại</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Đặt các siêu phẩm lên cùng bàn cân thông số kỹ thuật, màn hình, chip và giá bán.
          </p>
        </div>

        {/* Action Toggle "Only Differences" with 2026 Neon Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOnlyDifferences(!onlyDifferences)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all ${
              onlyDifferences
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            {onlyDifferences ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            <span>{onlyDifferences ? 'Đang chỉ xem điểm khác biệt' : 'Chỉ xem điểm khác biệt'}</span>
          </button>

          {selectedPhones.length < 3 && (
            <button
              onClick={() => setShowAddPicker(true)}
              className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Thêm máy thứ {selectedPhones.length + 1}</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="glass-panel rounded-3xl border-white/[0.1] overflow-x-auto shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[750px]">
          {/* Header Row with Phone Cards */}
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#070b14]/90">
              <th className="p-5 sm:p-6 w-1/4 align-top text-xs text-gray-400 uppercase font-bold tracking-wider">
                Sản phẩm so sánh
              </th>
              {selectedPhones.map((phone) => (
                <th key={phone.id} className="p-5 sm:p-6 w-1/4 align-top text-center">
                  <div className="relative glass-card p-5 rounded-3xl border-white/[0.08] group">
                    <button
                      onClick={() => removePhone(phone.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/60 text-gray-400 hover:text-red-400 hover:bg-black transition-colors"
                      title="Bỏ máy này"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <Link href={`/phones/${phone.slug}`}>
                      <div className="w-32 h-32 mx-auto mb-3 bg-gradient-to-b from-[#0f172a] to-[#070a12] rounded-2xl p-2 flex items-center justify-center">
                        <img
                          src={phone.colors[0]?.imageUrl}
                          alt={phone.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 min-h-[40px]">
                        {phone.name}
                      </h3>
                    </Link>

                    <div className="mt-2 text-base font-black text-amber-400">
                      {formatVND(phone.capacities[0].price)}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/phones/${phone.slug}`}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
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
                    className="w-full h-[270px] rounded-3xl border-2 border-dashed border-white/10 hover:border-amber-400/50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-amber-300 transition-all bg-white/[0.01] hover:bg-white/[0.04]"
                  >
                    <Plus className="w-8 h-8 text-amber-400" />
                    <span className="text-xs font-bold">Thêm máy thứ {selectedPhones.length + 1}</span>
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-white/[0.05] text-xs sm:text-sm">
            {specRows.map((row) => {
              const values = selectedPhones.map((p) => row.getVal(p));
              const isDifferent = new Set(values).size > 1;

              if (onlyDifferences && !isDifferent) {
                return null;
              }

              return (
                <tr
                  key={row.key}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    isDifferent ? 'bg-cyan-500/[0.04]' : ''
                  }`}
                >
                  <td className="p-4 sm:p-5 font-bold text-gray-300 bg-black/25">
                    <div className="flex items-center gap-2">
                      {isDifferent && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" title="Điểm khác biệt" />
                      )}
                      <span>{row.label}</span>
                    </div>
                  </td>
                  {selectedPhones.map((phone) => (
                    <td
                      key={phone.id}
                      className={`p-4 sm:p-5 text-center ${
                        isDifferent ? 'text-white font-bold' : 'text-gray-400'
                      }`}
                    >
                      {row.getVal(phone)}
                    </td>
                  ))}
                  {selectedPhones.length < 3 && <td className="p-4 text-center text-gray-600">-</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add Phone to Compare */}
      {showAddPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0c121e] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="font-bold text-white text-base">Chọn Điện Thoại Để Đưa Lên Bàn Cân</h3>
              <button
                onClick={() => setShowAddPicker(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
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
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-amber-500/15 border border-white/[0.06] hover:border-amber-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={phone.colors[0]?.imageUrl}
                        alt={phone.name}
                        className="w-12 h-12 object-contain rounded-xl bg-black/40 p-1"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{phone.name}</h4>
                        <p className="text-xs text-gray-400">{phone.specs.chip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400">
                        {formatVND(phone.capacities[0].price)}
                      </span>
                      <span className="block text-[11px] text-cyan-400 font-bold mt-0.5">+ Chọn So Sánh</span>
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
