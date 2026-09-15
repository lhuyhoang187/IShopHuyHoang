import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Award,
  Users,
  Star,
  ArrowRight,
  Truck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giới Thiệu iShop Huy Hoàng - 10 Năm Khẳng Định Uy Tín Apple & iCare',
  description:
    'Khám phá câu chuyện thương hiệu, tiêu chuẩn bán lẻ iPhone 100% nguyên seal, cam kết 1 đổi 1 trong 30 ngày và trung tâm kỹ thuật sửa chữa iCare 30 phút tại TP.HCM.',
};

export default function AboutPage() {
  const milestones = [
    {
      year: '2016',
      title: 'Thành Lập Cửa Hàng Đầu Tiên',
      desc: 'Khởi đầu tại đường 3/2, Quận 10 với mục tiêu mang đến cho người dùng thiết bị Apple nguyên seal chuẩn quốc tế và sự minh bạch tuyệt đối.',
    },
    {
      year: '2019',
      title: 'Mở Rộng Chi Nhánh Thủ Đức',
      desc: 'Khai trương chi nhánh thứ 2 tại 45 Lê Văn Việt, mở rộng dịch vụ tiếp cận hàng chục ngàn khách hàng khu vực phía Đông TP.HCM.',
    },
    {
      year: '2022',
      title: 'Tiên Phong Trung Tâm Sửa Chữa iCare',
      desc: 'Chuẩn hóa quy trình sửa chữa xem trực tiếp lấy liền trong 30 phút, ký tên lên linh kiện và cam kết 100% linh kiện chính hãng.',
    },
    {
      year: '2026',
      title: 'Chuyển Đổi Số Toàn Diện 2.0',
      desc: 'Ra mắt hệ thống quản lý bảo hành điện tử qua IMEI, phiếu in nhiệt K80 kèm mã QR tra cứu tiến độ thời gian thực và thanh toán VietQR Napas 247.',
    },
  ];

  const commitments = [
    {
      icon: ShieldCheck,
      color: 'from-amber-500 to-amber-600',
      title: '100% Máy Mới Nguyên Seal Chưa Active',
      desc: 'Tất cả iPhone bán ra đều nguyên đai nguyên kiện từ Apple. Khách hàng tự tay khui seal hộp và kích hoạt kiểm tra ngày bảo hành trực tiếp trên hệ thống Apple toàn cầu.',
    },
    {
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
      title: 'Chính Sách 1 Đổi 1 Trong 30 Ngày',
      desc: 'Nếu phát sinh bất kỳ lỗi phần cứng nào từ nhà sản xuất trong 30 ngày đầu tiên, bạn được đổi ngay một máy mới nguyên hộp mà không mất thời gian chờ thẩm định.',
    },
    {
      icon: Wrench,
      color: 'from-cyan-500 to-cyan-600',
      title: 'Dịch Vụ iCare Sửa Chữa 30 Phút',
      desc: 'Kỹ thuật viên thao tác minh bạch trước mắt khách hàng. Khách được ký tên lên toàn bộ linh kiện zin và theo dõi tiến độ thời gian thực qua mã QR trên phiếu nhiệt K80.',
    },
    {
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      title: 'Bảo Hành Điện Tử IMEI Trọn Đời',
      desc: 'Không lo mất hóa đơn giấy. Mọi giao dịch được lưu trữ trên nền tảng đám mây bảo mật cao, tra cứu chỉ trong 1 giây bằng cách nhập số IMEI của thiết bị.',
    },
  ];

  return (
    <div className="min-h-screen text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
      {/* 1. HERO BANNER: CÂU CHUYỆN THƯƠNG HIỆU */}
      <section className="relative rounded-[2.5rem] overflow-hidden p-8 sm:p-16 border border-white/10 shadow-2xl bg-gradient-to-b from-[#0e162e] via-[#090e1c] to-[#060810]">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-amber-500/30 text-xs sm:text-sm text-amber-300 font-bold backdrop-blur-md">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>CÂU CHUYỆN THƯƠNG HIỆU • HÀNH TRÌNH 10 NĂM UY TÍN</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            Kiến Tạo Chuẩn Mực <br />
            <span className="text-gradient-gold">Bán Lẻ & Dịch Vụ Apple 2026</span>
          </h1>

          <p className="text-base sm:text-xl text-gray-300 leading-relaxed font-normal max-w-3xl">
            Được thành lập từ năm 2016 tại TP. Hồ Chí Minh, <strong className="text-white font-bold">iShop Huy Hoàng</strong> đã phục vụ hơn 50.000 khách hàng với tôn chỉ: <span className="text-white font-semibold">"Sản phẩm chuẩn mực, kỹ thuật minh bạch và dịch vụ tận tâm"</span>. Chúng tôi không chỉ bán một chiếc iPhone, chúng tôi trao gửi sự an tâm tuyệt đối trong suốt vòng đời sử dụng máy.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/"
              className="px-8 py-4 rounded-full bg-white text-black font-black text-sm sm:text-base hover:bg-gray-200 transition-all shadow-lg hover:scale-105"
            >
              Khám Phá iPhone
            </Link>
            <Link
              href="/repair"
              className="px-8 py-4 rounded-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white font-bold text-sm sm:text-base border border-white/10 transition-all hover:scale-105"
            >
              Đặt Hẹn Sửa Chữa iCare
            </Link>
          </div>
        </div>

        {/* 3 Stats Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 border-t border-white/10 mt-12">
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center sm:text-left">
            <div className="text-4xl sm:text-5xl font-black text-amber-400">10+ Năm</div>
            <div className="text-sm text-gray-300 font-semibold mt-1">Phục vụ tận tâm từ 2016</div>
            <p className="text-xs text-gray-400 mt-2">Hơn một thập kỷ khẳng định thương hiệu uy tín hàng đầu TP.HCM.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center sm:text-left">
            <div className="text-4xl sm:text-5xl font-black text-emerald-400">50.000+</div>
            <div className="text-sm text-gray-300 font-semibold mt-1">Khách hàng tin tưởng</div>
            <p className="text-xs text-gray-400 mt-2">Phục vụ hàng chục ngàn cá nhân, doanh nghiệp và người sáng tạo nội dung.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center sm:text-left">
            <div className="text-4xl sm:text-5xl font-black text-cyan-400">99.8%</div>
            <div className="text-sm text-gray-300 font-semibold mt-1">Đánh giá hài lòng 5 sao</div>
            <p className="text-xs text-gray-400 mt-2">Chính sách 1 đổi 1 trong 30 ngày và kiểm tra minh bạch trước mắt khách.</p>
          </div>
        </div>
      </section>

      {/* 2. BỐN CAM KẾT VÀNG */}
      <section className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-amber-500/30 text-xs font-bold text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>GIÁ TRỊ CỐT LÕI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            4 Cam Kết Vàng Làm Nên Thương Hiệu
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Mỗi chính sách bán hàng và dịch vụ tại iShop Huy Hoàng đều được thiết kế vì quyền lợi cao nhất của khách hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {commitments.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-3xl p-8 border-white/10 space-y-4 hover:border-amber-400/50 transition-all hover:scale-[1.02]"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{c.title}</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. LỊCH SỬ PHÁT TRIỂN (TIMELINE 2016 - 2026) */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Hành Trình 10 Năm Phát Triển
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Từng bước nỗ lực hoàn thiện để trở thành hệ thống bán lẻ và sửa chữa Apple được yêu thích nhất.
          </p>
        </div>

        <div className="relative border-l-2 border-amber-500/40 ml-4 sm:ml-32 space-y-12 pl-6 sm:pl-10">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-amber-400 border-4 border-black group-hover:scale-125 transition-transform shadow-[0_0_15px_rgba(226,183,116,0.8)]" />

              <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-2 hover:border-amber-400/50 transition-all">
                <div className="text-sm font-black text-amber-400 font-mono tracking-wider">{m.year}</div>
                <h4 className="text-xl font-bold text-white">{m.title}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HỆ THỐNG SHOWROOM TRẢI NGHIỆM TẠI TP.HCM */}
      <section className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-cyan-500/30 text-xs font-bold text-cyan-300">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>ĐỊA ĐIỂM SHOWROOM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Trải Nghiệm Trực Tiếp Tại Showroom
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Không gian trải nghiệm máy lạnh chuẩn quốc tế, trang bị đầy đủ máy mẫu trải nghiệm và khu vực iCare Desk sửa chữa xem trực tiếp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Showroom 1 */}
          <div className="glass-panel rounded-3xl p-8 border-white/10 space-y-6 hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                Chi Nhánh 1 (Quận 10)
              </span>
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Đang mở cửa
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">iShop Huy Hoàng - Đường 3/2</h3>
              <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                Số 168 Đường 3/2, Phường 12, Quận 10, TP. Hồ Chí Minh
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hotline: <strong className="text-white font-mono">0988.888.999</strong> (Phím 1)</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Giờ mở cửa: 08:30 - 21:30 (Cả Thứ 7 & Chủ Nhật)</span>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Có phòng kỹ thuật iCare Desk sửa lấy liền 30 phút</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300"
              >
                <span>Xem bản đồ chỉ đường Google Maps</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Showroom 2 */}
          <div className="glass-panel rounded-3xl p-8 border-white/10 space-y-6 hover:border-cyan-400/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/30">
                Chi Nhánh 2 (TP. Thủ Đức)
              </span>
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Đang mở cửa
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">iShop Huy Hoàng - Thủ Đức</h3>
              <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                Số 45 Lê Văn Việt, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Hotline: <strong className="text-white font-mono">0909.123.456</strong> (Phím 2)</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Giờ mở cửa: 08:30 - 21:30 (Cả Thứ 7 & Chủ Nhật)</span>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Có bãi đỗ xe ô tô miễn phí và phòng chờ VIP</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300"
              >
                <span>Xem bản đồ chỉ đường Google Maps</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIÊN HỆ & TỔNG ĐÀI HỖ TRỢ */}
      <section className="text-center rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          Bạn Cần Tư Vấn Thiết Bị Hoặc Đặt Lịch Sửa Chữa?
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Đội ngũ tư vấn viên và chuyên viên kỹ thuật Apple của iShop Huy Hoàng luôn sẵn sàng hỗ trợ bạn 24/7. Hãy gọi ngay hotline miễn phí cước!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="tel:0988888999"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm sm:text-base hover:scale-105 transition-all shadow-lg shadow-amber-500/30"
          >
            Gọi Ngay: 0988.888.999
          </a>
          <Link
            href="/repair"
            className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/15 transition-all"
          >
            Đặt Hẹn Sửa Chữa Online
          </Link>
        </div>
      </section>
    </div>
  );
}
