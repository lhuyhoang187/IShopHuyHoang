import React from 'react';
import Link from 'next/link';
import {
  Smartphone,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Clock,
  Wrench,
  Sparkles,
  User,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#080c18] border-t border-white/[0.1] text-gray-400 text-xs mt-24 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 4 Value Pillars - 2026 Cyber-Luxe Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-white/[0.06] relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3.5 border-white/[0.06] hover:border-amber-500/40">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-[0_0_15px_rgba(226,183,116,0.15)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">100% Máy Mới Nguyên Seal</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Tem phân phối chính ngạch, kích hoạt bảo hành điện tử IMEI theo tên bạn.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-start gap-3.5 border-white/[0.06] hover:border-emerald-500/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">1 Đổi 1 Trong 30 Ngày</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Đổi ngay thân máy mới nếu lỗi kỹ thuật từ nhà sản xuất, không chờ đợi.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-start gap-3.5 border-white/[0.06] hover:border-cyan-500/40">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">Giao Siêu Tốc 1 Giờ</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Giao hỏa tốc nội thành TP.HCM & Hà Nội, miễn phí đóng thùng bảo hiểm toàn quốc.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-start gap-3.5 border-white/[0.06] hover:border-purple-500/40">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-1">iCare Sửa Chữa Minh Bạch</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Xem trực tiếp quy trình, in biên nhận QR tra cứu tiến độ 6 bước thời gian thực.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-black">
                <Smartphone className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                iShop <span className="text-gradient-gold">Huy Hoàng</span>
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-gray-400">
              Hệ sinh thái công nghệ chuẩn mực cao: Bán lẻ Điện thoại mới 100% chính hãng, Phụ kiện tuyển chọn & Trung tâm kỹ thuật iCare Service.
            </p>
            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Showroom 1: 168 Đường 3/2, Phường 12, Quận 10, TP.HCM</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Showroom 2: 45 Lê Văn Việt, Hiệp Phú, TP. Thủ Đức</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[11px] text-amber-400">
              Sản Phẩm & So Sánh
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/phones" className="hover:text-amber-300 transition-colors">
                  iPhone 16 Pro Max Titan Sa Mạc
                </Link>
              </li>
              <li>
                <Link href="/phones" className="hover:text-amber-300 transition-colors">
                  Samsung Galaxy S24 Ultra & Fold6
                </Link>
              </li>
              <li>
                <Link href="/accessories" className="hover:text-amber-300 transition-colors">
                  Củ sạc GaN 65W & Pin sạc MagSafe
                </Link>
              </li>
              <li>
                <Link href="/accessories" className="hover:text-amber-300 transition-colors">
                  Kính KingKong & Phụ kiện cao cấp
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-cyan-400 transition-colors font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  So sánh 3 máy song song
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Repair Desk */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[11px] text-cyan-400">
              Tra Cứu &amp; Dịch Vụ
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 font-bold text-amber-300/90">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Hồ sơ hội viên &amp; Thẻ VIP tích điểm
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Tra cứu bảo hành điện tử (IMEI)
                </Link>
              </li>
              <li>
                <Link href="/repair/tracking" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Tra cứu tiến độ sửa chữa (Mã QR)
                </Link>
              </li>
              <li>
                <Link href="/repair" className="hover:text-cyan-300 transition-colors">
                  Bảng giá thay pin, ép kính, màn hình
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-300 transition-colors">
                  Giới thiệu hệ sinh thái Apple &amp; Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Working Hours */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase text-[11px] text-emerald-400">
              Tổng Đài Hỗ Trợ Khách Hàng
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Mua hàng & Tư vấn: <strong className="text-white font-mono">0988.888.999</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Kỹ thuật & Sửa chữa: <strong className="text-white font-mono">0909.123.456</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Mở cửa: 08:30 - 21:30 (Cả T7 & CN)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>Email: contact@ishophuyhoang.vn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Slogan thương hiệu & Liên kết nội bộ kín đáo */}
      <div className="bg-[#020306] border-t border-white/[0.04] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400 font-medium">
          <span>© 2026 <span className="text-white font-bold">iShop Huy Hoàng</span> - Đỉnh Cao Công Nghệ &amp; Dịch Vụ Chuyên Nghiệp</span>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Bảo mật thông tin 100%</span>
            <span>•</span>
            <span>Hệ thống phân phối Apple chính hãng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
