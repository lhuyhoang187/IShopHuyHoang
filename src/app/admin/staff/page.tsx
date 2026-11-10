'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Role } from '@/lib/types';

interface StaffRecord {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar?: string;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New staff modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newRole, setNewRole] = useState<Role>('cashier');

  const loadStaff = async () => {
    setIsLoading(true);
    setCurrentRole(IShopStore.getRole());

    try {
      const res = await fetch('/api/admin/staff');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStaffList(json.data);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleUpdateRole = async (id: string, newRole: Role) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        loadStaff();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.error || 'Lỗi cập nhật quyền');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản của nhân viên "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Đã xóa thành công nhân viên ${name}`);
        loadStaff();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.error || 'Lỗi xóa nhân viên');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) return;

    try {
      const res = await fetch('/api/auth/staff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // If created, automatically set desired role
        if (json.data && json.data.id && newRole !== 'pending') {
          await handleUpdateRole(json.data.id, newRole);
        }
        setStatusMessage(`Đã tạo tài khoản nhân viên ${newName} thành công!`);
        setIsAddModalOpen(false);
        setNewName('');
        setNewUsername('');
        setNewPassword('password123');
        loadStaff();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.error || 'Lỗi tạo nhân viên');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (currentRole !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 text-slate-800">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            KHU VỰC BẢO MẬT
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Chỉ Chủ Cửa Hàng Mới Có Quyền Phân Bổ Nhân Sự
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Chỉ tài khoản Chủ Shop (Admin) mới có thẩm quyền xét duyệt, cấp quyền hạn nhân viên và quản trị nhân sự nội bộ.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-colors"
          >
            Quay lại Bảng điều khiển
          </Link>
        </div>
      </div>
    );
  }

  const pendingStaff = staffList.filter((s) => s.role === 'pending');
  const activeStaff = staffList.filter((s) => s.role !== 'pending');

  const filtered = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Hệ Thống Phân Quyền RBAC</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Do Chủ Shop Quản Trị Trực Tiếp</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Users className="w-6 h-6 text-amber-600" />
            <span>Quản Lý Nhân Viên &amp; Phê Duyệt Cấp Quyền</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Nhân viên mới đăng ký tài khoản cần được Chủ Shop phê duyệt và phân quyền trước khi được phép đăng nhập làm việc.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStaff}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-semibold">Tổng nhân sự:</span>
          <p className="text-2xl font-black text-slate-900">{staffList.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-sm space-y-1">
          <span className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Chờ duyệt quyền:</span>
          </span>
          <p className="text-2xl font-black text-amber-700">{pendingStaff.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-semibold">Thu ngân (POS):</span>
          <p className="text-2xl font-black text-blue-700">
            {staffList.filter((s) => s.role === 'cashier').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-slate-500 text-xs font-semibold">Kỹ thuật viên iCare:</span>
          <p className="text-2xl font-black text-purple-700">
            {staffList.filter((s) => s.role === 'technician').length}
          </p>
        </div>
      </div>

      {/* PENDING APPROVAL SECTION */}
      {pendingStaff.length > 0 && (
        <div className="rounded-3xl p-6 sm:p-7 border border-amber-300 bg-amber-50/70 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-300 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Có {pendingStaff.length} nhân viên mới đang chờ bạn phê duyệt cấp quyền!
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Hãy lựa chọn vai trò phân quyền phù hợp để nhân viên có thể đăng nhập vào làm việc.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200 rounded-2xl bg-white border border-amber-200 overflow-hidden shadow-2xs">
            {pendingStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-sm">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{staff.name}</h3>
                    <p className="text-xs text-slate-600 font-mono">
                      Username: <strong className="text-amber-800 font-bold">{staff.username}</strong> • Tạo lúc: {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Chờ Chủ Shop Cấp Quyền
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'cashier')}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    ✓ Cấp quyền Thu Ngân
                  </button>
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'technician')}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    ✓ Cấp quyền Kỹ Thuật Viên
                  </button>
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'admin')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
                  >
                    ★ Cấp quyền Quản Trị
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="Từ chối / Xóa"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL STAFF TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhân viên theo họ tên hoặc username..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {filtered.length} nhân sự
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
              <tr>
                <th className="p-4 sm:p-5">Nhân Viên</th>
                <th className="p-4 sm:p-5">Tài Khoản (Username)</th>
                <th className="p-4 sm:p-5">Vai Trò Hiện Tại</th>
                <th className="p-4 sm:p-5">Ngày Tham Gia</th>
                <th className="p-4 sm:p-5 text-right">Điều Chỉnh Phân Quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((staff) => {
                const isSuperAdmin = staff.username === 'admin';
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-amber-700">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{staff.name}</span>
                        {isSuperAdmin && (
                          <span className="text-[10px] text-amber-700 font-bold block font-mono">
                            ★ Chủ Cửa Hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 font-mono text-slate-700 font-semibold">{staff.username}</td>
                    <td className="p-4 sm:p-5">
                      {staff.role === 'admin' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          Chủ Shop (Toàn Quyền)
                        </span>
                      ) : staff.role === 'cashier' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Thu Ngân (POS)
                        </span>
                      ) : staff.role === 'technician' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Kỹ Thuật Viên (iCare)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                          Chờ Duyệt Quyền
                        </span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-slate-500 font-mono">
                      {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      {isSuperAdmin ? (
                        <span className="text-slate-400 italic text-[11px]">Không thể thay đổi</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={staff.role}
                            onChange={(e) => handleUpdateRole(staff.id, e.target.value as Role)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="cashier">Thu Ngân (Cashier)</option>
                            <option value="technician">Kỹ Thuật Viên (Technician)</option>
                            <option value="admin">Quản Trị Viên (Admin)</option>
                            <option value="pending">Khóa / Chờ Duyệt (Pending)</option>
                          </select>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Tạo Tài Khoản Nhân Viên Mới</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">Họ và tên nhân viên *:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Tên đăng nhập (Username) *:</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="VD: tranbinh"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Mật khẩu ban đầu *:</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Cấp quyền ngay cho nhân viên:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="cashier">Thu Ngân (Bán hàng POS, ẩn giá vốn, ẩn sổ quỹ)</option>
                  <option value="technician">Kỹ Thuật Viên (iCare sửa chữa, kho linh kiện)</option>
                  <option value="admin">Quản Trị Viên (Toàn quyền)</option>
                  <option value="pending">Chờ Duyệt (Chưa kích hoạt)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  Xác Nhận Tạo Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
