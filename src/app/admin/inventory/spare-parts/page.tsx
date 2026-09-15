'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Search,
  Plus,
  Wrench,
  Package,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { SparePartItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventorySparePartsPage() {
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [search, setSearch] = useState('');

  const loadData = () => {
    setParts(IShopStore.getSpareParts());
    setRole(IShopStore.getRole());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search.trim()) ||
      p.compatibleModels.some((m) => m.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 uppercase">Phân hệ Kho Hàng</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Linh Kiện Sửa Chữa Chuyên Sâu</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Cpu className="w-6 h-6 text-amber-400" />
            <span>Kho Linh Kiện Sửa Chữa (Màn hình, Pin Pisen, Kính, Cáp)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Linh kiện phục vụ thay thế tại bàn sửa chữa. Xuất kho tự động trừ tồn và tính vào chi phí phiếu sửa.
          </p>
        </div>

        <Link
          href="/admin/repairs"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Wrench className="w-4 h-4" />
          <span>Vào Bàn Sửa Chữa</span>
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
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5"
        >
          Kho Phụ Kiện (Barcode)
        </Link>
        <Link
          href="/admin/inventory/spare-parts"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black"
        >
          Kho Linh Kiện Sửa Chữa
        </Link>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên linh kiện, dòng máy tương thích (iPhone 15, S24 Ultra...)..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Spare Parts Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Mã Linh Kiện</th>
                <th className="p-4">Tên Linh Kiện & Loại</th>
                <th className="p-4">Dòng Máy Tương Thích</th>
                <th className="p-4 text-right">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right">Giá Thay Cho Khách</th>
                <th className="p-4 text-center">Tồn Kho</th>
                <th className="p-4">Bảo Hành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((part) => (
                <tr key={part.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-400 text-xs">
                    {part.barcode}
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-white block">{part.name}</span>
                    <span className="text-[11px] text-gray-400">{part.categoryName}</span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {part.compatibleModels.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 border border-white/5"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-4 text-right font-medium">
                    {isCashier ? (
                      <span className="text-gray-500 italic">*** Ẩn</span>
                    ) : (
                      formatVND(part.costPrice)
                    )}
                  </td>

                  <td className="p-4 text-right font-bold text-emerald-400">
                    {formatVND(part.retailRepairPrice)}
                  </td>

                  <td className="p-4 text-center font-bold text-base text-white">
                    {part.stock} <span className="text-xs font-normal text-gray-400">{part.unit}</span>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {part.warrantyMonths} Tháng
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
