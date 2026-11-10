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
  Check,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function ComparePage() {
  const [allPhones, setAllPhones] = useState<PhoneProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<string>('All');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [pickerWarning, setPickerWarning] = useState<string>('');

  const loadData = () => {
    const list = IShopStore.getComparisonList();
    const phones = IShopStore.getPhones();
    setAllPhones(phones);
    setSelectedIds(list);
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

  const openPicker = () => {
    setTempSelectedIds([...selectedIds]);
    setSelectedStorage('All');
    setPickerWarning('');
    setShowAddPicker(true);
  };

  const togglePickerPhone = (id: string) => {
    if (tempSelectedIds.includes(id)) {
      setTempSelectedIds(tempSelectedIds.filter((item) => item !== id));
      setPickerWarning('');
    } else {
      if (tempSelectedIds.length >= 3) {
        setPickerWarning('Bạn chỉ có thể chọn tối đa 3 máy để so sánh cùng lúc.');
        return;
      }
      setPickerWarning('');
      setTempSelectedIds([...tempSelectedIds, id]);
    }
  };

  const handleStartCompare = () => {
    if (tempSelectedIds.length < 2) return;
    IShopStore.setComparisonList(tempSelectedIds);
    setSelectedIds(tempSelectedIds);
    setShowAddPicker(false);
  };

  const storageOptions = ['All', '128GB', '256GB', '512GB', '1TB'];

  const getStorageCount = (storage: string) => {
    if (storage === 'All') return allPhones.length;
    return allPhones.filter((p) =>
      p.capacities.some((c) => c.size.toLowerCase().includes(storage.toLowerCase()))
    ).length;
  };

  const filteredPhonesForPicker = allPhones.filter((phone) => {
    if (selectedStorage === 'All') return true;
    return phone.capacities.some((c) =>
      c.size.toLowerCase().includes(selectedStorage.toLowerCase())
    );
  });

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

          <button
            onClick={openPicker}
            className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">
              {selectedPhones.length < 3 ? `Chọn máy so sánh (${selectedPhones.length}/3)` : 'Đổi máy so sánh'}
            </span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table - Always rendered */}
      <div className="bg-white rounded-3xl border border-slate-300/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px] table-fixed">
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

                {/* Progressive Single Slot: only 1 slot shown at a time */}
                {selectedPhones.length < 3 && (
                  <th
                    className={`p-5 sm:p-6 align-top text-center border-r border-slate-200 last:border-r-0 ${
                      selectedPhones.length >= 2
                        ? 'w-1/4'
                        : selectedPhones.length === 1
                        ? 'w-1/3 sm:w-1/4'
                        : 'w-1/2 sm:w-1/3'
                    }`}
                  >
                    <button
                      onClick={openPicker}
                      className="w-full max-w-sm mx-auto h-[270px] rounded-3xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-700 transition-all bg-slate-50/50 hover:bg-amber-50/30 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold mt-1">
                        Thêm máy thứ {selectedPhones.length + 1}
                      </span>
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
                  if (!onlyDifferences || selectedPhones.length < 2) return true;
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
                      const isDifferent = selectedPhones.length > 1 && new Set(values).size > 1;
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
                          <td className="p-4 sm:p-5 font-bold text-slate-800 border-r border-slate-200 bg-inherit w-1/4">
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

                          {/* Values per Selected Phone */}
                          {selectedPhones.map((phone) => {
                            const val = row.getVal(phone);
                            return (
                              <td
                                key={phone.id}
                                className={`p-4 sm:p-5 text-center border-r border-slate-200 last:border-r-0 leading-relaxed w-1/4 ${
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

                          {/* Empty placeholder cell for the single next slot */}
                          {selectedPhones.length < 3 && (
                            <td
                              className={`p-4 sm:p-5 text-center text-slate-300 font-medium border-r border-slate-200 last:border-r-0 ${
                                selectedPhones.length >= 2
                                  ? 'w-1/4'
                                  : selectedPhones.length === 1
                                  ? 'w-1/3 sm:w-1/4'
                                  : 'w-1/2 sm:w-1/3'
                              }`}
                            >
                              -
                            </td>
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

      {/* Modal Add / Select Phone to Compare */}
      {showAddPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Chọn Điện Thoại Để Đưa Lên Bàn Cân
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lọc dung lượng, tích chọn 2 - 3 máy và bấm nút "So Sánh Ngay"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddPicker(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Filter Bar */}
            <div className="py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bộ Lọc Dung Lượng Máy:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Hiển thị {filteredPhonesForPicker.length} dòng máy
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {storageOptions.map((storage) => {
                  const isSelected = selectedStorage === storage;
                  const count = getStorageCount(storage);
                  return (
                    <button
                      key={storage}
                      type="button"
                      onClick={() => setSelectedStorage(storage)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'btn-gold text-white shadow-sm ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{storage === 'All' ? 'Tất Cả Dung Lượng' : storage}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isSelected ? 'bg-black/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Selection List with Checkboxes */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-[220px]">
              {filteredPhonesForPicker.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Không tìm thấy điện thoại nào có phiên bản {selectedStorage}.
                </div>
              ) : (
                filteredPhonesForPicker.map((phone) => {
                  const isChecked = tempSelectedIds.includes(phone.id);
                  const matchedCap =
                    selectedStorage !== 'All'
                      ? phone.capacities.find((c) =>
                          c.size.toLowerCase().includes(selectedStorage.toLowerCase())
                        )
                      : null;
                  const displayPrice = matchedCap ? matchedCap.price : phone.capacities[0].price;

                  return (
                    <div
                      key={phone.id}
                      onClick={() => togglePickerPhone(phone.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-200/80 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                            isChecked
                              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                              : 'border-slate-300 bg-white hover:border-amber-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <img
                          src={phone.colors[0]?.imageUrl}
                          alt={phone.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl bg-slate-100 border border-slate-200 p-1 shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                              {phone.brand}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {phone.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {phone.specs.chip}
                          </p>

                          {/* Capacities list badges */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {phone.capacities.map((c) => {
                              const isMatch =
                                selectedStorage !== 'All' &&
                                c.size.toLowerCase().includes(selectedStorage.toLowerCase());
                              return (
                                <span
                                  key={c.size}
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    isMatch
                                      ? 'bg-amber-600 text-white font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {c.size}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xs sm:text-sm font-black text-amber-700 block">
                          {formatVND(displayPrice)}
                        </span>
                        {matchedCap && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Bản {matchedCap.size}
                          </span>
                        )}
                        <span
                          className={`inline-block text-[10px] sm:text-[11px] font-bold mt-1 px-2.5 py-0.5 rounded-lg transition-colors ${
                            isChecked
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isChecked ? '✓ Đã tích chọn' : '+ Tích chọn'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with "So Sánh Ngay" Button */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Đã tích chọn:</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                      tempSelectedIds.length >= 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tempSelectedIds.length}/3 máy
                  </span>
                  {tempSelectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempSelectedIds([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 underline ml-1 cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                {pickerWarning && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pickerWarning}</span>
                  </p>
                )}

                {tempSelectedIds.length < 2 && !pickerWarning && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vui lòng tích chọn tối thiểu 2 máy để bắt đầu so sánh
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAddPicker(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={tempSelectedIds.length < 2}
                  onClick={handleStartCompare}
                  className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                    tempSelectedIds.length >= 2
                      ? 'btn-gold text-white hover:opacity-90 cursor-pointer shadow-amber-500/20 hover:scale-[1.02]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Scale className="w-4 h-4 text-white" />
                  <span>So Sánh Ngay ({tempSelectedIds.length} máy)</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
