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
  Banknote,
  Cpu,
  HardDrive,
  Monitor,
  Camera,
  Battery,
  BatteryCharging,
  Zap,
  ShieldCheck,
  Gauge,
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

  // Grouped specs definitions with icons and categories
  const specCategories = [
    {
      category: 'Giá Bán & Bộ Nhớ',
      icon: Banknote,
      rows: [
        { key: 'price', label: 'Giá khởi điểm niêm yết', icon: Banknote, getVal: (p: PhoneProduct) => formatVND(p.capacities[0].price), highlightPrice: true },
        { key: 'storage', label: 'Các phiên bản bộ nhớ', icon: HardDrive, getVal: (p: PhoneProduct) => p.capacities.map((c) => c.size).join(', ') },
        { key: 'ram', label: 'Bộ nhớ RAM', icon: Cpu, getVal: (p: PhoneProduct) => p.specs.ram },
      ],
    },
    {
      category: 'Màn Hình & Hiệu Năng',
      icon: Monitor,
      rows: [
        { key: 'screen', label: 'Màn hình & Tần số quét', icon: Monitor, getVal: (p: PhoneProduct) => p.specs.screen },
        { key: 'chip', label: 'Vi xử lý (CPU 3nm)', icon: Cpu, getVal: (p: PhoneProduct) => p.specs.chip },
        { key: 'os', label: 'Hệ điều hành', icon: Sparkles, getVal: (p: PhoneProduct) => p.specs.os },
      ],
    },
    {
      category: 'Hệ Thống Camera',
      icon: Camera,
      rows: [
        { key: 'rearCamera', label: 'Hệ thống Camera sau', icon: Camera, getVal: (p: PhoneProduct) => p.specs.rearCamera },
        { key: 'frontCamera', label: 'Camera Selfie trước', icon: Camera, getVal: (p: PhoneProduct) => p.specs.frontCamera },
      ],
    },
    {
      category: 'Pin, Sạc & Tiện Ích',
      icon: BatteryCharging,
      rows: [
        { key: 'battery', label: 'Dung lượng pin', icon: Battery, getVal: (p: PhoneProduct) => p.specs.battery },
        { key: 'charging', label: 'Công nghệ sạc nhanh', icon: Zap, getVal: (p: PhoneProduct) => p.specs.charging },
        { key: 'waterResistant', label: 'Chuẩn kháng nước & bụi', icon: ShieldCheck, getVal: (p: PhoneProduct) => p.specs.waterResistant },
        { key: 'weight', label: 'Trọng lượng thân máy', icon: Gauge, getVal: (p: PhoneProduct) => p.specs.weight },
      ],
    },
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
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-sm ring-2 ring-sky-200'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {onlyDifferences ? <EyeOff className="w-4 h-4 text-sky-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{onlyDifferences ? 'Đang chỉ xem điểm khác biệt' : 'Chỉ xem điểm khác biệt'}</span>
          </button>

          {selectedPhones.length < 3 && (
            <button
              onClick={() => setShowAddPicker(true)}
              className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Thêm máy thứ {selectedPhones.length + 1}</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-300/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            {/* Header Row with Phone Cards */}
            <thead>
              <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-100/90 via-slate-50 to-slate-100/90">
                <th className="p-5 sm:p-6 w-1/4 align-top border-r border-slate-200">
                  <div className="flex flex-col justify-between h-full min-h-[140px]">
                    <div>
                      <span className="inline-block text-[11px] font-black tracking-wider uppercase text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-md mb-2">
                        Thông Số Đối Chiếu
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">
                        Bảng so sánh chi tiết giữa các dòng máy
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shadow-sm"></span>
                      <span>Dòng có màu xanh biểu thị thông số khác nhau</span>
                    </div>
                  </div>
                </th>
                {selectedPhones.map((phone) => (
                  <th key={phone.id} className="p-5 sm:p-6 w-1/4 align-top text-center border-r border-slate-200 last:border-r-0">
                    <div className="relative bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group hover:border-amber-400 hover:shadow-md transition-all">
                      <button
                        onClick={() => removePhone(phone.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Bỏ máy này khỏi so sánh"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <Link href={`/phones/${phone.slug}`}>
                        <div className="w-32 h-32 mx-auto mb-3 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200/80 rounded-2xl p-2 flex items-center justify-center">
                          <img
                            src={phone.colors[0]?.imageUrl}
                            alt={phone.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 min-h-[40px]">
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
                          <span>Xem chi tiết</span>
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
                      className="w-full h-[270px] rounded-3xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-700 transition-all bg-slate-50/50 hover:bg-amber-50/30 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold mt-1">Thêm máy thứ {selectedPhones.length + 1}</span>
                      <span className="text-[11px] text-slate-400">Chọn từ danh mục</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            {/* Categorized Body Rows */}
            <tbody className="text-xs sm:text-sm">
              {specCategories.map((cat, catIdx) => {
                // Filter rows if onlyDifferences
                const visibleRows = cat.rows.filter((row) => {
                  if (!onlyDifferences) return true;
                  const values = selectedPhones.map((p) => row.getVal(p));
                  return new Set(values).size > 1;
                });

                if (visibleRows.length === 0) return null;

                const CatIcon = cat.icon;

                return (
                  <React.Fragment key={cat.category}>
                    {/* Category Divider Header */}
                    <tr className="bg-slate-100/90 border-t-2 border-b border-slate-300">
                      <td
                        colSpan={1 + selectedPhones.length + (selectedPhones.length < 3 ? 1 : 0)}
                        className="py-3 px-5 sm:px-6"
                      >
                        <div className="flex items-center gap-2 text-slate-800 font-black text-xs sm:text-sm uppercase tracking-wide">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800">
                            <CatIcon className="w-4 h-4 text-amber-700" />
                          </div>
                          <span>{cat.category}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Spec Rows inside Category */}
                    {visibleRows.map((row, rowIdx) => {
                      const values = selectedPhones.map((p) => row.getVal(p));
                      const isDifferent = new Set(values).size > 1;
                      const RowIcon = row.icon;
                      const isEven = rowIdx % 2 === 0;

                      return (
                        <tr
                          key={row.key}
                          className={`border-b border-slate-200 transition-colors ${
                            isDifferent
                              ? 'bg-sky-50/50 hover:bg-sky-100/50'
                              : isEven
                              ? 'bg-white hover:bg-slate-50'
                              : 'bg-slate-50/60 hover:bg-slate-100/70'
                          }`}
                        >
                          {/* Label Cell */}
                          <td className="p-4 sm:p-5 font-bold text-slate-800 border-r border-slate-200 bg-inherit">
                            <div className="flex items-center gap-2.5">
                              {isDifferent ? (
                                <span
                                  className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shrink-0 ring-4 ring-sky-100"
                                  title="Thông số có sự khác biệt giữa các máy"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
                                  <RowIcon className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span className="leading-snug">{row.label}</span>
                            </div>
                          </td>

                          {/* Values per Phone */}
                          {selectedPhones.map((phone) => {
                            const val = row.getVal(phone);
                            return (
                              <td
                                key={phone.id}
                                className={`p-4 sm:p-5 text-center border-r border-slate-200 last:border-r-0 leading-relaxed ${
                                  row.highlightPrice
                                    ? 'text-amber-700 font-black text-sm sm:text-base'
                                    : isDifferent
                                    ? 'text-slate-900 font-bold'
                                    : 'text-slate-600 font-medium'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}

                          {/* Empty placeholder column if < 3 phones */}
                          {selectedPhones.length < 3 && (
                            <td className="p-4 text-center text-slate-300 font-medium">-</td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
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
