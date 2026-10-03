'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Store,
  ShieldAlert,
  X,
  Download,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { CashbookEntry, Role, Invoice, RepairTicket } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { exportCashbookCsv } from '@/lib/exportUtils';

export default function AdminCashbookPage() {
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);

  const [typeFilter, setTypeFilter] = useState<'all' | 'receipt' | 'payment'>('all');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New manual entry form
  const [entryType, setEntryType] = useState<'receipt' | 'payment'>('receipt');
  const [category, setCategory] = useState<string>('other');
  const [categoryLabel, setCategoryLabel] = useState('Khoản thu khác');
  const [amount, setAmount] = useState<number>(1000000);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setEntries(IShopStore.getCashbook());
    setRole(IShopStore.getRole());
    setInvoices(IShopStore.getInvoices());
    setRepairs(IShopStore.getRepairs());

    // Sync from MySQL database
    fetch('/api/cashbook')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEntries(json.data);
        }
      })
      .catch((err) => console.warn('Cashbook API notice:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  // Gross profit calculation by 3 branches
  // Branch 1: Phones
  let phoneRevenue = 0;
  let phoneCost = 0;
  // Branch 2: Accessories
  let accRevenue = 0;
  let accCost = 0;

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (item.type === 'phone') {
        phoneRevenue += item.total;
        phoneCost += (item.costPrice || 0) * item.quantity;
      } else if (item.type === 'accessory') {
        accRevenue += item.total;
        accCost += (item.costPrice || 0) * item.quantity;
      }
    });
  });

  const phoneGrossProfit = phoneRevenue - phoneCost;
  const accGrossProfit = accRevenue - accCost;

  // Branch 3: Repairs
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
  const repairGrossProfit = repairRevenue - repairPartsCost;

  const totalStoreGrossProfit = phoneGrossProfit + accGrossProfit + repairGrossProfit;

  // Totals for cashbook
  const totalReceipts = entries
    .filter((e) => e.type === 'receipt')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = entries
    .filter((e) => e.type === 'payment')
    .reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalReceipts - totalPayments;

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    const label =
      category === 'rent_utilities'
        ? 'Tiền thuê & Tiện ích'
        : category === 'salary'
        ? 'Lương nhân viên'
        : categoryLabel;

    // 1. Post to live MySQL Database
    try {
      await fetch('/api/cashbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          category,
          categoryLabel: label,
          amount,
          paymentMethod,
          description,
          creator: role === 'admin' ? 'Lê Huy Hoàng (Chủ Shop)' : 'Kế toán',
        }),
      });
    } catch (err) {
      console.warn('API cashbook error:', err);
    }

    // 2. Also save to client store for immediate reactivity
    IShopStore.addCashbookEntry({
      type: entryType,
      category: category as any,
      categoryLabel: label,
      amount,
      paymentMethod,
      description,
      creator: role === 'admin' ? 'Lê Huy Hoàng (Chủ Shop)' : 'Kế toán',
    });

    setIsAddModalOpen(false);
    setDescription('');
    loadData();
  };

  const filtered = entries
    .filter((e) => (typeFilter === 'all' ? true : e.type === typeFilter))
    .filter(
      (e) =>
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.referenceCode && e.referenceCode.toLowerCase().includes(search.toLowerCase()))
    );

  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            TRUY CẬP BỊ GIỚI HẠN (RBAC SECURITY)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Chỉ Chủ Cửa Hàng Mới Được Xem Sổ Thu Chi
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Phân hệ <strong>Sổ Quỹ Thu - Chi</strong> và <strong>Báo Cáo Lợi Nhuận Gộp</strong> chứa dữ liệu tài chính mật của doanh nghiệp. Bạn đang đăng nhập với vai trò{' '}
            <strong className="text-amber-400 uppercase font-mono">
              {role === 'cashier' ? 'Thu Ngân (Cashier)' : 'Kỹ Thuật Viên (Technician)'}
            </strong>.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 max-w-md mx-auto text-xs text-left text-gray-300 space-y-2.5 shadow-xl">
          <div className="flex items-center gap-2 font-bold text-white">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Chính sách phân quyền bảo mật iShop 2026:</span>
          </div>
          <p className="text-gray-400 leading-relaxed text-[11px]">
            • <strong className="text-cyan-300">Thu ngân:</strong> Bán hàng tại quầy POS, tạo phiếu thu bán hàng, bảo mật ẩn hoàn toàn giá vốn, sổ quỹ và lợi nhuận gộp.
            <br />
            • <strong className="text-purple-300">Kỹ thuật viên:</strong> Tiếp nhận sửa chữa và xuất kho linh kiện thay thế.
            <br />
            • <strong className="text-amber-300">Chủ cửa hàng (Admin):</strong> Toàn quyền đối soát dòng tiền thu - chi, giá vốn nhập hàng và lợi nhuận ròng.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {role === 'cashier' ? (
            <Link
              href="/admin/pos"
              className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <span>Vào Bàn Bán Hàng (POS)</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </Link>
          ) : (
            <Link
              href="/admin/repairs"
              className="btn-gold px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <span>Vào Bàn Sửa Chữa (iCare)</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </Link>
          )}

          <Link
            href="/admin"
            className="px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
          >
            Quay Về Cockpit
          </Link>

          <button
            onClick={() => {
              IShopStore.setRole('admin');
              setRole('admin');
            }}
            className="px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            title="Dành cho kiểm thử hệ thống"
          >
            Chuyển Sang Quyền Chủ Shop (Admin)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase">Phân hệ Kế Toán</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Tài Chính & Lợi Nhuận Gộp 3 Mảng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>Sổ Quỹ Tiền Mặt / Ngân Hàng & Báo Cáo Lợi Nhuận Gộp</span>
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Lập Phiếu Thu / Chi Ngoài Hệ Thống</span>
        </button>
      </div>

      {/* 3-SOURCE GROSS PROFIT REPORT (BÁO CÁO LÃI GỘP 3 MẢNG KINH DOANH) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Báo Cáo Lợi Nhuận Gộp Phân Tách 3 Mảng (Tự Động Trừ Giá Vốn)</span>
          </h2>
          {isCashier && (
            <span className="text-xs text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" /> Thu ngân bị ẩn thông tin lợi nhuận gộp
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Phone Profit */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-blue-400 uppercase block">1. Điện Thoại Mới</span>
            <div className="text-xl font-extrabold text-white">
              {isCashier ? '***' : formatVND(phoneGrossProfit)}
            </div>
            <div className="text-[11px] text-gray-400 space-y-0.5 pt-1 border-t border-white/5">
              <div className="flex justify-between">
                <span>Doanh thu:</span>
                <span>{formatVND(phoneRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Giá vốn:</span>
                <span>{isCashier ? '***' : `-${formatVND(phoneCost)}`}</span>
              </div>
            </div>
          </div>

          {/* Accessory Profit */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase block">2. Phụ Kiện Chính Hãng</span>
            <div className="text-xl font-extrabold text-white">
              {isCashier ? '***' : formatVND(accGrossProfit)}
            </div>
            <div className="text-[11px] text-gray-400 space-y-0.5 pt-1 border-t border-white/5">
              <div className="flex justify-between">
                <span>Doanh thu:</span>
                <span>{formatVND(accRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Giá vốn:</span>
                <span>{isCashier ? '***' : `-${formatVND(accCost)}`}</span>
              </div>
            </div>
          </div>

          {/* Repair Service Profit */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase block">3. Dịch Vụ Sửa Chữa</span>
            <div className="text-xl font-extrabold text-white">
              {isCashier ? '***' : formatVND(repairGrossProfit)}
            </div>
            <div className="text-[11px] text-gray-400 space-y-0.5 pt-1 border-t border-white/5">
              <div className="flex justify-between">
                <span>Doanh thu sửa:</span>
                <span>{formatVND(repairRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vốn linh kiện:</span>
                <span>{isCashier ? '***' : `-${formatVND(repairPartsCost)}`}</span>
              </div>
            </div>
          </div>

          {/* TOTAL STORE GROSS PROFIT */}
          <div className="glass-panel rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-tr from-emerald-500/[0.12] to-transparent space-y-2">
            <span className="text-xs font-black text-emerald-300 uppercase block">
              TỔNG LỢI NHUẬN GỘP
            </span>
            <div className="text-2xl font-black text-emerald-400">
              {isCashier ? '*** Bảo Mật ***' : formatVND(totalStoreGrossProfit)}
            </div>
            <p className="text-[11px] text-gray-300 pt-1 border-t border-white/10">
              Lãi gộp thuần túy sau khi trừ toàn bộ giá vốn máy, phụ kiện và linh kiện sửa chữa.
            </p>
          </div>
        </div>
      </div>

      {/* CASHBOOK SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Tổng Thu (Phiếu Thu PT):</span>
            <span className="text-xl font-bold text-emerald-400">{formatVND(totalReceipts)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Tổng Chi (Phiếu Chi PC):</span>
            <span className="text-xl font-bold text-rose-400">{formatVND(totalPayments)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Tồn Quỹ Thực Tế Hiện Tại:</span>
            <span className="text-xl font-bold text-white">{formatVND(netCashFlow)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Type Filter for Cashbook Entries */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã chứng từ (PT-xxxx, PC-xxxx), mã tham chiếu, diễn giải..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              typeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTypeFilter('receipt')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              typeFilter === 'receipt' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Phiếu Thu (+)
          </button>
          <button
            onClick={() => setTypeFilter('payment')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              typeFilter === 'payment' ? 'bg-rose-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Phiếu Chi (-)
          </button>

          <button
            onClick={() => exportCashbookCsv(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all shadow-sm ml-auto"
            title="Xuất danh sách sổ quỹ ra file Excel CSV chuẩn tiếng Việt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Cashbook Entries Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Mã Phiếu & Thời Gian</th>
                <th className="p-4">Loại Chứng Từ</th>
                <th className="p-4">Nội Dung Diễn Giải</th>
                <th className="p-4">Tham Chiếu</th>
                <th className="p-4">Hình Thức</th>
                <th className="p-4 text-right">Số Tiền Thu / Chi</th>
                <th className="p-4">Người Lập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono">
                    <span
                      className={`font-bold block ${
                        entry.type === 'receipt' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {entry.code}
                    </span>
                    <span className="text-[10px] text-gray-500">{entry.date}</span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        entry.type === 'receipt'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {entry.type === 'receipt' ? 'Thu' : 'Chi'} • {entry.categoryLabel}
                    </span>
                  </td>

                  <td className="p-4 font-medium text-white max-w-xs">{entry.description}</td>

                  <td className="p-4 font-mono text-xs text-blue-400">
                    {entry.referenceCode || '-'}
                  </td>

                  <td className="p-4 text-gray-300 text-xs">
                    {entry.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                  </td>

                  <td
                    className={`p-4 text-right font-black text-sm ${
                      entry.type === 'receipt' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {entry.type === 'receipt' ? '+' : '-'}
                    {formatVND(entry.amount)}
                  </td>

                  <td className="p-4 text-gray-400 text-xs">{entry.creator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121826] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">Lập Phiếu Thu / Chi Mới</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryType('receipt')}
                  className={`py-2 rounded-xl border font-bold ${
                    entryType === 'receipt'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Phiếu Thu (+)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('payment')}
                  className={`py-2 rounded-xl border font-bold ${
                    entryType === 'payment'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  Phiếu Chi (-)
                </button>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Khoản mục:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#0e1422] border border-white/10 rounded-xl text-white"
                >
                  <option value="rent_utilities">Tiền thuê mặt bằng, điện nước</option>
                  <option value="salary">Lương, phụ cấp nhân viên</option>
                  <option value="marketing">Quảng cáo, marketing</option>
                  <option value="other">Khoản thu / chi khác</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Số tiền (VND) *:</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 font-bold text-base"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Phương thức:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-[#0e1422] border border-white/10 rounded-xl text-white"
                >
                  <option value="cash">Tiền mặt tại quỹ</option>
                  <option value="transfer">Chuyển khoản ngân hàng</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Nội dung diễn giải *:</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Diễn giải chi tiết lý do thu/chi..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
                >
                  Lưu Vào Sổ Quỹ
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
