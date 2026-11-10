'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Smartphone,
  HardDrive,
  Palette,
  Layers,
  Sparkles,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { PhoneProduct, PhoneColor, PhoneCapacity } from '@/lib/types';
import { IShopStore } from '@/lib/store';
import { formatVND } from '@/lib/vietqr';

interface PhoneVariantStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: PhoneProduct;
  onUpdated?: () => void;
}

export default function PhoneVariantStockModal({
  isOpen,
  onClose,
  phone,
  onUpdated,
}: PhoneVariantStockModalProps) {
  const [activeTab, setActiveTab] = useState<'capacities' | 'colors' | 'matrix'>('capacities');
  const [capacities, setCapacities] = useState<PhoneCapacity[]>([]);
  const [colors, setColors] = useState<PhoneColor[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, { stock: number; isOutOfStock?: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize state from phone
  useEffect(() => {
    if (!isOpen || !phone) return;

    // Get current in-stock phones to calculate real stock counts
    const inStockPhones = IShopStore.getAvailablePhones().filter((p) => p.phoneId === phone.id);

    const initialCapacities = phone.capacities.map((c) => {
      const capNorm = c.size.toLowerCase().replace(/\s+/g, '');
      const count = inStockPhones.filter(
        (p) => p.capacity.toLowerCase().replace(/\s+/g, '') === capNorm
      ).length;

      return {
        ...c,
        stock: c.stock !== undefined ? c.stock : count > 0 ? count : 5,
        isOutOfStock: c.isOutOfStock || false,
      };
    });

    const initialColors = phone.colors.map((c) => {
      const colNorm = c.name.toLowerCase().trim();
      const count = inStockPhones.filter((p) => p.color.toLowerCase().trim().includes(colNorm)).length;

      return {
        ...c,
        stock: c.stock !== undefined ? c.stock : count > 0 ? count : 5,
        isOutOfStock: c.isOutOfStock || false,
      };
    });

    // Initial variant combinations
    const initialMatrix: Record<string, { stock: number; isOutOfStock?: boolean }> = {
      ...(phone.variantStocks || {}),
    };

    phone.colors.forEach((col) => {
      phone.capacities.forEach((cap) => {
        const key = `${col.name}_${cap.size}`;
        if (!initialMatrix[key]) {
          const matched = inStockPhones.filter(
            (p) =>
              p.color.toLowerCase().trim() === col.name.toLowerCase().trim() &&
              p.capacity.toLowerCase().replace(/\s+/g, '') === cap.size.toLowerCase().replace(/\s+/g, '')
          );
          initialMatrix[key] = {
            stock: matched.length > 0 ? matched.length : 3,
            isOutOfStock: false,
          };
        }
      });
    });

    setCapacities(initialCapacities);
    setColors(initialColors);
    setVariantStocks(initialMatrix);
    setFeedback(null);
  }, [isOpen, phone]);

  if (!isOpen) return null;

  // Handlers for Capacities
  const handleToggleCapacityOutOfStock = (size: string) => {
    setCapacities((prev) =>
      prev.map((c) => {
        if (c.size === size) {
          const nextOutOfStock = !c.isOutOfStock;
          const currentStock = c.stock ?? 0;
          return {
            ...c,
            isOutOfStock: nextOutOfStock,
            stock: nextOutOfStock ? 0 : currentStock > 0 ? currentStock : 5,
          };
        }
        return c;
      })
    );
  };

  const handleUpdateCapacityStock = (size: string, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    setCapacities((prev) =>
      prev.map((c) => (c.size === size ? { ...c, stock: stockVal, isOutOfStock: stockVal === 0 } : c))
    );
  };

  // Handlers for Colors
  const handleToggleColorOutOfStock = (id: string) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextOutOfStock = !c.isOutOfStock;
          const currentStock = c.stock ?? 0;
          return {
            ...c,
            isOutOfStock: nextOutOfStock,
            stock: nextOutOfStock ? 0 : currentStock > 0 ? currentStock : 5,
          };
        }
        return c;
      })
    );
  };

  const handleUpdateColorStock = (id: string, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stock: stockVal, isOutOfStock: stockVal === 0 } : c))
    );
  };

  // Handlers for Matrix Combinations
  const handleToggleMatrixOutOfStock = (key: string) => {
    setVariantStocks((prev) => {
      const current = prev[key] || { stock: 0, isOutOfStock: false };
      const nextOutOfStock = !current.isOutOfStock;
      return {
        ...prev,
        [key]: {
          ...current,
          isOutOfStock: nextOutOfStock,
          stock: nextOutOfStock ? 0 : current.stock > 0 ? current.stock : 3,
        },
      };
    });
  };

  const handleUpdateMatrixStock = (key: string, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    setVariantStocks((prev) => {
      const current = prev[key] || { stock: 0, isOutOfStock: false };
      return {
        ...prev,
        [key]: {
          ...current,
          stock: stockVal,
          isOutOfStock: stockVal === 0,
        },
      };
    });
  };

  // Save changes to Store and MySQL Database API
  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      // 1. Update in client IShopStore (localStorage + events)
      IShopStore.updatePhoneVariants(phone.id, {
        capacities,
        colors,
        variantStocks,
      });

      // 2. Persist to MySQL Backend API
      const res = await fetch(`/api/phones/${phone.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacities,
          colors,
          variantStocks,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu vào CSDL');
      }

      setFeedback({
        type: 'success',
        message: 'Đã lưu và đồng bộ tồn kho thành công vào hệ thống!',
      });

      if (onUpdated) {
        onUpdated();
      }

      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving variant stock:', err);
      setFeedback({
        type: 'error',
        message: 'Lỗi: ' + (err?.message || 'Có lỗi xảy ra khi lưu'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Bright, clean and high-contrast */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-sm shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  DÀNH CHO SHOP &bull; QUẢN LÝ TỒN KHO BIẾN THỂ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Đồng bộ tức thì
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate max-w-md sm:max-w-xl">
                {phone.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Bright and crisp */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('capacities')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'capacities'
                ? 'bg-white text-amber-800 border-t-2 border-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-600" />
            <span>Theo Dung Lượng ({capacities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'colors'
                ? 'bg-white text-amber-800 border-t-2 border-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-600" />
            <span>Theo Màu Sắc ({colors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-amber-800 border-t-2 border-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Ma Trận Chi Tiết (Màu x Dung lượng)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">Hướng dẫn dành cho chủ cửa hàng:</p>
              <p className="leading-relaxed text-amber-900">
                Gạt nút <strong>&quot;Còn hàng / Hết hàng&quot;</strong> hoặc nhập trực tiếp số lượng máy hiện có trong kho. Khi một dung lượng hoặc màu sắc bị đánh dấu <strong>Hết hàng</strong> (hoặc số lượng = 0), khách hàng xem chi tiết sẽ thấy nhãn đỏ &quot;Hết hàng&quot; và nút Mua ngay sẽ tự động bị khóa!
              </p>
            </div>
          </div>

          {/* TAB 1: Capacities */}
          {activeTab === 'capacities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Danh Sách Dung Lượng Bộ Nhớ</span>
                  <span className="text-xs text-slate-500 font-medium">({capacities.length} phiên bản)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Gạt nút để bật/tắt Còn - Hết hàng</span>
              </div>

              <div className="space-y-3">
                {capacities.map((cap) => {
                  const isOut = Boolean(cap.isOutOfStock || cap.stock === 0);
                  return (
                    <div
                      key={cap.size}
                      className={`p-4 rounded-2xl border transition-all ${
                        isOut
                          ? 'bg-red-50/70 border-red-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Storage Name & Price */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className={`text-base font-bold ${isOut ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {cap.size}
                            </span>
                            {isOut ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
                                ✕ TẠM HẾT HÀNG
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                                ✓ CÒN HÀNG (SẴN SÀNG BÁN)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-700 font-bold mt-1">
                            Giá bán: {formatVND(cap.price)}
                          </p>
                        </div>

                        {/* Controls: Stock input & Out of stock switch */}
                        <div className="flex items-center flex-wrap gap-2.5">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleCapacityOutOfStock(cap.size)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                              isOut
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isOut ? 'Đang Hết Hàng (Bấm để Bật lại)' : 'Đang Còn Hàng (Bấm để Báo Hết)'}
                          </button>

                          {/* Number input with - / + */}
                          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300 px-2 py-1 shadow-inner">
                            <span className="text-[11px] text-slate-600 mr-2 font-bold">SL kho:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCapacityStock(cap.size, (cap.stock || 0) - 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={cap.stock ?? 0}
                              onChange={(e) => handleUpdateCapacityStock(cap.size, parseInt(e.target.value) || 0)}
                              className="w-14 text-center bg-white text-slate-900 font-black text-xs sm:text-sm border border-slate-300 rounded-lg py-0.5 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCapacityStock(cap.size, (cap.stock || 0) + 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick presets */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateCapacityStock(cap.size, 0)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 transition-colors shadow-sm"
                            >
                              Về 0
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCapacityStock(cap.size, 5)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-300 transition-colors shadow-sm"
                            >
                              Đặt 5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCapacityStock(cap.size, 10)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-300 transition-colors shadow-sm"
                            >
                              Đặt 10
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Colors */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Danh Sách Màu Sắc Máy</span>
                  <span className="text-xs text-slate-500 font-medium">({colors.length} màu)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Gạt nút để chỉnh Còn - Hết hàng từng màu</span>
              </div>

              <div className="space-y-3">
                {colors.map((col) => {
                  const isOut = Boolean(col.isOutOfStock || col.stock === 0);
                  return (
                    <div
                      key={col.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isOut
                          ? 'bg-red-50/70 border-red-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Color Preview & Name */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            style={{ backgroundColor: col.hex }}
                            className="w-8 h-8 rounded-full border-2 border-slate-300 shadow-sm shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isOut ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {col.name}
                              </span>
                              {isOut ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
                                  ✕ HẾT HÀNG
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                                  ✓ CÒN HÀNG
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">Mã màu: {col.hex}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center flex-wrap gap-2.5">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleColorOutOfStock(col.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                              isOut
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isOut ? 'Đang Hết Hàng (Bật lại)' : 'Đang Còn Hàng (Báo Hết)'}
                          </button>

                          {/* Number input with - / + */}
                          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300 px-2 py-1 shadow-inner">
                            <span className="text-[11px] text-slate-600 mr-2 font-bold">SL kho:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateColorStock(col.id, (col.stock || 0) - 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={col.stock ?? 0}
                              onChange={(e) => handleUpdateColorStock(col.id, parseInt(e.target.value) || 0)}
                              className="w-14 text-center bg-white text-slate-900 font-black text-xs sm:text-sm border border-slate-300 rounded-lg py-0.5 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateColorStock(col.id, (col.stock || 0) + 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick presets */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateColorStock(col.id, 0)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 transition-colors shadow-sm"
                            >
                              Về 0
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateColorStock(col.id, 5)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-300 transition-colors shadow-sm"
                            >
                              Đặt 5
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Matrix combinations */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Ma Trận Tồn Kho Chi Tiết (Màu Sắc x Dung Lượng)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cho phép chỉ định số lượng và trạng thái Còn/Hết hàng cho từng cặp biến thể độc lập
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colors.map((col) =>
                  capacities.map((cap) => {
                    const key = `${col.name}_${cap.size}`;
                    const conf = variantStocks[key] || { stock: 0, isOutOfStock: false };
                    const isOut = Boolean(conf.isOutOfStock || conf.stock === 0 || col.isOutOfStock || cap.isOutOfStock);

                    return (
                      <div
                        key={key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isOut
                            ? 'bg-red-50/70 border-red-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              style={{ backgroundColor: col.hex }}
                              className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                            />
                            <div className="truncate">
                              <span className="font-bold text-xs text-slate-900 block truncate">{col.name}</span>
                              <span className="text-[11px] font-black text-amber-700">{cap.size}</span>
                            </div>
                          </div>

                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-700 border border-red-200 shrink-0">
                              HẾT HÀNG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              CÒN {conf.stock} MÁY
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleToggleMatrixOutOfStock(key)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors shadow-sm ${
                              isOut
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isOut ? 'Báo còn hàng' : 'Báo hết hàng'}
                          </button>

                          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-300 px-1.5 py-0.5">
                            <span className="text-[10px] text-slate-600 mr-1.5 font-bold">SL:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateMatrixStock(key, (conf.stock || 0) - 1)}
                              className="p-0.5 text-slate-600 hover:text-slate-900"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={conf.stock ?? 0}
                              onChange={(e) => handleUpdateMatrixStock(key, parseInt(e.target.value) || 0)}
                              className="w-10 text-center bg-white text-slate-900 font-bold text-xs border border-slate-300 rounded px-0.5 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateMatrixStock(key, (conf.stock || 0) + 1)}
                              className="p-0.5 text-slate-600 hover:text-slate-900"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border shadow-sm animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Đang đồng bộ CSDL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>LƯU VÀ CẬP NHẬT TỒN KHO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
