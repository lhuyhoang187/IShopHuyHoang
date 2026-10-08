'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  ShoppingCart,
  Wrench,
  Package,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  DollarSign,
  Activity,
  ChevronRight,
  Download,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Role, Invoice, RepairTicket, PhoneStockItem, AccessoryProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportInvoicesCsv, exportRepairsCsv } from '@/lib/exportUtils';

export default function AdminDashboardPage() {
  const [role, setRole] = useState<Role>('admin');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [phoneStock, setPhoneStock] = useState<PhoneStockItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);

  const loadData = () => {
    setRole(IShopStore.getRole());
    setInvoices(IShopStore.getInvoices());
    setRepairs(IShopStore.getRepairs());
    setPhoneStock(IShopStore.getPhoneStock());
    setAccessories(IShopStore.getAccessories());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Metrics calculation
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Cost calculation
  const totalCost = invoices.reduce((sum, inv) => {
    const invCost = inv.items.reduce(
      (itemSum, i) => itemSum + (i.costPrice || 0) * i.quantity,
      0
    );
    return sum + invCost;
  }, 0);

  // Revenue from repairs (status === 'delivered')
  const deliveredRepairs = repairs.filter((r) => r.status === 'delivered');
  const repairRevenue = deliveredRepairs.reduce((sum, r) => sum + r.totalAmount, 0);
  const repairPartsCost = deliveredRepairs.reduce(
    (sum, r) =>
      sum +
      r.partsUsed.reduce(
        (pSum, p) => pSum + (p.costPrice || 0) * p.quantity,
        0
      ),
    0
  );

  const grandTotalRevenue = totalRevenue + repairRevenue;
  const grandTotalGrossProfit =
    totalRevenue - totalCost + (repairRevenue - repairPartsCost);

  const availablePhonesCount = phoneStock.filter((p) => p.status === 'in_stock').length;
  const soldPhonesCount = phoneStock.filter((p) => p.status === 'sold').length;
  const activeRepairsCount = repairs.filter((r) => r.status !== 'delivered' && r.status !== 'cancelled').length;
  const lowStockAccessories = accessories.filter((a) => a.stock <= a.minStockAlert);

  const isCashier = role === 'cashier';

  return (
    <div className="space-y-8">
      {/* Welcome Cockpit Banner - Warm Luxury Flash Sale Aesthetic (Matching Image 2) */}
      <div className="relative rounded-3xl p-7 sm:p-9 bg-gradient-to-r from-amber-50/95 via-orange-50/85 to-rose-50/95 border-2 border-amber-300/80 overflow-hidden shadow-[0_15px_40px_rgba(245,158,11,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Soft background ambient glow orbs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/90 text-rose-700 font-black text-xs border border-rose-300/80 shadow-sm animate-pulse">
            <Activity className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>HỆ THỐNG ĐIỀU HÀNH THỜI GIAN THỰC 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
            Trung Tâm Quản Trị <span className="text-amber-600">iShop Huy Hoàng</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Đang đăng nhập với vai trò:{' '}
            <strong className="text-amber-700 uppercase font-black ml-1">
              {role === 'admin'
                ? 'CHỦ CỬA HÀNG (ADMIN TOÀN QUYỀN)'
                : role === 'technician'
                ? 'KỸ THUẬT VIÊN'
                : 'THU NGÂN / BÁN HÀNG (BẢO MẬT GIÁ VỐN)'}
            </strong>
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3.5 shrink-0">
          <Link
            href="/admin/pos"
            className="btn-gold px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Mở POS Bán Hàng</span>
          </Link>

          <Link
            href="/admin/repairs"
            className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs sm:text-sm border border-amber-300/80 shadow-sm hover:shadow-md flex items-center gap-2 transition-all hover:scale-105"
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Tiếp Nhận Sửa (30s)</span>
          </Link>
        </div>
      </div>

      {/* 4 Cyber KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Revenue */}
        <div className="glass-card rounded-3xl p-6 border-white/[0.08] hover:border-cyan-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatVND(grandTotalRevenue)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Từ {invoices.length} đơn bán & {deliveredRepairs.length} ca hoàn tất
          </p>
        </div>

        {/* Metric 2: Gross Profit */}
        <div className="glass-card rounded-3xl p-6 border-white/[0.08] hover:border-emerald-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lợi Nhuận Gộp</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {isCashier ? (
              <span className="text-gray-500 text-lg italic font-semibold">*** Bảo Mật ***</span>
            ) : (
              formatVND(grandTotalGrossProfit)
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            {isCashier ? 'Thu ngân bị ẩn giá vốn' : 'Doanh thu trừ giá vốn máy & linh kiện'}
          </p>
        </div>

        {/* Metric 3: Phone Stock */}
        <div className="glass-card rounded-3xl p-6 border-white/[0.08] hover:border-amber-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kho Máy Mới (IMEI)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {availablePhonesCount} <span className="text-sm font-normal text-gray-400">cây</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Đã xuất bán: <strong className="text-amber-400 font-bold">{soldPhonesCount}</strong> cây (Kích hoạt BH)
          </p>
        </div>

        {/* Metric 4: Repair Queue */}
        <div className="glass-card rounded-3xl p-6 border-white/[0.08] hover:border-purple-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phiếu Đang Sửa</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400 tracking-tight">
            {activeRepairsCount} <span className="text-sm font-normal text-gray-400">phiếu</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Đang trong quy trình kỹ thuật 6 bước
          </p>
        </div>
      </div>

      {/* Inventory Warnings Alert */}
      {lowStockAccessories.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3 text-amber-300">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <span>
              <strong className="font-bold text-white">Cảnh Báo Tồn Kho:</strong> Có {lowStockAccessories.length} sản phẩm phụ kiện dưới mức tối thiểu (&lt; 5 cái):{' '}
              {lowStockAccessories.map((a) => `${a.name} (còn ${a.stock})`).join(', ')}
            </span>
          </div>
          <Link
            href="/admin/restock"
            className="btn-gold px-4 py-2 rounded-xl text-xs font-black shrink-0 text-center"
          >
            Nhập Thêm Hàng
          </Link>
        </div>
      )}

      {/* 3 Revenue Stream Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-cyan-400" />
          <span>Phân Tách Doanh Thu 3 Mảng Kinh Doanh Cốt Lõi</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stream 1: New Phones */}
          <div className="glass-panel rounded-3xl p-6 border-white/[0.08] hover:border-cyan-500/40 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wide">1. Điện Thoại Mới (IMEI)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                100% Nguyên Seal
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatVND(
                invoices.reduce((sum, inv) => {
                  const phoneTotal = inv.items
                    .filter((i) => i.type === 'phone')
                    .reduce((pSum, p) => pSum + p.total, 0);
                  return sum + phoneTotal;
                }, 0)
              )}
            </div>
            <p className="text-xs text-gray-400">
              Quản lý chính xác từng cây theo IMEI, kích hoạt bảo hành tức thì.
            </p>
            <Link
              href="/admin/inventory/phones"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 pt-1"
            >
              <span>Xem kho máy mới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stream 2: Accessories */}
          <div className="glass-panel rounded-3xl p-6 border-white/[0.08] hover:border-emerald-500/40 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">2. Phụ Kiện Chính Hãng</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Mã Barcode
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatVND(
                invoices.reduce((sum, inv) => {
                  const accTotal = inv.items
                    .filter((i) => i.type === 'accessory')
                    .reduce((aSum, a) => aSum + a.total, 0);
                  return sum + accTotal;
                }, 0)
              )}
            </div>
            <p className="text-xs text-gray-400">
              Củ sạc GaN 65W, Pin MagSafe, Kính KingKong bán kèm giảm 15%.
            </p>
            <Link
              href="/admin/inventory/accessories"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 pt-1"
            >
              <span>Xem kho phụ kiện</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stream 3: Repair Service */}
          <div className="glass-panel rounded-3xl p-6 border-white/[0.08] hover:border-amber-500/40 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">3. Dịch Vụ Sửa Chữa (iCare)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Mã QR Phiếu
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatVND(repairRevenue)}
            </div>
            <p className="text-xs text-gray-400">
              Xuất linh kiện trừ kho, khách quét QR xem tiến độ 6 bước trực tiếp.
            </p>
            <Link
              href="/admin/repairs"
              className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 pt-1"
            >
              <span>Xem bàn sửa chữa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Invoices & Active Repair Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent POS Sales Invoices */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Hóa Đơn Bán Hàng Gần Nhất</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportInvoicesCsv(invoices)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 hover:text-white border border-white/[0.08] transition-colors"
                title="Xuất Excel danh sách hóa đơn"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Xuất Excel</span>
              </button>
              <Link href="/admin/pos" className="text-xs text-cyan-400 font-bold hover:underline">
                Vào POS ↗
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400">{inv.invoiceCode}</span>
                    <span className="font-bold text-white">{inv.customerName}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">{inv.createdAt}</span>
                </div>

                <div className="text-right">
                  <span className="font-black text-amber-400 block text-sm">{formatVND(inv.totalAmount)}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">{inv.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Repair Tickets */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Tiến Độ Phiếu Sửa Chữa Tại Quầy</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportRepairsCsv(repairs)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-gray-300 hover:text-white border border-white/[0.08] transition-colors"
                title="Xuất Excel danh sách phiếu sửa"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Xuất Excel</span>
              </button>
              <Link href="/admin/repairs" className="text-xs text-amber-400 font-bold hover:underline">
                Xử lý phiếu ↗
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            {repairs.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{t.ticketCode}</span>
                    <span className="font-bold text-white">{t.deviceModel}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Khách: {t.customerName} ({t.customerPhone})
                  </span>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 block mb-1">
                    {t.status === 'received' && 'Tiếp nhận'}
                    {t.status === 'inspecting' && 'Kiểm tra'}
                    {t.status === 'repairing' && 'Đang sửa'}
                    {t.status === 'qc_checking' && 'QC xuất xưởng'}
                    {t.status === 'ready_for_pickup' && 'Sẵn sàng giao'}
                    {t.status === 'delivered' && 'Đã giao'}
                  </span>
                  <span className="font-black text-white">{formatVND(t.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
