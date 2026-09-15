'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Search,
  AlertTriangle,
  Barcode,
  Package,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventoryAccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase">Phân hệ Kho Hàng</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Quản lý theo Barcode</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Headphones className="w-6 h-6 text-emerald-400" />
            <span>Kho Phụ Kiện Chính Hãng (Barcode)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Củ sạc GaN, Pin MagSafe, Cáp sạc, Kính cường lực KingKong, Tai nghe AirPods.
          </p>
        </div>

        <Link
          href="/admin/restock"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2"
        >
          <span>Nhập Hàng Phụ Kiện</span>
        </Link>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5"
        >
          Kho Máy Mới (IMEI)
        </Link>
        <Link
          href="/admin/inventory/accessories"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
        >
          Kho Phụ Kiện (Barcode)
        </Link>
        <Link
          href="/admin/inventory/spare-parts"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5"
        >
          Kho Linh Kiện Sửa Chữa
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vạch Barcode, tên phụ kiện, hãng (Baseus, Anker)..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Danh mục:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
          >
            <option value="all" className="bg-[#121826]">Tất cả danh mục</option>
            <option value="charger" className="bg-[#121826]">Củ sạc GaN</option>
            <option value="cable" className="bg-[#121826]">Cáp sạc</option>
            <option value="powerbank" className="bg-[#121826]">Pin MagSafe</option>
            <option value="screen_protector" className="bg-[#121826]">Kính cường lực</option>
            <option value="audio" className="bg-[#121826]">Tai nghe</option>
            <option value="case" className="bg-[#121826]">Ốp lưng</option>
          </select>
        </div>
      </div>

      {/* Accessories Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Hình Ảnh & Mã Barcode</th>
                <th className="p-4">Tên Phụ Kiện</th>
                <th className="p-4">Hãng & Nhóm</th>
                <th className="p-4 text-right">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right">Giá Bán Lẻ</th>
                <th className="p-4 text-center">Tồn Kho Hiện Tại</th>
                <th className="p-4 text-center">Cảnh Báo Tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((acc) => {
                const isLow = acc.stock <= acc.minStockAlert;

                return (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.imageUrl}
                          alt={acc.name}
                          className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1 shrink-0"
                        />
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {acc.barcode}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-white block">{acc.name}</span>
                      <span className="text-[11px] text-gray-400">{acc.specs}</span>
                    </td>

                    <td className="p-4">
                      <span className="text-white font-medium block">{acc.brand}</span>
                      <span className="text-[11px] text-gray-400">{acc.categoryName}</span>
                    </td>

                    <td className="p-4 text-right font-medium">
                      {isCashier ? (
                        <span className="text-gray-500 italic">*** Ẩn</span>
                      ) : (
                        formatVND(acc.costPrice)
                      )}
                    </td>

                    <td className="p-4 text-right font-bold text-emerald-400">
                      {formatVND(acc.sellingPrice)}
                    </td>

                    <td className="p-4 text-center font-bold text-base">
                      <span className={isLow ? 'text-red-400' : 'text-white'}>
                        {acc.stock}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {isLow ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết (&lt; {acc.minStockAlert})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Đủ hàng
                        </span>
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
