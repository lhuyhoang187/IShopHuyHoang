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
  Edit2,
  Trash2,
  Sparkles,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Customer, Supplier } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { getTierByPoints } from '@/lib/loyalty';

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pay Debt Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('transfer');

  // Customer Modals (Add / Edit)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [custFormPoints, setCustFormPoints] = useState<number>(0);
  const [custFormType, setCustFormType] = useState('Khách lẻ');
  const [custFormNotes, setCustFormNotes] = useState('');

  // Supplier Modals (Add / Edit)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supFormName, setSupFormName] = useState('');
  const [supFormPhone, setSupFormPhone] = useState('');
  const [supFormEmail, setSupFormEmail] = useState('');
  const [supFormAddress, setSupFormAddress] = useState('');
  const [supFormContactPerson, setSupFormContactPerson] = useState('');
  const [supFormInitialDebt, setSupFormInitialDebt] = useState<number>(0);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Customers from MySQL Database
      const custRes = await fetch('/api/customers');
      const custData = await custRes.json();
      if (custData.success && Array.isArray(custData.data)) {
        setCustomers(custData.data);
      } else {
        setCustomers(IShopStore.getCustomers());
      }

      // 2. Fetch Suppliers from MySQL Database
      const supRes = await fetch('/api/suppliers');
      const supData = await supRes.json();
      if (supData.success && Array.isArray(supData.data)) {
        setSuppliers(supData.data);
      } else {
        setSuppliers(IShopStore.getSuppliers());
      }
    } catch (err) {
      console.warn('Partners fetch error:', err);
      setCustomers(IShopStore.getCustomers());
      setSuppliers(IShopStore.getSuppliers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Pay Supplier Debt
  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          amount: payAmount,
          paymentMethod: payMethod,
          creator: 'Lê Huy Hoàng (Chủ Shop)',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Đã thanh toán ${formatVND(payAmount)} cho ${selectedSupplier.name} và hạch toán Sổ Quỹ!`);
        IShopStore.paySupplierDebt(selectedSupplier.id, payAmount, payMethod);
        setSelectedSupplier(null);
        setPayAmount(0);
        loadData();
      } else {
        showToast(json.error || 'Lỗi thanh toán công nợ', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi thanh toán nợ', 'error');
    }
  };

  // Open Customer Modal
  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustFormName('');
    setCustFormPhone('');
    setCustFormEmail('');
    setCustFormAddress('');
    setCustFormPoints(0);
    setCustFormType('Khách lẻ');
    setCustFormNotes('');
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustFormName(cust.name);
    setCustFormPhone(cust.phone);
    setCustFormEmail(cust.email || '');
    setCustFormAddress(cust.address || '');
    setCustFormPoints(cust.points || 0);
    setCustFormType(cust.customerType || 'Khách lẻ');
    setCustFormNotes(cust.notes || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFormName.trim() || !custFormPhone.trim()) {
      showToast('Vui lòng nhập họ tên và số điện thoại', 'error');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer?.id,
          name: custFormName.trim(),
          phone: custFormPhone.trim(),
          email: custFormEmail.trim() || null,
          address: custFormAddress.trim() || null,
          points: custFormPoints,
          customerType: custFormType,
          membershipTier: getTierByPoints(custFormPoints).tier,
          notes: custFormNotes.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(editingCustomer ? 'Đã cập nhật khách hàng thành công!' : 'Đã thêm khách hàng mới thành công!');
        setIsCustomerModalOpen(false);
        loadData();
      } else {
        showToast(json.error || 'Lỗi lưu thông tin khách hàng', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng khi lưu khách hàng', 'error');
    }
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${cust.name}" (${cust.phone}) khỏi hệ thống?`)) return;

    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(cust.id)}&phone=${encodeURIComponent(cust.phone)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Đã xóa khách hàng ${cust.name}!`);
        IShopStore.deleteCustomer(cust.id);
        loadData();
      } else {
        showToast(json.error || 'Lỗi xóa khách hàng', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa khách hàng', 'error');
    }
  };

  // Open Supplier Modal
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupFormName('');
    setSupFormPhone('');
    setSupFormEmail('');
    setSupFormAddress('');
    setSupFormContactPerson('');
    setSupFormInitialDebt(0);
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupFormName(sup.name);
    setSupFormPhone(sup.phone);
    setSupFormEmail(sup.email || '');
    setSupFormAddress(sup.address || '');
    setSupFormContactPerson(sup.contactPerson || '');
    setSupFormInitialDebt(sup.currentDebt || 0);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supFormName.trim()) {
      showToast('Vui lòng nhập tên nhà cung cấp', 'error');
      return;
    }

    try {
      const endpoint = '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      const payload = editingSupplier
        ? {
            id: editingSupplier.id,
            name: supFormName.trim(),
            phone: supFormPhone.trim(),
            email: supFormEmail.trim(),
            address: supFormAddress.trim(),
            contactPerson: supFormContactPerson.trim(),
            currentDebt: supFormInitialDebt,
          }
        : {
            action: 'create',
            name: supFormName.trim(),
            phone: supFormPhone.trim(),
            email: supFormEmail.trim(),
            address: supFormAddress.trim(),
            contactPerson: supFormContactPerson.trim(),
            currentDebt: supFormInitialDebt,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(editingSupplier ? 'Đã cập nhật nhà cung cấp thành công!' : 'Đã thêm nhà cung cấp mới thành công!');
        setIsSupplierModalOpen(false);
        loadData();
      } else {
        showToast(json.error || 'Lỗi lưu nhà cung cấp', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng khi lưu nhà cung cấp', 'error');
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${sup.name}"?`)) return;

    try {
      const res = await fetch(`/api/suppliers?id=${encodeURIComponent(sup.id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Đã xóa nhà cung cấp ${sup.name}!`);
        loadData();
      } else {
        showToast(json.error || 'Lỗi xóa nhà cung cấp', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa nhà cung cấp', 'error');
    }
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Phân hệ Đối Tác</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">CSDL MySQL Thực &amp; Chuẩn Hóa 3NF</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Quản Lý Đối Tác: Khách Hàng Tích Điểm &amp; Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Đồng bộ 100% CSDL MySQL. Quản trị toàn diện danh bạ khách hàng thân thiết, tích lũy điểm và theo dõi công nợ nhà phân phối.
          </p>
        </div>

        {/* Action Buttons & Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'customers' ? (
            <button
              onClick={openAddCustomer}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Khách Hàng</span>
            </button>
          ) : (
            <button
              onClick={openAddSupplier}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Nhà Cung Cấp</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Khách Hàng ({customers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'suppliers'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Nhà Cung Cấp ({suppliers.length})</span>
            </button>
          </div>
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
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Làm mới dữ liệu từ MySQL"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
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
                  <th className="p-4 sm:p-5 text-center">Hạng &amp; Điểm Tích Lũy</th>
                  <th className="p-4 sm:p-5 text-center">Lịch Sử Mua / Sửa</th>
                  <th className="p-4 sm:p-5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {cust.email || (cust.createdAt ? `Gia nhập: ${cust.createdAt.substring(0, 10)}` : 'Khách vãng lai')}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 font-mono font-bold text-blue-600">{cust.phone}</td>
                    <td className="p-4 sm:p-5 text-slate-600 text-xs">{cust.address || 'Chưa cập nhật'}</td>
                    <td className="p-4 sm:p-5 text-right font-black text-slate-900 font-mono">
                      {formatVND(cust.totalSpent || 0)}
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>{cust.points || 0} Điểm</span>
                      </span>
                      <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                        {cust.membershipTier || getTierByPoints(cust.points || 0).tier}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-center text-xs text-slate-700">
                      <span className="block font-semibold">{cust.purchaseCount || 0} đơn mua máy</span>
                      <span className="text-slate-500">{cust.repairCount || 0} lần sửa chữa</span>
                    </td>
                    <td className="p-4 sm:p-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditCustomer(cust)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500 text-xs">
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
                      {formatVND(sup.totalPurchased || 0)}
                    </td>

                    <td className="p-4 sm:p-5 text-right">
                      {(sup.currentDebt || 0) > 0 ? (
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
                      <div className="flex items-center justify-center gap-1.5">
                        {(sup.currentDebt || 0) > 0 && (
                          <button
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setPayAmount(sup.currentDebt);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Trả Nợ
                          </button>
                        )}
                        <button
                          onClick={() => openEditSupplier(sup)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin NCC"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Xóa nhà cung cấp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* Customer Modal (Add / Edit) */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingCustomer ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Thêm Mới Khách Hàng Thân Thiết'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Họ và tên khách hàng *:</label>
                  <input
                    type="text"
                    required
                    value={custFormName}
                    onChange={(e) => setCustFormName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Số điện thoại (10 số) *:</label>
                  <input
                    type="text"
                    required
                    value={custFormPhone}
                    disabled={!!editingCustomer}
                    onChange={(e) => setCustFormPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-purple-500 disabled:opacity-70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Email (Tùy chọn):</label>
                  <input
                    type="email"
                    value={custFormEmail}
                    onChange={(e) => setCustFormEmail(e.target.value)}
                    placeholder="khachhang@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Điểm tích lũy khởi tạo:</label>
                  <input
                    type="number"
                    value={custFormPoints}
                    onChange={(e) => setCustFormPoints(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-amber-700 font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Địa chỉ giao hàng / cư trú:</label>
                <input
                  type="text"
                  value={custFormAddress}
                  onChange={(e) => setCustFormAddress(e.target.value)}
                  placeholder="Số nhà, Tên đường, Quận/Huyện, TP.HCM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Ghi chú khách hàng:</label>
                <textarea
                  rows={2}
                  value={custFormNotes}
                  onChange={(e) => setCustFormNotes(e.target.value)}
                  placeholder="Ghi chú sở thích, nhu cầu đặc biệt..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {editingCustomer ? 'Lưu Thay Đổi' : 'Thêm Khách Hàng Vào CSDL'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal (Add / Edit) */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Mới Nhà Cung Cấp & Đối Tác'}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">Tên Công Ty / Nhà Phân Phối *:</label>
                <input
                  type="text"
                  required
                  value={supFormName}
                  onChange={(e) => setSupFormName(e.target.value)}
                  placeholder="Công Ty CP Phân Phối FPT Synnex..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Người đại diện liên hệ:</label>
                  <input
                    type="text"
                    value={supFormContactPerson}
                    onChange={(e) => setSupFormContactPerson(e.target.value)}
                    placeholder="Nguyễn Văn Đại Diện"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Số điện thoại hotline *:</label>
                  <input
                    type="text"
                    required
                    value={supFormPhone}
                    onChange={(e) => setSupFormPhone(e.target.value)}
                    placeholder="028.7300.6666"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Email nhà cung cấp:</label>
                  <input
                    type="email"
                    value={supFormEmail}
                    onChange={(e) => setSupFormEmail(e.target.value)}
                    placeholder="contact@synnexfpt.com.vn"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Công nợ ban đầu (VND):</label>
                  <input
                    type="number"
                    value={supFormInitialDebt}
                    onChange={(e) => setSupFormInitialDebt(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-rose-600 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Địa chỉ trụ sở / kho hàng:</label>
                <input
                  type="text"
                  value={supFormAddress}
                  onChange={(e) => setSupFormAddress(e.target.value)}
                  placeholder="Tòa nhà FPT, Quận 7, TP.HCM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {editingSupplier ? 'Lưu Thay Đổi' : 'Thêm Nhà Cung Cấp Vào CSDL'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
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
