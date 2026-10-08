'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Store,
  Star,
  Quote,
  Sparkles,
  KeyRound,
  X,
  ShoppingBag,
  LayoutDashboard,
  Smartphone,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IShopStore } from '@/lib/store';
import { CustomerUser } from '@/lib/types';

interface TestimonialSlide {
  id: number;
  image: string;
  tag: string;
  quote: string;
  author: string;
  role: string;
  rating: number;
}

const TESTIMONIALS: TestimonialSlide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1400&q=85',
    tag: '✦ APPLE FLAGSHIP 100% SEAL',
    quote:
      'Đập hộp iPhone 16 Pro Max Titan Sa Mạc tại iShop Huy Hoàng là trải nghiệm đẳng cấp nhất. Máy mới 100% nguyên seal chưa active, chính sách bảo hành 1 đổi 1 và hỗ trợ kích hoạt Apple Care tận tâm.',
    author: 'Trần Minh Quân',
    role: 'Sở hữu iPhone 16 Pro Max Desert Titanium 512GB',
    rating: 5,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=85',
    tag: '✦ TRUNG TÂM iCARE 30 PHÚT LẤY LIỀN',
    quote:
      'Màn hình máy tôi bị nứt được đội ngũ kỹ thuật iCare thẩm định và ép kính phục hồi chỉ trong 35 phút. Trực tiếp quan sát kỹ thuật viên thao tác trong phòng vô trùng, cực kỳ minh bạch và chuyên nghiệp.',
    author: 'Hoàng Yến Linh',
    role: 'Khách hàng dịch vụ iCare Express Lấy Ngay',
    rating: 5,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1400&q=85',
    tag: '✦ THU CŨ ĐỔI MỚI - TRỢ GIÁ 2 TRIỆU',
    quote:
      'Định giá thu cũ cực kỳ sòng phẳng, thủ tục lên đời iPhone mới duyệt hồ sơ chỉ 5 phút nhận máy ngay. iShop Huy Hoàng luôn là địa chỉ công nghệ chuẩn 5 sao số một của gia đình tôi.',
    author: 'Nguyễn Đăng Khoa',
    role: 'Hội viên Kim Cương iShop Diamond Club',
    rating: 5,
  },
];

const ACCENT = {
  primaryBtn:
    'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black shadow-lg shadow-amber-500/25',
  pillBg: 'bg-slate-900 shadow-md',
  pillText: 'text-white',
  accentText: 'text-amber-600',
  accentBg: 'bg-amber-500/10',
  accentBorder: 'border-amber-500/30',
  focusRing: 'focus:border-amber-500 focus:ring-amber-500/20',
  confettiColors: ['#f59e0b', '#d97706', '#0ea5e9', '#10b981', '#ffffff'],
};

export default function LoginPage({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States for UX
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ email: string; isNewUser: boolean }>({
    email: '',
    isNewUser: false,
  });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Sync mode with prop if changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Carousel Auto-play (5.5s, pauses when hovered)
  useEffect(() => {
    if (isCarouselHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselHovered]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const accent = ACCENT;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: accent.confettiColors,
      });
    } catch {
      // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'signup' && !firstName) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firstName || email.split('@')[0],
          email: email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        IShopStore.setCustomerUser(json.data);
      } else {
        const user: CustomerUser = {
          id: 'cust-' + Date.now(),
          name: firstName || email.split('@')[0],
          email: email,
          phone: '090' + Math.floor(1000000 + Math.random() * 9000000),
          points: 100,
        };
        IShopStore.setCustomerUser(user);
      }
    } catch {
      const user: CustomerUser = {
        id: 'cust-' + Date.now(),
        name: firstName || email.split('@')[0],
        email: email,
        phone: '090' + Math.floor(1000000 + Math.random() * 9000000),
        points: 100,
      };
      IShopStore.setCustomerUser(user);
    } finally {
      setIsLoading(false);
      setSuccessInfo({
        email,
        isNewUser: mode === 'signup',
      });
      setShowSuccessModal(true);
      triggerConfetti();
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    setSocialLoading(provider);
    const mockEmail = `vip.${provider.toLowerCase()}@gmail.com`;
    const mockName = provider === 'Google' ? 'Khách Hàng Google' : 'Khách Hàng Apple';

    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mockName,
          email: mockEmail,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        IShopStore.setCustomerUser(json.data);
      } else {
        const user: CustomerUser = {
          id: 'cust-' + Date.now(),
          name: mockName,
          email: mockEmail,
          phone: '098' + Math.floor(1000000 + Math.random() * 9000000),
          points: 100,
        };
        IShopStore.setCustomerUser(user);
      }
    } catch {
      const user: CustomerUser = {
        id: 'cust-' + Date.now(),
        name: mockName,
        email: mockEmail,
        phone: '098' + Math.floor(1000000 + Math.random() * 9000000),
        points: 100,
      };
      IShopStore.setCustomerUser(user);
    } finally {
      setSocialLoading(null);
      setSuccessInfo({
        email: mockEmail,
        isNewUser: false,
      });
      setShowSuccessModal(true);
      triggerConfetti();
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 1100);
  };

  const activeTestimonial = TESTIMONIALS[currentSlide];

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-800 flex flex-col justify-between items-center py-5 px-4 sm:px-6 lg:px-8 selection:bg-amber-400 selection:text-black font-sans transition-colors duration-300">
      {/* Background ambient lighting - Light luxury ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[450px] bg-amber-500/[0.06] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-sky-500/[0.05] rounded-full blur-[130px]" />
      </div>

      {/* 1. Header chuẩn nhận diện thương hiệu iShop Huy Hoàng */}
      <header className="relative z-40 w-full max-w-[1180px] flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 mb-4 sm:mb-6 rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur-2xl">
        {/* Logo thương hiệu */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-md group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber-300 group-hover:rotate-6 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
              iShop <span className="text-gradient-gold">Huy Hoàng</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Apple Flagship &amp; iCare
            </span>
          </div>
        </Link>

        {/* Badge xác thực trung tâm (Ẩn trên màn hình nhỏ) */}
        <div className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 shadow-sm text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span className="tracking-wide text-slate-700">XÁC THỰC BẢO MẬT 256-BIT</span>
        </div>

        {/* Cụm tiện ích bên phải: Về Cửa Hàng */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105"
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Về Cửa Hàng</span>
          </Link>
        </div>
      </header>

      {/* 2. Container chính: Thẻ Split Card phong cách Light Panel */}
      <main className="relative z-10 w-full max-w-[1180px] my-auto">
        <div className="w-full bg-white/95 rounded-3xl sm:rounded-[2.5rem] p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 border border-slate-200 shadow-xl backdrop-blur-xl transition-all duration-300">
          
          {/* CỘT TRÁI: Form Xác thực (55% trên Desktop / lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-7 md:p-9">
            <div>
              {/* Nút chuyển tab dạng viên thuốc (Segmented Pill Switcher) */}
              <div className="flex justify-center mb-7">
                <div className="relative inline-flex p-1.5 bg-slate-100 rounded-full border border-slate-200 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`relative z-10 px-7 py-2 rounded-full text-xs sm:text-sm font-black transition-colors duration-200 ${
                      mode === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'login' && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 rounded-full -z-10 bg-slate-900 shadow-md"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`relative z-10 px-7 py-2 rounded-full text-xs sm:text-sm font-black transition-colors duration-200 ${
                      mode === 'signup' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'signup' && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 rounded-full -z-10 bg-slate-900 shadow-md"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    Sign up
                  </button>
                </div>
              </div>

              {/* Tiêu đề động theo tab */}
              <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                  {mode === 'login' ? (
                    <motion.div
                      key="title-login"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5"
                    >
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Welcome! Please enter your details to login
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 font-normal">
                        Chào mừng trở lại iShop Huy Hoàng! Quản lý đơn hàng Apple, tra cứu bảo hành IMEI &amp; đặt lịch sửa chữa iCare.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="title-signup"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5"
                    >
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Create Account / Join us today
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 font-normal">
                        Gia nhập cộng đồng iShop VIP để nhận trợ giá thu cũ 2 triệu, bảo hành 1 đổi 1 &amp; ưu đãi linh kiện chính hãng.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form nhập liệu */}
              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 max-w-md mx-auto">
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      key="field-firstname"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-1.5"
                    >
                      <label className="block text-xs font-bold text-slate-700">
                        First Name / Họ và tên <span className="text-amber-600">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="ishop_customer_name"
                          autoComplete="off"
                          required={mode === 'signup'}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Trần Minh Quân"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email address <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="ishop_customer_email"
                      id="ishop_customer_email"
                      autoComplete="off"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="quan.tran@apple.vip"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="ishop_customer_password"
                      id="ishop_customer_password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login options: Remember me & Forgot Password */}
                {mode === 'login' ? (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-400/20 accent-amber-500"
                      />
                      <span className="text-xs text-slate-600 font-medium">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Bằng việc tạo tài khoản, bạn đồng ý với{' '}
                      <span className="font-bold underline cursor-pointer text-amber-600">
                        Điều khoản dịch vụ
                      </span>{' '}
                      và{' '}
                      <span className="font-bold underline cursor-pointer text-amber-600">
                        Chính sách bảo hành iShop
                      </span>.
                    </p>
                  </div>
                )}

                {/* Nút Submit chính có hiệu ứng loading */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl font-black text-sm active:scale-[0.99] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed group bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-md shadow-amber-500/25"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Đang xác thực thông tin...</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {/* Đường kẻ phân cách "OR" */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="absolute bg-white px-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    OR
                  </span>
                </div>

                {/* 2 Nút Đăng nhập mạng xã hội: Google & Apple */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    disabled={!!socialLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] text-xs font-bold text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-sm"
                  >
                    {socialLoading === 'Google' ? (
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Apple')}
                    disabled={!!socialLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] text-xs font-bold text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-sm"
                  >
                    {socialLoading === 'Apple' ? (
                      <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.66-7.85-11.91-14.39-7.14-10.9-12.82-23.1-17.06-36.59-4.23-13.5-6.35-26.17-6.35-38.01 0-14.82 3.65-27.24 10.95-37.28 7.3-10.04 16.63-15.15 28-15.34 4.58 0 9.77 1.25 15.58 3.75 5.81 2.5 9.43 3.75 10.87 3.75 1.25 0 5.09-1.31 11.51-3.94 6.42-2.62 11.83-3.81 16.23-3.56 12.39.75 22.38 5.48 29.98 14.2-10.8 6.54-16.1 15.56-15.91 27.07.2 9.07 3.65 16.85 10.37 23.33 6.72 6.48 14.68 10.23 23.88 11.25-2.2 6.64-4.83 13.43-7.89 20.37zM119.22 31.81c0-7.39 2.65-14.31 7.96-20.76 5.3-6.45 11.84-10.42 19.61-11.91.49 1.48.74 3.02.74 4.62 0 7.3-2.73 14.28-8.2 20.93-5.46 6.65-12.18 10.63-20.11 11.95v-4.83z" />
                      </svg>
                    )}
                    <span>Continue with Apple</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Chân form chuyển đổi nhanh */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản thành viên?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold underline transition-colors text-amber-600 hover:text-amber-700"
                  >
                    Đăng ký tài khoản VIP
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Đã có tài khoản iShop?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold underline transition-colors text-amber-600 hover:text-amber-700"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Carousel Hình ảnh Apple Flagship & Testimonial (lg:col-span-5) */}
          <div
            className="dark-testimonial-card lg:col-span-5 relative rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[480px] sm:min-h-[540px] lg:min-h-[640px] flex flex-col justify-between p-6 sm:p-8 select-none group border border-white/20 shadow-2xl"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
          >
            {/* Background Image Carousel with smooth crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.id}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${activeTestimonial.image})` }}
              />
            </AnimatePresence>

            {/* Lớp phủ gradient mờ bảo vệ độ tương phản chữ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/40 pointer-events-none" />

            {/* Top Carousel Bar: Badge & Counter */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[11px] font-black tracking-wider uppercase text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeTestimonial.tag}</span>
              </div>

              {/* Bộ đếm số trang (01 / 03) */}
              <div className="px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-mono font-bold tracking-widest text-white shadow-sm">
                0{currentSlide + 1} / 0{TESTIMONIALS.length}
              </div>
            </div>

            {/* Bottom Content: Quote, Author info & Controls */}
            <div className="relative z-10 space-y-5">
              {/* Quote & Stars */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(activeTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                  <span className="text-[11px] font-black text-amber-300 ml-1.5 tracking-wider drop-shadow-sm">
                    ĐÁNH GIÁ 5.0 SAO CHUẨN VIP
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="relative"
                  >
                    <Quote className="w-8 h-8 text-amber-400 absolute -top-3 -left-2 -z-10 opacity-70" />
                    <p className="testimonial-quote text-base sm:text-lg font-semibold text-white leading-relaxed italic line-clamp-4 pt-2 drop-shadow-md">
                      &ldquo;{activeTestimonial.quote}&rdquo;
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Author and Job title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3.5 pt-3 border-t border-white/25"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-white/50 shrink-0">
                    {activeTestimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="testimonial-author font-black text-white text-base sm:text-lg leading-tight drop-shadow-sm">
                      {activeTestimonial.author}
                    </h4>
                    <p className="testimonial-role text-xs text-amber-300 font-bold mt-1 drop-shadow-sm">
                      {activeTestimonial.role}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Controls: Dots Indicators & Prev/Next Arrows */}
              <div className="flex items-center justify-between pt-1">
                {/* Dots indicators */}
                <div className="flex items-center gap-2">
                  {TESTIMONIALS.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'w-8 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md'
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrows */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Slide trước"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Slide tiếp theo"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer bản quyền đồng bộ */}
      <footer className="relative z-10 mt-6 text-center text-xs text-slate-500 font-medium">
        © 2026 iShop Huy Hoàng. All rights reserved. Hệ thống bán lẻ Apple Flagship &amp; Trung tâm sửa chữa iCare kỹ thuật cao.
      </footer>

      {/* 3. Popup / Modal thông báo đăng nhập / đăng ký thành công */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden text-slate-900"
            >
              {/* Decorative top accent */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                {successInfo.isNewUser ? 'Đăng Ký Thành Viên Thành Công!' : 'Xác Thực Đăng Nhập Thành Công!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">
                Chào mừng{' '}
                <span className="font-bold text-amber-600">{successInfo.email}</span> đã kết nối vào hệ thống iShop Huy Hoàng an toàn.
              </p>

              {/* Thẻ trạng thái phiên bảo mật */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left mb-6 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Trạng thái kết nối:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã xác thực SSL 256-bit
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Thời gian phiên:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {new Date().toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Loại tài khoản:</span>
                  <span className="font-bold text-amber-600">Thành Viên VIP iShop</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-105 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/25"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Tiếp Tục Mua Sắm</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/repair')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-md"
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Đặt Lịch iCare 30p</span>
                </button>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="text-[11px] text-slate-500 hover:text-amber-600 transition-colors underline flex items-center justify-center gap-1 mx-auto"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Xem giỏ hàng &amp; các đơn hàng của bạn</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal Khôi phục mật khẩu (Forgot Password Modal) */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowForgotModal(false);
                setForgotSent(false);
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-left overflow-hidden text-slate-900"
            >
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>

              {!forgotSent ? (
                <>
                  <h3 className="text-xl font-black text-slate-900 mb-1.5">Khôi Phục Mật Khẩu</h3>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Nhập email tài khoản iShop của bạn. Hệ thống sẽ gửi đường dẫn khôi phục mật khẩu bảo mật trong vòng vài giây.
                  </p>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="quan.tran@apple.vip"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-75 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white"
                    >
                      {forgotLoading ? (
                        <span>Đang gửi liên kết xác thực...</span>
                      ) : (
                        <span>Gửi liên kết khôi phục</span>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-2 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Email đã được gửi!</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vui lòng kiểm tra hộp thư đến của <span className="font-bold text-amber-600">{forgotEmail}</span> và làm theo hướng dẫn để tạo mật khẩu mới.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-200"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
