'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Sliders,
  Edit3,
  Layers,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HardDrive,
  Palette,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct, PhoneStockItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportPhoneStockCsv } from '@/lib/exportUtils';
import PhoneVariantStockModal from '@/components/admin/PhoneVariantStockModal';

export default function InventoryPhonesPage() {
  const [activeView, setActiveView] = useState<'variants' | 'imei'>('variants');
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [stock, setStock] = useState<PhoneStockItem[]>([]);
  const [role, setRole] = useState<Role>('admin');

  // Multi-attribute Filter Toolbar for Variants view
  const [phoneSearch, setPhoneSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Search & Filter for IMEI view
  const [searchImei, setSearchImei] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Stock edit modal state
  const [selectedPhoneForEdit, setSelectedPhoneForEdit] = useState<PhoneProduct | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const loadData = () => {
    const localPhones = IShopStore.getPhones();
    const localStock = IShopStore.getPhoneStock();
    setPhones(localPhones);
    setStock(localStock);
    setRole(IShopStore.getRole());

    // Sync phones live from MySQL Database
    fetch('/api/phones')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPhones(json.data);
          // If modal is open, refresh selected phone
          setSelectedPhoneForEdit((prev) =>
            prev ? json.data.find((p: PhoneProduct) => p.id === prev.id) || prev : null
          );
        }
      })
      .catch((err) => console.warn('Phones sync notice:', err));

    // Sync IMEI live from MySQL Database
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

  // Extract unique brands from catalog
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    phones.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [phones]);

  // Extract unique capacities from catalog, sorted logically
  const availableCapacities = useMemo(() => {
    const set = new Set<string>();
    phones.forEach((p) => {
      (p.capacities || []).forEach((c) => {
        if (c.size) set.add(c.size);
      });
    });
    return Array.from(set).sort((a, b) => {
      const parseSize = (s: string) => {
        if (s.toUpperCase().includes('TB')) return (parseInt(s) || 1) * 1024;
        return parseInt(s) || 0;
      };
      return parseSize(a) - parseSize(b);
    });
  }, [phones]);

  // Filtered Phone Models for Variants List view
  const filteredPhones = useMemo(() => {
    return phones.filter((p) => {
      // 1. Filter by Brand
      const matchBrand =
        brandFilter === 'all' || p.brand.toLowerCase() === brandFilter.toLowerCase();

      // 2. Filter by Capacity
      const matchCapacity =
        capacityFilter === 'all' ||
        (p.capacities || []).some(
          (c) => c.size.toLowerCase().replace(/\s+/g, '') === capacityFilter.toLowerCase().replace(/\s+/g, '')
        );

      // 3. Filter by Stock Status
      let matchStatus = true;
      const phoneImeisInStock = stock.filter(
        (s) => s.phoneId === p.id && s.status === 'in_stock'
      ).length;

      if (stockStatusFilter === 'in_stock') {
        matchStatus = phoneImeisInStock > 0;
      } else if (stockStatusFilter === 'out_of_stock') {
        const hasOutOfStockVariant =
          phoneImeisInStock === 0 ||
          (p.capacities || []).some((c) => c.isOutOfStock || c.stock === 0) ||
          (p.colors || []).some((c) => c.isOutOfStock || c.stock === 0);
        matchStatus = hasOutOfStockVariant;
      }

      // 4. Filter by Search Query
      const q = phoneSearch.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);

      return matchBrand && matchCapacity && matchStatus && matchSearch;
    });
  }, [phones, stock, brandFilter, capacityFilter, stockStatusFilter, phoneSearch]);

  // Filtered IMEI records for IMEI view
  const filteredImeiStock = useMemo(() => {
    return stock
      .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter))
      .filter(
        (item) =>
          item.imei.includes(searchImei.trim()) ||
          item.phoneName.toLowerCase().includes(searchImei.toLowerCase()) ||
          item.color.toLowerCase().includes(searchImei.toLowerCase()) ||
          (item.soldToCustomerPhone && item.soldToCustomerPhone.includes(searchImei.trim()))
      );
  }, [stock, statusFilter, searchImei]);

  const inStockCount = stock.filter((s) => s.status === 'in_stock').length;
  const soldCount = stock.filter((s) => s.status === 'sold').length;

  // Open modal handler
  const handleOpenStockEdit = (phone: PhoneProduct) => {
    setSelectedPhoneForEdit(phone);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              Phân Hệ Quản Lý Kho Điện Thoại
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Dành Riêng Cho Chủ Shop &amp; Quản Trị Viên</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Smartphone className="w-6 h-6 text-amber-600" />
            <span>Quản Lý Tồn Kho &amp; Trạng Thái Biến Thể Điện Thoại</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Tổng tồn kho máy sẵn sàng bán:{' '}
            <strong className="text-emerald-700 font-bold">{inStockCount} cây</strong> • Đã xuất bán:{' '}
            <strong className="text-amber-700 font-bold">{soldCount} cây</strong> • Số dòng máy:{' '}
            <strong className="text-slate-900 font-bold">{phones.length} model</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/promotions"
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-sm"
          >
            <Tag className="w-4 h-4 text-black" />
            <span>Điều Chỉnh Giá &amp; Khuyến Mãi</span>
          </Link>
          <button
            onClick={() => exportPhoneStockCsv(filteredImeiStock)}
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
            <span>Nhập Lô IMEI Từ NCC</span>
          </Link>
        </div>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white shadow-sm whitespace-nowrap"
        >
          Kho Điện Thoại (Biến Thể &amp; IMEI)
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

      {/* MODE TABS: View by Product Variants (Color/Capacity) vs. View by IMEI */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveView('variants')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'variants'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-700 hover:bg-amber-100/80'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Quản Lý Tồn Kho Theo Màu &amp; Dung Lượng ({phones.length} Dòng Máy)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('imei')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'imei'
                ? 'bg-slate-900 text-white font-black shadow-md'
                : 'text-slate-700 hover:bg-amber-100/80'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Chi Tiết Từng Cây Máy Theo Số IMEI ({stock.length} Cây)</span>
          </button>
        </div>

        <div className="text-[11px] text-amber-900 font-medium px-2">
          {activeView === 'variants'
            ? '💡 Chỉnh sửa số lượng, đánh dấu Còn/Hết hàng cho từng màu & dung lượng'
            : '💡 Quản lý tình trạng xuất bán và bảo hành của từng số IMEI riêng biệt'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DANH SÁCH TINH GỌN (LIST VIEW) KÈM BỘ LỌC THEO HÃNG & DUNG LƯỢNG */}
      {/* ========================================================================= */}
      {activeView === 'variants' && (
        <div className="space-y-4">
          {/* Smart Filter Toolbar: Search + Brand Filter + Capacity Filter + Stock Status Filter */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search box */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Tìm theo tên máy (iPhone 16, S24 Ultra, Xiaomi...)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors font-medium"
                />
                {phoneSearch && (
                  <button
                    onClick={() => setPhoneSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Brand Filter */}
              <div className="md:col-span-3 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold shrink-0">Hãng:</span>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">Tất cả thương hiệu ({phones.length})</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity Filter */}
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold shrink-0">Bộ nhớ:</span>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">Tất cả dung lượng</option>
                  {availableCapacities.map((cap) => (
                    <option key={cap} value={cap}>
                      {cap}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold shrink-0">Kho:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="in_stock">Còn hàng sẵn bán</option>
                  <option value="out_of_stock">Có mục hết hàng</option>
                </select>
              </div>
            </div>

            {/* Quick Active Filter Pills & Reset */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 text-[11px] font-medium">Đang lọc theo:</span>
                {brandFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold flex items-center gap-1">
                    Hãng: {brandFilter}
                    <button onClick={() => setBrandFilter('all')}>
                      <X className="w-3 h-3 hover:text-black" />
                    </button>
                  </span>
                )}
                {capacityFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-bold flex items-center gap-1">
                    Dung lượng: {capacityFilter}
                    <button onClick={() => setCapacityFilter('all')}>
                      <X className="w-3 h-3 hover:text-black" />
                    </button>
                  </span>
                )}
                {stockStatusFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    Trạng thái: {stockStatusFilter === 'in_stock' ? 'Còn hàng' : 'Có mục hết hàng'}
                    <button onClick={() => setStockStatusFilter('all')}>
                      <X className="w-3 h-3 hover:text-black" />
                    </button>
                  </span>
                )}
                {brandFilter === 'all' && capacityFilter === 'all' && stockStatusFilter === 'all' && !phoneSearch && (
                  <span className="text-slate-500 text-[11px]">Toàn bộ danh mục ({phones.length} model)</span>
                )}
              </div>

              {(brandFilter !== 'all' || capacityFilter !== 'all' || stockStatusFilter !== 'all' || phoneSearch) && (
                <button
                  onClick={() => {
                    setBrandFilter('all');
                    setCapacityFilter('all');
                    setStockStatusFilter('all');
                    setPhoneSearch('');
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline shrink-0"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* COMPACT LIST VIEW TABLE (Tối ưu giao diện & form chữ thanh thoát, chuẩn ERP Apple Store) */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap w-[26%]">Dòng Máy &amp; Thương Hiệu</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-[27%]">Dung Lượng &amp; Giá Bán</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-[27%]">Màu Sắc Máy</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-[10%]">Kho IMEI</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap w-[10%]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPhones.map((phone) => {
                    // Live in-stock IMEI count
                    const phoneImeisInStock = stock.filter(
                      (s) => s.phoneId === phone.id && s.status === 'in_stock'
                    ).length;

                    // Clean product title and subtitle
                    const nameParts = phone.name.split(' - ');
                    const mainTitle = nameParts[0] || phone.name;
                    const subTitle = nameParts[1] || 'Mới 100% Nguyên Seal';

                    return (
                      <tr
                        key={phone.id}
                        className="hover:bg-amber-50/30 transition-colors group"
                      >
                        {/* 1. Phone image & basic info */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-amber-300 transition-colors shadow-2xs">
                              {phone.colors[0]?.imageUrl ? (
                                <img
                                  src={phone.colors[0].imageUrl}
                                  alt={phone.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <Smartphone className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                    phone.brand === 'Apple'
                                      ? 'bg-slate-900 text-white'
                                      : phone.brand === 'Samsung'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-orange-600 text-white'
                                  }`}
                                >
                                  {phone.brand}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">ID: {phone.id}</span>
                              </div>

                              <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                                {mainTitle}
                              </h3>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {subTitle}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <Link
                                  href={`/phones/${phone.slug}`}
                                  target="_blank"
                                  className="text-[11px] text-amber-700 hover:text-amber-800 font-bold inline-flex items-center gap-1 hover:underline"
                                >
                                  <span>Xem trang khách</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Capacities Stock list */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            {phone.capacities.map((cap) => {
                              const isOut = Boolean(cap.isOutOfStock || cap.stock === 0);
                              const isHighlight =
                                capacityFilter !== 'all' &&
                                cap.size.toLowerCase().replace(/\s+/g, '') === capacityFilter.toLowerCase().replace(/\s+/g, '');
                              const stockVal = cap.stock !== undefined ? cap.stock : 5;

                              return (
                                <div
                                  key={cap.size}
                                  className={`px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                    isHighlight
                                      ? 'border-amber-400 bg-amber-50/90 shadow-2xs'
                                      : isOut
                                      ? 'bg-red-50/60 border-red-200 text-slate-600'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-xs ${isOut ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                      {cap.size}
                                    </span>
                                    <span className="text-[11px] text-amber-800 font-semibold font-mono tabular-nums">
                                      {formatVND(cap.price)}
                                    </span>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isOut ? (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
                                        ✕ Hết hàng
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                                        ● Còn {stockVal} máy
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* 3. Colors Stock list */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            {phone.colors.map((c) => {
                              const isOut = Boolean(c.isOutOfStock || c.stock === 0);
                              const stockVal = c.stock !== undefined ? c.stock : 5;
                              // Clean color name (remove english subtitle inside parentheses for clean display)
                              const cleanColorName = c.name.replace(/\s*\([^)]*\)/g, '').trim() || c.name;

                              return (
                                <div
                                  key={c.id}
                                  className={`px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                    isOut
                                      ? 'bg-red-50/60 border-red-200 text-slate-600'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0" title={c.name}>
                                    <span
                                      style={{ backgroundColor: c.hex }}
                                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                    />
                                    <span
                                      className={`truncate font-semibold text-xs ${
                                        isOut ? 'line-through text-slate-400' : 'text-slate-800'
                                      }`}
                                    >
                                      {cleanColorName}
                                    </span>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isOut ? (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
                                        ✕ Hết hàng
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                                        ● Còn {stockVal} máy
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* 4. Total In Stock (IMEI) */}
                        <td className="py-4 px-4 align-top text-center whitespace-nowrap">
                          {phoneImeisInStock > 0 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block shadow-2xs whitespace-nowrap">
                              ● {phoneImeisInStock} cây sẵn bán
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 inline-block whitespace-nowrap">
                              ✕ 0 cây trong kho
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 font-medium block mt-1">
                            {phone.capacities.length} DL &bull; {phone.colors.length} màu
                          </span>
                        </td>

                        {/* 5. Action button - Keeps on one single clean line */}
                        <td className="py-4 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenStockEdit(phone)}
                            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer ml-auto whitespace-nowrap shrink-0"
                            title="Điều chỉnh số lượng và trạng thái Còn/Hết hàng"
                          >
                            <Sliders className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Chỉnh Sửa Tồn Kho</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPhones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 text-xs">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="font-bold text-slate-700">Không tìm thấy dòng máy nào phù hợp.</p>
                          <p className="text-[11px] text-slate-400">
                            Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc theo hãng và dung lượng.
                          </p>
                          <button
                            onClick={() => {
                              setBrandFilter('all');
                              setCapacityFilter('all');
                              setStockStatusFilter('all');
                              setPhoneSearch('');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                          >
                            Đặt lại bộ lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: CHI TIẾT TỪNG CÂY MÁY (THEO SỐ IMEI 15 KÝ TỰ)           */}
      {/* ============================================================== */}
      {activeView === 'imei' && (
        <div className="space-y-4">
          {/* Search and Filters for IMEI */}
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

          {/* IMEI Stock Table */}
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
                  {filteredImeiStock.map((unit) => (
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

                  {filteredImeiStock.length === 0 && (
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
      )}

      {/* ============================================================== */}
      {/* PHONE VARIANT STOCK MODAL (Chỉ mở trong trang Quản Trị Shop)    */}
      {/* ============================================================== */}
      {selectedPhoneForEdit && (
        <PhoneVariantStockModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setSelectedPhoneForEdit(null);
          }}
          phone={selectedPhoneForEdit}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}
