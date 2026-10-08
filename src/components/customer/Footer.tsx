import React from 'react';
import Link from 'next/link';
import {
  Smartphone,
  ShieldCheck,
  Truck,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Clock,
  Wrench,
  User,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-rose-50/95 border-t-2 border-amber-300 text-slate-700 text-xs mt-24 relative overflow-hidden shadow-[0_-15px_40px_rgba(245,158,11,0.15)]">
      {/* Radiant Gold Metallic Top Divider Line - Distinct Separation */}
      <div className="w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-sm" />

      {/* Subtle Warm Ambient Glows (matching Flash Sale card aura) */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* 4 Value Pillars - Elevated Luxury Warm Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-amber-200/80 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="footer-card rounded-2xl p-4.5 flex items-start gap-3.5 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/80 group-hover:scale-110 transition-transform shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold text-sm mb-1 tracking-tight">100% Máy Mới Nguyên Seal</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Tem phân phối chính ngạch, kích hoạt bảo hành điện tử IMEI theo tên bạn.
              </p>
            </div>
          </div>

          <div className="footer-card rounded-2xl p-4.5 flex items-start gap-3.5 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 border border-orange-300/80 group-hover:scale-110 transition-transform shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold text-sm mb-1 tracking-tight">1 Đổi 1 Trong 30 Ngày</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Đổi ngay thân máy mới nếu lỗi kỹ thuật từ nhà sản xuất, không chờ đợi.
              </p>
            </div>
          </div>

          <div className="footer-card rounded-2xl p-4.5 flex items-start gap-3.5 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300/80 group-hover:scale-110 transition-transform shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold text-sm mb-1 tracking-tight">Giao Siêu Tốc 1 Giờ</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Giao hỏa tốc nội thành TP.HCM &amp; Hà Nội, miễn phí đóng thùng bảo hiểm toàn quốc.
              </p>
            </div>
          </div>

          <div className="footer-card rounded-2xl p-4.5 flex items-start gap-3.5 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/80 group-hover:scale-110 transition-transform shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-extrabold text-sm mb-1 tracking-tight">iCare Sửa Chữa Minh Bạch</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Xem trực tiếp quy trình, in biên nhận QR tra cứu tiến độ 6 bước thời gian thực.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black shadow-md shadow-amber-500/30">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                <span>iShop </span>
                <span className="text-amber-600 font-black">Huy Hoàng</span>
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-600 font-medium">
              Hệ sinh thái công nghệ chuẩn mực cao: Bán lẻ Điện thoại mới 100% chính hãng, Phụ kiện tuyển chọn &amp; Trung tâm kỹ thuật iCare Service.
            </p>
            <div className="space-y-2 pt-1 text-[11px] text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Showroom 1: 168 Đường 3/2, Phường 12, Quận 10, TP.HCM</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Showroom 2: 45 Lê Văn Việt, Hiệp Phú, TP. Thủ Đức</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-slate-900 font-black text-xs mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500 inline-block shadow-sm" />
              <span>Sản Phẩm &amp; So Sánh</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/phones" className="text-slate-600 hover:text-amber-700 hover:font-bold font-medium transition-colors block py-0.5">
                  iPhone 16 Pro Max Titan Sa Mạc
                </Link>
              </li>
              <li>
                <Link href="/phones" className="text-slate-600 hover:text-amber-700 hover:font-bold font-medium transition-colors block py-0.5">
                  Samsung Galaxy S24 Ultra &amp; Fold6
                </Link>
              </li>
              <li>
                <Link href="/accessories" className="text-slate-600 hover:text-amber-700 hover:font-bold font-medium transition-colors block py-0.5">
                  Củ sạc GaN 65W &amp; Pin sạc MagSafe
                </Link>
              </li>
              <li>
                <Link href="/accessories" className="text-slate-600 hover:text-amber-700 hover:font-bold font-medium transition-colors block py-0.5">
                  Kính KingKong &amp; Phụ kiện cao cấp
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-sky-700 hover:text-sky-800 font-bold flex items-center gap-1.5 transition-colors pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  So sánh 3 máy song song
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Repair Desk */}
          <div>
            <h4 className="text-slate-900 font-black text-xs mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 inline-block shadow-sm" />
              <span>Tra Cứu &amp; Dịch Vụ</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account" className="text-amber-800 hover:text-amber-900 transition-colors flex items-center gap-1.5 font-bold">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  Hồ sơ hội viên &amp; Thẻ VIP tích điểm
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Tra cứu bảo hành điện tử (IMEI)
                </Link>
              </li>
              <li>
                <Link href="/repair/tracking" className="text-sky-700 hover:text-sky-800 transition-colors flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Tra cứu tiến độ sửa chữa (Mã QR)
                </Link>
              </li>
              <li>
                <Link href="/repair" className="text-slate-600 hover:text-slate-900 hover:font-bold font-medium transition-colors block py-0.5">
                  Bảng giá thay pin, ép kính, màn hình
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-600 hover:text-slate-900 hover:font-bold font-medium transition-colors block py-0.5">
                  Giới thiệu hệ sinh thái Apple &amp; Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support Hotline */}
          <div>
            <h4 className="text-slate-900 font-black text-xs mb-4 tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500 inline-block shadow-sm" />
              <span>Tổng Đài Hỗ Trợ Khách Hàng</span>
            </h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mua hàng &amp; Tư vấn: <strong className="text-amber-700 font-mono font-bold text-sm">0988.888.999</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Kỹ thuật &amp; Sửa chữa: <strong className="text-amber-700 font-mono font-bold text-sm">0909.123.456</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Mở cửa: 08:30 - 21:30 (Cả T7 &amp; CN)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Email: contact@ishophuyhoang.vn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Warm Amber Copyright Section */}
      <div className="footer-bottom-bar bg-amber-100/70 border-t border-amber-200/80 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 font-semibold">
          <span>
            © 2026 <strong className="text-slate-900 font-black">iShop Huy Hoàng</strong> - Đỉnh Cao Công Nghệ &amp; Dịch Vụ Chuyên Nghiệp
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Bảo mật thông tin 100%</span>
            <span>•</span>
            <span>Hệ thống phân phối Apple chính hãng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
