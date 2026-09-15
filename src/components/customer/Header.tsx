'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Smartphone,
  Headphones,
  Scale,
  Wrench,
  ShieldCheck,
  ShoppingCart,
  Search,
  Store,
  PhoneCall,
  Menu,
  X,
  Zap,
  Building2,
  User,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import SmartSearchModal from './SmartSearchModal';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function Header() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateCounts = () => {
    const cart = IShopStore.getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
    setCompareCount(IShopStore.getComparisonList().length);
  };

  useEffect(() => {
    updateCounts();
    const listener = () => updateCounts();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // 7 Danh mục cốt lõi của cửa hàng - Vừa vặn 100% trên một hàng, không bao giờ phải cuộn
  const navLinks = [
    {
      name: 'Điện Thoại iPhone',
      href: '/phones',
      icon: Smartphone,
      badge: null,
    },
    {
      name: 'Phụ Kiện Chính Hãng',
      href: '/accessories',
      icon: Headphones,
      badge: null,
    },
    {
      name: 'So Sánh Máy',
      href: '/compare',
      icon: Scale,
      badge: compareCount > 0 ? `${compareCount}` : null,
      badgeColor: 'bg-amber-400 text-black font-black',
    },
    {
      name: 'Bảng Giá Sửa iCare',
      href: '/repair',
      icon: Wrench,
      badge: '30 Phút',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      name: 'Tiến Độ Sửa (QR)',
      href: '/repair/tracking',
      icon: Zap,
      badge: null,
    },
    {
      name: 'Bảo Hành IMEI',
      href: '/warranty',
      icon: ShieldCheck,
      badge: null,
    },
    {
      name: 'Hệ Thống Showroom',
      href: '/about',
      icon: Building2,
      badge: null,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 shadow-[0_12px_45px_rgba(0,0,0,0.65)] transition-all">
        {/* TẦNG 1: HEADER CHÍNH (TIỆN ÍCH & THƯƠNG HIỆU - Không dính, không đè, tự nhiên 100%) */}
        <div className="bg-[#0c0906]/95 backdrop-blur-2xl border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 gap-4">
              {/* 1. Logo Thương Hiệu Bên Trái */}
              <Link href="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(226,183,116,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(226,183,116,0.55)] transition-all">
                  <div className="w-full h-full bg-[#0e0b08] rounded-[14px] flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-amber-300 group-hover:rotate-6 transition-transform" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                    iShop <span className="text-gradient-gold">Huy Hoàng</span>
                  </span>
                  <span className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Apple Flagship & iCare
                  </span>
                </div>
              </Link>

              {/* 2. Ô Tìm Kiếm Ở Trung Tâm (Tự động co giãn theo khoảng trống, không bị đè) */}
              <div className="hidden lg:flex flex-1 max-w-sm xl:max-w-md mx-4">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] hover:border-amber-400/50 text-gray-300 text-xs sm:text-sm transition-all shadow-inner group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="group-hover:text-white transition-colors truncate">
                      Tìm iPhone 16, GaN 65W, ép kính...
                    </span>
                  </div>
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800/40 rounded-lg font-bold shrink-0">
                    Ctrl K
                  </kbd>
                </button>
              </div>

              {/* 3. Cụm Tiện Ích Bên Phải (Gọn gàng, thoáng đãng, không đè lấn) */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Nút Tìm kiếm trên mobile */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="lg:hidden p-2.5 text-gray-300 hover:text-white rounded-xl bg-white/[0.06] border border-white/10"
                  title="Tìm kiếm"
                >
                  <Search className="w-5 h-5 text-amber-400" />
                </button>

                {/* Bộ Chọn Bảng Màu 2026 */}
                <ThemeSwitcher />

                {/* Giỏ Hàng (Có badge số lượng) */}
                <Link
                  href="/cart"
                  className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/40 transition-all text-white font-bold text-xs sm:text-sm shrink-0"
                  title="Giỏ hàng của bạn"
                >
                  <ShoppingCart className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="hidden xl:inline">Giỏ Hàng</span>
                  {cartCount > 0 && (
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[11px] px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Đăng Nhập */}
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs sm:text-sm transition-all shrink-0"
                  title="Đăng nhập tài khoản"
                >
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="hidden xl:inline">Đăng Nhập</span>
                </Link>

                {/* Quản Trị Cửa Hàng & POS */}
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105 shrink-0"
                  title="Truy cập hệ thống POS bán hàng & kỹ thuật iCare"
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Quản Trị POS</span>
                  <span className="sm:hidden">POS</span>
                </Link>

                {/* Nút Mở Menu Trên Mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2.5 text-gray-300 hover:text-white rounded-xl bg-white/[0.06] border border-white/10"
                  aria-label="Mở Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TẦNG 2: THANH MENU ĐIỀU HƯỚNG DỊCH VỤ - VỪA VẶN 100%, CĂN GIỮA HOÀN TOÀN, KHÔNG CÓ CUỘN */}
        <div className="hidden lg:block bg-[#140e0a]/98 backdrop-blur-2xl border-b border-amber-500/20 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center py-2.5 gap-2 xl:gap-3.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl transition-all shrink-0 text-xs xl:text-sm font-bold ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(226,183,116,0.2)] font-black'
                        : 'text-gray-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-amber-300/80'}`} />
                    <span className="whitespace-nowrap">{link.name}</span>
                    {link.badge && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${link.badgeColor}`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* MENU DI ĐỘNG KHI CLICK TOGGLE (Phân chia danh mục rành mạch, dễ thao tác) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0c0906]/98 backdrop-blur-2xl border-b border-amber-500/30 px-5 py-6 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Nhóm 1: Mua Sắm Thiết Bị */}
            <div>
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2.5">
                Mua Sắm & So Sánh Sản Phẩm
              </div>
              <div className="space-y-1.5">
                {navLinks.slice(0, 3).map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span>{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${link.badgeColor}`}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Nhóm 2: Dịch Vụ Sửa Chữa & Bảo Hành */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[11px] font-black text-cyan-400 uppercase tracking-wider mb-2.5">
                Dịch Vụ iCare & Hỗ Trợ Kỹ Thuật
              </div>
              <div className="space-y-1.5">
                {navLinks.slice(3).map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span>{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${link.badgeColor}`}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Hotline & Tài khoản di động */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <a
                href="tel:0988888999"
                className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Hotline: 0988.888.999 (Tư Vấn Miễn Phí 24/7)</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-gray-200 text-xs font-bold"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Đăng Nhập</span>
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Quản Trị POS</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Smart Search Modal */}
      <SmartSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
