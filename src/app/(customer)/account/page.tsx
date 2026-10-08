'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Lock,
  Award,
  ShoppingBag,
  Wrench,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gift,
  ArrowRight,
  LogOut,
  ChevronRight,
  Clock,
  Printer,
  KeyRound,
  FileText,
  AlertCircle,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IShopStore } from '@/lib/store';
import { CustomerUser, Customer, Invoice, RepairTicket } from '@/lib/types';
import { MEMBERSHIP_TIERS, getTierByPoints, MembershipTierConfig } from '@/lib/loyalty';
import { formatVND } from '@/lib/vietqr';
import { AvatarPickerModal } from '@/components/common/AvatarPickerModal';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'loyalty' | 'orders' | 'repairs'>('profile');
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('male');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);

  // Quick Login Form State (Khi chưa đăng nhập)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders & Repairs History
  const [customerOrders, setCustomerOrders] = useState<Invoice[]>([]);
  const [customerRepairs, setCustomerRepairs] = useState<RepairTicket[]>([]);

  // Selected invoice for detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load user data
  const loadUserData = () => {
    setIsLoading(true);
    const user = IShopStore.getCustomerUser();
    setCustomerUser(user);

    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setBirthday(user.birthday || '');
      setGender(user.gender || 'male');
      setCity(user.city || 'TP. Hồ Chí Minh');
      setAddress(user.address || '');
      setAvatar(user.avatar || '');

      // Load related invoices & repairs
      const allInvoices = IShopStore.getInvoices();
      const userInvoices = allInvoices.filter(
        (inv) =>
          (user.phone && inv.customerPhone.trim() === user.phone.trim()) ||
          inv.customerName.toLowerCase().includes(user.name.toLowerCase())
      );
      setCustomerOrders(userInvoices);

      const allRepairs = IShopStore.getRepairs();
      const userRepairs = allRepairs.filter(
        (rep) =>
          (user.phone && rep.customerPhone.trim() === user.phone.trim()) ||
          rep.customerName.toLowerCase().includes(user.name.toLowerCase())
      );
      setCustomerRepairs(userRepairs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserData();
    const handleDataChange = () => loadUserData();
    window.addEventListener('ishop_data_changed', handleDataChange);
    return () => window.removeEventListener('ishop_data_changed', handleDataChange);
  }, []);

  // Quick Demo Login
  const handleQuickDemoLogin = (demoPhone = '0909123456', demoName = 'Hoàng Gia Bảo') => {
    const custs = IShopStore.getCustomers();
    const existing = custs.find((c) => c.phone === demoPhone);
    const cachedAvatar =
      IShopStore.getCustomerAvatar(demoPhone) ||
      existing?.avatar ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80';

    const newUser: CustomerUser = {
      id: existing ? existing.id : 'cust-demo',
      name: existing ? existing.name : demoName,
      phone: demoPhone,
      email: existing?.email || 'bao.hoang@icloud.com',
      address: existing?.address || '45 Lê Văn Việt, TP. Thủ Đức, TP.HCM',
      points: existing ? existing.points : 62365,
      birthday: existing?.birthday || '1996-10-18',
      city: existing?.city || 'TP. Hồ Chí Minh',
      gender: 'male',
      membershipTier: existing?.membershipTier || 'Thẻ Kim Cương',
      avatar: cachedAvatar,
      createdAt: '2026-01-15',
    };

    IShopStore.setCustomerUser(newUser);
    setCustomerUser(newUser);
    setAvatar(newUser.avatar || '');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setLoginError('Vui lòng nhập số điện thoại đăng nhập');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const custs = IShopStore.getCustomers();
      const matched = custs.find((c) => c.phone.trim() === loginPhone.trim());
      const cachedAvatar =
        IShopStore.getCustomerAvatar(loginPhone.trim()) ||
        (matched?.email && IShopStore.getCustomerAvatar(matched.email)) ||
        matched?.avatar;

      const userObj: CustomerUser = {
        id: matched ? matched.id : 'cust-' + Date.now(),
        name: matched ? matched.name : 'Khách Hàng ' + loginPhone.slice(-4),
        phone: loginPhone.trim(),
        email: matched?.email || undefined,
        address: matched?.address || undefined,
        points: matched ? matched.points : 150,
        membershipTier: matched ? matched.membershipTier : 'Thành viên mới',
        birthday: matched?.birthday || undefined,
        city: matched?.city || 'TP. Hồ Chí Minh',
        avatar: cachedAvatar || undefined,
      };

      IShopStore.setCustomerUser(userObj);
      setCustomerUser(userObj);
      setAvatar(userObj.avatar || '');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {
      setLoginError('Không thể đăng nhập. Vui lòng thử lại!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Save Avatar
  const handleSaveAvatar = async (newAvatarUrl: string | null) => {
    const finalAvatar = newAvatarUrl || '';
    setAvatar(finalAvatar);
    if (customerUser) {
      const updated = IShopStore.updateCustomerUser({ avatar: finalAvatar || undefined });
      if (updated) setCustomerUser(updated);

      // Sync avatar to backend
      try {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerUser.name,
            phone: customerUser.phone,
            avatar: finalAvatar,
          }),
        });
      } catch (err) {
        console.warn('API sync avatar err:', err);
      }

      setProfileFeedback('✓ Cập nhật ảnh đại diện thành công!');
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.4 } });
      setTimeout(() => setProfileFeedback(null), 3000);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Vui lòng điền Họ tên và Số điện thoại!');
      return;
    }
    setIsSavingProfile(true);

    const updatedData: Partial<CustomerUser> = {
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      birthday: birthday || undefined,
      gender,
      city: city.trim(),
      address: address.trim() || undefined,
      avatar: avatar || undefined,
    };

    IShopStore.updateCustomerUser(updatedData);

    // Sync to backend MySQL
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          phone: updatedData.phone,
          email: updatedData.email,
          address: updatedData.address,
        }),
      });
    } catch (err) {
      console.warn('API sync profile notice:', err);
    }

    setIsSavingProfile(false);
    setProfileFeedback('✓ Cập nhật hồ sơ thông tin thành công!');
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    setTimeout(() => setProfileFeedback(null), 3500);
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityFeedback(null);

    if (newPassword.length < 6) {
      setSecurityFeedback({
        type: 'error',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn!',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityFeedback({
        type: 'error',
        message: 'Xác nhận mật khẩu mới không khớp! Vui lòng kiểm tra lại.',
      });
      return;
    }

    // Save updated password
    IShopStore.updateCustomerUser({ password: newPassword });

    setSecurityFeedback({
      type: 'success',
      message: '✓ Đổi mật khẩu thành công! Mật khẩu mới của bạn đã có hiệu lực ngay lập tức.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setSecurityFeedback(null), 5000);
  };

  // Calculate Loyalty Tiers & Next Step
  const currentPoints = customerUser?.points || 0;
  const currentTier = getTierByPoints(currentPoints);

  // Find next tier for progress bar
  const tierIndex = MEMBERSHIP_TIERS.findIndex((t) => t.tier === currentTier.tier);
  const nextTier = tierIndex < MEMBERSHIP_TIERS.length - 1 ? MEMBERSHIP_TIERS[tierIndex + 1] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - currentPoints) : 0;
  const progressPercent = nextTier
    ? Math.min(100, Math.round(((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100))
    : 100;

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-transparent' };
    if (pass.length < 6) return { score: 1, text: 'Yếu', color: 'bg-rose-500' };
    if (pass.length < 10) return { score: 2, text: 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, text: 'Rất mạnh', color: 'bg-emerald-500' };
  };
  const passStrength = getPasswordStrength(newPassword);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // GIAO DIỆN CHƯA ĐĂNG NHẬP
  if (!customerUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-md mx-auto space-y-6 relative z-10">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <User className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">Cổng Thông Tin Khách Hàng</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vui lòng đăng nhập để cập nhật hồ sơ, đổi mật khẩu, xem thẻ VIP tích điểm và theo dõi đơn hàng của bạn.
              </p>
            </div>

            {/* Quick Demo Login Option */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Trải Nghiệm Nhanh Bằng Tài Khoản Khách VIP:</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Vào với tài khoản: Hoàng Gia Bảo (VIP Kim Cương)</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Hoặc Đăng Nhập SĐT</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Số điện thoại khách hàng:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="09xx xxx xxx (Số đã mua hàng)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Mật khẩu (nếu có):</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu (hoặc để trống nếu chưa tạo)..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-slate-900/10 transition-all cursor-pointer"
              >
                {isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập Tra Cứu Hồ Sơ'}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-slate-500 hover:text-amber-700 font-medium text-xs">
                  Chuyển sang trang Đăng Nhập Đầy Đủ →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN KHÁCH HÀNG ĐÃ ĐĂNG NHẬP
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header Banner Thông Tin Khách Hàng */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Customer Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-md overflow-hidden">
                <div className="w-full h-full bg-slate-100 rounded-[14px] flex items-center justify-center text-amber-800 font-black text-2xl overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt={customerUser.name} className="w-full h-full object-cover" />
                  ) : (
                    customerUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md hover:scale-110 flex items-center justify-center cursor-pointer"
                title="Thay đổi ảnh đại diện khách hàng"
              >
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{customerUser.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${currentTier.badgeClass}`}>
                  {currentTier.tier}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                <span className="font-mono font-medium text-slate-700">{customerUser.phone}</span>
                {customerUser.email && <span>• {customerUser.email}</span>}
              </p>
              <p className="text-[11px] text-slate-600">
                Ưu đãi hiện tại: <strong className="text-amber-700">Chiết khấu {currentTier.discountPercent}%</strong> trên mọi sản phẩm
              </p>
            </div>
          </div>

          {/* Quick Metrics & Logout */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Điểm Tích Lũy</span>
              <span className="text-lg font-black text-amber-700 font-mono">
                {currentPoints.toLocaleString('vi-VN')} pts
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Đổi Ảnh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                IShopStore.logoutCustomer();
                setCustomerUser(null);
              }}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-slate-200 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ Cá Nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Đổi Mật Khẩu &amp; Bảo Mật</span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Thẻ VIP &amp; Điểm Thưởng</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Lịch Sử Đơn Mua ({customerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'repairs'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Đơn Sửa iCare ({customerRepairs.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Main Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TAB 1: HỒ SƠ CÁ NHÂN */}
        {activeTab === 'profile' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-slate-900">Chỉnh Sửa Thông Tin Cá Nhân</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Dữ liệu được bảo mật 256-bit</span>
            </div>

            {profileFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{profileFeedback}</span>
              </div>
            )}

            {/* Quick Avatar Row in Form */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt={customerUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-amber-800">{customerUser.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-xs">Ảnh đại diện thành viên VIP</p>
                  <p className="text-slate-500 text-[11px]">
                    Hiển thị trên Thẻ VIP Apple Wallet, hóa đơn mua hàng và thanh điều hướng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                Đổi Ảnh Đại Diện
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Họ và Tên Khách Hàng: *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Số Điện Thoại (Kích hoạt BH): *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-amber-800 font-mono font-bold focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Thư Điện Tử (Email):</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Ngày Sinh Nhật:</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Giới Tính:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Tỉnh / Thành Phố:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold mb-1 block">Địa Chỉ Giao Hàng &amp; Nhận Máy:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSavingProfile ? 'Đang Lưu...' : 'Lưu Thay Đổi Thông Tin'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
        {activeTab === 'security' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-slate-900">Đổi Mật Khẩu &amp; Cài Đặt Bảo Mật</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Khuyến nghị đổi mật khẩu định kỳ 90 ngày</span>
            </div>

            {securityFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                  securityFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {securityFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{securityFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Đổi Mật Khẩu */}
              <div className="lg:col-span-7 space-y-4 text-xs">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Mật khẩu hiện tại:</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại..."
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Mật khẩu mới: *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự..."
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Thanh đo độ mạnh mật khẩu */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full flex-1 rounded-full transition-all ${
                              passStrength.score >= 1 ? passStrength.color : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full flex-1 rounded-full transition-all ${
                              passStrength.score >= 2 ? passStrength.color : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full flex-1 rounded-full transition-all ${
                              passStrength.score >= 3 ? passStrength.color : 'bg-transparent'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Độ mạnh mật khẩu: {passStrength.text}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Xác nhận mật khẩu mới: *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white shadow-inner transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Cập Nhật Mật Khẩu Mới</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Tùy chọn bảo mật 2 lớp */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-sky-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Lớp Bảo Vệ Nâng Cao</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Xác Thực 2 Bước (2FA)</p>
                      <p className="text-[10px] text-slate-500">Gửi mã OTP khi đăng nhập trên thiết bị lạ</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isTwoFactorEnabled}
                      onChange={(e) => setIsTwoFactorEnabled(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Sinh Trắc Học (Face ID / Touch ID)</p>
                      <p className="text-[10px] text-slate-500">Đăng nhập nhanh không cần nhập mật khẩu</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBiometricEnabled}
                      onChange={(e) => setIsBiometricEnabled(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5 shadow-sm">
                  <p className="font-bold text-amber-900">💡 Lưu ý bảo mật:</p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    Không chia sẻ mã OTP hoặc mật khẩu cho bất kỳ ai, kể cả nhân viên kỹ thuật iShop. Nhân viên chỉ hỗ trợ kích hoạt bảo hành thông qua số IMEI máy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THẺ VIP & ĐIỂM THƯỞNG */}
        {activeTab === 'loyalty' && (
          <div className="lg:col-span-12 space-y-6">
            {/* Digital Apple Wallet Card (Preserve premium dark titanium card texture) */}
            <div className="max-w-md mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#0f172a] border-2 border-amber-400/50 shadow-2xl relative overflow-hidden text-amber-100 space-y-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-amber-300 font-mono font-bold block">
                    THẺ HỘI VIÊN ĐIỆN TỬ 2026
                  </span>
                  <h3 className="font-black text-xl text-white tracking-wider">iShop Huy Hoàng</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Chip & Tier Badge */}
              <div className="flex items-center justify-between pt-2">
                <div className="w-12 h-9 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 shadow-inner flex items-center justify-center">
                  <div className="w-8 h-5 border border-black/30 rounded" />
                </div>
                <span className={`px-3 py-1 rounded-full font-black text-xs border ${currentTier.badgeClass}`}>
                  {currentTier.tier}
                </span>
              </div>

              {/* Customer Name & Card Number */}
              <div className="space-y-1 pt-2">
                <p className="text-[10px] uppercase tracking-widest text-amber-300 font-mono font-bold">Chủ sở hữu thẻ</p>
                <p className="font-bold text-white text-base tracking-wide uppercase">{customerUser.name}</p>
                <p className="font-mono text-xs text-amber-300 font-semibold">SĐT: {customerUser.phone}</p>
              </div>

              {/* Points & Discount */}
              <div className="flex items-center justify-between pt-3 border-t border-amber-500/30">
                <div>
                  <span className="text-[10px] uppercase text-amber-300 font-bold block">Điểm Tích Lũy</span>
                  <span className="text-xl font-black text-amber-300 font-mono">
                    {currentPoints.toLocaleString('vi-VN')} pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-emerald-300 font-bold block">Chiết Khấu Mua Hàng</span>
                  <span className="text-xl font-black text-emerald-300 font-mono">
                    {currentTier.discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-slate-900">Mục Tiêu Thăng Hạng Tiếp Theo:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${nextTier.badgeClass}`}>
                      {nextTier.tier} (Giảm {nextTier.discountPercent}%)
                    </span>
                  </div>
                  <span className="font-mono text-slate-600">
                    Còn thiếu: <strong className="text-amber-700">{pointsToNext.toLocaleString('vi-VN')} điểm</strong>
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  * Khi mua điện thoại flagship mới, quý khách được cộng thêm <strong className="text-slate-800">+500 điểm</strong>/máy để nhanh chóng lên hạng.
                </p>
              </div>
            )}

            {/* Bảng Chi Tiết Chính Sách 5 Hạng Thẻ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Gift className="w-4 h-4 text-sky-700" />
                <span>Quyền Lợi &amp; Bảng Phân Hạng Thẻ Thành Viên iShop 2026</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                      <th className="py-2.5 px-3 rounded-l-lg">Hạng Thẻ</th>
                      <th className="py-2.5 px-3">Điểm Tích Lũy</th>
                      <th className="py-2.5 px-3 text-center">Chiết Khấu Mặc Định</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Quyền Lợi Đặc Biệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {MEMBERSHIP_TIERS.map((t, i) => (
                      <tr key={i} className={t.tier === currentTier.tier ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50/50'}>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${t.badgeClass}`}>
                            {t.tier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {t.minPoints === 0 ? 'Dưới 1.000 điểm' : `Từ ${t.minPoints.toLocaleString('vi-VN')} điểm`}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700 font-mono text-xs">
                          {t.discountPercent}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {t.description}
                          {t.tier === currentTier.tier && (
                            <span className="ml-2 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              ✓ Hạng Hiện Tại
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LỊCH SỬ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-slate-900">Lịch Sử Mua Hàng &amp; Hóa Đơn Điện Tử</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Tìm thấy {customerOrders.length} đơn hàng</span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Chưa có đơn hàng nào được ghi nhận cho số điện thoại này.</p>
                <Link
                  href="/phones"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
                >
                  <span>Khám Phá Máy Mới Ngay</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders.map((invoice, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700">{invoice.invoiceCode}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{invoice.createdAt}</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] w-fit">
                        ✓ Đã thanh toán ({invoice.paymentMethod.toUpperCase()})
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {invoice.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900">{it.name}</span>
                            {it.imei && (
                              <span className="text-[10px] font-mono text-amber-800 ml-2 font-semibold">
                                (IMEI: {it.imei})
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-slate-900">{formatVND(it.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-600">
                        {invoice.pointsEarned ? (
                          <span className="text-amber-700 font-semibold">+ {invoice.pointsEarned} điểm thưởng</span>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium">Tổng thanh toán:</span>
                        <span className="font-black text-amber-700 text-sm font-mono">
                          {formatVND(invoice.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LỊCH SỬ SỬA CHỮA ICARE */}
        {activeTab === 'repairs' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-slate-900">Lịch Sử Sửa Chữa &amp; Thay Thế Linh Kiện iCare</h2>
              </div>
              <Link href="/repair/tracking" className="text-xs text-amber-700 hover:text-amber-800 font-semibold hover:underline">
                Tra cứu tiến độ sửa qua mã QR →
              </Link>
            </div>

            {customerRepairs.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Bạn chưa có phiếu sửa chữa nào tại trung tâm iCare.</p>
                <Link
                  href="/repair"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
                >
                  <span>Xem Bảng Giá Sửa Lấy Ngay</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {customerRepairs.map((ticket, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-700">{ticket.ticketCode}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-slate-900 font-bold">{ticket.deviceModel} - {ticket.issueDescription}</p>
                    <p className="text-slate-500 text-[11px]">Kỹ thuật viên: <strong className="text-slate-700">{ticket.technicianName || 'Đang phân công'}</strong> • Ngày hẹn: <strong className="text-slate-700">{ticket.estimatedDeliveryDate || 'Trong ngày'}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Reusable Avatar Picker Modal */}
      {customerUser && (
        <AvatarPickerModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentAvatar={avatar}
          name={customerUser.name}
          onSaveAvatar={handleSaveAvatar}
          title="Ảnh Đại Diện Khách Hàng VIP"
        />
      )}
    </div>
  );
}
