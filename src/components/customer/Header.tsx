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
  LogOut,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { CustomerUser } from '@/lib/types';
import SmartSearchModal from './SmartSearchModal';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

export default function Header() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);

  const updateCounts = () => {
    const cart = IShopStore.getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
    setCompareCount(IShopStore.getComparisonList().length);
    setCustomerUser(IShopStore.getCustomerUser());
  };

  useEffect(() => {
    updateCounts();
    const listener = () => updateCounts();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);


  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.auth-menu-container')) {
        setIsLoginMenuOpen(false);
        setIsCustomerMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
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

                {/* Trạng Thái Khách Hàng / Đăng Nhập */}
                {customerUser ? (
                  <div className="relative auth-menu-container hidden sm:block shrink-0">
                    <button
                      onClick={() => setIsCustomerMenuOpen(!isCustomerMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm transition-all"
                      title="Thông tin thành viên"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-xs shadow-sm">
                        {customerUser.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[110px] truncate">{customerUser.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </button>

                    {/* Popover thông tin khách hàng */}
                    {isCustomerMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#140e0a]/98 border border-amber-500/30 p-3 shadow-2xl backdrop-blur-2xl z-50 space-y-2 text-xs animate-in fade-in zoom-in-95">
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm truncate">{customerUser.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              VIP
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] truncate">{customerUser.phone || customerUser.email}</p>
                          <p className="text-amber-400 text-[11px] font-medium">Điểm tích lũy: {customerUser.points || 100} pts</p>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href="/repair/tracking"
                            onClick={() => setIsCustomerMenuOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Wrench className="w-4 h-4 text-amber-400" />
                            <span>Theo dõi sửa máy iCare</span>
                          </Link>
                          <Link
                            href="/cart"
                            onClick={() => setIsCustomerMenuOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4 text-amber-400" />
                            <span>Giỏ hàng & Đơn mua ({cartCount})</span>
                          </Link>
                          <Link
                            href="/admin"
                            onClick={() => setIsCustomerMenuOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors font-medium border-t border-white/5 pt-2"
                          >
                            <Store className="w-4 h-4 text-emerald-400" />
                            <span>Cổng Đăng Nhập Cho Shop (POS)</span>
                          </Link>
                        </div>

                        <div className="pt-1 border-t border-white/10">
                          <button
                            onClick={() => {
                              IShopStore.logoutCustomer();
                              setCustomerUser(null);
                              setIsCustomerMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 font-bold transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất tài khoản</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative auth-menu-container hidden sm:block shrink-0">
                    <button
                      onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/40 text-white font-bold text-xs sm:text-sm transition-all shadow-sm"
                      title="Đăng nhập tài khoản"
                    >
                      <User className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Đăng Nhập</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </button>

                    {/* Popover Điều Hướng Đăng Nhập: Khách Hàng hoặc Shop */}
                    {isLoginMenuOpen && (
                      <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-[#140e0a]/98 border border-amber-500/35 p-3.5 shadow-2xl backdrop-blur-2xl z-50 space-y-2 text-xs animate-in fade-in zoom-in-95">
                        <div className="px-2 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          Chọn Cổng Đăng Nhập:
                        </div>

                        {/* 1. Khách Hàng */}
                        <Link
                          href="/login"
                          onClick={() => setIsLoginMenuOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/40 text-left transition-all group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block group-hover:text-amber-300">
                              Khách Hàng Hội Viên
                            </span>
                            <span className="text-[11px] text-gray-400 leading-tight block mt-0.5">
                              Tích điểm VIP, xem đơn mua &amp; bảo hành
                            </span>
                          </div>
                        </Link>

                        {/* 2. Cửa Hàng / Shop Staff */}
                        <Link
                          href="/admin"
                          onClick={() => setIsLoginMenuOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                              <span>Đăng Nhập Cho Shop</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-400 text-black">
                                POS
                              </span>
                            </span>
                            <span className="text-[11px] text-gray-400 leading-tight block mt-0.5">
                              Cổng Quản Trị, Thu Ngân POS &amp; Kỹ Thuật iCare
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                )}



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

              {customerUser ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-xs">
                        {customerUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{customerUser.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{customerUser.phone || customerUser.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      VIP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/repair/tracking"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.06] border border-white/10 text-gray-200 text-xs font-bold"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span>Đơn Của Tôi</span>
                    </Link>

                    <button
                      onClick={() => {
                        IShopStore.logoutCustomer();
                        setCustomerUser(null);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-lg"
                  >
                    <User className="w-4 h-4 text-black" />
                    <span>Đăng Nhập Khách Hàng (Tích Điểm VIP)</span>
                  </Link>

                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                  >
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>Đăng Nhập Cho Shop (POS &amp; Quản Trị)</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Smart Search Modal */}
      <SmartSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
