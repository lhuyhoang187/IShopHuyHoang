'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Tag,
  Phone,
} from 'lucide-react';
import { formatVND } from '@/lib/vietqr';
import confetti from 'canvas-confetti';
import { IShopStore } from '@/lib/store';
import {
  CustomerUser,
  RepairDeviceOption,
  RepairServiceCatalogItem,
  RepairSymptomOption,
  RepairTimeSlotOption,
} from '@/lib/types';

export default function RepairPriceListPage() {
  const [activeTab, setActiveTab] = useState<'iphone' | 'samsung'>('iphone');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Authentication state
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [quickLoginName, setQuickLoginName] = useState('');
  const [quickLoginPhone, setQuickLoginPhone] = useState('');

  // Repair Catalog & Lists loaded from Store
  const [deviceList, setDeviceList] = useState<RepairDeviceOption[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<RepairServiceCatalogItem[]>([]);
  const [symptomList, setSymptomList] = useState<RepairSymptomOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<RepairTimeSlotOption[]>([]);

  // Selected Symptoms (multiple choice from list)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Màn hình nứt vỡ kính, sọc xanh, chảy mực',
  ]);
  const [extraNotes, setExtraNotes] = useState('');
  const [customModelText, setCustomModelText] = useState('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const getDayAfterStr = () => new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const formatDateDisplay = (d: Date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    model: 'iPhone 15 Pro Max',
    service: 'Thay Màn Hình Zin OLED 120Hz ProMotion',
    date: getTodayStr(),
    time: '09:30',
  });

  const loadData = () => {
    const cust = IShopStore.getCustomerUser();
    if (cust) {
      setCustomerUser(cust);
      setBookingForm((prev) => ({
        ...prev,
        name: cust.name,
        phone: cust.phone,
      }));
    }

    const devs = IShopStore.getRepairDeviceOptions();
    const srvs = IShopStore.getRepairServiceCatalog();
    const syms = IShopStore.getRepairSymptomOptions();
    const slots = IShopStore.getRepairTimeSlotOptions();

    setDeviceList(devs);
    setServiceCatalog(srvs);
    setSymptomList(syms);
    setTimeSlots(slots);

    // Initial defaults if not already set
    if (devs.length > 0 && !bookingForm.model) {
      setBookingForm((prev) => ({ ...prev, model: devs[0].name }));
    }
    if (srvs.length > 0 && !bookingForm.service) {
      setBookingForm((prev) => ({ ...prev, service: srvs[0].name }));
    }
    if (slots.length > 0 && !bookingForm.time) {
      setBookingForm((prev) => ({ ...prev, time: slots[0].time }));
    }
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);

    // Also sync from backend API
    fetch('/api/repairs/config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (Array.isArray(json.data.devices) && json.data.devices.length > 0) {
            setDeviceList(json.data.devices);
            IShopStore.setRepairDeviceOptions(json.data.devices);
          }
          if (Array.isArray(json.data.services) && json.data.services.length > 0) {
            setServiceCatalog(json.data.services);
            IShopStore.setRepairServiceCatalog(json.data.services);
          }
          if (Array.isArray(json.data.symptoms) && json.data.symptoms.length > 0) {
            setSymptomList(json.data.symptoms);
            IShopStore.setRepairSymptomOptions(json.data.symptoms);
          }
          if (Array.isArray(json.data.timeSlots) && json.data.timeSlots.length > 0) {
            setTimeSlots(json.data.timeSlots);
            IShopStore.setRepairTimeSlotOptions(json.data.timeSlots);
          }
        }
      })
      .catch((e) => console.warn('Could not fetch repair config from API:', e));

    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Group devices by Brand
  const groupedDevices = useMemo(() => {
    const map: Record<string, RepairDeviceOption[]> = {};
    deviceList.forEach((d) => {
      const brand = d.brand || 'Khác';
      if (!map[brand]) map[brand] = [];
      map[brand].push(d);
    });
    return map;
  }, [deviceList]);

  // Selected Service details
  const selectedServiceObj = useMemo(() => {
    return serviceCatalog.find((s) => s.name === bookingForm.service);
  }, [serviceCatalog, bookingForm.service]);

  // Toggle symptom selection
  const toggleSymptom = (title: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleCustomerQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLoginName.trim() || !quickLoginPhone.trim()) return;

    const user: CustomerUser = {
      id: 'cust-' + Date.now(),
      name: quickLoginName.trim(),
      phone: quickLoginPhone.trim(),
    };

    IShopStore.setCustomerUser(user);
    setCustomerUser(user);
    setBookingForm((prev) => ({
      ...prev,
      name: user.name,
      phone: user.phone,
    }));
  };

  const handleLogoutCustomer = () => {
    IShopStore.logoutCustomer();
    setCustomerUser(null);
  };

  const defaultIphonePrices = [
    { service: 'Thay Pin Pisen Chính Hãng (Hiển thị 100% dung lượng)', models: 'iPhone 11 / 12 / 13 Series', price: 650000, warranty: '12 Tháng' },
    { service: 'Thay Pin Pisen Dung Lượng Cao Siêu Bền', models: 'iPhone 14 / 15 Series', price: 850000, warranty: '12 Tháng' },
    { service: 'Ép Kính Cảm Ứng Chân Không (Giữ màn zin hiển thị)', models: 'iPhone 12 / 13 / 14 Pro Max', price: 750000, warranty: '12 Tháng keo bọt' },
    { service: 'Thay Màn Hình OLED Zin Bóc Máy 120Hz ProMotion', models: 'iPhone 13 / 14 Pro Max', price: 5200000, warranty: '06 Tháng' },
    { service: 'Thay Màn Hình Zin Bóc Máy iPhone 15 Pro Max', models: 'iPhone 15 Pro Max', price: 6500000, warranty: '06 Tháng' },
    { service: 'Thay Cụm Chân Sạc Type-C & Mic Thoại', models: 'iPhone 15 / 16 Series', price: 650000, warranty: '06 Tháng' },
  ];

  const defaultSamsungPrices = [
    { service: 'Thay Màn Hình Dynamic AMOLED 2X Zin', models: 'Samsung Galaxy S24 Ultra', price: 5900000, warranty: '06 Tháng' },
    { service: 'Thay Pin Chính Hãng Samsung 5.000mAh', models: 'Galaxy S23 / S24 Ultra', price: 750000, warranty: '12 Tháng' },
    { service: 'Ép Kính Màn Hình Cong Phẳng Chân Không', models: 'Galaxy Note 20 / S22 / S23 Ultra', price: 850000, warranty: '12 Tháng' },
    { service: 'Thay Cụm Chân Sạc Nhanh 45W & Cáp Bo Phụ', models: 'Galaxy S24 Ultra', price: 550000, warranty: '06 Tháng' },
  ];

  const [iphonePrices, setIphonePrices] = useState(defaultIphonePrices);
  const [samsungPrices, setSamsungPrices] = useState(defaultSamsungPrices);

  useEffect(() => {
    fetch('/api/repairs/services')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const ipList = json.data
            .filter((s: any) => s.deviceBrand === 'Apple')
            .map((s: any) => ({
              service: s.name,
              models: s.deviceModels,
              price: s.price,
              warranty: s.warrantyPeriod,
            }));
          const ssList = json.data
            .filter((s: any) => s.deviceBrand === 'Samsung')
            .map((s: any) => ({
              service: s.name,
              models: s.deviceModels,
              price: s.price,
              warranty: s.warrantyPeriod,
            }));
          if (ipList.length > 0) setIphonePrices(ipList);
          if (ssList.length > 0) setSamsungPrices(ssList);
        }
      })
      .catch((e) => console.warn('Could not fetch repair services from API:', e));
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const actualModel =
      bookingForm.model === 'custom' && customModelText.trim()
        ? customModelText.trim()
        : bookingForm.model;

    const partsDescription: string[] = [];
    if (selectedSymptoms.length > 0) {
      partsDescription.push(`Triệu chứng: ${selectedSymptoms.join(', ')}`);
    }
    if (extraNotes.trim()) {
      partsDescription.push(`Ghi chú thêm: ${extraNotes.trim()}`);
    }
    const finalNotes = partsDescription.join(' | ') || 'Máy đặt hẹn sửa chữa trực tiếp';

    try {
      // 1. Create client-side repair ticket in IShopStore
      const ticket = IShopStore.createRepairTicket({
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerAddress: 'Đặt hẹn online qua website iShop',
        deviceModel: actualModel,
        imeiOrSerial: 'OL-' + Math.floor(100000 + Math.random() * 900000),
        unlockPasscode: 'Chưa cung cấp',
        appearanceCondition: 'Máy gửi hẹn tiếp nhận online',
        accessoriesIncluded: 'Khách mang máy trực tiếp đến shop',
        issueDescription: `${bookingForm.service} (${finalNotes})`,
        laborFee: 150000,
        estimatedDeliveryDate: `${bookingForm.date} ${bookingForm.time}:00`,
        technicianName: 'Trần Trọng Nghĩa',
        warrantyPeriod: selectedServiceObj?.warranty || 'Bảo hành 12 tháng',
        status: 'received',
        receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      setCreatedTicketCode(ticket.ticketCode);

      // 2. Sync with Server API asynchronously (Repair Ticket)
      fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: bookingForm.name,
          customerPhone: bookingForm.phone,
          customerAddress: 'Đặt online qua website',
          deviceModel: actualModel,
          imeiOrSerial: ticket.imeiOrSerial,
          unlockPasscode: 'Chưa cung cấp',
          issueDescription: `${bookingForm.service}. Hẹn: ${bookingForm.date} lúc ${bookingForm.time}. ${finalNotes}`,
          laborFee: 150000,
        }),
      }).catch((err) => console.warn('API sync background notice:', err));

      // 3. Save Online Repair Booking in MySQL
      fetch('/api/repairs/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingForm.name,
          phone: bookingForm.phone,
          model: actualModel,
          service: bookingForm.service,
          date: bookingForm.date,
          time: bookingForm.time,
          notes: finalNotes,
        }),
      }).catch((err) => console.warn('API booking notice:', err));

      // 4. Trigger confetti celebration
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e2b774', '#10b981', '#3b82f6', '#f59e0b'],
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
          <Wrench className="w-4 h-4" />
          <span>TRUNG TÂM DỊCH VỤ SỬA CHỮA iCARE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
          Bảng Giá Sửa Chữa &amp; Đặt Lịch Lấy Liền 30 Phút
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
          Minh bạch linh kiện, bảo hành rõ ràng, khách hàng trực tiếp quan sát kỹ thuật viên thao tác. Nhận máy có in mã QR theo dõi tiến độ thời gian thực.
        </p>

        <div className="pt-2">
          <Link
            href="/repair/tracking"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors shadow-sm"
          >
            <span>Đã gửi máy? Bấm vào đây để Tra Cứu Tiến Độ Sửa Bằng Mã QR</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pricing Tables */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Bảng Giá Tham Khảo</span>
          </h2>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('iphone')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'iphone'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apple iPhone
            </button>
            <button
              onClick={() => setActiveTab('samsung')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'samsung'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Samsung Galaxy
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Dịch Vụ Sửa Chữa</th>
                  <th className="p-4">Dòng Máy Áp Dụng</th>
                  <th className="p-4">Bảo Hành</th>
                  <th className="p-4 text-right">Chi Phí Trọn Gói</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'iphone' ? iphonePrices : samsungPrices).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {item.service}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{item.models}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.warranty}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-amber-700 text-sm sm:text-base">
                      {formatVND(item.price)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          const matchedModel = deviceList.find((d) =>
                            item.models.toLowerCase().includes(d.name.toLowerCase())
                          );
                          setBookingForm({
                            ...bookingForm,
                            model: matchedModel ? matchedModel.name : item.models.split('/')[0].trim(),
                            service: item.service,
                          });
                          const el = document.getElementById('booking-form');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
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
      <div id="booking-form" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Đặt Lịch Hẹn Mang Máy Đến Cửa Hàng
            </h2>
            <p className="text-xs text-slate-600">
              Chọn nhanh dòng máy, dịch vụ và tình trạng lỗi từ danh mục có sẵn. Kỹ thuật viên sẽ chuẩn bị linh kiện trước khi bạn đến!
            </p>
          </div>

          {bookingSuccess ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Đặt Lịch Hẹn Thành Công!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  iShop Huy Hoàng đã ghi nhận lịch hẹn và cấp mã phiếu biên nhận điện tử cho máy của quý khách.
                </p>
              </div>

              {/* Ticket Card Preview */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-amber-300 text-left space-y-3 font-mono text-xs shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">Mã Phiếu Tiếp Nhận</span>
                  <span className="text-sm font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                    {createdTicketCode}
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-700 font-sans">
                  <p><span className="text-slate-500 font-medium">Khách hàng:</span> <strong className="text-slate-900 font-bold">{bookingForm.name}</strong> ({bookingForm.phone})</p>
                  <p><span className="text-slate-500 font-medium">Thiết bị:</span> <strong className="text-blue-700 font-bold">{bookingForm.model === 'custom' ? customModelText : bookingForm.model}</strong></p>
                  <p><span className="text-slate-500 font-medium">Dịch vụ:</span> <strong className="text-slate-800">{bookingForm.service}</strong></p>
                  <p><span className="text-slate-500 font-medium">Khung giờ hẹn:</span> <strong className="text-amber-800 font-bold">{bookingForm.time} • Ngày {bookingForm.date}</strong></p>
                  {selectedSymptoms.length > 0 && (
                    <p><span className="text-slate-500 font-medium">Tình trạng:</span> <span className="text-slate-700">{selectedSymptoms.join(', ')}</span></p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href={`/repair/tracking?code=${encodeURIComponent(createdTicketCode)}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-transform hover:scale-105"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Xem Tiến Độ Sửa Chữa (Real-time)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setBookingSuccess(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Đặt thêm lịch khác
                </button>
              </div>
            </div>
          ) : !customerUser ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/80 border border-amber-200 text-center space-y-5 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  YÊU CẦU XÁC THỰC TÀI KHOẢN KHÁCH HÀNG
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Xác Thực Để Kích Hoạt Phiếu Sửa Chữa iCare
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Để tự động cấp mã theo dõi thời gian thực và kích hoạt gói bảo hành điện tử chính chủ, quý khách vui lòng xác nhận danh tính thành viên:
                </p>
              </div>

              {/* Quick Customer Login Form */}
              <form onSubmit={handleCustomerQuickLogin} className="max-w-md mx-auto space-y-3 text-xs text-left">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Họ và tên của bạn *:</label>
                  <input
                    type="text"
                    required
                    value={quickLoginName}
                    onChange={(e) => setQuickLoginName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">Số điện thoại liên hệ *:</label>
                  <input
                    type="tel"
                    required
                    value={quickLoginPhone}
                    onChange={(e) => setQuickLoginPhone(e.target.value)}
                    placeholder="VD: 0909123456"
                    className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400 font-mono font-bold text-amber-700"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl btn-gold text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>Xác Nhận &amp; Tiếp Tục Đặt Hẹn Lấy Ngay</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Authenticated Customer Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-medium">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Khách hàng: <strong className="text-slate-900 font-bold">{customerUser.name}</strong> ({customerUser.phone})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutCustomer}
                  className="text-slate-500 hover:text-slate-900 text-[11px] underline font-semibold cursor-pointer"
                >
                  Đổi tài khoản
                </button>
              </div>

              <form onSubmit={handleBooking} className="space-y-5 text-xs">
                {/* 1. Full name & Phone number (Retained as text inputs as requested) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold mb-1 block">
                      Họ và tên của bạn: *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      placeholder="VD: Nguyễn Văn Nam"
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold mb-1 block">
                      Số điện thoại liên hệ: *
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      placeholder="VD: 0909123456"
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* 2. Dòng máy cần sửa: DẠNG LIST ĐỂ KHÁCH CHỌN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold block">
                      Dòng máy cần sửa (Chọn từ danh sách): *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {deviceList.length} model hỗ trợ
                    </span>
                  </div>
                  <select
                    value={bookingForm.model}
                    onChange={(e) => setBookingForm({ ...bookingForm, model: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                  >
                    {Object.entries(groupedDevices).map(([brand, items]) => (
                      <optgroup key={brand} label={`--- Hãng ${brand} ---`}>
                        {items.map((dev) => (
                          <option key={dev.id} value={dev.name}>
                            {dev.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom">+ Dòng máy khác (khách tự nhập tên bên dưới)...</option>
                  </select>

                  {bookingForm.model === 'custom' && (
                    <div className="mt-2 animate-in fade-in">
                      <input
                        type="text"
                        required
                        value={customModelText}
                        onChange={(e) => setCustomModelText(e.target.value)}
                        placeholder="Nhập tên dòng máy cụ thể của bạn (VD: Xiaomi 14 Ultra, iPad Mini 6, Google Pixel...)"
                        className="w-full p-2.5 rounded-xl bg-amber-50/50 border border-amber-400 text-slate-900 text-xs font-bold focus:outline-none focus:bg-white"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* 3. Dịch vụ cần làm: DẠNG LIST ĐỂ KHÁCH CHỌN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold block">
                      Dịch vụ cần làm (Chọn từ danh mục dịch vụ iCare): *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {serviceCatalog.length} dịch vụ niêm yết
                    </span>
                  </div>
                  <select
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                  >
                    {serviceCatalog.map((srv) => (
                      <option key={srv.id} value={srv.name}>
                        {srv.name} — {srv.price > 0 ? formatVND(srv.price) : 'Miễn phí'} ({srv.warranty})
                      </option>
                    ))}
                    <option value="Kiểm tra & Báo giá tại quầy">Kiểm tra tổng thể vi mạch &amp; Báo giá tại quầy (Miễn phí 100%)</option>
                  </select>

                  {/* Service highlight preview card */}
                  {selectedServiceObj && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <span>Giá niêm yết: <strong className="text-emerald-700 font-mono text-xs">{selectedServiceObj.price > 0 ? formatVND(selectedServiceObj.price) : 'Miễn phí'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bảo hành: <strong className="text-blue-800">{selectedServiceObj.warranty}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Thời gian dự kiến: <strong>{selectedServiceObj.estimatedMinutes || 30} phút lấy liền</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Ngày hẹn & Khung giờ: DẠNG LIST ĐỂ KHÁCH CHỌN */}
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-bold mb-1.5 block">
                      Ngày hẹn mang máy (Chọn ngày nhanh từ danh sách): *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, date: getTodayStr() })}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          bookingForm.date === getTodayStr()
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Hôm nay ({formatDateDisplay(new Date())})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, date: getTomorrowStr() })}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          bookingForm.date === getTomorrowStr()
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Ngày mai ({formatDateDisplay(new Date(Date.now() + 86400000))})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, date: getDayAfterStr() })}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          bookingForm.date === getDayAfterStr()
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Ngày mốt ({formatDateDisplay(new Date(Date.now() + 172800000))})
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Hoặc chọn ngày khác:</span>
                      <input
                        type="date"
                        required
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold mb-1 block">
                      Khung giờ dự kiến (Chọn từ danh sách ca trực): *
                    </label>
                    <select
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      {timeSlots.map((ts) => (
                        <option key={ts.id} value={ts.time}>
                          {ts.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Mô tả tình trạng lỗi của máy: DẠNG LIST ĐỂ KHÁCH CHỌN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-bold block">
                      Mô tả tình trạng lỗi của máy (Chọn 1 hoặc nhiều triệu chứng từ danh sách): *
                    </label>
                    <span className="text-[11px] text-amber-800 font-bold">
                      Đã chọn {selectedSymptoms.length} lỗi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                    {symptomList.map((sym) => {
                      const isSelected = selectedSymptoms.includes(sym.title);
                      return (
                        <button
                          key={sym.id}
                          type="button"
                          onClick={() => toggleSymptom(sym.title)}
                          className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <span className="text-base shrink-0">{sym.icon || '📱'}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs block font-bold leading-tight">{sym.title}</span>
                            {sym.description && (
                              <span className={`text-[10px] block mt-0.5 truncate ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                                {sym.description}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0 text-slate-950 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      placeholder="Ghi chú thêm chi tiết (nếu có): VD: Máy rơi từ tầng 2 xuống, chập sau khi đi mưa..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? 'Đang Lưu Lịch Hẹn...' : 'Xác Nhận Đặt Lịch Sửa Chữa Ngay'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

