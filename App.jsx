import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Plus,
  ArrowRight,
  Mic,
  Play,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';

/**
 * Custom Minimalist Geometric Outline SVG Logo
 * Phong cách Untitled UI kết hợp nhận diện thương hiệu công nghệ Apple iShop Huy Hoàng
 */
function MinimalLogo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 8V24M8 16H24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="16"
        cy="16"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * FadeInUp Scroll Reveal Wrapper Component
 * Trượt phần tử lên từ translate-y-10 và opacity-0 đến opacity-100 trong 1000ms
 */
function FadeInUp({ children, delay = 0, className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
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
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * 5 Đối Tác Công Nghệ Hàng Đầu cho Marquee Vô Hạn
 */
function BrandLogos() {
  const brands = [
    {
      name: "Apple Authorized",
      icon: (
        <svg className="h-6 w-auto" viewBox="0 0 140 32" fill="none" stroke="currentColor">
          <path d="M14 10C15 8.5 16.5 7.5 18 7.5C18.2 9 17.5 10.5 16.5 11.5C15.5 12.5 14.2 13 14 10Z" fill="currentColor" stroke="none" />
          <path d="M18.5 13C16.8 13 15.6 14 14.5 14C13.4 14 12.4 13.1 11 13.1C9 13.1 7 14.7 7 18C7 21 8.8 25.5 11 25.5C12 25.5 12.6 24.8 14.3 24.8C16 24.8 16.5 25.5 17.7 25.5C19.9 25.5 21.5 21.7 21.5 21.5C21.4 21.4 18.5 20.2 18.5 16.8C18.5 14 20.8 13.2 18.5 13Z" fill="currentColor" stroke="none" />
          <text x="32" y="21" fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="0.08em">APPLE AUTHORIZED</text>
        </svg>
      ),
    },
    {
      name: "Pisen Official",
      icon: (
        <svg className="h-6 w-auto" viewBox="0 0 130 32" fill="none" stroke="currentColor">
          <rect x="6" y="8" width="16" height="16" rx="4" strokeWidth="2" />
          <polygon points="12,12 18,16 12,20" fill="currentColor" stroke="none" />
          <text x="30" y="21" fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="0.08em">PISEN VIỆT NAM</text>
        </svg>
      ),
    },
    {
      name: "KingKong Armor",
      icon: (
        <svg className="h-6 w-auto" viewBox="0 0 130 32" fill="none" stroke="currentColor">
          <path d="M14 6L22 10V18C22 23 14 26 14 26C14 26 6 23 6 18V10L14 6Z" strokeWidth="2" strokeLinejoin="round" />
          <text x="30" y="21" fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="0.08em">KINGKONG ARMOR</text>
        </svg>
      ),
    },
    {
      name: "Anker Prime",
      icon: (
        <svg className="h-6 w-auto" viewBox="0 0 115 32" fill="none" stroke="currentColor">
          <polygon points="14,6 18,15 10,15" strokeWidth="2" strokeLinejoin="round" />
          <line x1="8" y1="20" x2="20" y2="20" strokeWidth="2" />
          <text x="28" y="21" fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="0.08em">ANKER PRIME</text>
        </svg>
      ),
    },
    {
      name: "VietQR Napas",
      icon: (
        <svg className="h-6 w-auto" viewBox="0 0 120 32" fill="none" stroke="currentColor">
          <rect x="6" y="8" width="16" height="16" rx="3" strokeWidth="2" />
          <rect x="10" y="12" width="8" height="8" fill="currentColor" stroke="none" />
          <text x="30" y="21" fill="currentColor" stroke="none" fontSize="13" fontWeight="700" letterSpacing="0.08em">VIETQR NAPAS</text>
        </svg>
      ),
    },
  ];

  // Nhân bản 4 lần để chạy vòng lặp vô hạn mượt mà không bao giờ bị đứt đoạn
  const repeatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <div className="flex w-max animate-marquee items-center text-gray-400">
      {repeatedBrands.map((brand, idx) => (
        <div
          key={`${brand.name}-${idx}`}
          className="flex-shrink-0 px-8 opacity-70 hover:opacity-100 transition-opacity"
        >
          {brand.icon}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const closeMobileMenuAndScroll = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      question: "Máy bán ra tại iShop Huy Hoàng có đúng 100% nguyên seal chưa active không?",
      answer:
        "Chính xác 100%. Mọi sản phẩm iPhone phân phối tại iShop Huy Hoàng đều nguyên đai nguyên kiện từ nhà sản xuất Apple. Khách hàng tự tay rạch seal hộp, kích hoạt máy tại bàn và kiểm tra thời hạn bảo hành 12 tháng trực tiếp trên trang chủ checkcoverage.apple.com.",
    },
    {
      question: "Chính sách bảo hành 1 đổi 1 trong 30 ngày đầu được áp dụng như thế nào?",
      answer:
        "Nếu máy phát sinh bất kỳ lỗi phần cứng nào từ nhà sản xuất trong 30 ngày đầu tiên kể từ ngày kích hoạt, bạn sẽ được đổi ngay 1 thân máy mới nguyên hộp mà không cần qua quy trình chờ đợi thẩm định bảo hành phức tạp.",
    },
    {
      question: "Dịch vụ sửa chữa iCare 30 phút có xem trực tiếp và ký tên lên linh kiện không?",
      answer:
        "Có. Tại iCare Desk, toàn bộ quy trình tháo lắp, thay màn hình OLED zin, ép kính chân không hay thay pin Pisen đều được thực hiện công khai 100% trước mắt quý khách. Khách hàng ký tên trực tiếp lên linh kiện trước khi kỹ thuật viên thao tác.",
    },
    {
      question: "Tôi có thể tra cứu bảo hành điện tử theo số IMEI mà không cần giữ hóa đơn giấy không?",
      answer:
        "Đúng vậy. Hệ thống số hóa của iShop Huy Hoàng lưu trữ dữ liệu bảo hành trọn đời theo 15 chữ số IMEI của máy. Bạn chỉ cần nhập số IMEI hoặc quét mã QR trên website để kiểm tra ngày kích hoạt và hạn bảo hành bất cứ lúc nào.",
    },
    {
      question: "Hệ thống hỗ trợ những phương thức thanh toán và chương trình trả góp nào?",
      answer:
        "Chúng tôi hỗ trợ chuyển khoản siêu tốc VietQR Napas 247 hoàn toàn miễn phí, quét mã VNPAY, thanh toán thẻ Visa/Mastercard và chương trình trả góp 0% lãi suất qua thẻ tín dụng hoặc CCCD gắn chip nhận máy ngay trong 15 phút.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-white selection:text-black font-sans scroll-smooth overflow-x-hidden">
      {/* Global CSS for Smooth Scrolling & Infinite Marquee & Luxury Serif Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap');

        html {
          scroll-behavior: smooth;
        }

        .font-serif, [class*="font-serif"] {
          font-family: 'Playfair Display', Georgia, Cambria, 'Times New Roman', serif !important;
          letter-spacing: 0 !important;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>

      {/* =========================================================================
          1. THANH ĐIỀU HƯỚNG CỐ ĐỊNH & TỰ ĐỘNG THÍCH ỨNG
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-black/85 backdrop-blur-md border-b border-white/10 shadow-2xl py-3.5'
            : 'bg-transparent border-b border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo Bên Trái */}
          <a
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="text-white group-hover:scale-105 transition-transform text-amber-400">
              <MinimalLogo className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                iShop <span className="text-amber-300 font-black">Huy Hoàng</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase -mt-0.5">
                Apple Flagship & iCare 2026
              </span>
            </div>
          </a>

          {/* Các liên kết ở giữa (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Trang Chủ
            </a>
            <a
              href="/phones"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Điện Thoại iPhone
            </a>
            <a
              href="/about"
              className="text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
            >
              Giới Thiệu Shop
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Tính Năng
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Hỏi Đáp
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Liên Hệ
            </a>
          </nav>

          {/* Nút CTA bên phải (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/"
              className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Mua iPhone 16
            </a>
          </div>

          {/* Biểu tượng Hamburger trên di động */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Di Động Thả Xuống Mượt Mà */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <a
              href="/"
              className="block w-full text-left text-base font-medium text-gray-300 hover:text-white py-2"
            >
              Trang Chủ
            </a>
            <a
              href="/phones"
              className="block w-full text-left text-base font-medium text-gray-300 hover:text-white py-2"
            >
              Điện Thoại iPhone
            </a>
            <a
              href="/about"
              className="block w-full text-left text-base font-medium text-amber-300 py-2"
            >
              Giới Thiệu Về Shop
            </a>
            <button
              onClick={() => closeMobileMenuAndScroll('features')}
              className="block w-full text-left text-base font-medium text-gray-300 hover:text-white py-2"
            >
              Tính Năng
            </button>
            <button
              onClick={() => closeMobileMenuAndScroll('faq')}
              className="block w-full text-left text-base font-medium text-gray-300 hover:text-white py-2"
            >
              Câu Hỏi Thường Gặp
            </button>
            <button
              onClick={() => closeMobileMenuAndScroll('contact')}
              className="block w-full text-left text-base font-medium text-gray-300 hover:text-white py-2"
            >
              Liên Hệ & Showroom
            </button>

            <div className="pt-4 border-t border-white/10">
              <a
                href="/"
                className="block w-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium py-3 rounded-full border border-white/10 text-center"
              >
                Mua iPhone 16 Pro Max
              </a>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. PHẦN GIỚI THIỆU / HERO (id="about")
          ========================================================================= */}
      <section
        id="about"
        className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0"
      >
        {/* Video Nền Điện Ảnh Hòa Sắc Vàng Sa Mạc & Hiệu Ứng Vignette */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover min-w-full min-h-full opacity-90 scale-105"
            src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
          />
          {/* Lớp hòa sắc tối dịu nhẹ */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Radial Vignette điện ảnh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(14,11,8,0.85)_85%,#0e0b08_100%)]" />

          {/* Lớp Phủ Gradient Tuyến Tính */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black" />

          {/* Hào quang vàng sa mạc trung tâm */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-amber-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Huy hiệu trên cùng */}
          <FadeInUp delay={100}>
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ Showroom Flagship 2026 • iShop Huy Hoàng</span>
            </div>
          </FadeInUp>

          {/* Tiêu đề chính: từ "quyết định." có font-serif italic font-normal inline-block whitespace-nowrap */}
          <FadeInUp delay={250}>
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-center leading-[1.12]">
              Đẳng cấp Apple <br className="hidden sm:inline" />
              cho những{' '}
              <span className="font-serif italic font-normal text-gray-200 inline-block whitespace-nowrap">
                quyết định.
              </span>
            </h1>
          </FadeInUp>

          {/* Chú thích: Buộc cỡ chữ chính xác là text-[16px] text-gray-400 max-w-2xl */}
          <FadeInUp delay={400}>
            <p className="text-[16px] text-gray-400 max-w-2xl text-center leading-relaxed mb-10">
              Hệ thống bán lẻ iPhone 16 Pro Max 100% nguyên seal chưa active, bảo hành 1 đổi 1 trong 30 ngày và dịch vụ sửa chữa iCare 30 phút lấy liền minh bạch số 1 TP.HCM.
            </p>
          </FadeInUp>

          {/* Nút bấm: Hàng linh hoạt - Bấm vào thẳng trang chủ */}
          <FadeInUp delay={550}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Khám Phá iPhone 16
              </a>
              <a
                href="/repair"
                className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-8 py-3.5 rounded-full border border-white/5 transition-colors"
              >
                Đặt Hẹn iCare Desk
              </a>
            </div>
          </FadeInUp>

          {/* Marquee: Đối tác công nghệ hàng đầu */}
          <div className="w-full mt-24">
            <FadeInUp delay={700}>
              <p className="text-sm text-gray-500 font-medium mb-8 text-center">
                Được các đối tác công nghệ hàng đầu & hơn 50.000 khách hàng tin dùng
              </p>

              {/* SỬA LỖI QUAN TRỌNG CHO MARQUEE: Mask-Image Linear Gradient làm mờ 2 cạnh */}
              <div
                className="w-full overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                }}
              >
                <BrandLogos />
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. TÍNH NĂNG 1: TRÒ CHUYỆN AI & SHOWROOM SỐ (id="features")
          ========================================================================= */}
      <section
        id="features"
        className="py-24 px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Văn bản bên trái */}
          <FadeInUp delay={100} className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>✨ Showroom Số & Trợ Lý Tư Vấn iShop</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
              Nơi công nghệ gặp gỡ trải nghiệm mua sắm đỉnh cao.
            </h2>

            <p className="text-gray-400 text-base leading-relaxed">
              Trợ lý thông minh giúp bạn lựa chọn phiên bản iPhone 16 Pro Max Titan Sa Mạc phù hợp nhất, so sánh dung lượng 256GB - 1TB, tính toán giá thu cũ đổi mới và kiểm tra tình trạng kho máy nguyên seal theo thời gian thực.
            </p>

            <div>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/10 transition-colors"
              >
                <span>Xem Kho Máy Nguyên Seal</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </FadeInUp>

          {/* Bản mô phỏng bên phải */}
          <FadeInUp delay={250}>
            <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative min-h-[420px] flex flex-col justify-end">
              {/* Video nền */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 object-cover w-full h-full"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4"
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Thẻ phần tử UI nổi */}
              <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative z-10 space-y-4">
                {/* Chip ở trên */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5">
                    ✨ Titan Sa Mạc 256GB
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5">
                    1 Đổi 1 trong 30 ngày
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 border border-white/5">
                    Bảo Hành IMEI 12T
                  </span>
                </div>

                {/* Ô nhập liệu ở dưới */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 text-sm">
                  <span className="text-gray-400">Hỏi tư vấn về iPhone 16 Pro Max & thu cũ đổi mới...</span>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
                      <span className="w-1 h-5 bg-amber-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse delay-150" />
                    </div>
                    <Mic className="w-4 h-4 text-gray-300 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* =========================================================================
          4. TÍNH NĂNG 2: KỸ THUẬT iCARE & QR TRACKING 30 PHÚT
          ========================================================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Bản mô phỏng bên trái */}
          <FadeInUp delay={200} className="order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative min-h-[420px] flex flex-col justify-end">
              {/* Video nền */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 object-cover w-full h-full"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4"
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Thẻ phần tử UI nổi */}
              <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative z-10 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-2.5">
                    <button className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <span className="font-semibold text-white">11:06 AM – KTV Chris (iCare Desk)</span>
                  </div>
                  <span className="font-mono text-emerald-400">01:24</span>
                </div>

                {/* Dạng sóng âm trực quan */}
                <div className="flex items-center gap-1 py-1 h-6">
                  {[4, 12, 18, 24, 16, 8, 14, 22, 10, 16, 20, 14, 6, 18, 24, 12, 16, 8, 14, 20].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}px` }}
                      className="flex-1 bg-emerald-400/80 rounded-full"
                    />
                  ))}
                </div>

                <p className="text-xs text-gray-300 bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed font-mono">
                  "Đã hoàn thành kiểm tra QC màn hình OLED zin, đo áp suất chuẩn xuất xưởng và in biên nhận K80..."
                </p>
              </div>
            </div>
          </FadeInUp>

          {/* Văn bản bên phải */}
          <FadeInUp delay={100} className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>✨ Kỹ Thuật iCare & QR Tracking 30 Phút</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
              Sửa chữa minh bạch, tốc độ và chính xác tuyệt đối.
            </h2>

            <p className="text-gray-400 text-base leading-relaxed">
              Tự động số hóa quy trình tiếp nhận trong 30 giây, in phiếu nhiệt K80 kèm mã QR tra cứu tiến độ thời gian thực. Khách hàng ngồi xem trực tiếp kỹ thuật viên thao tác, ký tên lên linh kiện và nhận máy ngay trong 30 phút.
            </p>

            <div>
              <a
                href="/repair"
                className="inline-flex items-center gap-2 bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/10 transition-colors"
              >
                <span>Đặt Lịch Sửa Chữa Ngay</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* =========================================================================
          5. MỤC CÂU HỎI THƯỜNG GẶP (id="faq")
          ========================================================================= */}
      <section
        id="faq"
        className="py-32 px-6 max-w-3xl mx-auto"
      >
        <FadeInUp>
          {/* Tiêu đề: Chúng tôi có câu trả lời */}
          <h2 className="text-4xl md:text-5xl font-semibold mb-12 text-center tracking-tight text-white">
            Chúng tôi có câu trả lời
          </h2>

          {/* Vùng chứa: border border-white/10 rounded-xl bg-transparent */}
          <div className="border border-white/10 rounded-xl bg-transparent overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const isLast = index === faqs.length - 1;

              return (
                <div
                  key={index}
                  className={`${!isLast ? 'border-b border-white/10' : ''}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
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
          6. PHẦN CHÂN TRANG (id="contact")
          ========================================================================= */}
      <footer
        id="contact"
        className="relative z-0 pt-32 pb-10 px-6 border-t border-white/5 overflow-hidden"
      >
        {/* Video nền chân trang */}
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

        {/* Nút kêu gọi hành động (CTA) */}
        <div className="max-w-4xl mx-auto text-center mb-32 relative z-10">
          <FadeInUp>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 text-white">
              Sẵn sàng sở hữu thiết bị Apple{' '}
              <span className="font-serif italic font-normal text-gray-200 inline-block whitespace-nowrap">
                đẳng cấp?
              </span>
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              >
                Mua iPhone Ngay Hôm Nay
              </a>
              <a
                href="/about"
                className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-8 py-3.5 rounded-full border border-white/5 transition-colors"
              >
                Khám Phá Showroom
              </a>
            </div>
          </FadeInUp>
        </div>

        {/* Link Grid: 4 Cột */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-24 relative z-10">
          {/* Cột 1: Logo iShop Huy Hoàng + Tuyên ngôn */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <MinimalLogo className="w-7 h-7 text-amber-400" />
              <span className="text-xl font-bold tracking-tight text-white">iShop Huy Hoàng</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Hệ thống bán lẻ thiết bị Apple chính hãng 100% nguyên seal & Trung tâm sửa chữa kỹ thuật iCare hàng đầu TP.HCM.
            </p>
          </div>

          {/* Cột 2 (Sản phẩm) */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white">Sản Phẩm Apple</div>
            <ul className="space-y-2">
              {[
                { name: 'iPhone 16 Pro Max', href: '/phones/iphone-16-pro-max' },
                { name: 'iPhone 15 Pro Series', href: '/phones' },
                { name: 'Phụ Kiện Sạc GaN Anker', href: '/accessories' },
                { name: 'Cáp Sạc & Kính Cường Lực', href: '/accessories' },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3 (Dịch Vụ & Pháp Lý) */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white">Dịch Vụ & Pháp Lý</div>
            <ul className="space-y-2">
              {[
                { name: 'Sửa Chữa iCare 30 Phút', href: '/repair' },
                { name: 'Tra Cứu Mã Phiếu (QR)', href: '/repair/tracking' },
                { name: 'Tra Cứu Bảo Hành IMEI', href: '/warranty' },
                { name: 'Chính Sách 1 Đổi 1 Trong 30 Ngày', href: '/about' },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4 (Showroom) */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white">Hệ Thống Showroom</div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>CN1: 168 Đường 3/2, Q.10, TP.HCM</li>
              <li>CN2: 45 Lê Văn Việt, TP. Thủ Đức</li>
              <li className="text-amber-300 font-mono font-bold pt-1">Hotline: 0988.888.999</li>
              <li className="text-emerald-400 font-mono">Mở cửa: 08:30 - 21:30</li>
            </ul>
          </div>
        </div>

        {/* Thanh dưới: Bố cục bản quyền */}
        <div className="border-t border-white/5 pt-8 text-xs text-gray-500 flex flex-col md:flex-row justify-center items-center gap-2 relative z-10 text-center">
          <span>© 2026 iShop Huy Hoàng Flagship. Tất cả các quyền được bảo lưu</span>
          <span className="hidden md:inline">•</span>
          <span>
            bởi <span className="text-gray-300 font-medium">Re-text</span>
          </span>
          <span className="hidden md:inline">•</span>
          <span>
            Được tạo bằng <span className="text-gray-300 font-medium">Gemini</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
