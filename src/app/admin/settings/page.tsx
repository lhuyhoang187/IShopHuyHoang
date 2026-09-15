'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  UserCheck,
  Printer,
  RotateCcw,
  CheckCircle2,
  Lock,
  Eye,
  Store,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Role } from '@/lib/types';

export default function AdminSettingsPage() {
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [storeInfo, setStoreInfo] = useState({
    name: 'iShop Huy Hoàng - Apple & Smartphone Premium',
    address: '168 Đường 3/2, Quận 10 & 45 Lê Văn Việt, TP. Thủ Đức',
    hotline: '0988.888.999',
    returnPolicy: 'Bảo hành 12 tháng máy mới / 1 đổi 1 trong 30 ngày đầu.',
    receiptFooter: 'Cảm ơn quý khách đã tin tưởng và ủng hộ iShop Huy Hoàng!',
  });

  useEffect(() => {
    setCurrentRole(IShopStore.getRole());
  }, []);

  const handleRoleChange = (role: Role) => {
    IShopStore.setRole(role);
    setCurrentRole(role);
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc muốn khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
      IShopStore.resetAllData();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
      window.location.reload();
    }
  };

  const permissions = [
    { module: 'Bán Hàng POS & In Bill Nhiệt K80/A5', admin: true, tech: false, cashier: true },
    { module: 'Tiếp Nhận Sửa Chữa & Xuất Kho Linh Kiện', admin: true, tech: true, cashier: false },
    { module: 'Xem Giá Vốn Máy Mới & Linh Kiện', admin: true, tech: false, cashier: false },
    { module: 'Xem Báo Cáo Lợi Nhuận Gộp 3 Mảng', admin: true, tech: false, cashier: false },
    { module: 'Nhập Lô IMEI Từ Nhà Cung Cấp & Ghi Nợ', admin: true, tech: false, cashier: false },
    { module: 'Quản Lý Sổ Quỹ Thu - Chi Toàn Cửa Hàng', admin: true, tech: false, cashier: false },
    { module: 'Chỉnh Sửa Cấu Hình & Mẫu In Bill', admin: true, tech: false, cashier: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">Phân hệ Hệ Thống</span>
          <span className="text-gray-500">•</span>
          <span className="text-xs text-gray-400">Cấu Hình & Bảo Mật</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
          <Settings className="w-6 h-6 text-gray-300" />
          <span>Cấu Hình Cửa Hàng, Phân Quyền (RBAC) & Mẫu In Hóa Đơn</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Kế thừa cơ chế bảo mật doanh nghiệp thực tế: Ẩn giá vốn đối với thu ngân, phân tách quyền kỹ thuật viên.
        </p>
      </div>

      {/* 1. Quick Switch Current Role */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>1. Chọn Vai Trò Làm Việc Hiện Tại (Role Switcher)</span>
          </h2>
          <span className="text-xs text-emerald-400 font-semibold">
            Đang kích hoạt: {currentRole.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => handleRoleChange('admin')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
              currentRole === 'admin'
                ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/10'
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">👑 Chủ Shop (Admin)</span>
              {currentRole === 'admin' && <span className="text-xs text-rose-400 font-bold">Đang dùng</span>}
            </div>
            <p className="text-xs text-gray-400">
              Toàn quyền hệ thống: xem giá vốn, lãi gộp, sửa giá, chi sổ quỹ và phân quyền.
            </p>
          </div>

          <div
            onClick={() => handleRoleChange('technician')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
              currentRole === 'technician'
                ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">🔧 Kỹ Thuật Viên (Repair)</span>
              {currentRole === 'technician' && <span className="text-xs text-amber-400 font-bold">Đang dùng</span>}
            </div>
            <p className="text-xs text-gray-400">
              Xử lý bàn sửa chữa, xuất linh kiện từ kho, cập nhật 6 bước và in phiếu có QR.
            </p>
          </div>

          <div
            onClick={() => handleRoleChange('cashier')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
              currentRole === 'cashier'
                ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10'
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">🛒 Thu Ngân / Bán Hàng</span>
              {currentRole === 'cashier' && <span className="text-xs text-blue-400 font-bold">Đang dùng</span>}
            </div>
            <p className="text-xs text-gray-400">
              Bán hàng POS theo IMEI & Barcode, ẩn hoàn toàn giá vốn và lợi nhuận để bảo mật.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Permission Matrix Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400" />
          <span>2. Ma Trận Phân Quyền Chi Tiết (Role-Based Access Control)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
              <tr>
                <th className="p-3">Phân Hệ Chức Năng</th>
                <th className="p-3 text-center text-rose-400">Chủ Shop (Admin)</th>
                <th className="p-3 text-center text-amber-400">Kỹ Thuật Viên</th>
                <th className="p-3 text-center text-blue-400">Thu Ngân / Bán Hàng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-semibold text-white">{p.module}</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                  </td>
                  <td className="p-3 text-center">
                    {p.tech ? (
                      <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                    ) : (
                      <span className="text-gray-500">✕ Khóa</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {p.cashier ? (
                      <span className="text-emerald-400 font-bold">✓ Cho phép</span>
                    ) : (
                      <span className="text-gray-500">✕ Ẩn/Khóa</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Receipt Template Customization */}
      <form onSubmit={handleSaveStoreInfo} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>3. Tùy Chỉnh Thông Tin In Hóa Đơn Nhiệt K80 & Biên Nhận</span>
          </h2>
          {savedSuccess && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã lưu cài đặt!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Tên cửa hàng in trên bill:</label>
            <input
              type="text"
              value={storeInfo.name}
              onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Hotline in trên bill:</label>
            <input
              type="text"
              value={storeInfo.hotline}
              onChange={(e) => setStoreInfo({ ...storeInfo, hotline: e.target.value })}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-300 font-semibold mb-1 block">Địa chỉ showroom in trên bill:</label>
          <input
            type="text"
            value={storeInfo.address}
            onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
            className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Chính sách bảo hành / Đổi trả:</label>
            <input
              type="text"
              value={storeInfo.returnPolicy}
              onChange={(e) => setStoreInfo({ ...storeInfo, returnPolicy: e.target.value })}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-gray-300 font-semibold mb-1 block">Lời cảm ơn chân trang:</label>
            <input
              type="text"
              value={storeInfo.receiptFooter}
              onChange={(e) => setStoreInfo({ ...storeInfo, receiptFooter: e.target.value })}
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg"
          >
            Lưu Thông Tin Mẫu In
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi Phục Dữ Liệu Gốc</span>
          </button>
        </div>
      </form>
    </div>
  );
}
