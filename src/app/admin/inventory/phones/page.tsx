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
  Download,
  Tag,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneStockItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportPhoneStockCsv } from '@/lib/exportUtils';

export default function InventoryPhonesPage() {
  const [stock, setStock] = useState<PhoneStockItem[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [searchImei, setSearchImei] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = () => {
    setStock(IShopStore.getPhoneStock());
    setRole(IShopStore.getRole());

    // Sync live from MySQL Database
    fetch('/api/inventory/phones')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStock(json.data);
        }
      })
      .catch((err) => console.warn('Inventory sync notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const canViewCostPrice = IShopStore.hasPermission(role, 'cost_price');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Phân hệ Kho Hàng</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Quản lý theo IMEI từng cây</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Smartphone className="w-6 h-6 text-amber-600" />
            <span>Kho Máy Mới 100% (Theo Từng Số IMEI)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Tổng tồn kho: <strong className="text-emerald-700 font-bold">{inStockCount} cây còn hàng</strong> • Đã xuất bán:{' '}
            <strong className="text-amber-700 font-bold">{soldCount} cây</strong>
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
          <button
            onClick={() => exportPhoneStockCsv(filtered)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Xuất danh sách tồn kho IMEI ra file Excel CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/admin/restock"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nhập Lô IMEI Từ Nhà Cung Cấp</span>
          </Link>
        </div>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white shadow-sm whitespace-nowrap"
        >
          Kho Máy Mới (IMEI)
        </Link>
        <Link
          href="/admin/inventory/accessories"
          className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap"
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
            value={searchImei}
            onChange={(e) => setSearchImei(e.target.value)}
            placeholder="Tìm theo số IMEI (15 số), tên máy, SĐT người mua..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">Tất cả ({stock.length})</option>
            <option value="in_stock">Còn hàng ({inStockCount})</option>
            <option value="sold">Đã bán ({soldCount})</option>
          </select>
        </div>
      </div>

      {/* IMEI Stock Table - Scrollable Container with Sticky Thead to prevent header clipping */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100/95 backdrop-blur-md text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 whitespace-nowrap bg-slate-100">Số IMEI (15 Chữ Số)</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Dòng Máy &amp; Dung Lượng</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Màu Sắc</th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">
                  {canViewCostPrice ? 'Giá Vốn Nhập' : 'Giá Vốn'}
                </th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">Giá Bán Niêm Yết</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Trạng Thái</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Thông Tin Xuất Bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((unit) => (
                <tr key={unit.imei} className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-4 font-mono">
                    <span className="font-bold text-amber-800 block text-xs">{unit.imei}</span>
                    <span className="text-[10px] text-slate-500">Nhập: {unit.importDate}</span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{unit.phoneName}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      NCC: {unit.supplierName}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700 font-medium">{unit.color}</td>

                  <td className="p-4 text-right font-mono font-medium text-slate-700">
                    {canViewCostPrice ? (
                      formatVND(unit.costPrice)
                    ) : (
                      <span className="text-slate-400 italic">*** Ẩn</span>
                    )}
                  </td>

                  <td className="p-4 text-right font-black text-emerald-700 font-mono text-sm">
                    {formatVND(unit.sellingPrice)}
                  </td>

                  <td className="p-4">
                    {unit.status === 'in_stock' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        ● Còn hàng
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                        ✓ Đã bán
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-xs">
                    {unit.status === 'sold' ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{unit.soldToCustomerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {unit.soldToCustomerPhone} ({unit.soldAt})
                        </span>
                        <Link
                          href={`/warranty?imei=${unit.imei}`}
                          className="text-[10px] text-amber-700 hover:text-amber-800 font-bold hover:underline block"
                          target="_blank"
                        >
                          Xem tra cứu bảo hành ↗
                        </Link>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sẵn sàng tại quầy POS</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
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
