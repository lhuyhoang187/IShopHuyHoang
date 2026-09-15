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
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

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

// Cấu hình Accent màu tương ứng với từng Theme 2026
const THEME_ACCENTS: Record<
  string,
  {
    primaryBtn: string;
    pillBg: string;
    pillText: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    focusRing: string;
    confettiColors: string[];
  }
> = {
  titanium: {
    primaryBtn:
      'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_25px_rgba(226,183,116,0.4)]',
    pillBg:
      'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_20px_rgba(226,183,116,0.45)]',
    pillText: 'text-black',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/35',
    focusRing: 'focus:border-amber-400 focus:ring-amber-500/20',
    confettiColors: ['#e2b774', '#f59e0b', '#38bdf8', '#10b981', '#ffffff'],
  },
  cobalt: {
    primaryBtn:
      'bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 hover:from-indigo-400 hover:to-sky-300 text-white shadow-[0_0_25px_rgba(99,102,241,0.45)]',
    pillBg:
      'bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]',
    pillText: 'text-white',
    accentText: 'text-sky-300',
    accentBg: 'bg-indigo-500/20',
    accentBorder: 'border-indigo-500/40',
    focusRing: 'focus:border-sky-400 focus:ring-indigo-500/25',
    confettiColors: ['#6366f1', '#38bdf8', '#818cf8', '#a78bfa', '#ffffff'],
  },
  teal: {
    primaryBtn:
      'bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-black shadow-[0_0_25px_rgba(20,184,166,0.45)]',
    pillBg:
      'bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 shadow-[0_0_20px_rgba(20,184,166,0.5)]',
    pillText: 'text-black',
    accentText: 'text-teal-300',
    accentBg: 'bg-teal-500/20',
    accentBorder: 'border-teal-500/40',
    focusRing: 'focus:border-teal-400 focus:ring-teal-500/25',
    confettiColors: ['#14b8a6', '#10b981', '#38bdf8', '#34d399', '#ffffff'],
  },
  mocha: {
    primaryBtn:
      'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-[0_0_25px_rgba(244,63,94,0.45)]',
    pillBg:
      'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]',
    pillText: 'text-white',
    accentText: 'text-rose-300',
    accentBg: 'bg-rose-500/20',
    accentBorder: 'border-rose-500/40',
    focusRing: 'focus:border-rose-400 focus:ring-rose-500/25',
    confettiColors: ['#f43f5e', '#fb7185', '#f59e0b', '#fbbf24', '#ffffff'],
  },
  cream: {
    primaryBtn:
      'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black shadow-[0_0_25px_rgba(217,119,6,0.35)]',
    pillBg:
      'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_20px_rgba(226,183,116,0.45)]',
    pillText: 'text-black',
    accentText: 'text-amber-600',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/35',
    focusRing: 'focus:border-amber-500 focus:ring-amber-500/20',
    confettiColors: ['#e2b774', '#f59e0b', '#0ea5e9', '#d97706', '#ffffff'],
  },
  dusk: {
    primaryBtn:
      'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 hover:from-blue-500 hover:to-indigo-400 text-white shadow-[0_0_25px_rgba(129,140,248,0.45)]',
    pillBg:
      'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(129,140,248,0.5)]',
    pillText: 'text-white',
    accentText: 'text-blue-300',
    accentBg: 'bg-blue-500/20',
    accentBorder: 'border-blue-500/40',
    focusRing: 'focus:border-blue-400 focus:ring-blue-500/25',
    confettiColors: ['#818cf8', '#60a5fa', '#38bdf8', '#c084fc', '#ffffff'],
  },
};

export default function LoginPage({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Active theme tracking
  const [currentTheme, setCurrentTheme] = useState<string>('titanium');

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

  // Read & Listen to theme changes from ThemeSwitcher
  useEffect(() => {
    const saved = localStorage.getItem('ishop_theme') || 'titanium';
    setCurrentTheme(saved);

    const handleThemeChange = () => {
      const active = localStorage.getItem('ishop_theme') || 'titanium';
      setCurrentTheme(active);
    };

    window.addEventListener('ishop_theme_changed', handleThemeChange);
    return () => window.removeEventListener('ishop_theme_changed', handleThemeChange);
  }, []);

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

  const accent = THEME_ACCENTS[currentTheme] || THEME_ACCENTS.titanium;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'signup' && !firstName) return;

    setIsLoading(true);

    // Simulate backend auth call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessInfo({
        email,
        isNewUser: mode === 'signup',
      });
      setShowSuccessModal(true);
      triggerConfetti();
    }, 1100);
  };

  const handleSocialLogin = (provider: 'Google' | 'Apple') => {
    setSocialLoading(provider);
    setTimeout(() => {
      setSocialLoading(null);
      setSuccessInfo({
        email: `vip.member@${provider.toLowerCase()}.com`,
        isNewUser: false,
      });
      setShowSuccessModal(true);
      triggerConfetti();
    }, 1200);
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
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 flex flex-col justify-between items-center py-5 px-4 sm:px-6 lg:px-8 selection:bg-amber-400 selection:text-black font-sans transition-colors duration-300">
      {/* Background ambient lighting - Tự động thích ứng màu nền theo Theme 2026 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Glow sa mạc chính phía trên */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[450px] bg-white/[0.04] rounded-full blur-[140px]" />
        {/* Grid pattern nhẹ nhàng tạo chiều sâu hi-tech */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      {/* Fix Autofill styling for dark theme */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #140f0a inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
        }
      `}</style>

      {/* 1. Header chuẩn nhận diện thương hiệu iShop Huy Hoàng + BỘ CHỌN BẢNG MÀU */}
      <header className="relative z-40 w-full max-w-[1180px] flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 mb-4 sm:mb-6 rounded-2xl border border-white/10 glass-panel shadow-md backdrop-blur-2xl">
        {/* Logo thương hiệu */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(226,183,116,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(226,183,116,0.55)] transition-all">
            <div className="w-full h-full bg-[#0e0b08] rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber-300 group-hover:rotate-6 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              iShop <span className="text-gradient-gold">Huy Hoàng</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Apple Flagship &amp; iCare
            </span>
          </div>
        </Link>

        {/* Badge xác thực trung tâm (Ẩn trên màn hình nhỏ) */}
        <div className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 shadow-sm text-xs font-bold backdrop-blur-md">
          <ShieldCheck className={`w-4 h-4 ${accent.accentText}`} />
          <span className="tracking-wide text-gray-200">XÁC THỰC BẢO MẬT 256-BIT</span>
        </div>

        {/* Cụm tiện ích bên phải: BẢNG MÀU + Về Cửa Hàng + Quản Trị POS */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* BỘ CHỌN BẢNG MÀU THEME 2026 - Bo góc rounded-xl đồng bộ */}
          <ThemeSwitcher dropDirection="down" buttonRounded="rounded-xl" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-amber-400/40 text-gray-200 hover:text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105"
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Về Cửa Hàng</span>
          </Link>

          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            <span>Quản Trị POS</span>
          </Link>
        </div>
      </header>

      {/* 2. Container chính: Thẻ Split Card phong cách Glass Panel thích ứng theo Theme */}
      <main className="relative z-10 w-full max-w-[1180px] my-auto">
        <div className="w-full glass-panel rounded-3xl sm:rounded-[2.5rem] p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 transition-all duration-300">
          
          {/* CỘT TRÁI: Form Xác thực (55% trên Desktop / lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-7 md:p-9">
            <div>
              {/* Nút chuyển tab dạng viên thuốc (Segmented Pill Switcher) */}
              <div className="flex justify-center mb-7">
                <div className="relative inline-flex p-1.5 bg-black/40 rounded-full border border-white/10 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`relative z-10 px-7 py-2 rounded-full text-xs sm:text-sm font-black transition-colors duration-200 ${
                      mode === 'login' ? accent.pillText : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {mode === 'login' && (
                      <motion.div
                        layoutId="activePill"
                        className={`absolute inset-0 rounded-full -z-10 ${accent.pillBg}`}
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`relative z-10 px-7 py-2 rounded-full text-xs sm:text-sm font-black transition-colors duration-200 ${
                      mode === 'signup' ? accent.pillText : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {mode === 'signup' && (
                      <motion.div
                        layoutId="activePill"
                        className={`absolute inset-0 rounded-full -z-10 ${accent.pillBg}`}
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
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Welcome! Please enter your details to login
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-400 font-normal">
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
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Create Account / Join us today
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-400 font-normal">
                        Gia nhập cộng đồng iShop VIP để nhận trợ giá thu cũ 2 triệu, bảo hành 1 đổi 1 &amp; ưu đãi linh kiện chính hãng.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form nhập liệu */}
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
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
                      <label className="block text-xs font-bold text-gray-300">
                        First Name / Họ và tên <span className={accent.accentText}>*</span>
                      </label>
                      <div className="relative">
                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${accent.accentText}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required={mode === 'signup'}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Trần Minh Quân"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium text-white placeholder:text-gray-500 hover:border-white/20 focus:bg-black/60 focus:outline-none transition-all ${accent.focusRing}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Email address <span className={accent.accentText}>*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${accent.accentText}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="quan.tran@apple.vip"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium text-white placeholder:text-gray-500 hover:border-white/20 focus:bg-black/60 focus:outline-none transition-all ${accent.focusRing}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Password <span className={accent.accentText}>*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${accent.accentText}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium text-white placeholder:text-gray-500 hover:border-white/20 focus:bg-black/60 focus:outline-none transition-all ${accent.focusRing}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors"
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
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-400/20 accent-amber-500"
                      />
                      <span className="text-xs text-gray-300 font-medium">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className={`text-xs font-bold transition-colors underline-offset-2 hover:underline ${accent.accentText}`}
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Bằng việc tạo tài khoản, bạn đồng ý với{' '}
                      <span className={`font-bold underline cursor-pointer ${accent.accentText}`}>
                        Điều khoản dịch vụ
                      </span>{' '}
                      và{' '}
                      <span className={`font-bold underline cursor-pointer ${accent.accentText}`}>
                        Chính sách bảo hành iShop
                      </span>.
                    </p>
                  </div>
                )}

                {/* Nút Submit chính có hiệu ứng loading & màu theo theme */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3.5 px-6 rounded-xl font-black text-sm active:scale-[0.99] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed group ${accent.primaryBtn}`}
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
                  <div className="border-t border-white/10 w-full" />
                  <span className={`absolute bg-[#140e0a] px-3 text-[11px] font-extrabold uppercase tracking-widest ${accent.accentText}`}>
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
                    className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.09] active:scale-[0.99] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2.5 transition-all shadow-sm"
                  >
                    {socialLoading === 'Google' ? (
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
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
                    className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.09] active:scale-[0.99] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2.5 transition-all shadow-sm"
                  >
                    {socialLoading === 'Apple' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.06-7.66-7.85-11.91-14.39-7.14-10.9-12.82-23.1-17.06-36.59-4.23-13.5-6.35-26.17-6.35-38.01 0-14.82 3.65-27.24 10.95-37.28 7.3-10.04 16.63-15.15 28-15.34 4.58 0 9.77 1.25 15.58 3.75 5.81 2.5 9.43 3.75 10.87 3.75 1.25 0 5.09-1.31 11.51-3.94 6.42-2.62 11.83-3.81 16.23-3.56 12.39.75 22.38 5.48 29.98 14.2-10.8 6.54-16.1 15.56-15.91 27.07.2 9.07 3.65 16.85 10.37 23.33 6.72 6.48 14.68 10.23 23.88 11.25-2.2 6.64-4.83 13.43-7.89 20.37zM119.22 31.81c0-7.39 2.65-14.31 7.96-20.76 5.3-6.45 11.84-10.42 19.61-11.91.49 1.48.74 3.02.74 4.62 0 7.3-2.73 14.28-8.2 20.93-5.46 6.65-12.18 10.63-20.11 11.95v-4.83z" />
                      </svg>
                    )}
                    <span>Continue with Apple</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Chân form chuyển đổi nhanh */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-gray-400">
                  Chưa có tài khoản thành viên?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`font-bold underline transition-colors ${accent.accentText}`}
                  >
                    Đăng ký tài khoản VIP
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Đã có tài khoản iShop?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`font-bold underline transition-colors ${accent.accentText}`}
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Carousel Hình ảnh Apple Flagship & Testimonial (lg:col-span-5) */}
          <div
            className="lg:col-span-5 relative rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[480px] sm:min-h-[540px] lg:min-h-[640px] flex flex-col justify-between p-6 sm:p-8 select-none group border border-white/15 shadow-2xl"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            style={{ color: '#ffffff' }}
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

            {/* Lớp phủ gradient mờ đồng bộ bảo vệ độ tương phản chữ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/35 pointer-events-none" />

            {/* Top Carousel Bar: Badge & Counter */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[11px] font-black tracking-wider uppercase text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeTestimonial.tag}</span>
              </div>

              {/* Bộ đếm số trang (01 / 03) */}
              <div className="px-3.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-xs font-mono font-bold tracking-widest text-white">
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
                  <span className="text-[11px] font-black text-amber-300 ml-1.5 tracking-wider">
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
                    <Quote className="w-8 h-8 text-amber-400/35 absolute -top-3 -left-2 -z-10" />
                    <p className="text-sm sm:text-base font-medium text-white leading-relaxed italic line-clamp-4 pt-2">
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
                  className="flex items-center gap-3.5 pt-2 border-t border-white/20"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-sm shadow-md ring-2 ring-white/40 shrink-0">
                    {activeTestimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                      {activeTestimonial.author}
                    </h4>
                    <p className="text-xs text-amber-200/90 font-medium mt-0.5">{activeTestimonial.role}</p>
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
      <footer className="relative z-10 mt-6 text-center text-xs text-gray-400 font-medium">
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
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-center overflow-hidden text-white"
            >
              {/* Decorative top accent */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

              <div className={`w-16 h-16 rounded-3xl ${accent.accentBg} border ${accent.accentBorder} ${accent.accentText} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-black text-white mb-2">
                {successInfo.isNewUser ? 'Đăng Ký Thành Viên Thành Công!' : 'Xác Thực Đăng Nhập Thành Công!'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-6">
                Chào mừng{' '}
                <span className={`font-bold ${accent.accentText}`}>{successInfo.email}</span> đã kết nối vào hệ thống iShop Huy Hoàng an toàn.
              </p>

              {/* Thẻ trạng thái phiên bảo mật */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left mb-6 space-y-2 text-xs text-gray-300">
                <div className="flex justify-between items-center">
                  <span>Trạng thái kết nối:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đã xác thực SSL 256-bit
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Thời gian phiên:</span>
                  <span className="font-mono font-bold text-white">
                    {new Date().toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bảng màu đang chọn:</span>
                  <span className={`font-bold capitalize ${accent.accentText}`}>{currentTheme}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-105 ${accent.primaryBtn}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Vào Mua Sắm</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/20"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Vào Quản Trị POS</span>
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
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-left overflow-hidden text-white"
            >
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`w-12 h-12 rounded-2xl ${accent.accentBg} border ${accent.accentBorder} ${accent.accentText} flex items-center justify-center mb-4 shadow-md`}>
                <KeyRound className="w-6 h-6" />
              </div>

              {!forgotSent ? (
                <>
                  <h3 className="text-xl font-black text-white mb-1.5">Khôi Phục Mật Khẩu</h3>
                  <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                    Nhập email tài khoản iShop của bạn. Hệ thống sẽ gửi đường dẫn khôi phục mật khẩu bảo mật trong vòng vài giây.
                  </p>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-300">
                        Email address
                      </label>
                      <div className="relative">
                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${accent.accentText}`}>
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="quan.tran@apple.vip"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium text-white placeholder:text-gray-500 focus:outline-none transition-all ${accent.focusRing}`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className={`w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-75 ${accent.primaryBtn}`}
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
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-white">Email đã được gửi!</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Vui lòng kiểm tra hộp thư đến của <span className={`font-bold ${accent.accentText}`}>{forgotEmail}</span> và làm theo hướng dẫn để tạo mật khẩu mới.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-colors border border-white/10 hover:border-white/20"
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
