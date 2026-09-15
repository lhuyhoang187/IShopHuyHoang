'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowUp,
  Scale,
  Wrench,
  Headphones,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Search,
  Flame,
  Star,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Award,
  MapPin,
  Phone,
  Users,
  Building2,
  QrCode,
  ShoppingCart,
  Compass,
  Plus,
  Mic,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneProduct, AccessoryProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import ThemeSwitcher from '@/components/common/ThemeSwitcher';

function FadeInUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const current = domRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function BrandMarquee() {
  const brands = [
    { name: 'Apple Authorized', label: 'APPLE AUTHORIZED' },
    { name: 'Pisen Official', label: 'PISEN VIỆT NAM' },
    { name: 'KingKong Armor', label: 'KINGKONG ARMOR' },
    { name: 'Anker Prime', label: 'ANKER PRIME' },
    { name: 'VietQR Napas', label: 'VIETQR NAPAS 247' },
  ];
  const repeated = [...brands, ...brands, ...brands, ...brands];

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
      }}
    >
      <div className="flex w-max animate-marquee items-center text-gray-400">
        {repeated.map((brand, idx) => (
          <div
            key={`${brand.name}-${idx}`}
            className="flex-shrink-0 px-8 opacity-75 hover:opacity-100 transition-opacity flex items-center gap-2 font-mono text-xs tracking-widest text-gray-200 uppercase font-bold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{brand.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaggeredWords({
  text,
  startDelay = 0.5,
  stagger = 0.08,
  className = '',
}: {
  text: string;
  startDelay?: number;
  stagger?: number;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block whitespace-pre"
          style={{
            animation: 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            animationDelay: `${startDelay + index * stagger}s`,
            opacity: 0,
          }}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

export default function CustomerHomePage() {
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [heroColorIdx, setHeroColorIdx] = useState<number>(0);

  // Scroll Motion & Direction State
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const lastScrollY = useRef<number>(0);

  // Video Hero Controls
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const videoUrl = 'https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4';

  // Đảm bảo video nền luôn tự động phát (autoplay) mượt mà không bị chặn
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const loadData = () => {
    setPhones(IShopStore.getPhones());
    setAccessories(IShopStore.getAccessories());
    setCompareIds(IShopStore.getComparisonList());
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Lắng nghe thao tác cuộn con trỏ (Scroll Tracking: hướng cuộn + tiến trình % cuộn)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (currentY / totalHeight) * 100 : 0;

      setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      setShowScrollTop(currentY > 280);

      if (currentY < lastScrollY.current - 5) {
        setScrollDirection('up');
      } else if (currentY > lastScrollY.current + 5) {
        setScrollDirection('down');
      }
      lastScrollY.current = currentY;

      // Đồng bộ thanh tiến trình trên đỉnh màn hình
      const bar = document.getElementById('scroll-progress-bar');
      if (bar) {
        bar.style.transform = `scaleX(${progress / 100})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hiệu ứng cuộn con trỏ từ ngoài di chuyển vào (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll(
      '.reveal-on-scroll, .reveal-fly-left, .reveal-fly-right, .reveal-zoom-in, .reveal-fly-up'
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [phones, accessories]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const filteredPhones =
    selectedBrand === 'All'
      ? phones
      : phones.filter((p) => p.brand === selectedBrand);

  const heroPhone = phones.find((p) => p.slug === 'iphone-16-pro-max') || phones[0];
  const activeHeroColor = heroPhone?.colors[heroColorIdx] || heroPhone?.colors[0];

  return (
    <div className="space-y-28 pb-28 relative">
      {/* 0. Thanh Chỉ Báo Tiến Trình Cuộn Con Trỏ (Scroll Progress Bar 2026) */}
      <div
        id="scroll-progress-bar"
        aria-hidden="true"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Injected Custom Keyframe Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(28px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes shimmerGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(226, 183, 116, 0.25);
          }
          50% {
            box-shadow: 0 0 45px rgba(226, 183, 116, 0.55);
          }
        }

        .cta-btn-animation {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 2.3s;
          opacity: 0;
        }

        .shimmer-badge {
          animation: shimmerGlow 3s infinite ease-in-out;
        }
      `}</style>

      {/* 1. CINEMATIC VIDEO HERO SECTION - Chữ to, nổi bật, video chuyển động mượt mà */}
      <section className="hero-theme-section relative min-h-[88vh] sm:min-h-screen w-full text-white overflow-hidden flex flex-col justify-between border-b border-amber-500/20 shadow-2xl">
        {/* Full Screen Background Video */}
        {/* Cinematic Video Background with Harmonious Titanium Desert Blend */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onPlay={() => setVideoLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-90 z-0 transition-opacity duration-700"
            src={videoUrl}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          
          {/* Lớp hòa sắc tối dịu nhẹ không làm mất ánh vàng đồng của video */}
          <div className="absolute inset-0 bg-black/35 z-10" />
          
          {/* Gradient tuyến tính hòa vào nền Titanium Obsidian */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0e0b08] pointer-events-none z-10" />
          
          {/* Quầng sáng vàng sa mạc trung tâm (Desert Gold Ambient Aura) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-10" />
        </div>

        {/* Main Center Content with Word-By-Word Staggered Animation & Cỡ Chữ To Lớn */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-12 py-16 max-w-5xl mx-auto my-auto">
          {/* Top Badge */}
          <FadeInUp delay={100}>
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ Showroom Flagship 2026 • iShop Huy Hoàng</span>
            </div>
          </FadeInUp>

          {/* Main Heading */}
          <FadeInUp delay={250}>
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-center leading-[1.12] text-white">
              Đẳng cấp Apple <br className="hidden sm:inline" />
              cho những{' '}
              <span className="font-serif italic font-normal text-gray-200 inline-block whitespace-nowrap">
                quyết định.
              </span>
            </h1>
          </FadeInUp>

          {/* Secondary Text */}
          <FadeInUp delay={400}>
            <p className="text-[16px] text-gray-400 max-w-2xl text-center leading-relaxed mb-10 mx-auto">
              Hệ thống bán lẻ iPhone 16 Pro Max 100% nguyên seal chưa active, bảo hành 1 đổi 1 trong 30 ngày và dịch vụ sửa chữa iCare 30 phút lấy liền minh bạch số 1 TP.HCM.
            </p>
          </FadeInUp>

          {/* CTA Buttons - Vào thẳng trang chủ */}
          <FadeInUp delay={550}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Khám Phá iPhone 16
              </Link>
              <Link
                href="/about"
                className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-8 py-3.5 rounded-full border border-white/5 transition-colors"
              >
                Tìm Hiểu Về Shop
              </Link>
            </div>
          </FadeInUp>

          {/* Marquee: Được các nhà lãnh đạo ngành tin dùng */}
          <div className="w-full mt-20">
            <FadeInUp delay={700}>
              <p className="text-sm text-gray-500 font-medium mb-8 text-center">
                Được các nhà lãnh đạo ngành & hơn 50.000 khách hàng tin dùng
              </p>
              <BrandMarquee />
            </FadeInUp>
          </div>

          {/* 4 Feature Chips - Di chuyển vào mềm mại */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-12 w-full max-w-4xl opacity-95">
            <Link
              href="/phones/iphone-16-pro-max"
              className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-amber-500/50 backdrop-blur-md text-left transition-all group shadow-lg"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-bold text-white">iPhone 16 Pro Max</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">Titan Sa Mạc, 100% Seal</p>
            </Link>

            <Link
              href="/warranty"
              className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-emerald-500/50 backdrop-blur-md text-left transition-all group shadow-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-bold text-white">Bảo Hành IMEI</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">12 tháng 1 đổi 1 tận nơi</p>
            </Link>

            <Link
              href="/repair"
              className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-cyan-500/50 backdrop-blur-md text-left transition-all group shadow-lg"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
                <Wrench className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-bold text-white">iCare 30 Phút</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">Xem trực tiếp, lấy liền</p>
            </Link>

            <Link
              href="/checkout"
              className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-purple-500/50 backdrop-blur-md text-left transition-all group shadow-lg"
            >
              <div className="flex items-center gap-2 text-purple-400 mb-1.5">
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-bold text-white">Napas 247</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">VietQR thanh toán 0% phí</p>
            </Link>
          </div>
        </div>

        {/* Video Audio / Play Controls */}
        <div className="absolute bottom-16 right-6 z-30 flex items-center gap-2.5 p-2 rounded-full bg-black/70 border border-white/20 backdrop-blur-xl">
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
            title={isMuted ? 'Bật âm thanh video' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
            title={isPlaying ? 'Tạm dừng video' : 'Phát tiếp'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 text-amber-400" />}
          </button>
        </div>

        {/* Bottom Trust Line */}
        <div className="hero-trust-line relative z-20 w-full px-6 sm:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-300 border-t border-white/10 backdrop-blur-md font-medium">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ Thống Phân Phối Apple & Dịch Vụ iCare Chính Hãng 2026</span>
          </div>

          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-xs sm:text-sm text-gray-300">
            <span>Chi nhánh 1: 168 Đường 3/2, Q.10</span>
            <span>•</span>
            <span>Chi nhánh 2: 45 Lê Văn Việt, TP. Thủ Đức</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Hotline: 0988.888.999</span>
          </div>
        </div>
      </section>

      {/* 2. TEASER BANNER: VỀ iSHOP HUY HOÀNG - Tách ra trang riêng /about */}
      <section
        id="about-shop"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border-white/[0.12] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          {/* Subtle Background Nebula */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full badge-glow-gold text-xs sm:text-sm font-bold">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>CÂU CHUYỆN THƯƠNG HIỆU • 10 NĂM TỪ 2016</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              Về iShop Huy Hoàng <br />
              <span className="text-gradient-gold">Đẳng Cấp Apple & Dịch Vụ iCare Số 1 TP.HCM</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed">
              Hơn 10 năm phục vụ trên 50.000 khách hàng với tiêu chuẩn 100% nguyên seal chưa active, chính sách 1 đổi 1 trong 30 ngày và trung tâm kỹ thuật iCare sửa chữa minh bạch lấy liền trong 30 phút.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link
              href="/about"
              className="px-8 py-4 rounded-full bg-white text-black font-black text-sm sm:text-base hover:bg-gray-200 transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Xem Câu Chuyện & Showroom</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/15 transition-all"
            >
              4 Cam Kết Vàng
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 1: SHOWROOM SỐ & TRỢ LÝ TƯ VẤN iSHOP (id="features")
          ========================================================================= */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-28 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Văn bản bên trái: Bay từ TRÁI vào */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>✨ Showroom Số &amp; Trợ Lý Tư Vấn iShop</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
              Nơi công nghệ gặp gỡ trải nghiệm mua sắm đỉnh cao.
            </h2>

            <p className="text-gray-300 text-base leading-relaxed">
              Trợ lý thông minh giúp bạn lựa chọn phiên bản iPhone 16 Pro Max Titan Sa Mạc phù hợp nhất, so sánh dung lượng 256GB - 1TB, tính toán giá thu cũ đổi mới và kiểm tra tình trạng kho máy nguyên seal theo thời gian thực.
            </p>

            <div>
              <Link
                href="/phones"
                className="inline-flex items-center gap-2 bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/10 transition-colors group"
              >
                <span>Xem Kho Máy Nguyên Seal</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Bản mô phỏng bên phải: Bay từ PHẢI vào */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/10 relative min-h-[420px] flex flex-col justify-end shadow-2xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 object-cover w-full h-full"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4"
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Thẻ phần tử UI nổi: Thẩm định giá thu cũ & Trợ giá lên đời trực tiếp */}
              <div className="bg-[#1C1C1E]/92 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative z-10 space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5 font-semibold">
                    ✨ Titan Sa Mạc 256GB
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5 font-semibold">
                    1 Đổi 1 trong 30 ngày
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5 font-semibold">
                    Bảo Hành IMEI 12T
                  </span>
                </div>

                {/* Khối Thẩm Định Trợ Giá Thu Cũ & Trạng Thái Kho (Thay thế thanh tìm kiếm) */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Kho Sẵn Hàng • Giao Hỏa Tốc 1H
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-300 font-medium">Trợ giá lên đời:</span>
                      <span className="text-amber-400 font-black text-base sm:text-lg">
                        +2.000.000₫
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Bù chênh lệch từ 15.990.000₫ khi đổi từ iPhone 15 Pro Max
                    </p>
                  </div>

                  <Link
                    href="/compare"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Định Giá Máy Cũ</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 2: KỸ THUẬT iCARE & QR TRACKING 30 PHÚT
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Bản mô phỏng bên trái: Bay từ TRÁI vào (Phiếu Kỹ Thuật Số & Tiến Độ iCare Trực Tuyến) */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/10 relative min-h-[420px] flex flex-col justify-end shadow-2xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 object-cover w-full h-full"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4"
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Thẻ Phiếu Kỹ Thuật Số & Tiến Độ Sửa Chữa Live iCare (Thay thế thanh ghi âm) */}
              <div className="bg-[#1C1C1E]/92 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative z-10 space-y-3.5">
                {/* Header phiếu: Mã phiếu & Trạng thái Live */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-bold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>ĐANG THAO TÁC TRỰC TIẾP</span>
                    </span>
                    <span className="font-mono font-bold text-gray-300">#iCare-9824</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>22:45 / 30:00 Phút</span>
                  </div>
                </div>

                {/* Thông tin thiết bị & Kỹ thuật viên */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">iPhone 15 Pro Max (Titan Tự Nhiên)</span>
                    <span className="text-[11px] text-gray-400">KTV: Chris (Phòng Lab 01)</span>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-medium">
                    Hạng mục: Ép kính OLED zin vô trùng &amp; Test áp suất kháng nước
                  </p>
                </div>

                {/* 4 Bước Tiến Độ Thực Tế (Visual Progress Tracker) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 1. Tiếp nhận
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 2. Ký linh kiện
                    </span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> 3. Ép kính vô trùng
                    </span>
                    <span className="text-gray-500">4. Trả máy</span>
                  </div>

                  {/* Thanh tiến độ đa sắc */}
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full w-[75%] transition-all duration-500" />
                  </div>
                </div>

                {/* Dòng tóm tắt & Nút tra cứu QR phiếu K80 */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>In kèm mã QR phiếu nhiệt K80</span>
                  </div>

                  <Link
                    href="/repair/tracking"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all hover:scale-105"
                  >
                    <span>Xem Live QR</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Văn bản bên phải: Bay từ PHẢI vào */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            style={{ willChange: 'transform, opacity' }}
            className="space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>✨ Kỹ Thuật iCare &amp; QR Tracking 30 Phút</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
              Sửa chữa minh bạch, tốc độ và chính xác tuyệt đối.
            </h2>

            <p className="text-gray-300 text-base leading-relaxed">
              Tự động số hóa quy trình tiếp nhận trong 30 giây, in phiếu nhiệt K80 kèm mã QR tra cứu tiến độ thời gian thực. Khách hàng ngồi xem trực tiếp kỹ thuật viên thao tác, ký tên lên linh kiện và nhận máy ngay trong 30 phút.
            </p>

            <div>
              <Link
                href="/repair"
                className="inline-flex items-center gap-2 bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/10 transition-colors group"
              >
                <span>Đặt Lịch Sửa Chữa Ngay</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. SHOWROOM 3D INTERACTIVE HERO CARD (Bên trái bay từ TRÁI, Thẻ máy bay từ PHẢI) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center glass-panel rounded-3xl p-8 sm:p-14 border-white/[0.12] relative overflow-hidden shadow-2xl">
          {/* Cột thông tin: Bay từ Trái sang */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left reveal-fly-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-glow-gold text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>TRẢI NGHIỆM ĐỔI MÀU MÁY THỰC TẾ</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              iPhone 16 Pro Max <br />
              <span className="text-gradient-gold">Titan Sa Mạc Luxury 2026</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-200 font-normal leading-relaxed">
              Thiết kế viền mỏng nhất lịch sử Apple, màn hình Super Retina XDR 6.9 inch cùng hệ thống camera Fusion 48MP zoom quang học 5x. Bạn có thể bấm chọn màu vỏ máy bên dưới để chiêm ngưỡng ánh sáng phản chiếu trực tiếp!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3">
              <Link
                href="/phones/iphone-16-pro-max"
                className="btn-gold px-8 py-4 rounded-2xl text-sm sm:text-base flex items-center gap-2.5 font-black shadow-xl"
              >
                <span>Xem Cấu Hình & Mua Ngay</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </Link>

              <Link
                href="/compare"
                className="px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] hover:border-cyan-400/40 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-sm"
              >
                <Scale className="w-5 h-5 text-cyan-400" />
                <span>So Sánh 3 Máy</span>
              </Link>
            </div>
          </div>

          {/* Interactive 3D Card with Color Picker: Bay từ Phải sang */}
          <div className="lg:col-span-5 relative flex justify-center reveal-fly-right">
            <div className="relative w-full max-w-md">
              <div
                style={{
                  boxShadow: `0 0 85px 12px ${
                    heroColorIdx === 0
                      ? 'rgba(226, 183, 116, 0.35)'
                      : 'rgba(59, 130, 246, 0.3)'
                  }`,
                }}
                className="rounded-3xl transition-all duration-500"
              >
                <div className="glass-card rounded-3xl p-7 border-white/[0.15] relative overflow-hidden backdrop-blur-2xl">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-gradient-to-b from-[#151c36] to-[#0d1224] p-5 flex items-center justify-center">
                    <img
                      key={activeHeroColor?.imageUrl}
                      src={activeHeroColor?.imageUrl}
                      alt={heroPhone?.name}
                      className="w-full h-full object-contain hover:scale-105 transition-all duration-500 animate-in fade-in"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/30">
                      HOT NHẤT 2026
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{heroPhone?.name}</h3>
                      <p className="text-sm text-amber-300 font-semibold mt-0.5">
                        {activeHeroColor?.name} • 256GB
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm text-gray-500 line-through block">36.990.000đ</span>
                      <span className="text-2xl font-black text-amber-400">34.990.000đ</span>
                    </div>
                  </div>

                  {/* Interactive Color Switcher */}
                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-sm text-gray-200">
                    <span className="text-xs sm:text-sm text-gray-300 font-semibold">Bấm chọn màu vỏ máy:</span>
                    <div className="flex items-center gap-2.5">
                      {heroPhone?.colors.map((c, idx) => (
                        <button
                          key={c.id}
                          onClick={() => setHeroColorIdx(idx)}
                          title={c.name}
                          style={{ backgroundColor: c.hex }}
                          className={`w-7 h-7 rounded-full border transition-all ${
                            heroColorIdx === idx
                              ? 'border-amber-400 scale-125 shadow-[0_0_15px_rgba(226,183,116,0.85)]'
                              : 'border-white/30 opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FLASH SALE BANNER NEON - Phóng to và phát sáng từ trung tâm */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal-zoom-in">
        <div className="relative rounded-3xl p-7 sm:p-11 bg-gradient-to-r from-[#380e18]/90 via-[#271440]/85 to-[#101630] border border-red-500/40 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)]">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/25 text-red-200 font-black text-xs sm:text-sm border border-red-500/40 animate-pulse">
                <Flame className="w-4 h-4 text-red-400 fill-red-400" />
                <span>FLASH SALE GIỜ VÀNG HÔM NAY</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Giảm Đến 2.000.000đ Cho Khách Hàng Đặt Trước Qua VietQR
              </h3>
              <p className="text-sm sm:text-base text-gray-200 font-normal">
                Tặng kèm củ sạc GaN 65W + Kính cường lực KingKong + Voucher sửa chữa iCare trị giá 500.000đ.
              </p>
            </div>

            <Link
              href="/phones"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm sm:text-base shadow-xl shadow-red-600/35 shrink-0 transition-transform hover:scale-105"
            >
              Săn Deal Ngay ⚡
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SHOWROOM DANH SÁCH MÁY MỚI (Tồn kho & IMEI Thực tế) - Di chuyển từ TRÁI và PHẢI so le */}
      <section
        id="phones-showroom"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9 scroll-mt-28"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 reveal-fly-left">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">
              Showroom Apple Flagship
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1">
              Kho Điện Thoại iPhone Mới 100%
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mt-1.5">
              Quản lý chính xác từng số IMEI cụ thể, tự động kích hoạt bảo hành điện tử 12 tháng.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:text-base">
            {['All', 'Apple'].map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                  selectedBrand === brand
                    ? 'btn-gold'
                    : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {brand === 'All' ? 'Tất cả model' : brand}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredPhones.map((phone, idx) => {
            const isComparing = compareIds.includes(phone.id);
            // So le: chẵn từ TRÁI sang, lẻ từ PHẢI sang
            const flyClass = idx % 2 === 0 ? 'reveal-fly-left' : 'reveal-fly-right';

            return (
              <div
                key={phone.id}
                style={{ transitionDelay: `${(idx % 3) * 150}ms` }}
                className={`glass-card rounded-3xl p-7 border-white/[0.08] hover:border-amber-500/30 flex flex-col justify-between transition-all duration-300 group ${flyClass}`}
              >
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-[#141b34] to-[#0d1224] mb-6 p-5 flex items-center justify-center">
                    <img
                      src={phone.colors[0]?.imageUrl}
                      alt={phone.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Mới 100% Nguyên Seal
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-300 font-semibold">{phone.brand}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ● Sẵn hàng tại quầy
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                    {phone.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-2.5">
                    {phone.colors.map((c) => (
                      <span
                        key={c.id}
                        style={{ backgroundColor: c.hex }}
                        className="w-4 h-4 rounded-full border border-white/30"
                        title={c.name}
                      />
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs sm:text-sm text-gray-400 block">Giá niêm yết từ:</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400">
                        {formatVND(phone.capacities[0]?.price || 0)}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                      {formatVND(phone.capacities[0]?.originalPrice || (phone.capacities[0]?.price || 0) * 1.08)}
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/phones/${phone.slug}`}
                      className="btn-gold py-3 rounded-xl text-sm font-black text-center flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Xem Chi Tiết</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => {
                        IShopStore.toggleComparison(phone.id);
                        setCompareIds(IShopStore.getComparisonList());
                      }}
                      className={`py-3 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        isComparing
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                          : 'bg-white/[0.05] text-gray-200 border-white/10 hover:bg-white/[0.1]'
                      }`}
                    >
                      <Scale className="w-4 h-4" />
                      <span>{isComparing ? 'Đang so sánh' : 'So sánh'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. DỊCH VỤ SỬA CHỮA iCARE & TRA CỨU TIẾN ĐỘ QR (Nội dung từ Trái, Phiếu từ Phải) */}
      <section
        id="icare-desk"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28"
      >
        <div className="glass-panel rounded-3xl p-8 sm:p-14 border-white/[0.12] relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Cột mô tả iCare: Bay từ TRÁI vào */}
            <div className="lg:col-span-6 space-y-6 reveal-fly-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full badge-glow-violet text-xs sm:text-sm font-bold">
                <Wrench className="w-4 h-4 text-purple-300" />
                <span>TRUNG TÂM KỸ THUẬT iCARE CHUYÊN SÂU</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Sửa Chữa Lấy Ngay Trong 30 Phút <br />
                <span className="text-gradient-amethyst">Theo Dõi Tiến Độ Bằng Mã QR</span>
              </h2>

              <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-normal">
                Mỗi lượt sửa chữa đều được in một phiếu biên nhận nhiệt K80 có kèm **Mã QR Tra Cứu**. Khách hàng chỉ cần quét mã bằng điện thoại là có thể theo dõi từng bước thay màn hình, ép kính, thay pin theo thời gian thực!
              </p>

              <div className="space-y-3 text-sm sm:text-base text-gray-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Linh kiện zin bóc máy / Pin Pisen chính hãng bảo hành 12 tháng.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Xem trực tiếp quá trình tháo lắp, ký tên lên linh kiện an tâm 100%.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Tuyệt đối không phát sinh phụ phí ngoài báo giá niêm yết.</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/repair"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
                >
                  Xem Bảng Giá & Đặt Hẹn
                </Link>

                <Link
                  href="/repair/tracking"
                  className="px-7 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-sm sm:text-base transition-all"
                >
                  Tra Cứu Mã Phiếu (QR)
                </Link>
              </div>
            </div>

            {/* Right Preview Card of Repair Cyber Stepper: Bay từ PHẢI vào */}
            <div className="lg:col-span-6 bg-[#10162e] rounded-3xl p-7 border border-white/[0.12] shadow-2xl space-y-5 reveal-fly-right">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white">Phiếu Tiếp Nhận: SC-2608-001</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                  Đang sửa chữa
                </span>
              </div>

              <div className="space-y-4 py-2">
                {[
                  { step: '1. Tiếp nhận máy & Chụp ảnh tình trạng', done: true, time: '09:15' },
                  { step: '2. Kiểm tra kỹ thuật & Báo giá khách duyệt', done: true, time: '09:30' },
                  { step: '3. Xuất kho màn hình OLED zin & Thao tác', current: true, time: '10:10' },
                  { step: '4. Kiểm tra QC xuất xưởng & Đo áp suất', done: false, time: 'Dự kiến 11:00' },
                  { step: '5. Sẵn sàng bàn giao kèm hóa đơn K80', done: false, time: 'Dự kiến 11:30' },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.done
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : s.current
                            ? 'bg-cyan-500 text-black font-black animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : 'bg-white/10 text-gray-500'
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={
                          s.current
                            ? 'text-cyan-300 font-bold'
                            : s.done
                            ? 'text-gray-200 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {s.step}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400 font-mono">{s.time}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/[0.08] text-center">
                <Link
                  href="/repair/tracking?code=SC-2608-001"
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1.5"
                >
                  <span>Thử tra cứu trực tiếp phiếu này</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MỤC CÂU HỎI THƯỜNG GẶP (id="faq")
          ========================================================================= */}
      <section
        id="faq"
        className="py-32 px-6 max-w-3xl mx-auto scroll-mt-28"
      >
        <FadeInUp>
          {/* Tiêu đề: Chúng tôi có câu trả lời */}
          <h2 className="text-4xl md:text-5xl font-semibold mb-12 text-center tracking-tight text-white">
            Chúng tôi có câu trả lời
          </h2>

          {/* Vùng chứa: border border-white/10 rounded-xl bg-transparent */}
          <div className="border border-white/10 rounded-xl bg-transparent overflow-hidden">
            {[
              {
                question: 'Dữ liệu và thiết bị của tôi có được bảo mật an toàn 100% không?',
                answer:
                  'Hoàn toàn an toàn. Mọi giao dịch, lịch sử bảo hành theo số IMEI và quy trình tiếp nhận sửa chữa iCare đều được mã hóa trên nền tảng đám mây. Khách hàng ký tên trực tiếp lên linh kiện trước khi kỹ thuật viên thao tác và theo dõi minh bạch qua mã QR.',
              },
              {
                question: 'Chính sách 1 đổi 1 trong 30 ngày đầu được áp dụng như thế nào?',
                answer:
                  'Tất cả sản phẩm điện thoại iPhone mới nguyên seal bán ra tại hệ thống nếu phát sinh bất kỳ lỗi phần cứng nào từ nhà sản xuất trong 30 ngày đầu tiên, bạn sẽ được đổi ngay một máy mới nguyên hộp mà không mất thời gian chờ đợi thẩm định phức tạp.',
              },
              {
                question: 'Dịch vụ sửa chữa iCare 30 phút có phát sinh thêm phụ phí không?',
                answer:
                  'Tuyệt đối không. Bảng giá thay màn hình, ép kính, thay pin Pisen chính hãng tại iCare Desk được niêm yết công khai và báo trọn gói trước khi khách duyệt. Mọi bước kỹ thuật đều in rõ ràng trên hóa đơn nhiệt K80.',
              },
              {
                question: 'Tôi có thể tra cứu bảo hành mà không cần giữ lại hóa đơn giấy không?',
                answer:
                  'Có. Hệ thống quản lý thông minh 2.0 lưu trữ bảo hành điện tử trọn đời theo 15 số IMEI của máy. Bạn chỉ cần nhập IMEI trên website hoặc quét mã QR là có thể tra cứu ngày kích hoạt và thời hạn bảo hành bất cứ lúc nào.',
              },
              {
                question: 'Hệ thống hỗ trợ những phương thức thanh toán và trả góp nào?',
                answer:
                  'Chúng tôi hỗ trợ chuyển khoản siêu tốc VietQR Napas 247 hoàn toàn 0% phí, quét mã VNPAY, thẻ Visa/Mastercard và chương trình trả góp 0% lãi suất qua thẻ tín dụng hoặc CCCD gắn chip lấy máy ngay trong 15 phút.',
              },
            ].map((faq, index, arr) => {
              const isOpen = openFaqIndex === index;
              const isLast = index === arr.length - 1;

              return (
                <div
                  key={index}
                  className={`${!isLast ? 'border-b border-white/10' : ''}`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full py-6 px-6 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className="text-base text-white font-medium group-hover:text-gray-200 transition-colors pr-4">
                      {faq.question}
                    </span>

                    <span
                      className={`text-gray-400 transition-transform duration-300 transform shrink-0 ${
                        isOpen ? 'rotate-45 text-white' : 'rotate-0'
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-gray-400 text-sm pb-6 px-6 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </section>

      {/* =========================================================================
          PHẦN CHÂN TRANG CTA (id="contact")
          ========================================================================= */}
      <section
        id="contact"
        className="relative z-0 pt-32 pb-16 px-6 border-t border-white/5 overflow-hidden scroll-mt-28"
      >
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40"
            src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <FadeInUp>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 text-white">
              Sẵn sàng sở hữu thiết bị Apple{' '}
              <span className="font-serif italic font-normal text-gray-200 inline-block whitespace-nowrap">
                đẳng cấp?
              </span>
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              >
                Mua iPhone Ngay Hôm Nay
              </Link>
              <Link
                href="/about"
                className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-8 py-3.5 rounded-full border border-white/5 transition-colors"
              >
                Khám Phá Showroom
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 7. THANH ĐIỀU KHIỂN NỔI THÔNG MINH KHI CUỘN (Cyber Floating Scroll Cockpit) */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-2 rounded-full bg-[#120e0a]/92 border border-amber-500/30 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] animate-in slide-in-from-bottom-5 duration-300">
          {/* Scroll percentage badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{scrollProgress}%</span>
          </div>

          {/* Quick Theme Switcher (Mở hướng lên trên để không bị che khuất) */}
          <ThemeSwitcher dropDirection="up" />

          {/* Quick Anchor Jumps */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-300 font-semibold px-1">
            <a
              href="#about-shop"
              className="px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            >
              Về Shop
            </a>
            <a
              href="#phones-showroom"
              className="px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            >
              iPhone
            </a>
            <a
              href="#icare-desk"
              className="px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            >
              iCare
            </a>
          </div>

          {/* Back to Top button */}
          <button
            onClick={scrollToTop}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center gap-1 transition-all shadow-md shadow-amber-500/30 hover:scale-105 active:scale-95"
            title="Cuộn lên đầu trang"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline">Lên Đầu</span>
          </button>
        </div>
      )}
    </div>
  );
}
