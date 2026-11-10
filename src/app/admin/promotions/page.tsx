'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Package,
  Clock,
  DollarSign,
  Smartphone,
  Headphones,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Save,
  QrCode,
  Gift,
  Search,
  Filter,
  Check,
  X,
  Zap,
  ArrowUpDown,
  Sliders,
  CheckSquare,
  Square,
  ExternalLink,
  Percent,
  RefreshCw,
  Eye,
  Printer,
  ChevronDown,
  AlertCircle,
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

/**
 * Chuyển số tiền thành chuỗi đọc tiếng Việt ngắn gọn (VD: 29.990.000 -> 29 triệu 990 nghìn đ)
 * Giúp nhân viên nhận diện ngay lập tức, tránh tuyệt đối sai sót gõ nhầm số 0.
 */
function formatVietnameseWords(amount: number): string {
  if (!amount || amount <= 0) return '0 đ';
  const trieu = Math.floor(amount / 1000000);
  const nghin = Math.floor((amount % 1000000) / 1000);
  const le = amount % 1000;

  const parts: string[] = [];
  if (trieu > 0) parts.push(`${trieu} triệu`);
  if (nghin > 0) parts.push(`${nghin} nghìn`);
  if (le > 0) parts.push(`${le} đ`);
  return parts.length > 0 ? parts.join(' ') : `${amount} đ`;
}

// Preset mức chiết khấu thông dụng
const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30, 50];

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<
    'phones' | 'accessories' | 'campaigns' | 'qrcodes' | 'redeem'
  >('phones');
  const [role, setRole] = useState<Role>('admin');

  // Catalogs
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [promoQRs, setPromoQRs] = useState<PromoQRCode[]>([]);

  // Search & Filter for Phones List
  const [phoneSearch, setPhoneSearch] = useState('');
  const [phoneBrandFilter, setPhoneBrandFilter] = useState<string>('all');
  const [phoneDiscountFilter, setPhoneDiscountFilter] = useState<'all' | 'discounted' | 'original'>('all');
  const [selectedPhoneIds, setSelectedPhoneIds] = useState<string[]>([]);

  // Search & Filter for Accessories List
  const [accSearch, setAccSearch] = useState('');
  const [accCategoryFilter, setAccCategoryFilter] = useState<string>('all');
  const [selectedAccIds, setSelectedAccIds] = useState<string[]>([]);

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detailed Phone Pricing Config Modal
  const [detailPhoneModal, setDetailPhoneModal] = useState<PhoneProduct | null>(null);
  const [detailCapacities, setDetailCapacities] = useState<
    { size: string; price: number; originalPrice: number; discountPercent: number }[]
  >([]);

  // Batch Phone Discount Modal / Popover
  const [batchDiscountPercent, setBatchDiscountPercent] = useState<number>(10);

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
  const [previewQrModal, setPreviewQrModal] = useState<PromoQRCode | null>(null);

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
    if (diff <= 0) return 'Đã kết thúc';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days} ngày ${hours}h ${minutes}p`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  };

  // =========================================================================
  // PHONE PRICING LIST HANDLERS
  // =========================================================================

  // Quick preset discount for all capacities of 1 phone
  const applyQuickPhoneDiscount = (phoneId: string, percent: number) => {
    const phone = phones.find((p) => p.id === phoneId);
    if (!phone) return;

    phone.capacities.forEach((c) => {
      const orig = c.originalPrice > 0 ? c.originalPrice : c.price;
      const newPrice =
        percent === 0 ? orig : Math.round((orig * (100 - percent)) / 100000) * 1000;
      IShopStore.updatePhonePrice(phoneId, c.size, newPrice, orig);
    });

    loadData();
    showToast(
      percent === 0
        ? `✓ Đã khôi phục giá niêm yết cho ${phone.name}`
        : `✓ Đã áp dụng giảm ${percent}% cho toàn bộ dung lượng của ${phone.name}`
    );
  };

  // Open Detailed Config Modal for 1 Phone
  const openDetailPhoneModal = (phone: PhoneProduct) => {
    setDetailPhoneModal(phone);
    setDetailCapacities(
      phone.capacities.map((c) => {
        const orig = c.originalPrice > 0 ? c.originalPrice : c.price;
        const discountPct = orig > c.price ? Math.round(((orig - c.price) / orig) * 100) : 0;
        return {
          size: c.size,
          price: c.price,
          originalPrice: orig,
          discountPercent: discountPct,
        };
      })
    );
  };

  // Update capacity row in detail modal
  const handleDetailCapacityChange = (
    index: number,
    field: 'originalPrice' | 'price' | 'percent',
    value: number
  ) => {
    setDetailCapacities((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === 'percent') {
        item.discountPercent = value;
        if (value === 0) {
          item.price = item.originalPrice;
        } else {
          item.price = Math.round((item.originalPrice * (100 - value)) / 100000) * 1000;
        }
      } else if (field === 'originalPrice') {
        item.originalPrice = value;
        if (item.discountPercent > 0) {
          item.price =
            Math.round((value * (100 - item.discountPercent)) / 100000) * 1000;
        }
      } else if (field === 'price') {
        item.price = value;
        if (item.originalPrice > value && item.originalPrice > 0) {
          item.discountPercent = Math.round(
            ((item.originalPrice - value) / item.originalPrice) * 100
          );
        } else {
          item.discountPercent = 0;
        }
      }

      next[index] = item;
      return next;
    });
  };

  // Apply discount to all capacities inside modal
  const handleApplyAllCapacitiesInModal = (percent: number) => {
    setDetailCapacities((prev) =>
      prev.map((c) => {
        const newPrice =
          percent === 0 ? c.originalPrice : Math.round((c.originalPrice * (100 - percent)) / 100000) * 1000;
        return {
          ...c,
          discountPercent: percent,
          price: newPrice,
        };
      })
    );
  };

  // Save all capacities from modal
  const handleSavePhoneDetail = () => {
    if (!detailPhoneModal) return;

    detailCapacities.forEach((c) => {
      IShopStore.updatePhonePrice(
        detailPhoneModal.id,
        c.size,
        c.price,
        c.originalPrice
      );
    });

    loadData();
    showToast(`✓ Đã lưu cấu hình giá & khuyến mãi cho ${detailPhoneModal.name}!`);
    setDetailPhoneModal(null);
  };

  // Batch action: Apply discount to all selected phones
  const handleBatchApplyPhoneDiscount = (percent: number) => {
    if (selectedPhoneIds.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 dòng máy để cấu hình.');
      return;
    }

    selectedPhoneIds.forEach((pId) => {
      const phone = phones.find((p) => p.id === pId);
      if (phone) {
        phone.capacities.forEach((c) => {
          const orig = c.originalPrice > 0 ? c.originalPrice : c.price;
          const newPrice =
            percent === 0 ? orig : Math.round((orig * (100 - percent)) / 100000) * 1000;
          IShopStore.updatePhonePrice(pId, c.size, newPrice, orig);
        });
      }
    });

    loadData();
    setSelectedPhoneIds([]);
    showToast(
      percent === 0
        ? `✓ Đã khôi phục giá gốc cho ${selectedPhoneIds.length} dòng máy đã chọn!`
        : `✓ Đã áp dụng giảm ${percent}% thành công cho ${selectedPhoneIds.length} dòng máy!`
    );
  };

  // Select all / toggle for phones
  const handleToggleSelectAllPhones = () => {
    if (selectedPhoneIds.length === filteredPhones.length) {
      setSelectedPhoneIds([]);
    } else {
      setSelectedPhoneIds(filteredPhones.map((p) => p.id));
    }
  };

  const handleToggleSelectPhone = (id: string) => {
    setSelectedPhoneIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered phones list
  const filteredPhones = useMemo(() => {
    return phones.filter((p) => {
      if (phoneBrandFilter !== 'all' && p.brand !== phoneBrandFilter) return false;
      if (phoneDiscountFilter === 'discounted') {
        const hasDiscount = p.capacities.some((c) => c.originalPrice > c.price);
        if (!hasDiscount) return false;
      } else if (phoneDiscountFilter === 'original') {
        const allOriginal = p.capacities.every(
          (c) => !c.originalPrice || c.originalPrice <= c.price
        );
        if (!allOriginal) return false;
      }
      if (phoneSearch.trim()) {
        const q = phoneSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [phones, phoneBrandFilter, phoneDiscountFilter, phoneSearch]);

  // Unique brands
  const phoneBrands = useMemo(() => {
    const set = new Set<string>();
    phones.forEach((p) => set.add(p.brand));
    return Array.from(set);
  }, [phones]);

  // =========================================================================
  // ACCESSORY PRICING LIST HANDLERS
  // =========================================================================

  const handleSaveAccessory = (
    accId: string,
    data: {
      sellingPrice?: number;
      originalPrice?: number;
      discountWhenBoughtWithPhone?: number;
      pointsToRedeem?: number;
    }
  ) => {
    IShopStore.updateAccessory(accId, data);
    loadData();
    showToast('✓ Đã cập nhật giá phụ kiện thành công!');
  };

  const handleBatchApplyAccDiscountWithPhone = (percent: number) => {
    if (selectedAccIds.length === 0) {
      alert('Vui lòng tích chọn phụ kiện trong danh sách để áp dụng.');
      return;
    }

    selectedAccIds.forEach((id) => {
      IShopStore.updateAccessory(id, { discountWhenBoughtWithPhone: percent });
    });

    loadData();
    setSelectedAccIds([]);
    showToast(`✓ Đã thiết lập giảm ${percent}% khi mua kèm máy cho ${selectedAccIds.length} phụ kiện!`);
  };

  const handleAutoCalcPointsAllAccessories = () => {
    if (
      !window.confirm(
        'Tự động chuẩn hóa điểm đổi quà cho toàn bộ phụ kiện (1 điểm = 1.000 VNĐ)?'
      )
    )
      return;

    accessories.forEach((a) => {
      const pts = Math.max(10, Math.round(a.sellingPrice / 1000));
      IShopStore.updateAccessory(a.id, { pointsToRedeem: pts });
    });

    loadData();
    showToast('✓ Đã đồng bộ điểm đổi quà (1 điểm = 1.000đ) cho tất cả phụ kiện!');
  };

  const filteredAccessories = useMemo(() => {
    return accessories.filter((a) => {
      if (accCategoryFilter !== 'all' && a.category !== accCategoryFilter) return false;
      if (accSearch.trim()) {
        const q = accSearch.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.barcode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accessories, accCategoryFilter, accSearch]);

  const accCategories = useMemo(() => {
    const map = new Map<string, string>();
    accessories.forEach((a) => map.set(a.category, a.categoryName || a.category));
    return Array.from(map.entries());
  }, [accessories]);

  // =========================================================================
  // CAMPAIGN FLASH SALE HANDLERS
  // =========================================================================

  const openNewCampaignModal = () => {
    setEditingCampaignId(null);
    setCampaignTitle('');
    setCampaignDesc('');
    setCampaignBadge('FLASH SALE');
    setCampaignType('percentage');
    setCampaignValue(15);
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
      alert('Vui lòng nhập tên chiến dịch khuyến mãi');
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

  // =========================================================================
  // PROMO QR CODE HANDLERS
  // =========================================================================

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

    showToast('✓ Đã tạo mã QR Khuyến mãi mới!');
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

  // Metrics summary
  const discountedPhonesCount = useMemo(() => {
    return phones.filter((p) => p.capacities.some((c) => c.originalPrice > c.price)).length;
  }, [phones]);

  const activeCampaignsCount = useMemo(() => {
    return campaigns.filter((c) => c.isActive && new Date(c.endDate).getTime() > now).length;
  }, [campaigns, now]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Trung Tâm Quản Trị Giá & Khuyến Mãi
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Hệ thống bảng cấu hình dạng List 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Tag className="w-7 h-7 text-amber-600" />
            <span>Cấu Hình Giá Bán & Khuyến Mãi Dạng List</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Quản lý giá niêm yết, thiết lập % chiết khấu nhanh từ danh sách định sẵn, cấu hình Flash Sale thời gian thực và voucher QR giúp tránh hoàn toàn sai sót khi nhập thủ công.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={openNewCampaignModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>+ Tạo Flash Sale Mới</span>
          </button>
          <button
            onClick={openNewQrModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>+ Tạo Mã QR Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Dòng Điện Thoại
            </span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {phones.length} <span className="text-xs font-normal text-slate-500">model</span>
            </span>
            <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
              {discountedPhonesCount} model đang giảm giá
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Mặt Hàng Phụ Kiện
            </span>
            <span className="text-xl font-black text-emerald-700 mt-0.5 block">
              {accessories.length} <span className="text-xs font-normal text-slate-500">loại</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Cấu hình % giảm kèm máy
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Chiến Dịch Flash Sale
            </span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block">
              {activeCampaignsCount} / {campaigns.length}
            </span>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Đang chạy thời gian thực
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Mã QR Khuyến Mãi
            </span>
            <span className="text-xl font-black text-indigo-700 mt-0.5 block">
              {promoQRs.filter((q) => q.isActive).length} <span className="text-xs font-normal text-slate-500">mã</span>
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
              Quét camera áp dụng ngay
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('phones')}
          className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'phones'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>1. Cấu Hình Giá & KM Điện Thoại (List)</span>
        </button>

        <button
          onClick={() => setActiveTab('accessories')}
          className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'accessories'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>2. Cấu Hình Giá & KM Phụ Kiện (List)</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. Danh Sách Flash Sale ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qrcodes')}
          className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'qrcodes'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>4. Danh Sách Mã QR Voucher ({promoQRs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('redeem')}
          className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'redeem'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>5. Cấu Hình Điểm Đổi Quà Tặng</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CẤU HÌNH GIÁ & KHUYẾN MÃI ĐIỆN THOẠI (DẠNG LIST THÔNG MINH) */}
      {/* ========================================================================= */}
      {activeTab === 'phones' && (
        <div className="space-y-4">
          {/* Filter Bar & Controls */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Tìm dòng máy (iPhone 16 Pro, S24 Ultra, Xiaomi 14)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Trạng thái giá:</span>
                <select
                  value={phoneDiscountFilter}
                  onChange={(e: any) => setPhoneDiscountFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="all">Tất cả ({phones.length})</option>
                  <option value="discounted">Đang giảm giá ({discountedPhonesCount})</option>
                  <option value="original">Giá niêm yết chuẩn ({phones.length - discountedPhonesCount})</option>
                </select>
              </div>
            </div>

            {/* Brand Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Hãng:
              </span>
              <button
                onClick={() => setPhoneBrandFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  phoneBrandFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({phones.length})
              </button>
              {phoneBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => setPhoneBrandFilter(b)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    phoneBrandFilter === b
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b} ({phones.filter((p) => p.brand === b).length})
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Bar (when phones are checked) */}
          {selectedPhoneIds.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-black font-black text-xs">
                  {selectedPhoneIds.length}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Dòng máy được chọn trong danh sách:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-600 font-medium">Áp dụng giảm nhanh:</span>
                <button
                  onClick={() => handleBatchApplyPhoneDiscount(5)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-bold text-xs text-amber-900 transition-colors cursor-pointer"
                >
                  -5%
                </button>
                <button
                  onClick={() => handleBatchApplyPhoneDiscount(10)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-bold text-xs text-amber-900 transition-colors cursor-pointer"
                >
                  -10%
                </button>
                <button
                  onClick={() => handleBatchApplyPhoneDiscount(15)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-bold text-xs text-amber-900 transition-colors cursor-pointer"
                >
                  -15%
                </button>
                <button
                  onClick={() => handleBatchApplyPhoneDiscount(20)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-bold text-xs text-amber-900 transition-colors cursor-pointer"
                >
                  -20%
                </button>
                <button
                  onClick={() => handleBatchApplyPhoneDiscount(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 transition-colors cursor-pointer"
                >
                  Khôi phục giá gốc
                </button>
                <button
                  onClick={() => setSelectedPhoneIds([])}
                  className="p-1 text-slate-400 hover:text-slate-600 text-xs underline ml-2 cursor-pointer"
                >
                  Hủy chọn
                </button>
              </div>
            </div>
          )}

          {/* Main Phones Table List View */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredPhones.length > 0 &&
                          selectedPhoneIds.length === filteredPhones.length
                        }
                        onChange={handleToggleSelectAllPhones}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Dòng Máy & Thương Hiệu</th>
                    <th className="p-3.5">Các Phiên Bản Dung Lượng & Giá Niêm Yết</th>
                    <th className="p-3.5">Khoảng Giá Bán Hiện Tại</th>
                    <th className="p-3.5 text-center">Mức Khuyến Mãi</th>
                    <th className="p-3.5 text-center">Cấu Hình Nhanh (Preset)</th>
                    <th className="p-3.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPhones.map((phone) => {
                    const isSelected = selectedPhoneIds.includes(phone.id);
                    const prices = phone.capacities.map((c) => c.price);
                    const origPrices = phone.capacities.map((c) =>
                      c.originalPrice > 0 ? c.originalPrice : c.price
                    );
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const minOrig = Math.min(...origPrices);
                    const maxOrig = Math.max(...origPrices);

                    const hasDiscount = phone.capacities.some((c) => c.originalPrice > c.price);
                    const maxDiscountPct = Math.max(
                      ...phone.capacities.map((c) => {
                        const o = c.originalPrice > 0 ? c.originalPrice : c.price;
                        return o > c.price ? Math.round(((o - c.price) / o) * 100) : 0;
                      })
                    );

                    return (
                      <tr
                        key={phone.id}
                        className={`hover:bg-amber-50/30 transition-colors ${
                          isSelected ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPhone(phone.id)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>

                        {/* Product & Brand */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                                phone.brand === 'Apple'
                                  ? 'bg-slate-900 text-white'
                                  : phone.brand === 'Samsung'
                                  ? 'bg-blue-600 text-white'
                                  : phone.brand === 'Xiaomi'
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {phone.brand}
                            </span>
                            <div>
                              <strong className="text-slate-900 text-xs sm:text-sm block">
                                {phone.name}
                              </strong>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span>BH: {phone.warrantyInfo}</span>
                                <span>•</span>
                                <Link
                                  href={`/phones/${phone.slug}`}
                                  target="_blank"
                                  className="text-amber-700 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Xem web</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Capacities chip list */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {phone.capacities.map((cap) => {
                              const isCapDiscounted = cap.originalPrice > cap.price;
                              const capPct = isCapDiscounted
                                ? Math.round(
                                    ((cap.originalPrice - cap.price) / cap.originalPrice) * 100
                                  )
                                : 0;

                              return (
                                <div
                                  key={cap.size}
                                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 ${
                                    isCapDiscounted
                                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="font-black font-sans">{cap.size}:</span>
                                  <span className="font-bold">{formatVND(cap.price)}</span>
                                  {isCapDiscounted && (
                                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-1 rounded">
                                      -{capPct}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Current price range */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono">
                            <span className="text-sm font-black text-amber-900 block">
                              {minPrice === maxPrice
                                ? formatVND(minPrice)
                                : `${formatVND(minPrice)} - ${formatVND(maxPrice)}`}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-slate-400 line-through block">
                                Gốc:{' '}
                                {minOrig === maxOrig
                                  ? formatVND(minOrig)
                                  : `${formatVND(minOrig)} - ${formatVND(maxOrig)}`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Discount Status Badge */}
                        <td className="p-3.5 text-center">
                          {hasDiscount ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <Zap className="w-3 h-3 text-rose-600" />
                              Giảm đến {maxDiscountPct}%
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Giá chuẩn
                            </span>
                          )}
                        </td>

                        {/* Quick Presets dropdown / buttons */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => applyQuickPhoneDiscount(phone.id, 0)}
                              className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Khôi phục giá gốc"
                            >
                              0%
                            </button>
                            <button
                              onClick={() => applyQuickPhoneDiscount(phone.id, 5)}
                              className="px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            >
                              -5%
                            </button>
                            <button
                              onClick={() => applyQuickPhoneDiscount(phone.id, 10)}
                              className="px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            >
                              -10%
                            </button>
                            <button
                              onClick={() => applyQuickPhoneDiscount(phone.id, 15)}
                              className="px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            >
                              -15%
                            </button>
                          </div>
                        </td>

                        {/* Action Details button */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href="/admin/inventory/phones"
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs inline-flex items-center gap-1 transition-transform active:scale-95 shadow-sm"
                              title="Quản lý số lượng tồn kho và Còn/Hết hàng theo từng màu và dung lượng"
                            >
                              <Package className="w-3.5 h-3.5 text-amber-700" />
                              <span>Tồn Kho</span>
                            </Link>
                            <button
                              onClick={() => openDetailPhoneModal(phone)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-400" />
                              <span>Cấu Hình</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPhones.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Không tìm thấy dòng máy nào phù hợp với bộ lọc hiện tại.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CẤU HÌNH GIÁ & KHUYẾN MÃI PHỤ KIỆN (DẠNG LIST THÔNG MINH) */}
      {/* ========================================================================= */}
      {activeTab === 'accessories' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accSearch}
                  onChange={(e) => setAccSearch(e.target.value)}
                  placeholder="Tìm phụ kiện (Củ sạc GaN, Kính KingKong, Barcode)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoCalcPointsAllAccessories}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Quy đổi 1 điểm = 1.000 VNĐ cho toàn bộ phụ kiện"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chuẩn hóa 1 điểm = 1.000đ</span>
                </button>
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Danh mục:
              </span>
              <button
                onClick={() => setAccCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  accCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({accessories.length})
              </button>
              {accCategories.map(([catKey, catName]) => (
                <button
                  key={catKey}
                  onClick={() => setAccCategoryFilter(catKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    accCategoryFilter === catKey
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {catName} ({accessories.filter((a) => a.category === catKey).length})
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Bar for Accessories */}
          {selectedAccIds.length > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                  {selectedAccIds.length}
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  Phụ kiện được chọn: Áp dụng mức giảm khi mua kèm máy:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[10, 15, 20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleBatchApplyAccDiscountWithPhone(pct)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 font-bold text-xs text-emerald-900 transition-colors cursor-pointer"
                  >
                    -{pct}%
                  </button>
                ))}
                <button
                  onClick={() => setSelectedAccIds([])}
                  className="p-1 text-slate-400 hover:text-slate-600 text-xs underline ml-2 cursor-pointer"
                >
                  Hủy chọn
                </button>
              </div>
            </div>
          )}

          {/* Accessories Table List View */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredAccessories.length > 0 &&
                          selectedAccIds.length === filteredAccessories.length
                        }
                        onChange={() => {
                          if (selectedAccIds.length === filteredAccessories.length) {
                            setSelectedAccIds([]);
                          } else {
                            setSelectedAccIds(filteredAccessories.map((a) => a.id));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Phụ Kiện & Barcode</th>
                    <th className="p-3.5">Thương Hiệu</th>
                    <th className="p-3.5">Giá Niêm Yết Gốc</th>
                    <th className="p-3.5">Giá Bán Lẻ Hiện Tại</th>
                    <th className="p-3.5 text-center">Giảm Khi Mua Kèm Máy</th>
                    <th className="p-3.5 text-center">Điểm Đổi Thưởng</th>
                    <th className="p-3.5 text-right">Lưu Thay Đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccessories.map((acc) => {
                    const isSelected = selectedAccIds.includes(acc.id);
                    return (
                      <tr
                        key={acc.id}
                        className={`hover:bg-emerald-50/20 transition-colors ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedAccIds((prev) =>
                                prev.includes(acc.id)
                                  ? prev.filter((id) => id !== acc.id)
                                  : [...prev, acc.id]
                              );
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.imageUrl}
                              alt={acc.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block text-xs sm:text-sm">
                                {acc.name}
                              </strong>
                              <span className="text-[11px] font-mono text-slate-500">
                                Barcode: {acc.barcode} • Tồn: {acc.stock}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-semibold text-slate-700">{acc.brand}</td>

                        <td className="p-3.5">
                          <span className="font-mono text-slate-600 block">
                            {formatVND(acc.originalPrice || acc.sellingPrice)}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-mono font-black text-emerald-900 text-sm block">
                            {formatVND(acc.sellingPrice)}
                          </span>
                        </td>

                        {/* Discount with phone % (preset selector) */}
                        <td className="p-3.5 text-center">
                          <select
                            value={acc.discountWhenBoughtWithPhone || 15}
                            onChange={(e) =>
                              handleSaveAccessory(acc.id, {
                                discountWhenBoughtWithPhone: Number(e.target.value),
                              })
                            }
                            className="p-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="0">0% (Không giảm)</option>
                            <option value="10">-10%</option>
                            <option value="15">-15% (Chuẩn)</option>
                            <option value="20">-20%</option>
                            <option value="30">-30%</option>
                            <option value="50">-50% (Đặc biệt)</option>
                          </select>
                        </td>

                        {/* Redeem points */}
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-black text-xs font-mono inline-block">
                            {acc.pointsToRedeem || Math.round(acc.sellingPrice / 1000)} pts
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              showToast(`✓ Đã đồng bộ giá phụ kiện ${acc.name}!`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm ml-auto"
                          >
                            <Save className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* ========================================================================= */}
      {/* TAB 3: CHIẾN DỊCH FLASH SALE (DANH SÁCH BẢNG GỌN GÀNG) */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Danh Sách Chiến Dịch Flash Sale & Giờ Vàng</span>
              </h2>
              <p className="text-xs text-slate-500">
                Hiển thị theo dạng list có đồng hồ đếm ngược thời gian thực và công tắc Bật/Tắt nhanh chóng.
              </p>
            </div>

            <button
              onClick={openNewCampaignModal}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Thiết Lập Chiến Dịch Mới</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Chiến Dịch & Huy Hiệu</th>
                    <th className="p-3.5">Mức Khuyến Mãi</th>
                    <th className="p-3.5">Phạm Vi Áp Dụng</th>
                    <th className="p-3.5">Thời Gian Hiệu Lực</th>
                    <th className="p-3.5 text-center">Đếm Ngược</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((camp) => {
                    const isExpired = new Date(camp.endDate).getTime() <= now;
                    const isUpcoming = new Date(camp.startDate).getTime() > now;
                    const isRunning = camp.isActive && !isExpired && !isUpcoming;

                    return (
                      <tr key={camp.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500 text-black">
                              {camp.badgeText || 'PROMO'}
                            </span>
                            <div>
                              <strong className="text-slate-900 block text-xs sm:text-sm">
                                {camp.title}
                              </strong>
                              <span className="text-[11px] text-slate-500 line-clamp-1">
                                {camp.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-sm font-black text-rose-600 font-mono">
                            {camp.discountType === 'percentage'
                              ? `-${camp.discountValue}%`
                              : `-${formatVND(camp.discountValue)}`}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {camp.targetCategory === 'all'
                              ? 'Toàn bộ cửa hàng'
                              : camp.targetCategory === 'phones'
                              ? '📱 Chỉ Điện thoại'
                              : camp.targetCategory === 'accessories'
                              ? '🎧 Chỉ Phụ kiện'
                              : '🛠️ Sửa chữa'}
                          </span>
                        </td>

                        <td className="p-3.5 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                          <div>Từ: {new Date(camp.startDate).toLocaleString('vi-VN')}</div>
                          <div>Đến: {new Date(camp.endDate).toLocaleString('vi-VN')}</div>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span
                            className={`font-mono font-black text-xs px-2.5 py-1 rounded-xl ${
                              isRunning
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {formatCountdown(camp.endDate)}
                          </span>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleCampaign(camp.id, camp.isActive)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              camp.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {camp.isActive ? '● Đang Bật' : '○ Tạm Dừng'}
                          </button>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditCampaignModal(camp)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Sửa chiến dịch"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Xóa chiến dịch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {campaigns.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Chưa có chiến dịch Flash Sale nào được tạo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MÃ QR KHUYẾN MÃI (DANH SÁCH BẢNG GỌN GÀNG) */}
      {/* ========================================================================= */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>Danh Sách Mã QR Voucher Khuyến Mãi</span>
              </h2>
              <p className="text-xs text-slate-500">
                Khách hàng có thể quét mã trực tiếp tại quầy hoặc giỏ hàng để được trừ tiền tự động.
              </p>
            </div>

            <button
              onClick={openNewQrModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Mã QR Voucher Mới</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Mã Voucher & Tiêu Đề</th>
                    <th className="p-3.5">Mức Giảm</th>
                    <th className="p-3.5">Đơn Tối Thiểu</th>
                    <th className="p-3.5 text-center">Mã QR</th>
                    <th className="p-3.5 text-center">Đếm Ngược</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promoQRs.map((qr) => {
                    const isExpired = new Date(qr.endDate).getTime() <= now;

                    return (
                      <tr key={qr.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="p-3.5">
                          <div>
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                              {qr.code}
                            </span>
                            <strong className="text-slate-900 block text-xs sm:text-sm mt-1">
                              {qr.title}
                            </strong>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {qr.description}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-sm font-black text-rose-600 font-mono">
                            {qr.discountType === 'percentage'
                              ? `-${qr.discountValue}%`
                              : `-${formatVND(qr.discountValue)}`}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                          {formatVND(qr.minOrderValue)}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setPreviewQrModal(qr)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <QrCode className="w-4 h-4 text-indigo-600" />
                            <span>Xem QR</span>
                          </button>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="font-mono text-xs text-amber-800 font-bold">
                            {formatCountdown(qr.endDate)}
                          </span>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleQR(qr.id, qr.isActive)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              qr.isActive && !isExpired
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {qr.isActive && !isExpired ? '● Hoạt động' : '○ Tạm dừng'}
                          </button>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteQR(qr.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Xóa mã QR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {promoQRs.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Chưa có mã QR voucher nào được tạo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CẤU HÌNH ĐIỂM ĐỔI QUÀ (DANH SÁCH BẢNG GỌN GÀNG) */}
      {/* ========================================================================= */}
      {activeTab === 'redeem' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span>Danh Sách Phụ Kiện Đổi Điểm Thưởng Tích Lũy</span>
              </h2>
              <p className="text-xs text-slate-500">
                Quy đổi điểm thưởng (loyalty points) của khách hàng thành quà tặng phụ kiện chính hãng.
              </p>
            </div>

            <button
              onClick={handleAutoCalcPointsAllAccessories}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Quy đổi tự động 1 điểm = 1.000đ cho tất cả</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Hình Ảnh & Phụ Kiện</th>
                    <th className="p-3.5">Giá Bán Lẻ Hiện Tại</th>
                    <th className="p-3.5">Tồn Kho</th>
                    <th className="p-3.5 text-center">Số Điểm Cần Đổi (pts)</th>
                    <th className="p-3.5 text-center">Tương Đương Giá Trị</th>
                    <th className="p-3.5 text-right">Lưu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessories.map((acc) => {
                    const currentPts = acc.pointsToRedeem || Math.round(acc.sellingPrice / 1000);

                    return (
                      <tr key={acc.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={acc.imageUrl}
                              alt={acc.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block text-xs sm:text-sm">
                                {acc.name}
                              </strong>
                              <span className="text-[11px] font-mono text-slate-500">
                                {acc.brand} • Barcode: {acc.barcode}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {formatVND(acc.sellingPrice)}
                        </td>

                        <td className="p-3.5">
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

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            {[50, 99, 199, 390].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => handleSaveAccessory(acc.id, { pointsToRedeem: preset })}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  currentPts === preset
                                    ? 'bg-amber-500 text-black font-black'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {preset}p
                              </button>
                            ))}
                            <input
                              type="number"
                              step="10"
                              min="10"
                              value={currentPts}
                              onChange={(e) =>
                                handleSaveAccessory(acc.id, {
                                  pointsToRedeem: Number(e.target.value),
                                })
                              }
                              className="w-16 p-1 bg-amber-50 border border-amber-300 rounded-lg text-center font-mono font-black text-xs text-amber-900 focus:bg-white focus:outline-none"
                            />
                            <span className="text-[11px] font-bold text-slate-500">pts</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-mono text-slate-500">
                          ~{formatVND(currentPts * 1000)}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => showToast(`✓ Đã lưu điểm đổi cho ${acc.name}!`)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm ml-auto"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
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

      {/* ========================================================================= */}
      {/* MODAL: CẤU HÌNH CHI TIẾT GIÁ & KHUYẾN MÃI CHO 1 DÒNG MÁY (DẠNG LIST BIẾN THỂ) */}
      {/* ========================================================================= */}
      {detailPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-black text-base leading-tight">
                    Cấu Hình Giá & Khuyến Mãi: {detailPhoneModal.name}
                  </h3>
                  <span className="text-xs text-amber-100 font-medium">
                    Hãng: {detailPhoneModal.brand} • Bảo hành: {detailPhoneModal.warrantyInfo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailPhoneModal(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Quick All-capacity discount bar */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-900">
                    Áp dụng mức giảm chung cho tất cả dung lượng:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {DISCOUNT_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyAllCapacitiesInModal(pct)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {pct === 0 ? 'Giá gốc (0%)' : `-${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacities Configuration List Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 w-24">Dung Lượng</th>
                      <th className="p-3.5">Giá Gốc Niêm Yết</th>
                      <th className="p-3.5 text-center">% Chiết Khấu</th>
                      <th className="p-3.5">Giá Bán Khuyến Mãi (VNĐ)</th>
                      <th className="p-3.5 text-right">Chênh Lệch Tiết Kiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailCapacities.map((cap, idx) => {
                      const diff = cap.originalPrice - cap.price;

                      return (
                        <tr key={cap.size} className="hover:bg-amber-50/20">
                          {/* Capacity Badge */}
                          <td className="p-3.5 font-mono font-black text-sm text-slate-900">
                            {cap.size}
                          </td>

                          {/* Original Price Input */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <input
                                type="number"
                                step="50000"
                                value={cap.originalPrice}
                                onChange={(e) =>
                                  handleDetailCapacityChange(
                                    idx,
                                    'originalPrice',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-36 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 focus:bg-white focus:border-amber-500 focus:outline-none"
                              />
                              <div className="text-[10px] text-slate-400 font-medium">
                                {formatVietnameseWords(cap.originalPrice)}
                              </div>
                            </div>
                          </td>

                          {/* Discount % Selector */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <select
                                value={cap.discountPercent}
                                onChange={(e) =>
                                  handleDetailCapacityChange(idx, 'percent', Number(e.target.value))
                                }
                                className="p-1.5 bg-rose-50 border border-rose-300 text-rose-900 font-bold rounded-xl text-xs focus:outline-none cursor-pointer"
                              >
                                {DISCOUNT_PRESETS.map((p) => (
                                  <option key={p} value={p}>
                                    {p === 0 ? '0% (Gốc)' : `-${p}%`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Promo Selling Price Input */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <input
                                type="number"
                                step="50000"
                                value={cap.price}
                                onChange={(e) =>
                                  handleDetailCapacityChange(idx, 'price', Number(e.target.value))
                                }
                                className="w-36 p-2 bg-amber-50/60 border-2 border-amber-300 rounded-xl font-mono font-black text-xs text-amber-900 focus:bg-white focus:border-amber-500 focus:outline-none shadow-sm"
                              />
                              <div className="text-[10px] text-amber-700 font-bold">
                                {formatVietnameseWords(cap.price)}
                              </div>
                            </div>
                          </td>

                          {/* Difference preview */}
                          <td className="p-3.5 text-right font-mono">
                            {diff > 0 ? (
                              <div className="text-rose-600 font-bold">
                                <span>- {formatVND(diff)}</span>
                                <span className="block text-[10px] text-slate-500">
                                  (-{cap.discountPercent}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Giá gốc</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Hệ thống tự động đồng bộ giá bán này sang tồn kho máy chưa bán (in_stock) và giỏ hàng của khách hàng.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDetailPhoneModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleSavePhoneDetail}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Máy Này</span>
              </button>
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
                <Zap className="w-5 h-5 text-amber-200" />
                <h3 className="font-black text-base">
                  {editingCampaignId ? 'Chỉnh Sửa Chiến Dịch Khuyến Mãi' : 'Thiết Lập Flash Sale Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
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
                  placeholder="VD: Flash Sale Giờ Vàng Giáng Sinh 2026..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả ngắn hiển thị khách hàng:</label>
                <textarea
                  rows={2}
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  placeholder="VD: Giảm ngay 15% cho toàn bộ iPhone và phụ kiện..."
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
                  {campaignType === 'fixed_amount' && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {formatVietnameseWords(campaignValue)}
                    </span>
                  )}
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
                  <label className="font-bold text-slate-700 block mb-1">Phạm vi áp dụng:</label>
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
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-lg cursor-pointer"
                >
                  Lưu & Áp Dụng Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO MÃ QR VOUCHER MỚI */}
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
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
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
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg cursor-pointer"
                >
                  Tạo Mã QR Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM PHÓNG TO MÃ QR KHUYẾN MÃI */}
      {/* ========================================================================= */}
      {previewQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {previewQrModal.code}
              </span>
              <button
                onClick={() => setPreviewQrModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-base">{previewQrModal.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{previewQrModal.description}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  previewQrModal.code
                )}`}
                alt={previewQrModal.code}
                className="w-48 h-48 rounded-xl bg-white p-2 shadow-sm border border-slate-200"
              />
            </div>

            <div className="text-xs space-y-1">
              <div className="text-rose-600 font-bold">
                Ưu đãi:{' '}
                {previewQrModal.discountType === 'percentage'
                  ? `Giảm ${previewQrModal.discountValue}%`
                  : `Giảm ${formatVND(previewQrModal.discountValue)}`}
              </div>
              <div className="text-slate-500">
                Đơn tối thiểu: {formatVND(previewQrModal.minOrderValue)}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>In Mã QR Này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
