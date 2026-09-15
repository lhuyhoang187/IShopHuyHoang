'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Send,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { formatVND } from '@/lib/vietqr';

export default function RepairPriceListPage() {
  const [activeTab, setActiveTab] = useState<'iphone' | 'samsung'>('iphone');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    model: 'iPhone 15 Pro Max',
    service: 'Thay Màn Hình Zin OLED 120Hz',
    date: '2026-08-28',
    time: '10:00',
    notes: '',
  });

  const iphonePrices = [
    { service: 'Thay Pin Pisen Chính Hãng (Hiển thị 100% dung lượng)', models: 'iPhone 11 / 12 / 13 Series', price: 650000, warranty: '12 Tháng' },
    { service: 'Thay Pin Pisen Dung Lượng Cao Siêu Bền', models: 'iPhone 14 / 15 Series', price: 850000, warranty: '12 Tháng' },
    { service: 'Ép Kính Cảm Ứng Chân Không (Giữ màn zin hiển thị)', models: 'iPhone 12 / 13 / 14 Pro Max', price: 750000, warranty: '12 Tháng keo bọt' },
    { service: 'Thay Màn Hình OLED Zin Bóc Máy 120Hz ProMotion', models: 'iPhone 13 / 14 Pro Max', price: 5200000, warranty: '06 Tháng' },
    { service: 'Thay Màn Hình Zin Bóc Máy iPhone 15 Pro Max', models: 'iPhone 15 Pro Max', price: 6500000, warranty: '06 Tháng' },
    { service: 'Thay Cụm Chân Sạc Type-C & Mic Thoại', models: 'iPhone 15 / 16 Series', price: 650000, warranty: '06 Tháng' },
  ];

  const samsungPrices = [
    { service: 'Thay Màn Hình Dynamic AMOLED 2X Zin', models: 'Samsung Galaxy S24 Ultra', price: 5900000, warranty: '06 Tháng' },
    { service: 'Thay Pin Chính Hãng Samsung 5.000mAh', models: 'Galaxy S23 / S24 Ultra', price: 750000, warranty: '12 Tháng' },
    { service: 'Ép Kính Màn Hình Cong Phẳng Chân Không', models: 'Galaxy Note 20 / S22 / S23 Ultra', price: 850000, warranty: '12 Tháng' },
    { service: 'Thay Cụm Chân Sạc Nhanh 45W & Cáp Bo Phụ', models: 'Galaxy S24 Ultra', price: 550000, warranty: '06 Tháng' },
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
          <Wrench className="w-4 h-4" />
          <span>TRUNG TÂM DỊCH VỤ SỬA CHỮA iCARE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Bảng Giá Sửa Chữa & Đặt Lịch Lấy Liền 30 Phút
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
          Minh bạch linh kiện, bảo hành rõ ràng, khách hàng trực tiếp quan sát kỹ thuật viên thao tác. Nhận máy có in mã QR theo dõi tiến độ thời gian thực.
        </p>

        <div className="pt-2">
          <Link
            href="/repair/tracking"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
          >
            <span>Đã gửi máy? Bấm vào đây để Tra Cứu Tiến Độ Sửa Bằng Mã QR</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pricing Tables */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Bảng Giá Tham Khảo</span>
          </h2>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('iphone')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'iphone'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Apple iPhone
            </button>
            <button
              onClick={() => setActiveTab('samsung')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'samsung'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Samsung Galaxy
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0d1320] text-gray-400 uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="p-4">Dịch Vụ Sửa Chữa</th>
                  <th className="p-4">Dòng Máy Áp Dụng</th>
                  <th className="p-4">Bảo Hành</th>
                  <th className="p-4 text-right">Chi Phí Trọn Gói</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(activeTab === 'iphone' ? iphonePrices : samsungPrices).map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {item.service}
                    </td>
                    <td className="p-4 text-gray-300">{item.models}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.warranty}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-amber-400 text-sm sm:text-base">
                      {formatVND(item.price)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setBookingForm({
                            ...bookingForm,
                            model: item.models.split('/')[0].trim(),
                            service: item.service,
                          });
                          const el = document.getElementById('booking-form');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-600 text-gray-200 hover:text-white text-xs font-medium transition-colors"
                      >
                        Đặt hẹn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Appointment Booking Form */}
      <div id="booking-form" className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Đặt Lịch Hẹn Mang Máy Đến Cửa Hàng
            </h2>
            <p className="text-xs text-gray-400">
              Đặt hẹn trước để kỹ thuật viên chuẩn bị sẵn linh kiện zin, đến nơi được phục vụ ngay không phải chờ đợi.
            </p>
          </div>

          {bookingSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Đặt Lịch Hẹn Thành Công!</h3>
              <p className="text-xs text-gray-300">
                iShop Huy Hoàng đã ghi nhận lịch hẹn của bạn ({bookingForm.name} - {bookingForm.phone}) cho máy {bookingForm.model}. Nhân viên kỹ thuật sẽ gọi xác nhận trong 10 phút.
              </p>
              <button
                onClick={() => setBookingSuccess(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Đặt thêm lịch hẹn khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Họ và tên của bạn:</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Số điện thoại liên hệ:</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="VD: 0909123456"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Dòng máy cần sửa:</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.model}
                    onChange={(e) => setBookingForm({ ...bookingForm, model: e.target.value })}
                    placeholder="VD: iPhone 15 Pro Max"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Dịch vụ cần làm:</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                    placeholder="VD: Thay Pin Pisen / Ép kính"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Ngày hẹn mang máy:</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Khung giờ dự kiến:</label>
                  <select
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="09:00" className="bg-[#121826]">09:00 - Sáng</option>
                    <option value="10:30" className="bg-[#121826]">10:30 - Sáng</option>
                    <option value="14:00" className="bg-[#121826]">14:00 - Chiều</option>
                    <option value="16:00" className="bg-[#121826]">16:00 - Chiều</option>
                    <option value="18:30" className="bg-[#121826]">18:30 - Tối</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Mô tả tình trạng lỗi của máy:</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="VD: Rơi nhẹ bị sọc màn hình, pin tụt nhanh sập nguồn..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>Xác Nhận Đặt Lịch Sửa Chữa</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
