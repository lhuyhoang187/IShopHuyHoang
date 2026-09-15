'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Search,
  Filter,
  Package,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneStockItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventoryPhonesPage() {
  const [stock, setStock] = useState<PhoneStockItem[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [searchImei, setSearchImei] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = () => {
    setStock(IShopStore.getPhoneStock());
    setRole(IShopStore.getRole());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  const filtered = stock
    .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter))
    .filter(
      (item) =>
        item.imei.includes(searchImei.trim()) ||
        item.phoneName.toLowerCase().includes(searchImei.toLowerCase()) ||
        item.color.toLowerCase().includes(searchImei.toLowerCase()) ||
        (item.soldToCustomerPhone && item.soldToCustomerPhone.includes(searchImei.trim()))
    );

  const inStockCount = stock.filter((s) => s.status === 'in_stock').length;
  const soldCount = stock.filter((s) => s.status === 'sold').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-400 uppercase">Phân hệ Kho Hàng</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Quản lý theo IMEI từng cây</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <span>Kho Máy Mới 100% (Theo Từng Số IMEI)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tổng tồn kho: <strong className="text-emerald-400">{inStockCount} cây còn hàng</strong> • Đã xuất bán:{' '}
            <strong className="text-amber-400">{soldCount} cây</strong>
          </p>
        </div>

        <Link
          href="/admin/restock"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nhập Lô IMEI Từ Nhà Cung Cấp</span>
        </Link>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
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
            value={searchImei}
            onChange={(e) => setSearchImei(e.target.value)}
            placeholder="Tìm theo số IMEI (15 số), tên máy, SĐT người mua..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
          >
            <option value="all" className="bg-[#121826]">Tất cả ({stock.length})</option>
            <option value="in_stock" className="bg-[#121826]">Còn hàng ({inStockCount})</option>
            <option value="sold" className="bg-[#121826]">Đã bán ({soldCount})</option>
          </select>
        </div>
      </div>

      {/* IMEI Stock Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Số IMEI (15 Chữ Số)</th>
                <th className="p-4">Dòng Máy & Dung Lượng</th>
                <th className="p-4">Màu Sắc</th>
                <th className="p-4 text-right">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right">Giá Bán Niêm Yết</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4">Thông Tin Xuất Bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((unit) => (
                <tr key={unit.imei} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono">
                    <span className="font-bold text-amber-400 block">{unit.imei}</span>
                    <span className="text-[10px] text-gray-500">Nhập: {unit.importDate}</span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-white block">{unit.phoneName}</span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      NCC: {unit.supplierName}
                    </span>
                  </td>

                  <td className="p-4 text-gray-300">{unit.color}</td>

                  <td className="p-4 text-right font-medium">
                    {isCashier ? (
                      <span className="text-gray-500 italic">*** Ẩn</span>
                    ) : (
                      formatVND(unit.costPrice)
                    )}
                  </td>

                  <td className="p-4 text-right font-bold text-emerald-400">
                    {formatVND(unit.sellingPrice)}
                  </td>

                  <td className="p-4">
                    {unit.status === 'in_stock' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ● Còn hàng
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        ✓ Đã bán
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-xs">
                    {unit.status === 'sold' ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{unit.soldToCustomerName}</span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {unit.soldToCustomerPhone} ({unit.soldAt})
                        </span>
                        <Link
                          href={`/warranty?imei=${unit.imei}`}
                          className="text-[10px] text-blue-400 hover:underline block"
                          target="_blank"
                        >
                          Xem tra cứu bảo hành ↗
                        </Link>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Sẵn sàng tại quầy POS</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-xs">
                    Không tìm thấy số IMEI nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
