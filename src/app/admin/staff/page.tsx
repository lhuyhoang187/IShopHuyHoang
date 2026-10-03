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
        // Now if admin chose a specific role directly, update it
        if (newRole !== 'pending' && json.data?.id) {
          await fetch('/api/admin/staff', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: json.data.id, role: newRole }),
          });
        }

        setIsAddModalOpen(false);
        setNewName('');
        setNewUsername('');
        setStatusMessage(`Đã tạo tài khoản nhân viên ${newName} thành công!`);
        loadStaff();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.error || 'Lỗi tạo nhân viên');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RBAC Access Gate: Strictly Admin Only
  if (currentRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            KHU VỰC BẢO MẬT TỐI CAO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Chỉ Chủ Cửa Hàng Mới Có Quyền Phân Bổ Nhân Sự
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Chỉ tài khoản Chủ Shop (Admin) mới có thẩm quyền xét duyệt, cấp quyền hạn nhân viên và quản trị nhân sự nội bộ.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10"
        >
          Quay lại Bảng điều khiển
        </Link>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 uppercase">Hệ Thống Phân Quyền RBAC</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Do Chủ Shop Quản Trị Trực Tiếp</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2.5 mt-1">
            <Users className="w-7 h-7 text-amber-400" />
            <span>Quản Lý Nhân Viên & Phê Duyệt Cấp Quyền</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Nhân viên mới đăng ký tài khoản cần được Chủ Shop phê duyệt và phân quyền trước khi được phép đăng nhập làm việc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStaff}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-gold px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-white/10 space-y-1">
          <span className="text-gray-400 text-xs">Tổng nhân sự:</span>
          <p className="text-2xl font-black text-white">{staffList.length}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Chờ duyệt quyền:</span>
          </span>
          <p className="text-2xl font-black text-amber-300">{pendingStaff.length}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/20 space-y-1">
          <span className="text-cyan-400 text-xs">Thu ngân (POS):</span>
          <p className="text-2xl font-black text-cyan-300">
            {staffList.filter((s) => s.role === 'cashier').length}
          </p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-purple-500/20 space-y-1">
          <span className="text-purple-400 text-xs">Kỹ thuật viên iCare:</span>
          <p className="text-2xl font-black text-purple-300">
            {staffList.filter((s) => s.role === 'technician').length}
          </p>
        </div>
      </div>

      {/* PENDING APPROVAL SECTION */}
      {pendingStaff.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Có {pendingStaff.length} nhân viên mới đang chờ bạn phê duyệt cấp quyền!
              </h2>
              <p className="text-xs text-gray-300">
                Hãy lựa chọn vai trò phân quyền phù hợp để nhân viên có thể đăng nhập vào làm việc.
              </p>
            </div>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            {pendingStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{staff.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Username: <strong className="text-amber-300">{staff.username}</strong> • Tạo lúc: {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Chờ Chủ Shop Cấp Quyền
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'cashier')}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all"
                  >
                    ✓ Cấp quyền Thu Ngân
                  </button>
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'technician')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all"
                  >
                    ✓ Cấp quyền Kỹ Thuật Viên
                  </button>
                  <button
                    onClick={() => handleUpdateRole(staff.id, 'admin')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition-all"
                  >
                    ★ Cấp quyền Quản Trị
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                    className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold"
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
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhân viên theo họ tên hoặc username..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <span className="text-xs text-gray-400">
            Hiển thị {filtered.length} nhân sự
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101d] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Nhân Viên</th>
                <th className="p-4">Tài Khoản (Username)</th>
                <th className="p-4">Vai Trò Hiện Tại</th>
                <th className="p-4">Ngày Tham Gia</th>
                <th className="p-4 text-right">Điều Chỉnh Phân Quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((staff) => {
                const isSuperAdmin = staff.username === 'admin';
                return (
                  <tr key={staff.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-300">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <span>{staff.name}</span>
                        {isSuperAdmin && (
                          <span className="text-[10px] text-amber-400 font-normal block font-mono">
                            ★ Chủ Cửa Hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-gray-300 font-semibold">{staff.username}</td>
                    <td className="p-4">
                      {staff.role === 'admin' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Chủ Shop (Toàn Quyền)
                        </span>
                      ) : staff.role === 'cashier' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Thu Ngân (POS)
                        </span>
                      ) : staff.role === 'technician' ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Kỹ Thuật Viên (iCare)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          Chờ Duyệt Quyền
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      {isSuperAdmin ? (
                        <span className="text-gray-500 italic text-[11px]">Không thể thay đổi</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={staff.role}
                            onChange={(e) => handleUpdateRole(staff.id, e.target.value as Role)}
                            className="p-1.5 bg-[#0e1422] border border-white/10 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                          >
                            <option value="cashier">Thu Ngân (Cashier)</option>
                            <option value="technician">Kỹ Thuật Viên (Technician)</option>
                            <option value="admin">Quản Trị Viên (Admin)</option>
                            <option value="pending">Khóa / Chờ Duyệt (Pending)</option>
                          </select>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121826] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="font-bold text-white text-lg">Tạo Tài Khoản Nhân Viên Mới</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Họ và tên nhân viên *:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Tên đăng nhập (Username) *:</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="VD: tranbinh"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Mật khẩu ban đầu *:</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Cấp quyền ngay cho nhân viên:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full p-3 rounded-xl bg-[#0d1320] border border-white/10 text-white focus:outline-none focus:border-amber-400"
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
                  className="flex-1 py-3 rounded-xl btn-gold text-xs font-black"
                >
                  Xác Nhận Tạo Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
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
