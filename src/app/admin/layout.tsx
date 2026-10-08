'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  ShoppingCart,
  Wrench,
  Package,
  Truck,
  Users,
  Wallet,
  Settings,
  Globe,
  ShieldAlert,
  Clock,
  ChevronDown,
  UserCheck,
  User,
  Sparkles,
  Bell,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogOut,
  KeyRound,
  Shield,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { IShopStore, RecentItem } from '@/lib/store';
import { Role, Invoice, RepairTicket, StaffUser } from '@/lib/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingRepairs, setPendingRepairs] = useState<RepairTicket[]>([]);
  const [latestInvoices, setLatestInvoices] = useState<Invoice[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Staff Login Form state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const loadAdminState = () => {
    const user = IShopStore.getStaffUser();
    setStaffUser(user);
    if (user) {
      setCurrentRole(user.role);
    } else {
      setCurrentRole(IShopStore.getRole());
    }
    setRecentItems(IShopStore.getRecentItems());
    const reps = IShopStore.getRepairs().filter((r) => r.status === 'received' || r.status === 'inspecting');
    const invs = IShopStore.getInvoices();
    setPendingRepairs(reps);
    setLatestInvoices(invs.slice(0, 4));
  };

  useEffect(() => {
    setIsMounted(true);
    loadAdminState();
    const listener = () => loadAdminState();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch('/api/auth/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const json = await res.json();

      if (json.isPending) {
        setStaffUser({
          id: json.data.id,
          username: json.data.username,
          name: json.data.name,
          role: 'pending',
        });
        IShopStore.setStaffUser({
          id: json.data.id,
          username: json.data.username,
          name: json.data.name,
          role: 'pending',
        });
        return;
      }

      if (json.success && json.data) {
        const cachedAvatar = IShopStore.getStaffAvatar(json.data.username);
        const finalUser = {
          ...json.data,
          avatar: json.data.avatar || cachedAvatar,
        };
        IShopStore.setStaffUser(finalUser);
        setStaffUser(finalUser);
        setCurrentRole(finalUser.role);
      } else {
        setAuthError(json.error || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      // Local offline fallback if API is unreachable
      const lowerUser = loginUsername.toLowerCase().trim();
      if (lowerUser === 'admin' || lowerUser === 'cashier' || lowerUser === 'tech' || lowerUser === 'technician') {
        const role: Role = lowerUser === 'tech' || lowerUser === 'technician' ? 'technician' : lowerUser === 'cashier' ? 'cashier' : 'admin';
        const name = role === 'admin' ? 'Chủ Cửa Hàng (Admin)' : role === 'technician' ? 'Kỹ Thuật Viên Apple' : 'Thu Ngân Quầy POS';
        const cachedAvatar = IShopStore.getStaffAvatar(lowerUser);
        const fallbackUser: StaffUser = {
          id: 'staff-' + lowerUser,
          username: lowerUser,
          name,
          role,
          avatar: cachedAvatar,
        };
        IShopStore.setStaffUser(fallbackUser);
        setStaffUser(fallbackUser);
        setCurrentRole(role);
        return;
      }
      setAuthError('Lỗi kết nối máy chủ xác thực: ' + (err?.message || ''));
    } finally {
      setIsAuthenticating(false);
    }
  };


  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch('/api/auth/staff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          password: regPassword,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setAuthSuccess(json.message);
        setAuthTab('login');
        setLoginUsername(regUsername);
        setLoginPassword(regPassword);
      } else {
        setAuthError(json.error || 'Lỗi đăng ký tài khoản');
      }
    } catch (err: any) {
      setAuthError('Lỗi kết nối máy chủ: ' + (err?.message || ''));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    IShopStore.logoutStaff();
    setStaffUser(null);
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-gray-500 text-xs">Đang khởi tạo cổng quản trị...</div>;
  }

  // 1. MANDATORY AUTH GATE: If not logged in, show Staff Login Gateway
  if (!staffUser) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 selection:bg-amber-400 selection:text-black">
        {/* Background glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/[0.08] rounded-full blur-[130px]" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 mx-auto shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Cổng Đăng Nhập Nội Bộ</h1>
            <p className="text-xs text-slate-500">
              Khu vực dành riêng cho Nhân Viên & Chủ Cửa Hàng iShop Huy Hoàng. Bắt buộc xác thực tài khoản.
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setAuthTab('login');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-colors ${
                authTab === 'login' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng Nhập Làm Việc
            </button>
            <button
              onClick={() => {
                setAuthTab('register');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg transition-colors ${
                authTab === 'register' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhân Viên Mới
            </button>
          </div>

          {/* Alerts */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Form */}
          {authTab === 'login' ? (
            <form onSubmit={handleStaffLogin} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Tên đăng nhập (Username):</label>
                <input
                  type="text"
                  name="ishop_staff_login_username"
                  id="ishop_staff_login_username"
                  autoComplete="off"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="VD: admin hoặc cashier..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Mật khẩu:</label>
                <input
                  type="password"
                  name="ishop_staff_login_password"
                  id="ishop_staff_login_password"
                  autoComplete="new-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-xl btn-gold text-sm font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-black" />
                    <span>Đăng Nhập Cổng Quản Trị</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStaffRegister} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Họ và tên của bạn:</label>
                <input
                  type="text"
                  name="ishop_staff_reg_fullname"
                  autoComplete="off"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Tên đăng nhập mong muốn:</label>
                <input
                  type="text"
                  name="ishop_staff_reg_username"
                  autoComplete="off"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="VD: tranbinh"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Mật khẩu khởi tạo:</label>
                <input
                  type="password"
                  name="ishop_staff_reg_password"
                  autoComplete="new-password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                * Lưu ý: Tài khoản nhân viên mới đăng ký sẽ ở trạng thái chờ duyệt. Chủ Cửa Hàng sẽ phân quyền trực tiếp trước khi bạn có thể thao tác.
              </p>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-xl btn-gold text-sm font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <span>Gửi Yêu Cầu Cấp Tài Khoản</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>← Quay lại Cửa Hàng Khách Hàng</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. PENDING APPROVAL GATE: If account created but not yet assigned role by owner
  if (staffUser.role === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-300 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 border border-amber-500/30">
              TÀI KHOẢN CHỜ PHÊ DUYỆT
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Xin chào, {staffUser.name}!</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tài khoản nhân viên <strong>{staffUser.username}</strong> của bạn đã được ghi nhận vào CSDL. Hiện tại tài khoản đang chờ Chủ Cửa Hàng (Admin) xét duyệt và cấp quyền trước khi có thể vào hệ thống.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left space-y-1.5 font-mono">
            <p>• Trạng thái: <strong className="text-amber-600">pending (chờ duyệt)</strong></p>
            <p>• Vui lòng báo Chủ Shop truy cập mục: <strong className="text-slate-900">Nhân Sự & Phân Quyền</strong></p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200"
            >
              Đăng Xuất
            </button>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs border border-slate-800 flex items-center justify-center"
            >
              Về Trang Khách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { name: string; href: string; icon: any; permissionKey?: string; adminOnly?: boolean }[] = [
    { name: 'Tổng Quan Cockpit', href: '/admin', icon: Store },
    { name: 'Bán Hàng (POS)', href: '/admin/pos', icon: ShoppingCart, permissionKey: 'pos' },
    { name: 'Bàn Sửa Chữa (iCare)', href: '/admin/repairs', icon: Wrench, permissionKey: 'repairs' },
    { name: 'Kho Hàng', href: '/admin/inventory/phones', icon: Package },
    { name: 'Mua Hàng NCC', href: '/admin/restock', icon: Truck, permissionKey: 'restock' },
    { name: 'Đối Tác & Khách Hàng', href: '/admin/partners', icon: Users, permissionKey: 'partners' },
    { name: 'Kế Toán & Sổ Quỹ', href: '/admin/cashbook', icon: Wallet, permissionKey: 'cashbook', adminOnly: true },
    { name: 'Nhân Sự & Phân Quyền', href: '/admin/staff', icon: UserCheck, permissionKey: 'staff_management', adminOnly: true },
    { name: 'Cấu Hình & Webhook', href: '/admin/settings', icon: Settings, permissionKey: 'settings' },
    { name: 'Tài Khoản & Hồ Sơ', href: '/admin/profile', icon: User },
  ];

  const roleLabels: Record<Role, { label: string; color: string }> = {
    admin: { label: 'Chủ Shop (Toàn Quyền)', color: 'badge-glow-gold' },
    technician: { label: 'Kỹ Thuật Viên', color: 'badge-glow-violet' },
    cashier: { label: 'Thu Ngân (POS)', color: 'badge-glow-cyan' },
    pending: { label: 'Chờ Duyệt', color: 'bg-gray-500/20 text-gray-300' },
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800 font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Admin Enterprise Cockpit Bar */}
      <header className="bg-white/95 backdrop-blur-2xl border-b border-slate-200 sticky top-0 z-40 shadow-sm text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-tight text-slate-900">
                    iShop Huy Hoàng
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    ERP / POS 2026
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block -mt-0.5 font-medium">
                  Hệ Thống Quản Trị Chuỗi & Bán Lẻ
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Access: Recent Items */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Xem gần đây:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
              {recentItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-[11px] font-mono shrink-0 transition-colors"
                  title={item.title}
                >
                  {item.code}
                </Link>
              ))}
            </div>
          </div>

          {/* Top Actions: Notifications, Staff Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
                title="Thông báo hệ thống thời gian thực"
              >
                <Bell className="w-4 h-4 text-amber-600" />
                {pendingRepairs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                    {pendingRepairs.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3 text-slate-900">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 font-black text-slate-900">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span>THÔNG BÁO VẬN HÀNH</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold border border-amber-200">
                        {pendingRepairs.length} phiếu chờ xử lý
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Phiếu Sửa Chữa Cần Tiếp Nhận:
                      </span>
                      {pendingRepairs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">Không có phiếu sửa chữa tồn đọng.</p>
                      ) : (
                        pendingRepairs.slice(0, 3).map((r) => (
                          <Link
                            key={r.id}
                            href="/admin/repairs"
                            onClick={() => setIsNotifOpen(false)}
                            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-start justify-between text-xs transition-colors block"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-700">{r.ticketCode}</span>
                                <span className="font-bold text-slate-900">{r.deviceModel}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{r.issueDescription}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-semibold shrink-0 border border-amber-200">
                              Chờ xử lý
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Customer Portal Link */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-all"
              title="Mở cổng bán hàng cho khách trải nghiệm"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">Cổng Khách Hàng</span>
            </Link>

            {/* Staff User Profile Badge & Quick Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/admin/profile"
                className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all group"
                title="Xem hồ sơ, đổi mật khẩu và ảnh đại diện nhân viên"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shrink-0 shadow-sm">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-300 font-black text-xs overflow-hidden">
                    {staffUser.avatar ? (
                      <img src={staffUser.avatar} alt={staffUser.name} className="w-full h-full object-cover" />
                    ) : (
                      staffUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate max-w-[120px]">
                    {staffUser.name}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold leading-none">
                    {roleLabels[currentRole].label}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                title="Đăng xuất khỏi hệ thống quản trị"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Module Navigation Bar */}
        <nav className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-1.5 text-xs font-bold">
            {navItems
              .filter((item) => {
                if (currentRole === 'admin') return true;
                if (item.permissionKey) {
                  return IShopStore.hasPermission(currentRole, item.permissionKey);
                }
                return !item.adminOnly;
              })
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href.split('?')[0]);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-emerald-800 border border-emerald-300 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
