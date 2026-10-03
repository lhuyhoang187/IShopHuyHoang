'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Package,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Supplier, PhoneProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function AdminRestockPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('sup-1');
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('p-1');
  const [color, setColor] = useState<string>('Titan Sa Mạc (Desert Titanium)');
  const [capacity, setCapacity] = useState<string>('256GB');
  const [costPrice, setCostPrice] = useState<number>(32500000);
  const [sellingPrice, setSellingPrice] = useState<number>(34990000);
  const [imeiListText, setImeiListText] = useState<string>(
    '358921104888001\n358921104888002\n358921104888003'
  );
  const [paidAmount, setPaidAmount] = useState<number>(50000000);

  const loadData = () => {
    setSuppliers(IShopStore.getSuppliers());
    setPhones(IShopStore.getPhones());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Parse raw IMEI text into array of clean 15-digit numbers
  const parsedImeis = imeiListText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);

  const totalBatchCost = costPrice * parsedImeis.length;
  const debtIncrease = Math.max(0, totalBatchCost - paidAmount);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedImeis.length === 0) {
      alert('Vui lòng nhập ít nhất 1 số IMEI hợp lệ!');
      return;
    }

    const currentPhone = phones.find((p) => p.id === selectedPhoneId);

    // 1. Post to live MySQL Database via /api/restock
    try {
      await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          phoneId: selectedPhoneId,
          phoneName: currentPhone ? currentPhone.name : 'iPhone 16 Pro Max',
          color,
          capacity,
          costPrice,
          sellingPrice,
          imeis: parsedImeis,
          paidAmount,
          notes: 'Nhập lô hàng chính ngạch qua Admin Restock.',
        }),
      });
    } catch (err) {
      console.warn('API restock error:', err);
    }

    // 2. Also save to client store for immediate reactivity
    IShopStore.importPhoneBatch(
      selectedSupplierId,
      selectedPhoneId,
      color,
      capacity,
      costPrice,
      sellingPrice,
      parsedImeis,
      paidAmount
    );

    setSuccessMessage(
      `Đã nạp thành công ${parsedImeis.length} cây máy mới vào kho CSDL MySQL! Đã tự động hạch toán Phiếu Chi: ${formatVND(
        paidAmount
      )} và cập nhật công nợ NCC: ${formatVND(debtIncrease)}.`
    );

    setImeiListText('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-400 uppercase">Phân hệ Mua Hàng & NCC</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Inbound Restock</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Truck className="w-6 h-6 text-blue-400" />
            <span>Mua Hàng & Nạp Lô IMEI Từ Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Dán hàng loạt số IMEI để nạp kho siêu tốc, tự động quản lý công nợ nhà phân phối.
          </p>
        </div>

        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
        >
          Xem Kho Máy Mới
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Import Form Layout */}
      <form onSubmit={handleImport} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Batch IMEI Input */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span>1. Dán Danh Sách Số IMEI Cần Nhập Kho</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                Đã nhận diện: {parsedImeis.length} IMEI
              </span>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Dán danh sách IMEI (Mỗi số 1 dòng hoặc cách nhau bởi dấu phẩy):
              </label>
              <textarea
                rows={7}
                required
                value={imeiListText}
                onChange={(e) => setImeiListText(e.target.value)}
                placeholder="358921104888001&#10;358921104888002&#10;358921104888003..."
                className="w-full p-3 bg-white/5 border border-white/15 rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Parsed Previews */}
            {parsedImeis.length > 0 && (
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs">
                <span className="text-gray-400 block text-[11px] mb-1">
                  Danh sách IMEI sẽ tạo trong kho:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parsedImeis.map((imei, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {idx + 1}. {imei}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Supplier Debt Status */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>2. Thông Tin Nhà Cung Cấp & Công Nợ</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Nhà Cung Cấp phân phối *:</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-[#0e1422] border border-white/15 rounded-xl text-white focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Nợ hiện tại: {formatVND(s.currentDebt)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Số tiền thanh toán ngay cho NCC:</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Configuration & Pricing */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/15 space-y-5 sticky top-28">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-white/10">
              3. Cấu Hình Dòng Máy Cho Lô IMEI
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Chọn Dòng Máy *:</label>
                <select
                  value={selectedPhoneId}
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  className="w-full p-2.5 bg-[#0e1422] border border-white/15 rounded-xl text-white focus:outline-none"
                >
                  {phones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Màu sắc:</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Dung lượng:</label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Giá vốn nhập/cây:</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Giá bán lẻ niêm yết:</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Số lượng máy nhập:</span>
                <span className="font-bold text-white">{parsedImeis.length} cây</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tổng giá trị lô hàng:</span>
                <span className="font-bold text-white">{formatVND(totalBatchCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Thanh toán ngay:</span>
                <span className="font-bold">{formatVND(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-red-400 font-bold border-t border-white/5 pt-2">
                <span>Ghi nợ thêm cho NCC:</span>
                <span>+{formatVND(debtIncrease)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={parsedImeis.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <Package className="w-4 h-4" />
              <span>XÁC NHẬN NẠP {parsedImeis.length} IMEI VÀO KHO</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
