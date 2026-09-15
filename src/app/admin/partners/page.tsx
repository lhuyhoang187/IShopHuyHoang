'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  Search,
  DollarSign,
  Plus,
  CheckCircle2,
  Phone,
  MapPin,
  X,
  CreditCard,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Customer, Supplier } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');

  // Pay Debt Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('transfer');

  const loadData = () => {
    setCustomers(IShopStore.getCustomers());
    setSuppliers(IShopStore.getSuppliers());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;

    IShopStore.paySupplierDebt(selectedSupplier.id, payAmount, payMethod);
    setSelectedSupplier(null);
    setPayAmount(0);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search.trim())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search.trim()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-400 uppercase">Phân hệ Đối Tác</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Khách Hàng & Nhà Phân Phối</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Quản Lý Đối Tác: Khách Hàng Tích Điểm & Nhà Cung Cấp</span>
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách Hàng ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Nhà Cung Cấp & Công Nợ ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'customers'
                ? 'Tìm kiếm theo tên khách hàng, số điện thoại...'
                : 'Tìm kiếm theo tên nhà phân phối, người liên hệ, SĐT...'
            }
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Tab 1: Customers Table */}
      {activeTab === 'customers' ? (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="p-4">Họ & Tên Khách Hàng</th>
                  <th className="p-4">Số Điện Thoại</th>
                  <th className="p-4">Địa Chỉ</th>
                  <th className="p-4 text-right">Tổng Chi Tiêu</th>
                  <th className="p-4 text-center">Điểm Tích Lũy</th>
                  <th className="p-4 text-center">Lịch Sử Mua / Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white block">{cust.name}</span>
                      <span className="text-[11px] text-gray-500">Gia nhập: {cust.createdAt}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-blue-400">{cust.phone}</td>
                    <td className="p-4 text-gray-400">{cust.address || 'Chưa cập nhật'}</td>
                    <td className="p-4 text-right font-black text-amber-400">
                      {formatVND(cust.totalSpent)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {cust.points} Điểm
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs text-gray-300">
                      <span className="block">{cust.purchaseCount} đơn mua máy</span>
                      <span className="text-gray-500">{cust.repairCount} lần sửa chữa</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Suppliers & Debts Table */
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="p-4">Nhà Cung Cấp / Đối Tác</th>
                  <th className="p-4">Người Đại Diện & SĐT</th>
                  <th className="p-4">Địa Chỉ Trụ Sở</th>
                  <th className="p-4 text-right">Tổng Tiền Đã Nhập</th>
                  <th className="p-4 text-right">Công Nợ Hiện Tại</th>
                  <th className="p-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white block text-sm">{sup.name}</span>
                      <span className="text-[11px] text-gray-400">{sup.email}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-white block">{sup.contactPerson}</span>
                      <span className="text-xs text-blue-400 font-mono">{sup.phone}</span>
                    </td>

                    <td className="p-4 text-gray-400 text-xs">{sup.address}</td>

                    <td className="p-4 text-right font-bold text-white">
                      {formatVND(sup.totalPurchased)}
                    </td>

                    <td className="p-4 text-right">
                      {sup.currentDebt > 0 ? (
                        <span className="font-black text-rose-400 text-sm block">
                          {formatVND(sup.currentDebt)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">
                          ✓ Đã thanh toán hết
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {sup.currentDebt > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedSupplier(sup);
                            setPayAmount(sup.currentDebt);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
                        >
                          Trả Nợ NCC
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121826] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">Thanh Toán Công Nợ Nhà Cung Cấp</h3>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayDebt} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-gray-400">Nhà cung cấp:</span>
                <p className="text-sm font-bold text-white">{selectedSupplier.name}</p>
                <p className="text-rose-400 font-semibold">
                  Số tiền còn nợ: {formatVND(selectedSupplier.currentDebt)}
                </p>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">
                  Số tiền thanh toán đợt này (VND) *:
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  max={selectedSupplier.currentDebt}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-base text-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">
                  Phương thức thanh toán:
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-[#0e1422] border border-white/10 rounded-xl text-white"
                >
                  <option value="transfer">Chuyển khoản ngân hàng (Ủy nhiệm chi)</option>
                  <option value="cash">Tiền mặt tại quầy</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
                >
                  Xác Nhận Xuất Quỹ Trả Nợ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
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
