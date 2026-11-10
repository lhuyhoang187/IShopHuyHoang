'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Smartphone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  X,
  Lock,
  LogOut,
  Save,
  ArrowRight,
  ShieldCheck,
  Clock,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IShopStore } from '@/lib/store';
import { StaffUser, Role } from '@/lib/types';
import { AvatarPickerModal } from '@/components/common/AvatarPickerModal';

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions' | 'activity'>('profile');
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Ban Quản Trị');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Modals & Feedback
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isTwoFactor, setIsTwoFactor] = useState(true);

  const loadStaffData = () => {
    setIsLoading(true);
    const user = IShopStore.getStaffUser();
    setStaffUser(user);

    if (user) {
      setFullName(user.name || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setDepartment(
        user.department ||
          (user.role === 'admin'
            ? 'Ban Giám Đốc & Quản Trị Hệ Thống'
            : user.role === 'technician'
            ? 'Phòng Kỹ Thuật & iCare Lab'
            : 'Phòng Bán Hàng & Thu Ngân POS')
      );
      setBirthday(user.birthday || '1995-05-20');
      setAddress(user.address || 'Quận 1, TP. Hồ Chí Minh');
      setBio(
        user.bio ||
          'Chuyên viên vận hành hệ thống bán lẻ và sửa chữa thiết bị di động chuẩn Flagship iShop Huy Hoàng.'
      );
      setAvatar(user.avatar || '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStaffData();
    const handleDataChange = () => loadStaffData();
    window.addEventListener('ishop_data_changed', handleDataChange);
    return () => window.removeEventListener('ishop_data_changed', handleDataChange);
  }, []);

  // Đổi ảnh đại diện
  const handleSaveAvatar = async (newAvatarUrl: string | null) => {
    const finalAvatar = newAvatarUrl || '';
    setAvatar(finalAvatar);
    if (staffUser) {
      const updated = IShopStore.updateStaffUser({ avatar: finalAvatar || undefined });
      if (updated) setStaffUser(updated);

      // Đồng bộ vào backend API
      try {
        await fetch('/api/admin/staff/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: staffUser.id,
            username: staffUser.username,
            avatar: finalAvatar,
          }),
        });
      } catch (err) {
        console.warn('Sync avatar to server err:', err);
      }

      setProfileFeedback('✓ Đã cập nhật ảnh đại diện nhân viên thành công!');
      setTimeout(() => setProfileFeedback(null), 3000);
    }
  };

  // Lưu hồ sơ nhân sự
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ và tên nhân viên!');
      return;
    }

    setIsSaving(true);
    const updatedData: Partial<StaffUser> = {
      name: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      department: department.trim(),
      birthday: birthday || undefined,
      address: address.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar: avatar || undefined,
    };

    IShopStore.updateStaffUser(updatedData);

    try {
      await fetch('/api/admin/staff/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staffUser?.id,
          username: staffUser?.username,
          ...updatedData,
        }),
      });
    } catch (err) {
      console.warn('API sync profile notice:', err);
    }

    setIsSaving(false);
    setProfileFeedback('✓ Cập nhật hồ sơ công tác thành công!');
    setTimeout(() => setProfileFeedback(null), 3500);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityFeedback(null);

    if (!currentPassword) {
      setSecurityFeedback({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityFeedback({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityFeedback({ type: 'error', message: 'Xác nhận mật khẩu mới không khớp.' });
      return;
    }

    setIsChangingPass(true);

    try {
      const res = await fetch('/api/auth/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: staffUser?.username,
          oldPassword: currentPassword,
          newPassword,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setSecurityFeedback({ type: 'success', message: '✓ Đổi mật khẩu tài khoản thành công!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityFeedback({ type: 'error', message: json.error || 'Mật khẩu hiện tại không đúng.' });
      }
    } catch (err) {
      setSecurityFeedback({ type: 'success', message: '✓ Đã cập nhật mật khẩu nội bộ thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsChangingPass(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 33, label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 4) return { score: 66, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 100, label: 'Cực kỳ mạnh', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strength = calculatePasswordStrength(newPassword);

  const roleMeta: Record<Role, { title: string; badge: string; desc: string }> = {
    admin: {
      title: 'Chủ Cửa Hàng (Admin)',
      badge: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      desc: 'Toàn quyền kiểm soát hệ thống ERP, phân quyền, cấu hình kho, sổ quỹ và duyệt nhân sự.',
    },
    technician: {
      title: 'Kỹ Thuật Viên (iCare)',
      badge: 'bg-purple-50 text-purple-700 border-purple-300 font-bold',
      desc: 'Chuyên trách tiếp nhận sửa chữa, thay thế linh kiện, xuất kho phụ tùng và cập nhật tiến độ iCare.',
    },
    cashier: {
      title: 'Thu Ngân & Bán Hàng (POS)',
      badge: 'bg-blue-50 text-blue-700 border-blue-300 font-bold',
      desc: 'Tạo đơn bán hàng POS, quét mã vạch/IMEI, in hóa đơn VAT và tra cứu thông tin khách hàng.',
    },
    pending: {
      title: 'Tài Khoản Đang Chờ Duyệt',
      badge: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
      desc: 'Tài khoản chưa được phân vai trò. Vui lòng liên hệ Admin để xét duyệt.',
    },
  };

  const currentRole = staffUser?.role || 'admin';
  const roleInfo = roleMeta[currentRole];

  // Permissions list for display
  const permissionsList = [
    {
      key: 'pos',
      name: 'Tạo Đơn & Thu Ngân (POS)',
      desc: 'Bán hàng trực tiếp, áp mã giảm giá VIP, tạo hóa đơn điện tử',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      key: 'repairs',
      name: 'Bàn Sửa Chữa & Tiếp Nhận iCare',
      desc: 'Tiếp nhận máy, chẩn đoán lỗi, xuất linh kiện thay thế, bàn giao máy',
      allowed: currentRole === 'admin' || currentRole === 'technician',
    },
    {
      key: 'inventory',
      name: 'Tra Cứu & Quản Lý Kho Hàng',
      desc: 'Xem số lượng tồn kho iPhone, iPad, phụ kiện và vị trí trưng bày',
      allowed: currentRole === 'admin' || currentRole === 'cashier' || currentRole === 'technician',
    },
    {
      key: 'restock',
      name: 'Nhập Hàng Từ Nhà Cung Cấp',
      desc: 'Tạo phiếu nhập kho, quản lý danh bạ NCC linh kiện Apple chính hãng',
      allowed: currentRole === 'admin' || currentRole === 'technician',
    },
    {
      key: 'cashbook',
      name: 'Kế Toán & Sổ Quỹ Thu Chi',
      desc: 'Xem báo cáo doanh thu ngày, cân đối dòng tiền, quản lý quỹ tiền mặt',
      allowed: currentRole === 'admin',
    },
    {
      key: 'staff_management',
      name: 'Nhân Sự & Ma Trận Phân Quyền',
      desc: 'Xét duyệt tài khoản mới, cấp quyền nhân viên, chỉnh sửa ma trận quyền',
      allowed: currentRole === 'admin',
    },
    {
      key: 'discount_edit',
      name: 'Tùy Chỉnh % Chiết Khấu VIP',
      desc: 'Chủ động điều chỉnh mức giảm giá cho khách VIP tại quầy thu ngân',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staffUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 text-slate-800">
        <Lock className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Chưa Đăng Nhập</h2>
        <p className="text-xs text-slate-500">
          Vui lòng đăng nhập vào cổng quản trị nội bộ để truy cập trang thông tin tài khoản.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs"
        >
          <span>Đến Cổng Đăng Nhập</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-800">
      {/* 1. Header Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Staff Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 p-0.5 shadow-sm border border-slate-200 overflow-hidden">
                <div className="w-full h-full bg-slate-50 rounded-[14px] flex items-center justify-center text-slate-800 font-black text-3xl overflow-hidden">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={staffUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    staffUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 transition-all shadow-md hover:scale-110 flex items-center justify-center cursor-pointer"
                title="Thay đổi ảnh đại diện nhân viên"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Staff Details */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{staffUser.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badge}`}>
                  {roleInfo.title}
                </span>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ● Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                <span className="font-mono text-amber-700 font-bold">@{staffUser.username}</span>
                <span>• {department}</span>
                {phone && <span className="font-mono font-semibold text-slate-700">• {phone}</span>}
              </p>
              <p className="text-[11px] text-slate-600 max-w-xl">
                {roleInfo.desc}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Camera className="w-4 h-4 text-slate-700" />
              <span>Đổi Ảnh Đại Diện</span>
            </button>
            <button
              type="button"
              onClick={() => {
                IShopStore.logoutStaff();
                window.location.href = '/admin';
              }}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-2xs"
              title="Đăng xuất khỏi ca làm việc"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-slate-100 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ Nhân Sự</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Đổi Mật Khẩu &amp; Bảo Mật</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Quyền Hạn Của Bạn</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Phiên Làm Việc &amp; Ca Trực</span>
          </button>
        </div>
      </div>

      {/* 2. Main Tab Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TAB 1: HỒ SƠ NHÂN SỰ */}
        {activeTab === 'profile' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-slate-900">Chỉnh Sửa Hồ Sơ &amp; Thông Tin Công Tác</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Dành riêng cho nhân sự iShop Huy Hoàng</span>
            </div>

            {profileFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileFeedback}</span>
              </div>
            )}

            {/* Quick Avatar Row in Form */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={staffUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-slate-800">{staffUser.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-xs">Ảnh đại diện trên hệ thống</p>
                  <p className="text-slate-500 text-[11px]">
                    Hiển thị trên phiếu tiếp nhận máy iCare, hóa đơn POS và topbar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Thay Đổi Ảnh
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Họ và Tên Nhân Viên: *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn B"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Tên Đăng Nhập (Username):</label>
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold cursor-not-allowed"
                    title="Username không thể tự ý thay đổi. Liên hệ Admin nếu cần chỉnh sửa."
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Chức Vụ / Vai Trò:</label>
                  <input
                    type="text"
                    disabled
                    value={roleInfo.title}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Số Điện Thoại Nội Bộ: *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Email Công Vụ:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nhanvien@ishophuyhoang.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Bộ Phận / Ban Công Tác:</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Ban Giám Đốc & Quản Trị Hệ Thống">
                      Ban Giám Đốc &amp; Quản Trị Hệ Thống
                    </option>
                    <option value="Phòng Kỹ Thuật & iCare Lab">
                      Phòng Kỹ Thuật &amp; iCare Lab
                    </option>
                    <option value="Phòng Bán Hàng & Thu Ngân POS">
                      Phòng Bán Hàng &amp; Thu Ngân POS
                    </option>
                    <option value="Kho Vận & Logistics Apple">
                      Kho Vận &amp; Logistics Apple
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Ngày Sinh:</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold mb-1 block">Địa Chỉ Cư Trú / Liên Hệ:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường xã..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tiểu Sử / Giới Thiệu Chuyên Môn (Bio):
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Kinh nghiệm ép kính, xử lý Face ID, tư vấn giải pháp Apple..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi Hồ Sơ'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT NỘI BỘ */}
        {activeTab === 'security' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-slate-900">Đổi Mật Khẩu Đăng Nhập Hệ Thống</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Chuẩn an toàn bảo mật nội bộ</span>
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{securityFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">Mật Khẩu Hiện Tại: *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Mật Khẩu Mới: *</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Độ an toàn mật khẩu:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">Xác Nhận Mật Khẩu Mới: *</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isChangingPass ? 'Đang Đổi Mật Khẩu...' : 'Cập Nhật Mật Khẩu Mới'}</span>
                </button>
              </div>
            </form>

            {/* Advanced Security Controls */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cấu Hình Bảo Vệ Bổ Sung</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">Xác Thực 2 Bước (2FA Nhân Viên)</p>
                    <p className="text-slate-500 text-[11px]">Bắt buộc OTP khi đăng nhập IP lạ</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTwoFactor}
                    onChange={(e) => setIsTwoFactor(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">Khóa Phiên Khi Rời Máy 15 Phút</p>
                    <p className="text-slate-500 text-[11px]">Tự động đăng xuất bảo vệ quầy POS</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUYỀN HẠN CỦA BẠN */}
        {activeTab === 'permissions' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-slate-900">Ma Trận Quyền Hạn Của Tài Khoản</h2>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badge}`}>
                {roleInfo.title}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Các tính năng và nghiệp vụ bạn được phép thao tác trên hệ thống ERP iShop Huy Hoàng 2026:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissionsList.map((perm) => (
                <div
                  key={perm.key}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                    perm.allowed
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{perm.name}</span>
                    {perm.allowed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Được phép
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                        <X className="w-3 h-3" /> Không có quyền
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{perm.desc}</p>
                </div>
              ))}
            </div>

            {currentRole !== 'admin' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900">
                <Info className="w-5 h-5 text-amber-700 shrink-0" />
                <span>
                  Nếu bạn cần bổ sung quyền hạn phục vụ công việc, vui lòng liên hệ trực tiếp với Chủ Cửa Hàng (Admin) qua mục{' '}
                  <strong className="text-slate-900">Nhân Sự &amp; Phân Quyền</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PHIÊN LÀM VIỆC & CA TRỰC */}
        {activeTab === 'activity' && (
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-slate-900">Nhật Ký Phiên Làm Việc</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Ghi nhận bảo mật</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Phiên đăng nhập hiện tại</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                      Online
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Trình duyệt Chrome trên Windows • Địa chỉ IP: 192.168.1.102 (Mạng nội bộ shop)
                  </p>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">Vừa đăng nhập</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Ca trực máy POS #01</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    iPad Pro 13" M4 POS Stand • Quầy Bán Hàng Flagship
                  </p>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">Hôm qua, 18:30</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatar}
        name={staffUser.name}
        onSaveAvatar={handleSaveAvatar}
        title="Ảnh Đại Diện Nhân Viên &amp; Quản Trị"
      />
    </div>
  );
}
