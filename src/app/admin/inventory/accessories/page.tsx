'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Search,
  AlertTriangle,
  Barcode,
  Package,
  Tag,
  Plus,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventoryAccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setAccessories(IShopStore.getAccessories());
    setRole(IShopStore.getRole());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  const handleQuickSavePrice = (accId: string) => {
    if (tempPrice <= 0) return;
    IShopStore.updateAccessory(accId, { sellingPrice: tempPrice });
    setEditingPriceId(null);
    setToastMsg('✓ Đã cập nhật giá bán mới thành công!');
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  const filtered = accessories
    .filter((a) => (categoryFilter === 'all' ? true : a.category === categoryFilter))
    .filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.barcode.includes(search.trim()) ||
        a.brand.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Phân hệ Kho Hàng</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Quản lý theo Barcode</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Headphones className="w-6 h-6 text-emerald-600" />
            <span>Kho Phụ Kiện Chính Hãng (Barcode)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Củ sạc GaN, Pin MagSafe, Cáp sạc, Kính cường lực KingKong, Tai nghe AirPods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/promotions"
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-sm"
          >
            <Tag className="w-4 h-4 text-black" />
            <span>Điều Chỉnh Giá &amp; Khuyến Mãi</span>
          </Link>
          <Link
            href="/admin/restock"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Nhập Hàng Phụ Kiện</span>
          </Link>
        </div>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap"
        >
          Kho Máy Mới (IMEI)
        </Link>
        <Link
          href="/admin/inventory/accessories"
          className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white shadow-sm whitespace-nowrap"
        >
          Kho Phụ Kiện (Barcode)
        </Link>
        <Link
          href="/admin/inventory/spare-parts"
          className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap"
        >
          Kho Linh Kiện Sửa Chữa
        </Link>
        <Link
          href="/admin/promotions"
          className="px-4 py-2 rounded-xl font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors whitespace-nowrap flex items-center gap-1.5 ml-auto"
        >
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>Cấu Hình Giá &amp; Flash Sale</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vạch Barcode, tên phụ kiện, hãng (Baseus, Anker)..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Danh mục:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="charger">Củ sạc GaN</option>
            <option value="cable">Cáp sạc</option>
            <option value="powerbank">Pin MagSafe</option>
            <option value="screen_protector">Kính cường lực</option>
            <option value="audio">Tai nghe</option>
            <option value="case">Ốp lưng</option>
          </select>
        </div>
      </div>

      {/* Accessories Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100/95 backdrop-blur-md text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 whitespace-nowrap bg-slate-100">Hình Ảnh &amp; Mã Barcode</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Tên Phụ Kiện</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Hãng &amp; Nhóm</th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">Giá Bán Lẻ</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Tồn Kho Hiện Tại</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Cảnh Báo Tồn</th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">Sửa Giá Bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((acc) => {
                const isLow = acc.stock <= acc.minStockAlert;
                const isEditing = editingPriceId === acc.id;

                return (
                  <tr key={acc.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.imageUrl}
                          alt={acc.name}
                          className="w-10 h-10 object-cover rounded-xl bg-slate-100 border border-slate-200 p-0.5 shrink-0"
                        />
                        <span className="font-mono text-xs font-bold text-emerald-800">
                          {acc.barcode}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{acc.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{acc.specs}</span>
                    </td>

                    <td className="p-4">
                      <span className="text-slate-800 font-bold block">{acc.brand}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{acc.categoryName}</span>
                    </td>

                    <td className="p-4 text-right font-medium text-slate-700">
                      {isCashier ? (
                        <span className="text-slate-400 italic">*** Ẩn</span>
                      ) : (
                        formatVND(acc.costPrice)
                      )}
                    </td>

                    <td className="p-4 text-right font-black text-emerald-700 font-mono text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          step="10000"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(Number(e.target.value))}
                          className="w-28 p-1.5 bg-emerald-50 border-2 border-emerald-400 rounded-lg text-right font-bold text-xs"
                          autoFocus
                        />
                      ) : (
                        formatVND(acc.sellingPrice)
                      )}
                    </td>

                    <td className="p-4 text-center font-bold text-sm">
                      <span className={isLow ? 'text-rose-600 font-black' : 'text-slate-900'}>
                        {acc.stock}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {isLow ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Sắp hết (&lt; {acc.minStockAlert})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Đủ hàng
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickSavePrice(acc.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            title="Lưu giá mới"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px]"
                            title="Hủy"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPriceId(acc.id);
                            setTempPrice(acc.sellingPrice);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Sửa giá
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
