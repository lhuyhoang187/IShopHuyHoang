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
  Download,
  Activity,
  ChevronRight,
  DollarSign,
  ShieldAlert,
  X,
  FileText,
  Mail,
  Tag,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Role, Invoice, RepairTicket, PhoneStockItem, AccessoryProduct, PromotionCampaign } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportInvoicesCsv, exportRepairsCsv } from '@/lib/exportUtils';

export default function AdminDashboardPage() {
  const [role, setRole] = useState<Role>('admin');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [phoneStock, setPhoneStock] = useState<PhoneStockItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const loadData = () => {
    setRole(IShopStore.getRole());
    setInvoices(IShopStore.getInvoices());
    setRepairs(IShopStore.getRepairs());
    setPhoneStock(IShopStore.getPhoneStock());
    setAccessories(IShopStore.getAccessories());
    setCampaigns(IShopStore.getPromotionCampaigns());
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

  // Đơn hàng lớn cần Admin duyệt (> 100.000.000đ hoặc đặt số lượng sỉ >= 5 máy)
  const waitingAdminApproval = invoices.filter(
    (inv) => inv.status === 'pending_admin_approval'
  );

  const handleApproveLargeOrder = (orderId: string) => {
    const success = IShopStore.approveLargeOrder(orderId, 'Chủ cửa hàng (Admin)');
    if (success) {
      setApprovalNotice('✓ Đã phê duyệt xuất kho đơn hàng thành công!');
      setTimeout(() => setApprovalNotice(null), 4000);
      loadData();
    }
  };

  const handleRejectLargeOrder = (orderId: string) => {
    const reason = window.prompt('Nhập lý do từ chối đơn hàng (hoặc để trống):', 'Vượt quá hạn mức số lượng hoặc cần xác minh lại') || 'Cần liên hệ trực tiếp';
    const success = IShopStore.rejectLargeOrder(orderId, 'Chủ cửa hàng (Admin)', reason);
    if (success) {
      setApprovalNotice('✓ Đã từ chối đơn hàng lớn và gửi thông báo qua email.');
      setTimeout(() => setApprovalNotice(null), 4000);
      loadData();
    }
  };

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

          <Link
            href="/admin/promotions"
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Tag className="w-4 h-4 text-white" />
            <span>Chỉnh Giá & Khuyến Mãi</span>
          </Link>
        </div>
      </div>

      {/* 4 Cyber KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {formatVND(grandTotalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Từ {invoices.length} đơn bán &amp; {deliveredRepairs.length} ca hoàn tất
          </p>
        </div>

        {/* Metric 2: Gross Profit */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi Nhuận Gộp</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {isCashier ? (
              <span className="text-slate-400 text-lg italic font-semibold">*** Bảo Mật ***</span>
            ) : (
              formatVND(grandTotalGrossProfit)
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {isCashier ? 'Thu ngân bị ẩn giá vốn' : 'Doanh thu trừ giá vốn máy & linh kiện'}
          </p>
        </div>

        {/* Metric 3: Phone Stock */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kho Máy Mới (IMEI)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {availablePhonesCount} <span className="text-sm font-normal text-slate-500">cây</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Đã xuất bán: <strong className="text-amber-700 font-bold">{soldPhonesCount}</strong> cây (Kích hoạt BH)
          </p>
        </div>

        {/* Metric 4: Repair Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phiếu Đang Sửa</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 tracking-tight">
            {activeRepairsCount} <span className="text-sm font-normal text-slate-500">phiếu</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Đang trong quy trình kỹ thuật 6 bước
          </p>
        </div>
      </div>

      {/* Inventory Warnings Alert */}
      {lowStockAccessories.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3 text-amber-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <span className="leading-relaxed">
              <strong className="font-bold text-slate-900">Cảnh Báo Tồn Kho:</strong> Có {lowStockAccessories.length} sản phẩm phụ kiện dưới mức tối thiểu (&lt; 5 cái):{' '}
              <span className="font-semibold text-amber-800">
                {lowStockAccessories.map((a) => `${a.name} (còn ${a.stock})`).join(', ')}
              </span>
            </span>
          </div>
          <Link
            href="/admin/restock"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shrink-0 text-center shadow-sm transition-colors"
          >
            Nhập Thêm Hàng
          </Link>
        </div>
      )}

      {/* CHIẾN DỊCH KHUYẾN MÃI & FLASH SALE THỜI GIAN THỰC */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-sm shrink-0">
              <Zap className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Chiến Dịch Khuyến Mãi &amp; Flash Sale Đang Chạy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Chương trình giảm giá tự động kích hoạt theo khung giờ và ngày bắt đầu/kết thúc
              </p>
            </div>
          </div>
          <Link
            href="/admin/promotions"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Quản Lý Giá &amp; Khuyến Mãi →</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.slice(0, 3).map((camp) => (
            <div
              key={camp.id}
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200 hover:border-amber-300 transition-all space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {camp.badgeText || 'PROMO'}
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    {camp.discountType === 'percentage'
                      ? `-${camp.discountValue}%`
                      : `-${formatVND(camp.discountValue)}`}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-1">{camp.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{camp.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Hạn dùng đến:</span>
                <span className="font-mono font-bold text-amber-800">
                  {new Date(camp.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thông Báo Thao Tác Phê Duyệt */}
      {approvalNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{approvalNotice}</span>
        </div>
      )}

      {/* RÀNG BUỘC ĐƠN HÀNG LỚN (> 100.000.000Đ HOẶC SỈ): CHỈ ADMIN MỚI ĐƯỢC DUYỆT */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-5 relative overflow-hidden">
        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Duyệt Đơn Hàng Lớn &amp; Đặt Trước (Pre-order)</span>
                {waitingAdminApproval.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-sm animate-pulse">
                    {waitingAdminApproval.length} ĐƠN CHỜ DUYỆT
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Ràng buộc an toàn vốn: Đơn hàng trên 100.000.000 VNĐ hoặc đặt sỉ phải được Admin duyệt trước khi xuất kho.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 shadow-sm self-start sm:self-auto">
            Hạn Mức Duyệt: &ge; 100.000.000đ
          </span>
        </div>

        {waitingAdminApproval.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-bold text-slate-900 text-sm">Không có đơn hàng lớn nào đang chờ duyệt</p>
            <p className="text-xs text-slate-500">Tất cả các đơn hàng trên 100 triệu và đặt sỉ đều đã được kiểm tra và xử lý an toàn.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {waitingAdminApproval.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 transition-all space-y-3.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-amber-800 text-sm bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
                      {order.invoiceCode}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-900 font-black text-sm">{order.customerName}</span>
                    <span className="text-slate-600 font-mono font-semibold">({order.customerPhone})</span>
                    {order.customerEmail && (
                      <span className="text-sky-700 text-xs font-medium bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-sky-600" /> {order.customerEmail}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      Chờ Admin Duyệt
                    </span>
                    {order.isPreOrder && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">
                        Đặt Trước ({order.depositPercent}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wide">
                      Sản phẩm đặt mua:
                    </span>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="text-slate-700 font-medium">
                        • {it.quantity}x <strong className="text-slate-900 font-bold">{it.name}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wide">
                      Giá trị đơn hàng:
                    </span>
                    <div className="text-xl font-black text-amber-700 font-mono">
                      {formatVND(order.totalAmount)}
                    </div>
                    {order.isPreOrder && (
                      <div className="text-xs text-slate-600 font-medium">
                        Đã cọc: <strong className="text-emerald-700 font-bold font-mono">{formatVND(order.depositAmount || 0)}</strong> • Còn lại: <span className="text-slate-700 font-bold font-mono">{formatVND(order.remainingBalance || 0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRejectLargeOrder(order.id)}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Từ Chối</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveLargeOrder(order.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>Phê Duyệt Xuất Kho</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3 Revenue Stream Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-cyan-600" />
          <span>Phân Tách Doanh Thu 3 Mảng Kinh Doanh Cốt Lõi</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stream 1: New Phones */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-700 uppercase tracking-wide">1. Điện Thoại Mới (IMEI)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                100% Nguyên Seal
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVND(
                invoices.reduce((sum, inv) => {
                  const phoneTotal = inv.items
                    .filter((i) => i.type === 'phone')
                    .reduce((pSum, p) => pSum + p.total, 0);
                  return sum + phoneTotal;
                }, 0)
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Quản lý chính xác từng cây theo IMEI, kích hoạt bảo hành tức thì.
            </p>
            <Link
              href="/admin/inventory/phones"
              className="text-xs text-cyan-700 hover:text-cyan-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              <span>Xem kho máy mới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stream 2: Accessories */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">2. Phụ Kiện Chính Hãng</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Mã Barcode
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVND(
                invoices.reduce((sum, inv) => {
                  const accTotal = inv.items
                    .filter((i) => i.type === 'accessory')
                    .reduce((aSum, a) => aSum + a.total, 0);
                  return sum + accTotal;
                }, 0)
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Củ sạc GaN 65W, Pin MagSafe, Kính KingKong bán kèm giảm 15%.
            </p>
            <Link
              href="/admin/inventory/accessories"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              <span>Xem kho phụ kiện</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Stream 3: Repair Service */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-700 uppercase tracking-wide">3. Dịch Vụ Sửa Chữa (iCare)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-800 font-bold border border-amber-200">
                Mã QR Phiếu
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatVND(repairRevenue)}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Xuất linh kiện trừ kho, khách quét QR xem tiến độ 6 bước trực tiếp.
            </p>
            <Link
              href="/admin/repairs"
              className="text-xs text-amber-700 hover:text-amber-800 font-bold inline-flex items-center gap-1 pt-1"
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
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Hóa Đơn Bán Hàng Gần Nhất</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportInvoicesCsv(invoices)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold transition-colors"
                title="Xuất Excel danh sách hóa đơn"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span>Xuất Excel</span>
              </button>
              <Link href="/admin/pos" className="text-xs text-cyan-700 font-bold hover:underline">
                Vào POS ↗
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-700">{inv.invoiceCode}</span>
                    <span className="font-bold text-slate-900">{inv.customerName}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{inv.createdAt}</span>
                </div>

                <div className="text-right">
                  <span className="font-black text-amber-700 block text-sm font-mono">{formatVND(inv.totalAmount)}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{inv.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Repair Tickets */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Tiến Độ Phiếu Sửa Chữa Tại Quầy</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportRepairsCsv(repairs)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold transition-colors"
                title="Xuất Excel danh sách phiếu sửa"
              >
                <Download className="w-3 h-3 text-amber-600" />
                <span>Xuất Excel</span>
              </button>
              <Link href="/admin/repairs" className="text-xs text-amber-700 font-bold hover:underline">
                Xử lý phiếu ↗
              </Link>
            </div>
          </div>

          <div className="space-y-2.5">
            {repairs.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700">{t.ticketCode}</span>
                    <span className="font-bold text-slate-900">{t.deviceModel}</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Khách: {t.customerName} ({t.customerPhone})
                  </span>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 block mb-1">
                    {t.status === 'received' && 'Tiếp nhận'}
                    {t.status === 'inspecting' && 'Kiểm tra'}
                    {t.status === 'repairing' && 'Đang sửa'}
                    {t.status === 'qc_checking' && 'QC xuất xưởng'}
                    {t.status === 'ready_for_pickup' && 'Sẵn sàng giao'}
                    {t.status === 'delivered' && 'Đã giao'}
                  </span>
                  <span className="font-black text-slate-900 font-mono">{formatVND(t.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
