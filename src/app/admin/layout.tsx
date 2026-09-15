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
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { IShopStore, RecentItem } from '@/lib/store';
import { Role } from '@/lib/types';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const loadAdminState = () => {
    setCurrentRole(IShopStore.getRole());
    setRecentItems(IShopStore.getRecentItems());
  };

  useEffect(() => {
    loadAdminState();
    const listener = () => loadAdminState();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const handleRoleChange = (newRole: Role) => {
    IShopStore.setRole(newRole);
    setCurrentRole(newRole);
    setIsRoleDropdownOpen(false);
  };

  const navItems = [
    { name: 'Tổng Quan Cockpit', href: '/admin', icon: Store },
    { name: 'Bán Hàng (POS)', href: '/admin/pos', icon: ShoppingCart },
    { name: 'Bàn Sửa Chữa (iCare)', href: '/admin/repairs', icon: Wrench },
    {
      name: 'Kho Hàng',
      href: '/admin/inventory/phones',
      icon: Package,
    },
    { name: 'Mua Hàng NCC', href: '/admin/restock', icon: Truck },
    { name: 'Đối Tác & Khách Hàng', href: '/admin/partners', icon: Users },
    { name: 'Kế Toán & Sổ Quỹ', href: '/admin/cashbook', icon: Wallet },
    { name: 'Cấu Hình & Phân Quyền', href: '/admin/settings', icon: Settings },
  ];

  const roleLabels: Record<Role, { label: string; color: string }> = {
    admin: { label: 'Chủ Shop (Admin - Toàn Quyền)', color: 'badge-glow-gold' },
    technician: { label: 'Kỹ Thuật Viên (Repair Desk)', color: 'badge-glow-violet' },
    cashier: { label: 'Thu Ngân (Ẩn Giá Vốn)', color: 'badge-glow-cyan' },
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Admin Enterprise Cockpit Bar */}
      <header className="bg-[#0d1326]/90 backdrop-blur-2xl border-b border-white/[0.1] sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
          {/* Logo & System Cockpit Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-tight text-white">
                    iShop Huy Hoàng
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    ERP / POS 2026
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block -mt-0.5 font-medium">
                  Hệ Thống Quản Trị Chuỗi & Bán Lẻ
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Access: Recent Items (Kế thừa tính năng Xem Cuối) */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-bold text-gray-300 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Xem gần đây:</span>
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
              {recentItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-white/[0.06] text-[11px] font-mono shrink-0 transition-colors"
                  title={item.title}
                >
                  {item.code}
                </Link>
              ))}
            </div>
          </div>

          {/* Role Switcher & Customer Portal Link */}
          <div className="flex items-center gap-3">
            {/* 2026 Theme Switcher */}
            <ThemeSwitcher />

            {/* Direct Switch to Customer Portal */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white text-xs font-bold border border-white/[0.08] transition-all"
              title="Mở cổng bán hàng cho khách trải nghiệm"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cổng Khách Hàng</span>
            </Link>

            {/* Role Switcher dropdown with 2026 Badges */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${roleLabels[currentRole].color}`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{roleLabels[currentRole].label.split('(')[0]}</span>
                <span className="sm:hidden">{currentRole.toUpperCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#10172e]/98 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in space-y-1.5">
                  <div className="px-3 py-1.5 text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Chuyển đổi vai trò thao tác:
                  </div>
                  {(['admin', 'technician', 'cashier'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`w-full text-left p-3 rounded-2xl text-xs flex flex-col transition-all ${
                        currentRole === r
                          ? 'bg-amber-500/20 border border-amber-500/30 font-bold text-white'
                          : 'text-gray-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="font-bold text-white">{roleLabels[r].label}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {r === 'admin' && 'Xem lãi gộp, giá vốn, toàn quyền quản trị'}
                        {r === 'technician' && 'Tiếp nhận sửa chữa, xuất linh kiện kho'}
                        {r === 'cashier' && 'Bán hàng POS, ẩn giá vốn & lợi nhuận bảo mật'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7-Module Enterprise Navigation Bar */}
        <nav className="bg-[#090d1a] border-t border-white/[0.06] px-4 sm:px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-1.5 text-xs font-bold">
            {navItems.map((item) => {
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
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
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
