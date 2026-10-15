'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Sparkles,
  Clock,
  Calendar,
  Percent,
  DollarSign,
  Smartphone,
  Headphones,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  QrCode,
  Gift,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Copy,
  Printer,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import {
  PhoneProduct,
  AccessoryProduct,
  PromoQRCode,
  PromotionCampaign,
  Role,
} from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'campaigns' | 'qrcodes' | 'redeem'>(
    'pricing'
  );
  const [role, setRole] = useState<Role>('admin');

  // Catalogs
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [promoQRs, setPromoQRs] = useState<PromoQRCode[]>([]);

  // Search & Filter for pricing
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'phones' | 'accessories'>(
    'all'
  );
  const [brandFilter, setBrandFilter] = useState('all');

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal / Form state for Campaign
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campaignBadge, setCampaignBadge] = useState('FLASH SALE');
  const [campaignType, setCampaignType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [campaignValue, setCampaignValue] = useState<number>(15);
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [campaignTarget, setCampaignTarget] = useState<'all' | 'phones' | 'accessories' | 'repairs'>('all');

  // Modal / Form state for Promo QR
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrTitle, setQrTitle] = useState('');
  const [qrDesc, setQrDesc] = useState('');
  const [qrDiscountType, setQrDiscountType] = useState<'percentage' | 'fixed_amount'>('fixed_amount');
  const [qrDiscountVal, setQrDiscountVal] = useState<number>(200000);
  const [qrMinOrder, setQrMinOrder] = useState<number>(5000000);
  const [qrStart, setQrStart] = useState('');
  const [qrEnd, setQrEnd] = useState('');

  // Inline edit state for Phones: phoneId -> { [capacitySize]: { price, originalPrice } }
  const [phonePriceEdits, setPhonePriceEdits] = useState<
    Record<string, Record<string, { price: number; originalPrice: number }>>
  >({});

  // Inline edit state for Accessories: accessoryId -> { sellingPrice, originalPrice, discountWhenBoughtWithPhone, pointsToRedeem }
  const [accPriceEdits, setAccPriceEdits] = useState<
    Record<
      string,
      {
        sellingPrice: number;
        originalPrice: number;
        discountWhenBoughtWithPhone: number;
        pointsToRedeem: number;
      }
    >
  >({});

  // Realtime clock for countdown
  const [now, setNow] = useState(Date.now());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setRole(IShopStore.getRole());
    const phoneList = IShopStore.getPhones();
    const accList = IShopStore.getAccessories();
    const campList = IShopStore.getPromotionCampaigns();
    const qrList = IShopStore.getPromoQRCodes();

    setPhones(phoneList);
    setAccessories(accList);
    setCampaigns(campList);
    setPromoQRs(qrList);

    // Init phonePriceEdits
    const pEdits: Record<string, Record<string, { price: number; originalPrice: number }>> = {};
    phoneList.forEach((p) => {
      pEdits[p.id] = {};
      p.capacities.forEach((c) => {
        pEdits[p.id][c.size] = {
          price: c.price,
          originalPrice: c.originalPrice,
        };
      });
    });
    setPhonePriceEdits(pEdits);

    // Init accPriceEdits
    const aEdits: Record<string, any> = {};
    accList.forEach((a) => {
      aEdits[a.id] = {
        sellingPrice: a.sellingPrice,
        originalPrice: a.originalPrice,
        discountWhenBoughtWithPhone: a.discountWhenBoughtWithPhone || 15,
        pointsToRedeem: a.pointsToRedeem || Math.round(a.sellingPrice / 1000),
      };
    });
    setAccPriceEdits(aEdits);
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener('ishop_data_changed', listener);
      clearInterval(interval);
    };
  }, []);

  // Format countdown string
  const formatCountdown = (endDateStr: string) => {
    const diff = new Date(endDateStr).getTime() - now;
    if (diff <= 0) return 'Đã hết hạn';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days} ngày ${hours} giờ ${minutes} phút`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  };

  // Handlers for Phone Price Editing
  const handleSavePhonePrice = (phoneId: string, capacitySize: string) => {
    const edit = phonePriceEdits[phoneId]?.[capacitySize];
    if (!edit) return;

    if (edit.price <= 0) {
      alert('Giá bán phải lớn hơn 0');
      return;
    }

    IShopStore.updatePhonePrice(phoneId, capacitySize, edit.price, edit.originalPrice);
    showToast(`✓ Đã cập nhật giá phiên bản ${capacitySize} thành công!`);
  };

  // Quick discount % for all capacities of a phone
  const handleQuickDiscountPhone = (phoneId: string, discountPercent: number) => {
    const phone = phones.find((p) => p.id === phoneId);
    if (!phone) return;

    phone.capacities.forEach((c) => {
      const orig = c.originalPrice > 0 ? c.originalPrice : c.price;
      const newPrice = Math.round((orig * (100 - discountPercent)) / 100000) * 1000;
      IShopStore.updatePhonePrice(phoneId, c.size, newPrice, orig);
    });

    loadData();
    showToast(`✓ Đã áp dụng giảm ${discountPercent}% cho toàn bộ bản ${phone.name}!`);
  };

  // Handlers for Accessory Price Editing
  const handleSaveAccessoryPrice = (accId: string) => {
    const edit = accPriceEdits[accId];
    if (!edit) return;

    if (edit.sellingPrice <= 0) {
      alert('Giá bán phải lớn hơn 0');
      return;
    }

    IShopStore.updateAccessory(accId, {
      sellingPrice: edit.sellingPrice,
      originalPrice: edit.originalPrice,
      discountWhenBoughtWithPhone: edit.discountWhenBoughtWithPhone,
      pointsToRedeem: edit.pointsToRedeem,
    });
    showToast(`✓ Đã lưu thay đổi giá & điều kiện khuyến mãi phụ kiện!`);
  };

  // Handlers for Campaign Modal
  const openNewCampaignModal = () => {
    setEditingCampaignId(null);
    setCampaignTitle('');
    setCampaignDesc('');
    setCampaignBadge('FLASH SALE');
    setCampaignType('percentage');
    setCampaignValue(15);
    // Default start now, end 3 days later
    const startStr = new Date().toISOString().slice(0, 16);
    const endStr = new Date(Date.now() + 3600 * 1000 * 72).toISOString().slice(0, 16);
    setCampaignStart(startStr);
    setCampaignEnd(endStr);
    setCampaignTarget('all');
    setIsCampaignModalOpen(true);
  };

  const openEditCampaignModal = (camp: PromotionCampaign) => {
    setEditingCampaignId(camp.id);
    setCampaignTitle(camp.title);
    setCampaignDesc(camp.description);
    setCampaignBadge(camp.badgeText || 'HOT PROMO');
    setCampaignType(camp.discountType);
    setCampaignValue(camp.discountValue);
    setCampaignStart(new Date(camp.startDate).toISOString().slice(0, 16));
    setCampaignEnd(new Date(camp.endDate).toISOString().slice(0, 16));
    setCampaignTarget(camp.targetCategory || 'all');
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) {
      alert('Vui lòng nhập tên chương trình khuyến mãi');
      return;
    }

    const payload = {
      title: campaignTitle.trim(),
      description: campaignDesc.trim(),
      badgeText: campaignBadge.trim(),
      discountType: campaignType,
      discountValue: Number(campaignValue),
      startDate: new Date(campaignStart).toISOString(),
      endDate: new Date(campaignEnd).toISOString(),
      isActive: true,
      targetCategory: campaignTarget,
      bannerGradient:
        campaignType === 'percentage'
          ? 'from-amber-500 via-orange-500 to-rose-600'
          : 'from-blue-600 via-indigo-600 to-purple-600',
    };

    if (editingCampaignId) {
      IShopStore.updatePromotionCampaign(editingCampaignId, payload);
      showToast('✓ Đã cập nhật chiến dịch khuyến mãi thành công!');
    } else {
      IShopStore.createPromotionCampaign(payload);
      showToast('✓ Đã khởi tạo chiến dịch Flash Sale mới!');
    }

    setIsCampaignModalOpen(false);
    loadData();
  };

  const handleToggleCampaign = (id: string, currentActive: boolean) => {
    IShopStore.updatePromotionCampaign(id, { isActive: !currentActive });
    showToast(`✓ Đã ${!currentActive ? 'kích hoạt' : 'tạm dừng'} chiến dịch khuyến mãi!`);
    loadData();
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chiến dịch khuyến mãi này?')) {
      IShopStore.deletePromotionCampaign(id);
      showToast('✓ Đã xóa chiến dịch thành công.');
      loadData();
    }
  };

  // Handlers for Promo QR
  const openNewQrModal = () => {
    setQrCode('SUMMER-' + Math.floor(100 + Math.random() * 900));
    setQrTitle('');
    setQrDesc('');
    setQrDiscountType('fixed_amount');
    setQrDiscountVal(200000);
    setQrMinOrder(3000000);
    const startStr = new Date().toISOString().slice(0, 16);
    const endStr = new Date(Date.now() + 3600 * 1000 * 120).toISOString().slice(0, 16);
    setQrStart(startStr);
    setQrEnd(endStr);
    setIsQrModalOpen(true);
  };

  const handleSavePromoQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim() || !qrTitle.trim()) {
      alert('Vui lòng nhập đầy đủ mã QR và tiêu đề');
      return;
    }

    IShopStore.createPromoQRCode({
      code: qrCode.trim().toUpperCase(),
      title: qrTitle.trim(),
      description: qrDesc.trim(),
      discountType: qrDiscountType,
      discountValue: Number(qrDiscountVal),
      minOrderValue: Number(qrMinOrder),
      startDate: new Date(qrStart).toISOString(),
      endDate: new Date(qrEnd).toISOString(),
      isActive: true,
      qrPayload: `https://ishop.vn/promo/${qrCode.trim().toUpperCase()}`,
      bannerColor: 'from-amber-500 to-orange-600',
    });

    showToast('✓ Đã tạo mã QR Khuyến mãi mới kèm thời gian hiệu lực!');
    setIsQrModalOpen(false);
    loadData();
  };

  const handleToggleQR = (id: string, currentActive: boolean) => {
    IShopStore.updatePromoQRCode(id, { isActive: !currentActive });
    showToast(`✓ Đã ${!currentActive ? 'kích hoạt' : 'tạm ngừng'} mã QR!`);
    loadData();
  };

  const handleDeleteQR = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mã QR này?')) {
      IShopStore.deletePromoQRCode(id);
      showToast('✓ Đã xóa mã QR khuyến mãi.');
      loadData();
    }
  };

  // Filter products for Tab 1
  const filteredPhones = phones.filter((p) => {
    if (productTypeFilter === 'accessories') return false;
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredAccessories = accessories.filter((a) => {
    if (productTypeFilter === 'phones') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.barcode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Trung Tâm Quản Trị Giá & Khuyến Mãi
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Hệ thống thời gian thực 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Tag className="w-7 h-7 text-amber-600" />
            <span>Điều Chỉnh Giá & Cấu Hình Khuyến Mãi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Sửa giá bán trực tiếp cho điện thoại và phụ kiện đang kinh doanh, thiết lập thời gian bắt đầu
            - kết thúc Flash Sale có đếm ngược, quản lý mã QR và điểm quy đổi quà tặng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openNewCampaignModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Tạo Flash Sale Mới</span>
          </button>
          <button
            onClick={openNewQrModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Tạo Mã QR Mới</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Dòng Điện Thoại Đang Bán
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
              {phones.length} <span className="text-xs font-normal text-slate-500">model</span>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
              Chỉnh giá theo từng bản GB
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Mặt Hàng Phụ Kiện
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
              {accessories.length} <span className="text-xs font-normal text-slate-500">loại</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Giá lẻ & % kèm máy
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Chiến Dịch Khuyến Mãi
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
              {campaigns.filter((c) => c.isActive).length} / {campaigns.length}
            </span>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Đang chạy thời gian thực
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Mã QR Khuyến Mãi
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 block">
              {promoQRs.filter((q) => q.isActive).length} <span className="text-xs font-normal text-slate-500">mã</span>
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
              Có hạn dùng & đếm ngược
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>1. Điều Chỉnh Giá Trực Tiếp Sản Phẩm</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Cài Đặt Flash Sale & Thời Gian Khuyến Mãi</span>
        </button>

        <button
          onClick={() => setActiveTab('qrcodes')}
          className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'qrcodes'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>3. Mã QR Khuyến Mãi (Quét Giảm Giá)</span>
        </button>

        <button
          onClick={() => setActiveTab('redeem')}
          className={`px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'redeem'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>4. Cấu Hình Điểm Đổi Phụ Kiện</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ĐIỀU CHỈNH GIÁ TRỰC TIẾP SẢN PHẨM */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm cần sửa giá (iPhone 16, S24, Củ sạc 65W, Kính KingKong)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Loại sản phẩm:</span>
              <select
                value={productTypeFilter}
                onChange={(e: any) => setProductTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="all">Tất cả sản phẩm</option>
                <option value="phones">📱 Điện thoại ({phones.length})</option>
                <option value="accessories">🎧 Phụ kiện ({accessories.length})</option>
              </select>

              {productTypeFilter !== 'accessories' && (
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="all">Tất cả hãng</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="OPPO">OPPO</option>
                </select>
              )}
            </div>
          </div>

          {/* Section: PHONES PRICING */}
          {productTypeFilter !== 'accessories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <span>Bảng Giá Niêm Yết & Giá Khuyến Mãi Điện Thoại</span>
                </h2>
                <span className="text-xs text-slate-500">
                  Hiển thị {filteredPhones.length} dòng máy
                </span>
              </div>

              <div className="space-y-4">
                {filteredPhones.map((phone) => (
                  <div
                    key={phone.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:border-amber-300 transition-all"
                  >
                    {/* Header Phone Row */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs shrink-0">
                          {phone.brand}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base">
                            {phone.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>Bảo hành: {phone.warrantyInfo}</span>
                            <span>•</span>
                            <Link
                              href={`/phones/${phone.slug}`}
                              target="_blank"
                              className="text-amber-700 hover:underline font-bold"
                            >
                              Xem trang khách hàng →
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Quick Discount Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Giảm nhanh:</span>
                        <button
                          onClick={() => handleQuickDiscountPhone(phone.id, 5)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-amber-100 hover:text-amber-800 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          -5%
                        </button>
                        <button
                          onClick={() => handleQuickDiscountPhone(phone.id, 10)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-amber-100 hover:text-amber-800 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleQuickDiscountPhone(phone.id, 15)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-amber-100 hover:text-amber-800 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          -15%
                        </button>
                      </div>
                    </div>

                    {/* Capacities Table */}
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                            <th className="pb-2">Phiên Bản Dung Lượng</th>
                            <th className="pb-2">Giá Gốc Niêm Yết (VNĐ)</th>
                            <th className="pb-2">Giá Bán Khuyến Mãi (VNĐ)</th>
                            <th className="pb-2 text-center">% Giảm Giá</th>
                            <th className="pb-2 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {phone.capacities.map((cap) => {
                            const editVal = phonePriceEdits[phone.id]?.[cap.size] || {
                              price: cap.price,
                              originalPrice: cap.originalPrice,
                            };
                            const discountPct =
                              editVal.originalPrice > editVal.price
                                ? Math.round(
                                    ((editVal.originalPrice - editVal.price) /
                                      editVal.originalPrice) *
                                      100
                                  )
                                : 0;

                            return (
                              <tr key={cap.size} className="hover:bg-amber-50/30">
                                <td className="py-3 font-black text-slate-900 font-mono text-sm">
                                  {cap.size}
                                </td>

                                <td className="py-3">
                                  <div className="flex items-center gap-1.5 max-w-[200px]">
                                    <input
                                      type="number"
                                      step="50000"
                                      value={editVal.originalPrice}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setPhonePriceEdits((prev) => ({
                                          ...prev,
                                          [phone.id]: {
                                            ...prev[phone.id],
                                            [cap.size]: {
                                              ...editVal,
                                              originalPrice: v,
                                            },
                                          },
                                        }));
                                      }}
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 focus:bg-white focus:border-amber-500 focus:outline-none"
                                      placeholder="Giá gốc..."
                                    />
                                  </div>
                                </td>

                                <td className="py-3">
                                  <div className="flex items-center gap-1.5 max-w-[200px]">
                                    <input
                                      type="number"
                                      step="50000"
                                      value={editVal.price}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setPhonePriceEdits((prev) => ({
                                          ...prev,
                                          [phone.id]: {
                                            ...prev[phone.id],
                                            [cap.size]: {
                                              ...editVal,
                                              price: v,
                                            },
                                          },
                                        }));
                                      }}
                                      className="w-full p-2 bg-amber-50/50 border-2 border-amber-300 rounded-xl font-mono font-black text-xs text-amber-900 focus:bg-white focus:border-amber-500 focus:outline-none shadow-sm"
                                      placeholder="Giá bán lẻ..."
                                    />
                                  </div>
                                </td>

                                <td className="py-3 text-center">
                                  {discountPct > 0 ? (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                      -{discountPct}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Giá chuẩn</span>
                                  )}
                                </td>

                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => handleSavePhonePrice(phone.id, cap.size)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-transform active:scale-95 cursor-pointer shadow-sm"
                                  >
                                    <Save className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Lưu Giá</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: ACCESSORIES PRICING */}
          {productTypeFilter !== 'phones' && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-emerald-600" />
                  <span>Bảng Giá Bán Lẻ & Chiết Khấu Kèm Máy Của Phụ Kiện</span>
                </h2>
                <span className="text-xs text-slate-500">
                  Hiển thị {filteredAccessories.length} phụ kiện
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Tên Phụ Kiện &amp; Barcode</th>
                        <th className="p-4">Hãng</th>
                        <th className="p-4">Giá Gốc Niêm Yết</th>
                        <th className="p-4">Giá Bán Lẻ Hiện Tại</th>
                        <th className="p-4 text-center">Giảm Khi Mua Kèm Máy</th>
                        <th className="p-4 text-center">Điểm Đổi Thưởng</th>
                        <th className="p-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAccessories.map((acc) => {
                        const edit = accPriceEdits[acc.id] || {
                          sellingPrice: acc.sellingPrice,
                          originalPrice: acc.originalPrice,
                          discountWhenBoughtWithPhone: acc.discountWhenBoughtWithPhone,
                          pointsToRedeem: acc.pointsToRedeem,
                        };

                        return (
                          <tr key={acc.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-4">
                              <span className="font-black text-slate-900 block">{acc.name}</span>
                              <span className="text-[11px] font-mono text-slate-500">
                                Barcode: {acc.barcode} • Tồn kho: {acc.stock}
                              </span>
                            </td>

                            <td className="p-4 font-semibold text-slate-700">{acc.brand}</td>

                            <td className="p-4">
                              <input
                                type="number"
                                step="10000"
                                value={edit.originalPrice}
                                onChange={(e) =>
                                  setAccPriceEdits((prev) => ({
                                    ...prev,
                                    [acc.id]: {
                                      ...edit,
                                      originalPrice: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 focus:bg-white focus:border-emerald-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-4">
                              <input
                                type="number"
                                step="10000"
                                value={edit.sellingPrice}
                                onChange={(e) =>
                                  setAccPriceEdits((prev) => ({
                                    ...prev,
                                    [acc.id]: {
                                      ...edit,
                                      sellingPrice: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-28 p-2 bg-emerald-50/50 border-2 border-emerald-300 rounded-xl font-mono font-black text-xs text-emerald-900 focus:bg-white focus:border-emerald-500 focus:outline-none shadow-sm"
                              />
                            </td>

                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={edit.discountWhenBoughtWithPhone}
                                  onChange={(e) =>
                                    setAccPriceEdits((prev) => ({
                                      ...prev,
                                      [acc.id]: {
                                        ...edit,
                                        discountWhenBoughtWithPhone: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-14 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                                />
                                <span className="font-bold text-slate-600">%</span>
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="10"
                                  value={edit.pointsToRedeem}
                                  onChange={(e) =>
                                    setAccPriceEdits((prev) => ({
                                      ...prev,
                                      [acc.id]: {
                                        ...edit,
                                        pointsToRedeem: Number(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-16 p-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-center font-black text-xs"
                                />
                                <span className="text-[10px] text-slate-500 font-semibold">pts</span>
                              </div>
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleSaveAccessoryPrice(acc.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 ml-auto transition-transform active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Lưu</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CÀI ĐẶT FLASH SALE & THỜI GIAN KHUYẾN MÃI */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Danh Sách Chiến Dịch Khuyến Mãi &amp; Flash Sale Có Đếm Ngược</span>
              </h2>
              <p className="text-xs text-slate-500">
                Setup giờ vàng, ngày bắt đầu và kết thúc. Hệ thống tự động kích hoạt và kết thúc đúng hạn.
              </p>
            </div>

            <button
              onClick={openNewCampaignModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Thiết Lập Chiến Dịch Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((camp) => {
              const isExpired = new Date(camp.endDate).getTime() <= now;
              const isUpcoming = new Date(camp.startDate).getTime() > now;
              const isRunning = camp.isActive && !isExpired && !isUpcoming;

              return (
                <div
                  key={camp.id}
                  className={`bg-white rounded-3xl border ${
                    isRunning ? 'border-amber-300 shadow-lg shadow-amber-500/10' : 'border-slate-200'
                  } overflow-hidden flex flex-col justify-between`}
                >
                  {/* Top Gradient Banner */}
                  <div
                    className={`p-5 bg-gradient-to-r ${
                      camp.bannerGradient || 'from-amber-500 to-orange-600'
                    } text-white space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 backdrop-blur-sm border border-white/20">
                        {camp.badgeText || 'KHUYẾN MÃI'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isRunning
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : isUpcoming
                            ? 'bg-amber-400 text-black'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {isRunning ? '● ĐANG DIỄN RA' : isUpcoming ? '⏳ SẮP DIỄN RA' : '✕ HẾT HẠN'}
                      </span>
                    </div>

                    <h3 className="font-black text-base leading-snug">{camp.title}</h3>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black">
                        {camp.discountType === 'percentage'
                          ? `Giảm ${camp.discountValue}%`
                          : `Giảm ${formatVND(camp.discountValue)}`}
                      </span>
                      <span className="text-[11px] opacity-80 font-medium">
                        (Áp dụng: {camp.targetCategory === 'all' ? 'Toàn shop' : camp.targetCategory})
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>

                    {/* Countdown Box */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Thời hạn hiệu lực còn lại:</span>
                        </span>
                        <span className="font-mono text-xs font-black text-rose-600">
                          {formatCountdown(camp.endDate)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Bắt đầu: {new Date(camp.startDate).toLocaleString('vi-VN')}
                        <br />
                        Kết thúc: {new Date(camp.endDate).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <button
                        onClick={() => handleToggleCampaign(camp.id, camp.isActive)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          camp.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {camp.isActive ? 'Bật (Active)' : 'Tắt (Pause)'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditCampaignModal(camp)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Chỉnh sửa thời gian & nội dung"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Xóa chiến dịch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MÃ QR KHUYẾN MÃI (QUÉT GIẢM GIÁ) */}
      {/* ========================================================================= */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>Quản Lý Mã QR Khuyến Mãi Có Thời Gian Hiệu Lực</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tạo mã QR in tại quầy hoặc gửi khách quét bằng camera điện thoại để tự động áp dụng mã giảm giá khi thanh toán.
              </p>
            </div>

            <button
              onClick={openNewQrModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Mã QR Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {promoQRs.map((qr) => {
              const isExpired = new Date(qr.endDate).getTime() <= now;

              return (
                <div
                  key={qr.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                          {qr.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5">{qr.title}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          qr.isActive && !isExpired
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {qr.isActive && !isExpired ? 'Đang hiệu lực' : 'Đã kết thúc'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{qr.description}</p>

                    {/* QR Preview Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          qr.code
                        )}`}
                        alt={qr.code}
                        className="w-32 h-32 rounded-xl border border-white shadow-sm bg-white p-2"
                      />
                      <span className="text-[11px] font-mono text-slate-500">
                        Quét mã tại POS hoặc giỏ hàng
                      </span>
                    </div>

                    {/* Value & Min Order */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mức giảm:</span>
                        <strong className="text-rose-600 font-bold">
                          {qr.discountType === 'percentage'
                            ? `-${qr.discountValue}%`
                            : `-${formatVND(qr.discountValue)}`}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Đơn tối thiểu:</span>
                        <strong className="text-slate-800 font-medium">
                          {formatVND(qr.minOrderValue)}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Thời hạn còn lại:</span>
                        <strong className="text-amber-800 font-mono font-bold">
                          {formatCountdown(qr.endDate)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleQR(qr.id, qr.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        qr.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {qr.isActive ? 'Đang bật' : 'Đang tạm dừng'}
                    </button>

                    <button
                      onClick={() => handleDeleteQR(qr.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CẤU HÌNH ĐIỂM ĐỔI PHỤ KIỆN */}
      {/* ========================================================================= */}
      {activeTab === 'redeem' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span>Quy Đổi Phụ Kiện Bằng Điểm Tích Lũy Thành Viên</span>
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập số điểm cần thiết để khách hàng đổi quà tặng hoặc phụ kiện cao cấp (VD: 99 điểm cho Kính KingKong, 390 điểm cho Củ sạc GaN).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Hình Ảnh &amp; Phụ Kiện</th>
                    <th className="p-4">Giá Bán Lẻ Hiện Tại</th>
                    <th className="p-4">Tồn Kho</th>
                    <th className="p-4 text-center">Số Điểm Cần Đổi (Points)</th>
                    <th className="p-4 text-center">Quy Đổi Thành Tiền</th>
                    <th className="p-4 text-right">Lưu Cấu Hình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessories.map((acc) => {
                    const edit = accPriceEdits[acc.id] || {
                      sellingPrice: acc.sellingPrice,
                      originalPrice: acc.originalPrice,
                      discountWhenBoughtWithPhone: acc.discountWhenBoughtWithPhone,
                      pointsToRedeem: acc.pointsToRedeem || Math.round(acc.sellingPrice / 1000),
                    };

                    return (
                      <tr key={acc.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.imageUrl}
                              alt={acc.name}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block text-xs sm:text-sm">
                                {acc.name}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {acc.brand} • Barcode: {acc.barcode}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-900">
                          {formatVND(acc.sellingPrice)}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.stock > 5
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {acc.stock} cái
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              step="10"
                              min="10"
                              value={edit.pointsToRedeem}
                              onChange={(e) =>
                                setAccPriceEdits((prev) => ({
                                  ...prev,
                                  [acc.id]: {
                                    ...edit,
                                    pointsToRedeem: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-24 p-2 bg-amber-50 border-2 border-amber-300 rounded-xl text-center font-mono font-black text-xs text-amber-900 focus:bg-white focus:outline-none focus:border-amber-500 shadow-sm"
                            />
                            <span className="font-black text-amber-700 text-xs">Điểm</span>
                          </div>
                        </td>

                        <td className="p-4 text-center text-xs text-slate-500 font-medium">
                          Tương đương ~{formatVND(edit.pointsToRedeem * 1000)}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSaveAccessoryPrice(acc.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-transform active:scale-95 cursor-pointer shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>Lưu Điểm</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO / SỬA CHIẾN DỊCH KHUYẾN MÃI (FLASH SALE) */}
      {/* ========================================================================= */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <h3 className="font-black text-base">
                  {editingCampaignId ? 'Chỉnh Sửa Chiến Dịch Khuyến Mãi' : 'Thiết Lập Flash Sale Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên chương trình:</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="VD: Flash Sale Giờ Vàng 2026..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả ngắn hiển thị khách hàng:</label>
                <textarea
                  rows={2}
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  placeholder="VD: Giảm ngay 15% cho iPhone 16 Series và phụ kiện..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại chiết khấu:</label>
                  <select
                    value={campaignType}
                    onChange={(e: any) => setCampaignType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="percentage">Giảm theo % (Tỷ lệ)</option>
                    <option value="fixed_amount">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giá trị giảm:</label>
                  <input
                    type="number"
                    required
                    value={campaignValue}
                    onChange={(e) => setCampaignValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                    placeholder="VD: 15 hoặc 500000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian bắt đầu:</label>
                  <input
                    type="datetime-local"
                    required
                    value={campaignStart}
                    onChange={(e) => setCampaignStart(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian kết thúc:</label>
                  <input
                    type="datetime-local"
                    required
                    value={campaignEnd}
                    onChange={(e) => setCampaignEnd(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Áp dụng cho:</label>
                  <select
                    value={campaignTarget}
                    onChange={(e: any) => setCampaignTarget(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="all">Toàn bộ cửa hàng</option>
                    <option value="phones">Chỉ Điện Thoại</option>
                    <option value="accessories">Chỉ Phụ Kiện</option>
                    <option value="repairs">Dịch vụ sửa chữa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Huy hiệu (Badge):</label>
                  <input
                    type="text"
                    value={campaignBadge}
                    onChange={(e) => setCampaignBadge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    placeholder="VD: FLASH SALE, HOT..."
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg"
                >
                  Lưu &amp; Áp Dụng Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO MÃ QR KHUYẾN MÃI MỚI */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <h3 className="font-black text-base">Tạo Mã QR Khuyến Mãi Mới</h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoQR} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã Code:</label>
                  <input
                    type="text"
                    required
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                    placeholder="VD: TECHFEST-10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn tối thiểu (VNĐ):</label>
                  <input
                    type="number"
                    value={qrMinOrder}
                    onChange={(e) => setQrMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề khuyến mãi:</label>
                <input
                  type="text"
                  required
                  value={qrTitle}
                  onChange={(e) => setQrTitle(e.target.value)}
                  placeholder="VD: Khuyến Mãi Khách Thân Thiết - Giảm 200K..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại giảm giá:</label>
                  <select
                    value={qrDiscountType}
                    onChange={(e: any) => setQrDiscountType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                    <option value="percentage">Phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giá trị giảm:</label>
                  <input
                    type="number"
                    required
                    value={qrDiscountVal}
                    onChange={(e) => setQrDiscountVal(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hiệu lực từ:</label>
                  <input
                    type="datetime-local"
                    required
                    value={qrStart}
                    onChange={(e) => setQrStart(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hết hạn vào lúc:</label>
                  <input
                    type="datetime-local"
                    required
                    value={qrEnd}
                    onChange={(e) => setQrEnd(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg"
                >
                  Tạo Mã QR Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
