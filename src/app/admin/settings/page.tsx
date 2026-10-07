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
  Code,
  Send,
  Terminal,
  Radio,
  Loader2,
  Plus,
  Trash2,
  Save,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Role, PermissionItem } from '@/lib/types';

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

  // Webhook Simulator State
  const [testAmount, setTestAmount] = useState('34990000');
  const [testContent, setTestContent] = useState('IShop HD-2608-001');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const handleTestWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/webhook/vietqr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'MBBank Napas 247',
          transactionDate: new Date().toISOString(),
          transferAmount: Number(testAmount),
          content: testContent,
          referenceCode: 'TEST-' + Date.now(),
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch (err: any) {
      setWebhookResult({ error: err.message || 'Lỗi kết nối' });
    } finally {
      setIsSendingWebhook(false);
    }
  };

  // RBAC Permission Matrix State
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [rbacSearch, setRbacSearch] = useState('');
  const [rbacCategory, setRbacCategory] = useState<string>('all');
  const [isDirtyRbac, setIsDirtyRbac] = useState(false);
  const [rbacSuccessMsg, setRbacSuccessMsg] = useState<string | null>(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);

  // New module state
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCategory, setNewModuleCategory] = useState<PermissionItem['category']>('bán hàng');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModuleTech, setNewModuleTech] = useState(false);
  const [newModuleCashier, setNewModuleCashier] = useState(false);

  useEffect(() => {
    setCurrentRole(IShopStore.getRole());
    setPermissions(IShopStore.getPermissionMatrix());

    const handleDataChanged = () => {
      setCurrentRole(IShopStore.getRole());
      setPermissions(IShopStore.getPermissionMatrix());
    };
    window.addEventListener('ishop_data_changed', handleDataChanged);
    return () => window.removeEventListener('ishop_data_changed', handleDataChanged);
  }, []);

  const handleRoleChange = (role: Role) => {
    IShopStore.setRole(role);
    setCurrentRole(role);
  };

  const handleTogglePermission = (id: string, roleKey: 'tech' | 'cashier') => {
    const updated = permissions.map((item) => {
      if (item.id === id) {
        const newVal = !item[roleKey];
        return { ...item, [roleKey]: newVal };
      }
      return item;
    });
    setPermissions(updated);
    setIsDirtyRbac(true);
    IShopStore.setPermissionMatrix(updated);
    const target = updated.find((x) => x.id === id);
    const roleName = roleKey === 'tech' ? 'Kỹ Thuật Viên' : 'Thu Ngân';
    const statusText = target?.[roleKey] ? 'MỞ QUYỀN (CHO PHÉP)' : 'KHÓA TRUY CẬP';
    setRbacSuccessMsg(`Đã ${statusText} mục "${target?.module}" cho ${roleName}!`);
    setTimeout(() => setRbacSuccessMsg(null), 3000);
  };

  const handleSaveAllRbac = () => {
    IShopStore.setPermissionMatrix(permissions);
    setIsDirtyRbac(false);
    setRbacSuccessMsg('✓ Đã lưu và đồng bộ toàn bộ ma trận phân quyền RBAC thành công cho toàn hệ thống!');
    setTimeout(() => setRbacSuccessMsg(null), 3500);
  };

  const handleResetRbac = () => {
    if (confirm('Khôi phục ma trận phân quyền về cấu hình bảo mật mặc định ban đầu?')) {
      const def = IShopStore.resetPermissionMatrix();
      setPermissions(def);
      setIsDirtyRbac(false);
      setRbacSuccessMsg('✓ Đã khôi phục ma trận phân quyền về chuẩn mặc định!');
      setTimeout(() => setRbacSuccessMsg(null), 3000);
    }
  };

  const handleGrantAll = (roleKey: 'tech' | 'cashier', grant: boolean) => {
    const updated = permissions.map((p) => ({
      ...p,
      [roleKey]: grant,
    }));
    setPermissions(updated);
    setIsDirtyRbac(true);
    IShopStore.setPermissionMatrix(updated);
    const roleName = roleKey === 'tech' ? 'Kỹ Thuật Viên' : 'Thu Ngân';
    const actionName = grant ? 'Cấp toàn quyền' : 'Khóa toàn bộ';
    setRbacSuccessMsg(`✓ Đã ${actionName} cho ${roleName}!`);
    setTimeout(() => setRbacSuccessMsg(null), 3000);
  };

  const handleAddNewPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    const newId = 'perm_' + Date.now().toString(36);
    const newItem: PermissionItem = {
      id: newId,
      module: newModuleName.trim(),
      category: newModuleCategory,
      description: newModuleDesc.trim() || 'Phân quyền tính năng mở rộng của cửa hàng',
      admin: true,
      tech: newModuleTech,
      cashier: newModuleCashier,
    };
    const updated = [...permissions, newItem];
    setPermissions(updated);
    setIsDirtyRbac(true);
    IShopStore.setPermissionMatrix(updated);
    setIsAddModuleOpen(false);
    setNewModuleName('');
    setNewModuleDesc('');
    setNewModuleTech(false);
    setNewModuleCashier(false);
    setRbacSuccessMsg(`✓ Đã thêm phân hệ quyền mới: "${newItem.module}"!`);
    setTimeout(() => setRbacSuccessMsg(null), 3000);
  };

  const handleDeletePermission = (id: string, moduleName: string) => {
    if (confirm(`Bạn có chắc muốn xóa phân hệ "${moduleName}" khỏi ma trận phân quyền?`)) {
      const updated = permissions.filter((p) => p.id !== id);
      setPermissions(updated);
      setIsDirtyRbac(true);
      IShopStore.setPermissionMatrix(updated);
      setRbacSuccessMsg(`✓ Đã xóa phân hệ "${moduleName}"!`);
      setTimeout(() => setRbacSuccessMsg(null), 3000);
    }
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

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch =
      p.module.toLowerCase().includes(rbacSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(rbacSearch.toLowerCase()));
    const matchesCat = rbacCategory === 'all' || p.category === rbacCategory;
    return matchesSearch && matchesCat;
  });

  const categoryBadges: Record<string, { label: string; color: string }> = {
    'bán hàng': { label: 'Bán Hàng POS', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    'kỹ thuật': { label: 'Kỹ Thuật iCare', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    'kho & mua hàng': { label: 'Kho & Mua Hàng', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    'kế toán & báo cáo': { label: 'Kế Toán / Quỹ', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    'hệ thống': { label: 'Hệ Thống / RBAC', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  };

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

      {/* 2. Interactive Permission Matrix Table (RBAC) */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                TƯƠNG TÁC THỜI GIAN THỰC
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400">Enterprise Security</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 mt-1">
              <Lock className="w-5 h-5 text-rose-400" />
              <span>2. Ma Trận Phân Quyền Chi Tiết (Role-Based Access Control)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Bấm trực tiếp vào các nút công tắc bên dưới để <strong className="text-emerald-400">Cho phép (✓)</strong> hoặc <strong className="text-rose-400">Khóa (✕)</strong> quyền của từng chức vụ. Hệ thống tự động ghi nhớ và áp dụng ngay lập tức.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModuleOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Thêm Quyền Mới</span>
            </button>
            <button
              type="button"
              onClick={handleResetRbac}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Khôi phục về bảng phân quyền mặc định ban đầu"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Khôi Phục Mặc Định</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAllRbac}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isDirtyRbac
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-emerald-500/20 hover:opacity-90 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình RBAC</span>
              {isDirtyRbac && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            </button>
          </div>
        </div>

        {/* Live Feedback Toast Alert */}
        {rbacSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{rbacSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setRbacSuccessMsg(null)}
              className="text-emerald-400/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Batch Actions & Filter Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm phân hệ chức năng..."
              value={rbacSearch}
              onChange={(e) => setRbacSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <select
              value={rbacCategory}
              onChange={(e) => setRbacCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all" className="bg-[#0f1629]">Tất cả nhóm nghiệp vụ ({permissions.length})</option>
              <option value="bán hàng" className="bg-[#0f1629]">Bán Hàng POS</option>
              <option value="kỹ thuật" className="bg-[#0f1629]">Kỹ Thuật iCare</option>
              <option value="kho & mua hàng" className="bg-[#0f1629]">Kho & Mua Hàng</option>
              <option value="kế toán & báo cáo" className="bg-[#0f1629]">Kế Toán / Báo Cáo</option>
              <option value="hệ thống" className="bg-[#0f1629]">Hệ Thống / Quản Trị</option>
            </select>
          </div>

          {/* Quick Bulk Actions */}
          <div className="lg:col-span-4 flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 px-1 font-semibold">KTV:</span>
              <button
                type="button"
                onClick={() => handleGrantAll('tech', true)}
                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] transition-colors cursor-pointer"
                title="Bật tất cả quyền cho Kỹ Thuật Viên"
              >
                Mở hết
              </button>
              <button
                type="button"
                onClick={() => handleGrantAll('tech', false)}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-[10px] transition-colors cursor-pointer"
                title="Khóa tất cả quyền cho Kỹ Thuật Viên"
              >
                Khóa hết
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 px-1 font-semibold">Thu Ngân:</span>
              <button
                type="button"
                onClick={() => handleGrantAll('cashier', true)}
                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-[10px] transition-colors cursor-pointer"
                title="Bật tất cả quyền cho Thu Ngân"
              >
                Mở hết
              </button>
              <button
                type="button"
                onClick={() => handleGrantAll('cashier', false)}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-[10px] transition-colors cursor-pointer"
                title="Khóa tất cả quyền cho Thu Ngân"
              >
                Khóa hết
              </button>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-xl bg-[#090e1c]/80 backdrop-blur-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1224] text-gray-400 uppercase text-[11px] border-b border-white/10 select-none">
              <tr>
                <th className="p-4 w-5/12">Phân Hệ Chức Năng Nghiệp Vụ</th>
                <th className="p-4 w-2/12 text-center text-rose-400">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <span>👑 Chủ Shop (Admin)</span>
                  </div>
                </th>
                <th className="p-4 w-2/12 text-center text-amber-400">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <span>🔧 Kỹ Thuật Viên</span>
                  </div>
                </th>
                <th className="p-4 w-2/12 text-center text-blue-400">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <span>🛒 Thu Ngân / Bán Hàng</span>
                  </div>
                </th>
                <th className="p-4 w-1/12 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                    Không tìm thấy phân hệ phân quyền nào phù hợp từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((p) => {
                  const badge = categoryBadges[p.category] || {
                    label: p.category,
                    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Module info */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{p.module}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Admin column: Permanent full rights */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                          <span>Toàn quyền</span>
                        </div>
                      </td>

                      {/* Tech column: Interactive live toggle button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(p.id, 'tech')}
                          className={`w-36 mx-auto py-2 px-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all shadow-sm cursor-pointer group ${
                            p.tech
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:scale-[1.02]'
                              : 'bg-white/[0.03] text-gray-400 border-white/10 hover:bg-white/[0.08] hover:text-gray-200'
                          }`}
                          title="Nhấn để Bật / Tắt phân quyền cho Kỹ Thuật Viên"
                        >
                          <span className="flex items-center gap-1.5">
                            {p.tech ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-500 group-hover:text-rose-400 shrink-0 transition-colors" />
                            )}
                            <span>{p.tech ? 'Cho phép' : 'Khóa'}</span>
                          </span>

                          {/* Switch dot indicator */}
                          <div
                            className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                              p.tech ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-white shadow-md transform transition-transform" />
                          </div>
                        </button>
                      </td>

                      {/* Cashier column: Interactive live toggle button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(p.id, 'cashier')}
                          className={`w-36 mx-auto py-2 px-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all shadow-sm cursor-pointer group ${
                            p.cashier
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30 shadow-[0_0_14px_rgba(59,130,246,0.25)] hover:scale-[1.02]'
                              : 'bg-white/[0.03] text-gray-400 border-white/10 hover:bg-white/[0.08] hover:text-gray-200'
                          }`}
                          title="Nhấn để Bật / Tắt phân quyền cho Thu Ngân / Bán Hàng"
                        >
                          <span className="flex items-center gap-1.5">
                            {p.cashier ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-500 group-hover:text-rose-400 shrink-0 transition-colors" />
                            )}
                            <span>{p.cashier ? 'Cho phép' : 'Ẩn / Khóa'}</span>
                          </span>

                          {/* Switch dot indicator */}
                          <div
                            className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                              p.cashier ? 'bg-blue-500 justify-end' : 'bg-gray-700 justify-start'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-white shadow-md transform transition-transform" />
                          </div>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        {p.id.startsWith('perm_') ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePermission(p.id, p.module)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                            title="Xóa phân quyền tùy chỉnh này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500">Mặc định</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Add New Module */}
        {isAddModuleOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>Thêm Phân Hệ Phân Quyền Mới</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModuleOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewPermission} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Tên Phân Hệ Chức Năng:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Xuất File Báo Cáo Doanh Thu Excel..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Nhóm Nghiệp Vụ:</label>
                  <select
                    value={newModuleCategory}
                    onChange={(e) => setNewModuleCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="bán hàng" className="bg-[#0f172a]">Bán Hàng POS</option>
                    <option value="kỹ thuật" className="bg-[#0f172a]">Kỹ Thuật iCare</option>
                    <option value="kho & mua hàng" className="bg-[#0f172a]">Kho & Mua Hàng</option>
                    <option value="kế toán & báo cáo" className="bg-[#0f172a]">Kế Toán / Báo Cáo</option>
                    <option value="hệ thống" className="bg-[#0f172a]">Hệ Thống / Quản Trị</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Mô Tả Chi Tiết:</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả phạm vi quyền hạn và tác động..."
                    value={newModuleDesc}
                    onChange={(e) => setNewModuleDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase">
                    Cấp Quyền Ban Đầu:
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={newModuleTech}
                      onChange={(e) => setNewModuleTech(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>Cho phép Kỹ Thuật Viên truy cập</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={newModuleCashier}
                      onChange={(e) => setNewModuleCashier(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500"
                    />
                    <span>Cho phép Thu Ngân / Bán Hàng truy cập</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Xác Nhận Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddModuleOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

      {/* 2026 Developer & Webhook Integration Playground */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cổng API & Webhook Ngân Hàng Tự Động (Casso / SePay / Napas 247)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  v2.0 RESTful
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Tích hợp tự động gạch nợ hóa đơn và tiếp nhận dữ liệu thời gian thực từ các hệ thống bên ngoài.
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoints Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-emerald-400">POST /api/webhook/vietqr</span>
              <span className="text-[10px] text-gray-400">Napas 247</span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Tiếp nhận webhook biến động số dư, tự động khớp mã đơn và ghi phiếu thu vào sổ quỹ.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-cyan-400">GET /api/warranty?imei=...</span>
              <span className="text-[10px] text-gray-400">Public API</span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Tra cứu bảo hành điện tử theo 15 số IMEI, tính số ngày còn lại và ngày hết hạn.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-amber-400">GET/POST /api/orders</span>
              <span className="text-[10px] text-gray-400">Orders API</span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Tạo đơn hàng mới từ web/app, kiểm tra tồn kho và sinh mã hóa đơn HD-xxxx.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-purple-400">GET/POST /api/repairs</span>
              <span className="text-[10px] text-gray-400">iCare Service</span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Tiếp nhận thiết bị sửa chữa và tra cứu tiến độ pipeline 6 bước trực tiếp.
            </p>
          </div>
        </div>

        {/* Live Webhook Test Console */}
        <div className="p-4 rounded-2xl bg-[#090d18] border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Terminal className="w-4 h-4" />
              <span>Bàn Thử Nghiệm Webhook Ngân Hàng (Webhook Simulator)</span>
            </div>
            <span className="text-[11px] text-gray-400">Gửi test tới /api/webhook/vietqr</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Số tiền khách chuyển (VNĐ):</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Nội dung chuyển khoản (có chứa mã đơn):</label>
              <input
                type="text"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isSendingWebhook}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg"
            >
              {isSendingWebhook ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang bắn Webhook...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Bắn Webhook Giả Lập Ngân Hàng</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-gray-400 italic">
              Tự động cộng tiền vào Sổ Quỹ Thu - Chi nếu thành công
            </span>
          </div>

          {/* Webhook JSON Response Result */}
          {webhookResult && (
            <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs overflow-x-auto text-left">
              <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Phản hồi từ máy chủ (Server Response):</span>
              </div>
              <pre className="text-emerald-400 text-[11px]">
                {JSON.stringify(webhookResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
