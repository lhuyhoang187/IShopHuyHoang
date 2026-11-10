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
  Building2,
  Mail,
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
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Phân hệ Đối Tác</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Khách Hàng &amp; Nhà Phân Phối</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Quản Lý Đối Tác: Khách Hàng Tích Điểm &amp; Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Theo dõi chi tiêu, điểm tích lũy khách hàng thân thiết và quản trị công nợ nhà phân phối linh kiện, máy mới.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách Hàng ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Nhà Cung Cấp &amp; Công Nợ ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'customers'
                ? 'Tìm kiếm theo tên khách hàng, số điện thoại...'
                : 'Tìm kiếm theo tên nhà phân phối, người liên hệ, SĐT...'
            }
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Tab 1: Customers Table */}
      {activeTab === 'customers' ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 sm:p-5">Họ &amp; Tên Khách Hàng</th>
                  <th className="p-4 sm:p-5">Số Điện Thoại</th>
                  <th className="p-4 sm:p-5">Địa Chỉ</th>
                  <th className="p-4 sm:p-5 text-right">Tổng Chi Tiêu</th>
                  <th className="p-4 sm:p-5 text-center">Điểm Tích Lũy</th>
                  <th className="p-4 sm:p-5 text-center">Lịch Sử Mua / Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                      <span className="text-[11px] text-slate-500">Gia nhập: {cust.createdAt}</span>
                    </td>
                    <td className="p-4 sm:p-5 font-mono font-bold text-blue-600">{cust.phone}</td>
                    <td className="p-4 sm:p-5 text-slate-600">{cust.address || 'Chưa cập nhật'}</td>
                    <td className="p-4 sm:p-5 text-right font-black text-slate-900 font-mono">
                      {formatVND(cust.totalSpent)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {cust.points} Điểm
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-center text-xs text-slate-700">
                      <span className="block font-semibold">{cust.purchaseCount} đơn mua máy</span>
                      <span className="text-slate-500">{cust.repairCount} lần sửa chữa</span>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">
                      Không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Suppliers & Debts Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 sm:p-5">Nhà Cung Cấp / Đối Tác</th>
                  <th className="p-4 sm:p-5">Người Đại Diện &amp; SĐT</th>
                  <th className="p-4 sm:p-5">Địa Chỉ Trụ Sở</th>
                  <th className="p-4 sm:p-5 text-right">Tổng Tiền Đã Nhập</th>
                  <th className="p-4 sm:p-5 text-right">Công Nợ Hiện Tại</th>
                  <th className="p-4 sm:p-5 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-slate-900 block text-sm">{sup.name}</span>
                      <span className="text-[11px] text-slate-500">{sup.email}</span>
                    </td>

                    <td className="p-4 sm:p-5">
                      <span className="font-semibold text-slate-800 block">{sup.contactPerson}</span>
                      <span className="text-xs text-blue-600 font-mono font-bold">{sup.phone}</span>
                    </td>

                    <td className="p-4 sm:p-5 text-slate-600 text-xs">{sup.address}</td>

                    <td className="p-4 sm:p-5 text-right font-black text-slate-900 font-mono">
                      {formatVND(sup.totalPurchased)}
                    </td>

                    <td className="p-4 sm:p-5 text-right">
                      {sup.currentDebt > 0 ? (
                        <span className="font-black text-rose-600 text-sm font-mono block">
                          {formatVND(sup.currentDebt)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ✓ Đã thanh toán hết
                        </span>
                      )}
                    </td>

                    <td className="p-4 sm:p-5 text-center">
                      {sup.currentDebt > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedSupplier(sup);
                            setPayAmount(sup.currentDebt);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          Trả Nợ NCC
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">
                      Không tìm thấy nhà cung cấp nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Thanh Toán Công Nợ Nhà Cung Cấp</h3>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayDebt} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold">Nhà cung cấp:</span>
                <p className="text-sm font-black text-slate-900">{selectedSupplier.name}</p>
                <p className="text-rose-600 font-bold font-mono text-xs">
                  Số tiền còn nợ: {formatVND(selectedSupplier.currentDebt)}
                </p>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Số tiền thanh toán đợt này (VND) *:
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  max={selectedSupplier.currentDebt}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black text-base font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Phương thức thanh toán:
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="transfer">Chuyển khoản ngân hàng (Ủy nhiệm chi)</option>
                  <option value="cash">Tiền mặt tại quầy</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Xác Nhận Xuất Quỹ Trả Nợ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
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
