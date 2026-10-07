'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Smartphone,
  Headphones,
  Search,
  Trash2,
  Printer,
  CheckCircle2,
  User,
  Plus,
  Minus,
  Barcode,
  X,
  Sparkles,
  Edit,
  UserPlus,
  UserCheck,
  Award,
  Phone,
  MapPin,
  Lock,
  Unlock,
  ShieldAlert,
  Percent,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { PhoneStockItem, AccessoryProduct, Role, Invoice, InvoiceItem, Customer } from '@/lib/types';
import { formatVND, generateVietQRUrl } from '@/lib/vietqr';
import {
  MEMBERSHIP_TIERS,
  getTierByPoints,
  calculateProductRewardPoints,
} from '@/lib/loyalty';

export default function POSPage() {
  const [role, setRole] = useState<Role>('admin');
  const [activeTab, setActiveTab] = useState<'phones' | 'accessories'>('phones');

  const [availablePhones, setAvailablePhones] = useState<PhoneStockItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);

  // Search queries
  const [phoneSearch, setPhoneSearch] = useState('');
  const [accessorySearch, setAccessorySearch] = useState('');

  // POS Order & Customer State (Mẫu IncomSoft: Chọn, Xóa, Thêm, Sửa)
  const [posItems, setPosItems] = useState<InvoiceItem[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('cust-1');
  const [customerName, setCustomerName] = useState('Khách Lẻ Cửa Hàng (Hoàng Gia Bảo)');
  const [customerPhone, setCustomerPhone] = useState('0909123456');
  const [customerAddress, setCustomerAddress] = useState('45 Lê Văn Việt, TP. Thủ Đức, TP.HCM');
  const [customerMembership, setCustomerMembership] = useState('Thẻ Bạch Kim');
  const [customerPoints, setCustomerPoints] = useState<number>(62365);
  const [customerType, setCustomerType] = useState('Khách lẻ');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vietqr'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Loyalty & Custom Discount Permission State
  const [discountMode, setDiscountMode] = useState<'auto' | 'custom'>('auto');
  const [customDiscountType, setCustomDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(0);
  const [customDiscountFixed, setCustomDiscountFixed] = useState<number>(0);
  const [isDiscountOverrideUnlocked, setIsDiscountOverrideUnlocked] = useState(false);
  const [isManagerAuthModalOpen, setIsManagerAuthModalOpen] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [managerPinError, setManagerPinError] = useState<string | null>(null);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);

  // Customer Management Modals
  const [isSelectCustomerOpen, setIsSelectCustomerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');
  const [customerFeedback, setCustomerFeedback] = useState<string | null>(null);

  // Customer Form State (for Add & Edit)
  const [formCustName, setFormCustName] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formCustEmail, setFormCustEmail] = useState('');
  const [formCustAddress, setFormCustAddress] = useState('');
  const [formCustType, setFormCustType] = useState('Khách lẻ');
  const [formCustTier, setFormCustTier] = useState('Thẻ Bạch Kim');
  const [formCustPoints, setFormCustPoints] = useState<number>(0);
  const [formCustTaxCode, setFormCustTaxCode] = useState('');
  const [formCustBirthday, setFormCustBirthday] = useState('');
  const [formCustCity, setFormCustCity] = useState('TP. Hồ Chí Minh');
  const [formCustNotes, setFormCustNotes] = useState('');

  // Print Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'k80' | 'a5'>('k80');

  const loadStock = () => {
    setRole(IShopStore.getRole());
    setAvailablePhones(IShopStore.getAvailablePhones());
    setAccessories(IShopStore.getAccessories());

    const custs = IShopStore.getCustomers();
    setCustomersList(custs);

    // Sync live in-stock phones from MySQL
    fetch('/api/inventory/phones?status=in_stock')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAvailablePhones(json.data);
        }
      })
      .catch((err) => console.warn('POS stock sync notice:', err));

    // Sync live customers from MySQL
    fetch('/api/customers')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const merged = [...custs];
          json.data.forEach((apiCust: any) => {
            if (!merged.some((c) => c.phone === apiCust.phone)) {
              merged.push({
                id: apiCust.id,
                name: apiCust.name,
                phone: apiCust.phone,
                email: apiCust.email || '',
                address: apiCust.address || '',
                totalSpent: apiCust.totalSpent || 0,
                points: apiCust.points || 0,
                customerType: 'Khách lẻ',
                membershipTier: apiCust.points > 50000 ? 'Thẻ Bạch Kim' : apiCust.points > 10000 ? 'Thẻ Vàng' : 'Thành viên mới',
                createdAt: apiCust.createdAt ? apiCust.createdAt.substring(0, 10) : '2026-08-24',
                purchaseCount: apiCust.purchaseCount || 1,
                repairCount: apiCust.repairCount || 0,
              });
            }
          });
          setCustomersList(merged);
        }
      })
      .catch((err) => console.warn('Customer sync notice:', err));
  };

  // Customer Action Handlers
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerAddress(cust.address || '');
    const points = cust.points || 0;
    setCustomerPoints(points);
    const tierConfig = getTierByPoints(points);
    setCustomerMembership(tierConfig.tier);
    setCustomerType(cust.customerType || 'Khách lẻ');
    setDiscountMode('auto');
    setIsSelectCustomerOpen(false);
    setCustomerFeedback(
      `✓ Đã chọn: ${cust.name} (${tierConfig.tier} - Chiết khấu ${tierConfig.discountPercent}%)!`
    );
    setTimeout(() => setCustomerFeedback(null), 3000);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName('Khách Lẻ Cửa Hàng');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerMembership('Thành viên mới');
    setCustomerPoints(0);
    setCustomerType('Khách lẻ');
    setDiscountMode('auto');
    setCustomDiscountPercent(0);
    setCustomDiscountFixed(0);
    setCustomerFeedback('✓ Đã bỏ chọn, quay về Khách Lẻ Cửa Hàng (0% chiết khấu)!');
    setTimeout(() => setCustomerFeedback(null), 2500);
  };

  const handleRequestCustomDiscount = () => {
    if (canEditDiscount) {
      setDiscountMode('custom');
    } else {
      setIsManagerAuthModalOpen(true);
      setManagerPinInput('');
      setManagerPinError(null);
    }
  };

  const handleVerifyManagerPin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = managerPinInput.trim();
    if (pin === '1807' || pin === 'admin' || pin === 'admin123' || pin === '8888') {
      setIsDiscountOverrideUnlocked(true);
      setDiscountMode('custom');
      setIsManagerAuthModalOpen(false);
      setManagerPinInput('');
      setManagerPinError(null);
      setCustomerFeedback('✓ Quản lý / Chủ shop đã phê duyệt quyền chỉnh sửa chiết khấu!');
      setTimeout(() => setCustomerFeedback(null), 3500);
    } else {
      setManagerPinError('Mã PIN không đúng! Mặc định là 1807 hoặc mật khẩu quản trị.');
    }
  };

  const handleOpenAddCustomer = () => {
    setFormCustName('');
    setFormCustPhone('');
    setFormCustEmail('');
    setFormCustAddress('');
    setFormCustType('Khách lẻ');
    setFormCustTier('Thẻ Bạch Kim');
    setFormCustPoints(0);
    setFormCustTaxCode('');
    setFormCustBirthday('');
    setFormCustCity('TP. Hồ Chí Minh');
    setFormCustNotes('');
    setIsAddCustomerOpen(true);
  };

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustName.trim() || !formCustPhone.trim()) {
      alert('Vui lòng nhập Tên và Số điện thoại khách hàng!');
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: formCustName.trim(),
      phone: formCustPhone.trim(),
      email: formCustEmail.trim() || undefined,
      address: formCustAddress.trim() || undefined,
      customerType: formCustType,
      membershipTier: formCustTier,
      points: Number(formCustPoints) || 0,
      taxCode: formCustTaxCode.trim() || undefined,
      birthday: formCustBirthday || undefined,
      city: formCustCity.trim() || undefined,
      notes: formCustNotes.trim() || undefined,
      totalSpent: 0,
      createdAt: new Date().toISOString().substring(0, 10),
      purchaseCount: 0,
      repairCount: 0,
    };

    IShopStore.addCustomer(newCust);
    setCustomersList(IShopStore.getCustomers());

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCust.name,
          phone: newCust.phone,
          email: newCust.email,
          address: newCust.address,
          points: newCust.points,
        }),
      });
    } catch (err) {
      console.warn('API save customer notice:', err);
    }

    handleSelectCustomer(newCust);
    setIsAddCustomerOpen(false);
    setCustomerFeedback(`✓ Đã thêm và chọn khách hàng mới: ${newCust.name}!`);
    setTimeout(() => setCustomerFeedback(null), 3000);
  };

  const handleOpenEditCustomer = () => {
    const existing = selectedCustomerId
      ? customersList.find((c) => c.id === selectedCustomerId)
      : customersList.find((c) => c.phone === customerPhone);

    if (existing) {
      setFormCustName(existing.name);
      setFormCustPhone(existing.phone);
      setFormCustEmail(existing.email || '');
      setFormCustAddress(existing.address || customerAddress);
      setFormCustType(existing.customerType || customerType);
      setFormCustTier(existing.membershipTier || customerMembership);
      setFormCustPoints(existing.points || customerPoints);
      setFormCustTaxCode(existing.taxCode || '');
      setFormCustBirthday(existing.birthday || '');
      setFormCustCity(existing.city || 'TP. Hồ Chí Minh');
      setFormCustNotes(existing.notes || '');
    } else {
      setFormCustName(customerName !== 'Khách Mua Tại Quầy' ? customerName : '');
      setFormCustPhone(customerPhone);
      setFormCustEmail('');
      setFormCustAddress(customerAddress);
      setFormCustType(customerType);
      setFormCustTier(customerMembership);
      setFormCustPoints(customerPoints);
      setFormCustTaxCode('');
      setFormCustBirthday('');
      setFormCustCity('TP. Hồ Chí Minh');
      setFormCustNotes('');
    }
    setIsEditCustomerOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustName.trim() || !formCustPhone.trim()) {
      alert('Vui lòng nhập Tên và Số điện thoại khách hàng!');
      return;
    }

    const targetId = selectedCustomerId || 'cust-' + Date.now();
    const updatedData: Partial<Customer> = {
      name: formCustName.trim(),
      phone: formCustPhone.trim(),
      email: formCustEmail.trim() || undefined,
      address: formCustAddress.trim() || undefined,
      customerType: formCustType,
      membershipTier: formCustTier,
      points: Number(formCustPoints) || 0,
      taxCode: formCustTaxCode.trim() || undefined,
      birthday: formCustBirthday || undefined,
      city: formCustCity.trim() || undefined,
      notes: formCustNotes.trim() || undefined,
    };

    if (selectedCustomerId) {
      IShopStore.updateCustomer(selectedCustomerId, updatedData);
    } else {
      IShopStore.addCustomer({
        id: targetId,
        name: formCustName.trim(),
        phone: formCustPhone.trim(),
        email: formCustEmail.trim() || undefined,
        address: formCustAddress.trim() || undefined,
        customerType: formCustType,
        membershipTier: formCustTier,
        points: Number(formCustPoints) || 0,
        taxCode: formCustTaxCode.trim() || undefined,
        birthday: formCustBirthday || undefined,
        city: formCustCity.trim() || undefined,
        notes: formCustNotes.trim() || undefined,
        totalSpent: 0,
        createdAt: new Date().toISOString().substring(0, 10),
        purchaseCount: 1,
        repairCount: 0,
      });
      setSelectedCustomerId(targetId);
    }

    setCustomersList(IShopStore.getCustomers());

    setCustomerName(formCustName.trim());
    setCustomerPhone(formCustPhone.trim());
    setCustomerAddress(formCustAddress.trim());
    setCustomerMembership(formCustTier);
    setCustomerPoints(Number(formCustPoints) || 0);
    setCustomerType(formCustType);

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formCustName.trim(),
          phone: formCustPhone.trim(),
          email: formCustEmail.trim(),
          address: formCustAddress.trim(),
          points: Number(formCustPoints) || 0,
        }),
      });
    } catch (err) {
      console.warn('API update customer notice:', err);
    }

    setIsEditCustomerOpen(false);
    setCustomerFeedback(`✓ Đã cập nhật thông tin khách hàng: ${formCustName.trim()}!`);
    setTimeout(() => setCustomerFeedback(null), 3000);
  };

  useEffect(() => {
    loadStock();
    const listener = () => loadStock();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Filtered lists
  const filteredPhones = availablePhones.filter(
    (p) =>
      p.imei.includes(phoneSearch.trim()) ||
      p.phoneName.toLowerCase().includes(phoneSearch.toLowerCase()) ||
      p.color.toLowerCase().includes(phoneSearch.toLowerCase())
  );

  const filteredAccessories = accessories.filter(
    (a) =>
      a.barcode.includes(accessorySearch.trim()) ||
      a.name.toLowerCase().includes(accessorySearch.toLowerCase())
  );

  // Add phone by specific IMEI
  const addPhoneToOrder = (stockItem: PhoneStockItem) => {
    const isAlreadyIn = posItems.some((i) => i.imei === stockItem.imei);
    if (isAlreadyIn) {
      alert('Cây máy có số IMEI này đã được thêm vào đơn hàng!');
      return;
    }

    const rewardPoints = calculateProductRewardPoints({
      type: 'phone',
      sellingPrice: stockItem.sellingPrice,
      rewardPoints: stockItem.rewardPoints,
    });

    const newItem: InvoiceItem = {
      type: 'phone',
      id: stockItem.phoneId,
      name: stockItem.phoneName,
      variant: `${stockItem.color} - ${stockItem.capacity}`,
      imei: stockItem.imei,
      quantity: 1,
      unitPrice: stockItem.sellingPrice,
      costPrice: stockItem.costPrice,
      discount: 0,
      total: stockItem.sellingPrice,
      rewardPoints,
    };

    setPosItems([...posItems, newItem]);
  };

  // Add accessory
  const addAccessoryToOrder = (acc: AccessoryProduct) => {
    const rewardPoints = calculateProductRewardPoints({
      type: 'accessory',
      sellingPrice: acc.sellingPrice,
      rewardPoints: acc.rewardPoints,
    });

    const existing = posItems.find((i) => i.type === 'accessory' && i.id === acc.id);
    if (existing) {
      setPosItems(
        posItems.map((i) =>
          i.type === 'accessory' && i.id === acc.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      const newItem: InvoiceItem = {
        type: 'accessory',
        id: acc.id,
        name: acc.name,
        barcode: acc.barcode,
        quantity: 1,
        unitPrice: acc.sellingPrice,
        costPrice: acc.costPrice,
        discount: 0,
        total: acc.sellingPrice,
        rewardPoints,
      };
      setPosItems([...posItems, newItem]);
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setPosItems(posItems.filter((_, idx) => idx !== index));
    } else {
      setPosItems(
        posItems.map((item, idx) =>
          idx === index ? { ...item, quantity: newQty, total: newQty * item.unitPrice } : item
        )
      );
    }
  };

  const subtotal = posItems.reduce((sum, i) => sum + i.total, 0);

  // Điểm tích lũy đơn hàng hiện tại (tính tự động theo từng sản phẩm)
  const totalOrderRewardPoints = posItems.reduce(
    (sum, i) => sum + (i.rewardPoints || 0) * i.quantity,
    0
  );

  // Cấu hình thẻ thành viên theo điểm tích lũy hiện tại
  const currentTierConfig = getTierByPoints(customerPoints);

  // Phân quyền chỉnh sửa chiết khấu: Chủ shop (admin) hoặc Nhân viên có quyền pos_discount, hoặc được duyệt mã PIN tại quầy
  const canEditDiscount =
    role === 'admin' ||
    IShopStore.hasPermission(role, 'pos_discount') ||
    isDiscountOverrideUnlocked;

  // Tính chiết khấu
  const isWalkInGuest =
    !customerPhone ||
    customerPhone === '0900000000' ||
    customerName === 'Khách Lẻ Cửa Hàng';
  const autoDiscountPercent =
    isWalkInGuest && customerPoints === 0 ? 0 : currentTierConfig.discountPercent;
  const autoDiscountAmount = Math.round(subtotal * (autoDiscountPercent / 100));

  const effectiveDiscount =
    discountMode === 'auto'
      ? autoDiscountAmount
      : customDiscountType === 'percent'
      ? Math.round(subtotal * (Math.min(100, Math.max(0, customDiscountPercent)) / 100))
      : Math.min(subtotal, Math.max(0, customDiscountFixed));

  const totalAmount = Math.max(0, subtotal - effectiveDiscount);
  const changeAmount = Math.max(0, cashGiven - totalAmount);

  // Process payment & create invoice
  const handleCheckout = async () => {
    if (posItems.length === 0) {
      alert('Vui lòng chọn sản phẩm trước khi thanh toán!');
      return;
    }

    const cashierName =
      role === 'admin' ? 'Chủ shop Huy Hoàng' : role === 'cashier' ? 'Thu ngân quầy' : 'KTV quầy';

    // 1. Post to live MySQL Database
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Khách Mua Tại Quầy',
          customerPhone: customerPhone.trim() || '0900000000',
          items: posItems,
          subtotal,
          discount: effectiveDiscount,
          totalAmount,
          earnedPoints: totalOrderRewardPoints,
          paymentMethod,
          cashReceived: paymentMethod === 'cash' ? cashGiven : undefined,
          cashChange: paymentMethod === 'cash' ? changeAmount : undefined,
          cashierName,
        }),
      });
    } catch (err) {
      console.warn('API order checkout notice:', err);
    }

    // 2. Also save to client store for immediate reactivity and printing
    const invoice = IShopStore.createInvoice({
      customerName: customerName.trim() || 'Khách Mua Tại Quầy',
      customerPhone: customerPhone.trim() || '0900000000',
      customerTier: currentTierConfig.tier,
      items: posItems,
      subtotal,
      discount: effectiveDiscount,
      totalAmount,
      pointsEarned: totalOrderRewardPoints,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashGiven : undefined,
      cashChange: paymentMethod === 'cash' ? changeAmount : undefined,
      cashierName,
      warrantyNote: 'Bảo hành 12 tháng máy mới / 12 tháng phụ kiện 1 đổi 1.',
    });

    setCompletedInvoice(invoice);
    setPosItems([]);
    setDiscountMode('auto');
    setCustomDiscountPercent(0);
    setCustomDiscountFixed(0);
    setCashGiven(0);
    setIsDiscountOverrideUnlocked(false);
    loadStock();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            <span>Màn Hình Bán Hàng POS Siêu Tốc 2026</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Bán máy theo số IMEI cụ thể (tự động kích hoạt bảo hành) & Quét mã vạch phụ kiện.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('phones')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'phones'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Kho Máy Mới IMEI ({availablePhones.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('accessories')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'accessories'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Kho Phụ Kiện Barcode ({accessories.length})</span>
          </button>
        </div>
      </div>

      {/* POS Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab 1: Phones by IMEI */}
          {activeTab === 'phones' ? (
            <div className="glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4 shadow-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Quét hoặc nhập 15 số IMEI, tên máy (VD: 358921104829104, iPhone 16...)"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredPhones.map((unit) => {
                  const isInOrder = posItems.some((i) => i.imei === unit.imei);

                  return (
                    <div
                      key={unit.imei}
                      onClick={() => !isInOrder && addPhoneToOrder(unit)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isInOrder
                          ? 'border-amber-500/50 bg-amber-500/10 opacity-70 cursor-not-allowed'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/40 hover:scale-[1.005]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {unit.phoneName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                            {unit.color} • {unit.capacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="font-mono text-amber-300 font-bold">
                            IMEI: {unit.imei}
                          </span>
                          <span>• Nhập: {unit.importDate}</span>
                          <span>• NCC: {unit.supplierName.split(' ')[0]}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-400 block">
                          {formatVND(unit.sellingPrice)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isInOrder ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isInOrder ? '✓ Đã trong đơn' : '+ Chọn bán'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredPhones.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-xs font-mono">
                    Không tìm thấy cây máy nào khớp với &quot;{phoneSearch}&quot;
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Accessories by Barcode */
            <div className="glass-panel rounded-3xl p-6 border-white/[0.08] space-y-4 shadow-xl">
              <div className="relative">
                <Barcode className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accessorySearch}
                  onChange={(e) => setAccessorySearch(e.target.value)}
                  placeholder="Quét mã vạch Barcode máy quét hoặc gõ tên phụ kiện..."
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredAccessories.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => addAccessoryToOrder(acc)}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-400/40 cursor-pointer transition-all flex items-center justify-between gap-3 hover:scale-[1.005]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.imageUrl}
                        alt={acc.name}
                        className="w-11 h-11 object-contain rounded-xl bg-black/40 p-1.5 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {acc.name}
                        </h4>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400 font-bold">{acc.barcode}</span>
                          <span>• Tồn: <strong className="text-white">{acc.stock} cái</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-400 block">
                        {formatVND(acc.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">+ Thêm giỏ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: High-Contrast POS Cashier Terminal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border-white/[0.12] space-y-4 shadow-2xl bg-[#090e1a]/95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Đơn Hàng Hiện Tại ({posItems.length} món)</span>
              </h2>
              {posItems.length > 0 && (
                <button
                  onClick={() => setPosItems([])}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Xóa hết
                </button>
              )}
            </div>

            {/* Customer Information Panel (Mẫu ERP IncomSoft: Chọn, Xóa, Thêm, Sửa) */}
            <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Khách Hàng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsTiersModalOpen(true)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm"
                    title="Xem bảng tích điểm sản phẩm và mức chiết khấu từng hạng thẻ"
                  >
                    <Gift className="w-3 h-3 text-amber-400" />
                    <span>Bảng Điểm & Thẻ</span>
                  </button>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentTierConfig.badgeClass}`}>
                    {currentTierConfig.tier}
                  </span>
                </div>
              </div>

              {/* Customer Name Display / Quick Edit */}
              <div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Khách Lẻ Cửa Hàng..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/15 rounded-xl text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              {/* The 4 Action Buttons: Chọn - Xóa - Thêm - Sửa (Chuẩn Mẫu incomSoft) */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelectCustomerOpen(true)}
                  className="py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  title="Tìm và chọn khách hàng từ danh bạ cửa hàng"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Chọn</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer hover:scale-[1.02]"
                  title="Xóa/Bỏ chọn khách hàng, quay về khách lẻ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddCustomer}
                  className="py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  title="Thêm mới khách hàng trực tiếp tại quầy"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEditCustomer}
                  className="py-1.5 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                  title="Sửa thông tin khách hàng đang chọn"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {customerFeedback && (
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{customerFeedback}</span>
                </div>
              )}

              {/* Detail Fields (Mẫu incomSoft): Thẻ thành viên, Điểm hiện tại, Địa chỉ, Điện thoại */}
              <div className="space-y-2 text-xs pt-1 border-t border-white/5">
                {/* Thẻ thành viên */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-4 text-gray-400 font-semibold text-[11px]">Thẻ thành viên:</span>
                  <div className="col-span-8">
                    <span className={`w-full block px-2.5 py-1 rounded-lg font-bold text-xs font-mono border ${currentTierConfig.badgeClass}`}>
                      {currentTierConfig.tier} (Chiết khấu {currentTierConfig.discountPercent}%)
                    </span>
                  </div>
                </div>

                {/* Điểm hiện tại */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-4 text-gray-400 font-semibold text-[11px]">Điểm hiện tại:</span>
                  <div className="col-span-8">
                    <div className="flex items-center justify-between px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                      <span className="text-amber-300 font-black text-xs font-mono">
                        {customerPoints.toLocaleString('vi-VN')} điểm
                      </span>
                      {totalOrderRewardPoints > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold font-mono">
                          (+{totalOrderRewardPoints.toLocaleString('vi-VN')} đơn này)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Địa chỉ */}
                <div className="grid grid-cols-12 gap-2 items-start">
                  <span className="col-span-4 text-gray-400 font-semibold text-[11px] pt-1">Địa chỉ:</span>
                  <div className="col-span-8">
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Nhập địa chỉ giao hàng / hóa đơn..."
                      className="w-full px-2.5 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400 leading-tight"
                    />
                  </div>
                </div>

                {/* Điện thoại */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-4 text-gray-400 font-semibold text-[11px]">Điện thoại:</span>
                  <div className="col-span-8">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="09xx xxx xxx (kích hoạt BH)"
                      className="w-full px-2.5 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table in POS Bill */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border-t border-b border-white/[0.08] py-3">
              {posItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-mono">
                  Chưa có sản phẩm nào. Chọn máy theo IMEI hoặc phụ kiện bên trái.
                </div>
              ) : (
                posItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white truncate">{item.name}</h4>
                        {item.rewardPoints && item.rewardPoints > 0 ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold shrink-0">
                            +{item.rewardPoints * item.quantity} pts
                          </span>
                        ) : null}
                      </div>
                      {item.imei && (
                        <span className="text-[10px] font-mono text-amber-300 font-bold block">
                          IMEI: {item.imei}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="text-[10px] font-mono text-gray-400 block">
                          Barcode: {item.barcode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.type === 'accessory' ? (
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                          <button
                            onClick={() => updateQuantity(idx, item.quantity - 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-white px-1 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, item.quantity + 1)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          1 Cây
                        </span>
                      )}

                      <span className="font-black text-amber-400 text-xs font-mono">
                        {formatVND(item.total)}
                      </span>

                      <button
                        onClick={() => setPosItems(posItems.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Reward Points for this Order */}
            {posItems.length > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Điểm thưởng tích lũy đơn này:</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-amber-400">
                    +{totalOrderRewardPoints.toLocaleString('vi-VN')} điểm
                  </span>
                  {customerPhone && customerPhone !== '0900000000' && (
                    <span className="block text-[10px] text-gray-400 font-mono">
                      (Sau mua: {(customerPoints + totalOrderRewardPoints).toLocaleString('vi-VN')} pts)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Calculations & Discounts with Permission & Tiers */}
            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Tổng tiền hàng:</span>
                <span className="font-bold text-white font-mono">{formatVND(subtotal)}</span>
              </div>

              {/* Chiết khấu / Giảm giá Container */}
              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-white text-xs">Chiết khấu / Giảm giá:</span>
                  </div>
                  {/* Mode switcher tabs */}
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDiscountMode('auto')}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                        discountMode === 'auto'
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Theo thẻ ({autoDiscountPercent}%)
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestCustomDiscount}
                      className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                        discountMode === 'custom'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title={
                        canEditDiscount
                          ? 'Tự nhập % hoặc số tiền chiết khấu'
                          : 'Cần quyền Chủ shop / Quản lý duyệt'
                      }
                    >
                      {!canEditDiscount && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                      <span>Tùy chỉnh</span>
                    </button>
                  </div>
                </div>

                {discountMode === 'auto' ? (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${currentTierConfig.badgeClass}`}>
                        {currentTierConfig.tier}
                      </span>
                      <span>({autoDiscountPercent}% tổng đơn)</span>
                    </div>
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {effectiveDiscount > 0 ? `-${formatVND(effectiveDiscount)}` : '0 đ'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-white/5 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() => setCustomDiscountType('percent')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            customDiscountType === 'percent'
                              ? 'bg-white/20 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Theo %
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDiscountType('fixed')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            customDiscountType === 'fixed'
                              ? 'bg-white/20 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Số tiền (đ)
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 w-36">
                        {customDiscountType === 'percent' ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customDiscountPercent || ''}
                              onChange={(e) =>
                                setCustomDiscountPercent(
                                  Math.max(0, Math.min(100, Number(e.target.value) || 0))
                                )
                              }
                              placeholder="0"
                              className="w-full text-right p-1.5 bg-white/[0.06] border border-blue-400/40 rounded-lg text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-gray-400 font-bold">%</span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={customDiscountFixed || ''}
                              onChange={(e) =>
                                setCustomDiscountFixed(Math.max(0, Number(e.target.value) || 0))
                              }
                              placeholder="0"
                              className="w-full text-right p-1.5 bg-white/[0.06] border border-blue-400/40 rounded-lg text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-gray-400 font-bold">đ</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="text-blue-300 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {role === 'admin'
                          ? 'Chủ shop duyệt'
                          : isDiscountOverrideUnlocked
                          ? 'Quản lý mở khóa tại quầy'
                          : 'Nhân viên được cấp quyền'}
                      </span>
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        -{formatVND(effectiveDiscount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm font-black border-t border-white/[0.08] pt-2 text-white">
                <span>Khách phải trả:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-1 text-xs">
              <label className="text-gray-400 font-bold block">Phương thức thanh toán:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>💵 Tiền Mặt</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
                    paymentMethod === 'vietqr'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>📱 VietQR Napas</span>
                </button>
              </div>

              {/* Cash given calculation */}
              {paymentMethod === 'cash' ? (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-semibold">Tiền khách đưa:</span>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                      placeholder="Nhập số tiền..."
                      className="w-40 text-right p-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white font-bold text-sm"
                    />
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1.5 border-t border-white/5">
                    <span className="text-gray-400">Tiền thừa trả khách:</span>
                    <span className="text-emerald-400 text-sm">{formatVND(changeAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <span className="text-blue-300 font-bold block mb-1">
                    Mã QR tự động sinh sau khi bấm thanh toán
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Khách quét app ngân hàng MB, VCB, Techcombank, VPBank...
                  </span>
                </div>
              )}
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleCheckout}
              disabled={posItems.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <Printer className="w-5 h-5" />
              <span>THANH TOÁN & IN HÓA ĐƠN K80</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal (K80 & A5) */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1424] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Khổ in:</span>
                <button
                  onClick={() => setPrintFormat('k80')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    printFormat === 'k80' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Nhiệt K80 (80mm)
                </button>
                <button
                  onClick={() => setPrintFormat('a5')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    printFormat === 'a5' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Khổ A5
                </button>
              </div>

              <button
                onClick={() => setCompletedInvoice(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Canvas */}
            <div
              id="printable-receipt"
              className={`bg-white text-black p-5 rounded-2xl mx-auto font-mono text-xs shadow-inner ${
                printFormat === 'k80' ? 'max-w-[320px] text-[11px]' : 'max-w-md text-xs'
              }`}
            >
              <div className="text-center space-y-1 pb-3 border-b border-black border-dashed">
                <h2 className="font-bold text-base tracking-wider uppercase">iShop Huy Hoàng</h2>
                <p className="text-[10px]">Đ/C: 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức</p>
                <p className="text-[10px]">Hotline: 0988.888.999</p>
                <h3 className="font-bold text-sm mt-2 uppercase">HÓA ĐƠN BÁN HÀNG</h3>
                <p className="text-[10px]">Số HĐ: {completedInvoice.invoiceCode}</p>
                <p className="text-[10px]">Ngày: {completedInvoice.createdAt}</p>
              </div>

              <div className="py-2 space-y-1 border-b border-black border-dashed text-[11px]">
                <p>Khách hàng: <strong>{completedInvoice.customerName}</strong></p>
                <p>SĐT: <strong>{completedInvoice.customerPhone}</strong></p>
                <p>Thu ngân: {completedInvoice.cashierName}</p>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-black border-dashed space-y-2">
                {completedInvoice.items.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{item.name}</span>
                      <span>{formatVND(item.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>SL: {item.quantity} x {formatVND(item.unitPrice)}</span>
                    </div>
                    {item.imei && (
                      <div className="text-[10px] font-bold text-red-600">
                        * IMEI: {item.imei}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Totals */}
              <div className="py-2 space-y-1 border-b border-black border-dashed text-[11px]">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatVND(completedInvoice.subtotal)}</span>
                </div>
                {completedInvoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Chiết khấu:</span>
                    <span>-{formatVND(completedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1">
                  <span>TỔNG CỘNG:</span>
                  <span>{formatVND(completedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>Phương thức:</span>
                  <span className="uppercase font-bold">{completedInvoice.paymentMethod}</span>
                </div>
                {completedInvoice.customerTier && (
                  <div className="flex justify-between text-[10px] text-gray-700">
                    <span>Hạng thẻ:</span>
                    <span className="font-bold">{completedInvoice.customerTier}</span>
                  </div>
                )}
                {typeof completedInvoice.pointsEarned === 'number' && completedInvoice.pointsEarned > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-800 font-bold border-t border-dashed border-gray-400 pt-0.5">
                    <span>Điểm tích lũy đơn này:</span>
                    <span>+{completedInvoice.pointsEarned} điểm</span>
                  </div>
                )}
              </div>

              {/* QR Code in receipt for payment or warranty lookup */}
              <div className="py-3 text-center space-y-1">
                {completedInvoice.paymentMethod === 'vietqr' ? (
                  <>
                    <img
                      src={generateVietQRUrl(completedInvoice.totalAmount, completedInvoice.invoiceCode)}
                      alt="VietQR"
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-[9px]">Quét mã VietQR Napas 247 để chuyển khoản</p>
                  </>
                ) : (
                  <p className="text-[10px] font-semibold text-gray-700">
                    Đã thanh toán tiền mặt đủ.
                  </p>
                )}
                <p className="text-[9px] italic mt-2">
                  {completedInvoice.warrantyNote}
                </p>
                <p className="text-[9px] font-bold mt-1">Xin cảm ơn và hẹn gặp lại quý khách!</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 no-print">
              <button
                onClick={handlePrint}
                className="btn-gold flex-1 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>In Hóa Đơn Ngay (Ctrl + P)</span>
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CHỌN KHÁCH HÀNG (Select Customer Modal) */}
      {/* ============================================================== */}
      {isSelectCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Chọn Khách Hàng Thân Thiết (CRM POS)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectCustomerOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Gõ số điện thoại, tên khách hàng hoặc địa chỉ để tìm..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
              </div>

              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                <span className="text-gray-400 font-semibold shrink-0">Lọc theo:</span>
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'Thẻ Bạch Kim', label: 'Bạch Kim' },
                  { key: 'Thẻ Vàng', label: 'Thẻ Vàng' },
                  { key: 'Thẻ Bạc', label: 'Thẻ Bạc' },
                  { key: 'Khách lẻ', label: 'Khách lẻ' },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setCustomerTierFilter(tier.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      customerTierFilter === tier.key
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px] max-h-[400px]">
              {customersList
                .filter((c) => {
                  const query = customerSearch.toLowerCase().trim();
                  const matchQuery =
                    !query ||
                    c.name.toLowerCase().includes(query) ||
                    c.phone.includes(query) ||
                    (c.address && c.address.toLowerCase().includes(query));
                  const matchTier =
                    customerTierFilter === 'all' ||
                    c.membershipTier === customerTierFilter ||
                    c.customerType === customerTierFilter;
                  return matchQuery && matchTier;
                })
                .map((cust) => {
                  const isCurrent = selectedCustomerId === cust.id || customerPhone === cust.phone;
                  return (
                    <div
                      key={cust.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm">{cust.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {cust.membershipTier || 'Thành viên mới'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 font-mono">
                            {cust.points?.toLocaleString('vi-VN') || 0} điểm
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                          <span className="font-mono text-amber-300 font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{cust.phone}</span>
                          </span>
                          {cust.address && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{cust.address}</span>
                            </span>
                          )}
                          <span>• {cust.purchaseCount || 0} lần mua</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-white'
                          }`}
                        >
                          {isCurrent ? '✓ Đang chọn' : 'Chọn khách này'}
                        </button>
                      </div>
                    </div>
                  );
                })}

              {customersList.filter((c) => {
                const query = customerSearch.toLowerCase().trim();
                return (
                  !query ||
                  c.name.toLowerCase().includes(query) ||
                  c.phone.includes(query) ||
                  (c.address && c.address.toLowerCase().includes(query))
                );
              }).length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Không tìm thấy khách hàng khớp với &quot;{customerSearch}&quot;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSelectCustomerOpen(false);
                  handleOpenAddCustomer();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm khách hàng mới</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSelectCustomerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: THÊM KHÁCH HÀNG MỚI (Mẫu Chuẩn Hình 3 incomSoft) */}
      {/* ============================================================== */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header with Save & Close buttons matching IncomSoft Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Thêm Khách Hàng Mới Tại Quầy</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Loại khách hàng: *</label>
                  <select
                    value={formCustType}
                    onChange={(e) => setFormCustType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Khách lẻ" className="bg-[#0f172a]">Khách lẻ (mua trực tiếp)</option>
                    <option value="Khách thợ" className="bg-[#0f172a]">Khách thợ / Cửa hàng bạn</option>
                    <option value="Khách buôn" className="bg-[#0f172a]">Khách buôn / Đại lý</option>
                    <option value="Doanh nghiệp" className="bg-[#0f172a]">Doanh nghiệp / Công ty</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Thẻ thành viên:</label>
                  <select
                    value={formCustTier}
                    onChange={(e) => setFormCustTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Thành viên mới" className="bg-[#0f172a]">Thành viên mới</option>
                    <option value="Thẻ Đồng" className="bg-[#0f172a]">Thẻ Đồng</option>
                    <option value="Thẻ Bạc" className="bg-[#0f172a]">Thẻ Bạc</option>
                    <option value="Thẻ Vàng" className="bg-[#0f172a]">Thẻ Vàng</option>
                    <option value="Thẻ Bạch Kim" className="bg-[#0f172a]">Thẻ Bạch Kim</option>
                    <option value="VIP Diamond" className="bg-[#0f172a]">VIP Diamond</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Tên Khách Hàng: *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Anh Hoàng, Chị Mai..."
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Điện thoại (kích hoạt BH): *</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0909 123 456"
                    value={formCustPhone}
                    onChange={(e) => setFormCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Thư điện tử (Email):</label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com"
                    value={formCustEmail}
                    onChange={(e) => setFormCustEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Điểm tích lũy ban đầu:</label>
                  <input
                    type="number"
                    value={formCustPoints}
                    onChange={(e) => setFormCustPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Địa chỉ:</label>
                <textarea
                  rows={2}
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={formCustAddress}
                  onChange={(e) => setFormCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Tỉnh/Thành phố:</label>
                  <input
                    type="text"
                    value={formCustCity}
                    onChange={(e) => setFormCustCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Mã số thuế (nếu có):</label>
                  <input
                    type="text"
                    placeholder="MST doanh nghiệp"
                    value={formCustTaxCode}
                    onChange={(e) => setFormCustTaxCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Sinh nhật:</label>
                  <input
                    type="date"
                    value={formCustBirthday}
                    onChange={(e) => setFormCustBirthday(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Ghi chú thêm:</label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu riêng, thói quen mua hàng, v.v..."
                  value={formCustNotes}
                  onChange={(e) => setFormCustNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Lưu & Gán Vào Đơn Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SỬA THÔNG TIN KHÁCH HÀNG (Edit Customer Modal) */}
      {/* ============================================================== */}
      {isEditCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Chỉnh Sửa Thông Tin Khách Hàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCustomerOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Loại khách hàng:</label>
                  <select
                    value={formCustType}
                    onChange={(e) => setFormCustType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="Khách lẻ" className="bg-[#0f172a]">Khách lẻ (mua trực tiếp)</option>
                    <option value="Khách thợ" className="bg-[#0f172a]">Khách thợ / Cửa hàng bạn</option>
                    <option value="Khách buôn" className="bg-[#0f172a]">Khách buôn / Đại lý</option>
                    <option value="Doanh nghiệp" className="bg-[#0f172a]">Doanh nghiệp / Công ty</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Thẻ thành viên:</label>
                  <select
                    value={formCustTier}
                    onChange={(e) => setFormCustTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="Thành viên mới" className="bg-[#0f172a]">Thành viên mới</option>
                    <option value="Thẻ Đồng" className="bg-[#0f172a]">Thẻ Đồng</option>
                    <option value="Thẻ Bạc" className="bg-[#0f172a]">Thẻ Bạc</option>
                    <option value="Thẻ Vàng" className="bg-[#0f172a]">Thẻ Vàng</option>
                    <option value="Thẻ Bạch Kim" className="bg-[#0f172a]">Thẻ Bạch Kim</option>
                    <option value="VIP Diamond" className="bg-[#0f172a]">VIP Diamond</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Tên Khách Hàng: *</label>
                  <input
                    type="text"
                    required
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Điện thoại (kích hoạt BH): *</label>
                  <input
                    type="tel"
                    required
                    value={formCustPhone}
                    onChange={(e) => setFormCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-300 font-mono font-bold focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Thư điện tử (Email):</label>
                  <input
                    type="email"
                    value={formCustEmail}
                    onChange={(e) => setFormCustEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Điểm tích lũy:</label>
                  <input
                    type="number"
                    value={formCustPoints}
                    onChange={(e) => setFormCustPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Địa chỉ:</label>
                <textarea
                  rows={2}
                  value={formCustAddress}
                  onChange={(e) => setFormCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Tỉnh/Thành phố:</label>
                  <input
                    type="text"
                    value={formCustCity}
                    onChange={(e) => setFormCustCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Mã số thuế:</label>
                  <input
                    type="text"
                    value={formCustTaxCode}
                    onChange={(e) => setFormCustTaxCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">Sinh nhật:</label>
                  <input
                    type="date"
                    value={formCustBirthday}
                    onChange={(e) => setFormCustBirthday(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">Ghi chú thêm:</label>
                <textarea
                  rows={2}
                  value={formCustNotes}
                  onChange={(e) => setFormCustNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  Cập Nhật Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: TRA CỨU BẢNG ĐIỂM & CHÍNH SÁCH HẠNG THẺ (Tiers Policy) */}
      {/* ============================================================== */}
      {isTiersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Bảng Điểm Tích Lũy & Chính Sách Chiết Khấu Hạng Thẻ 2026
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Cộng điểm tự động theo từng món hàng & chiết khấu theo thứ hạng thành viên.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTiersModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-xs">
              {/* Section 1: Bảng điểm tích lũy theo từng loại sản phẩm */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>1. Bảng Điểm Tích Lũy Mặc Định Theo Sản Phẩm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">📱 Máy Flagship (≥ 25 triệu):</span>
                    <p className="text-gray-300">iPhone 16 Pro Max, S24 Ultra... → <strong className="text-emerald-400 font-mono">+500 điểm</strong>/máy</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">📱 Cận Cao Cấp (15tr - 24.99tr):</span>
                    <p className="text-gray-300">iPhone 15, Xiaomi 14 Ultra... → <strong className="text-emerald-400 font-mono">+350 điểm</strong>/máy</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">📱 Tầm Trung (7tr - 14.99tr):</span>
                    <p className="text-gray-300">Samsung A55, Redmi Note Pro... → <strong className="text-emerald-400 font-mono">+200 điểm</strong>/máy</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">📱 Phổ Thông (&lt; 7 triệu):</span>
                    <p className="text-gray-300">Các dòng máy phổ thông → <strong className="text-emerald-400 font-mono">+100 điểm</strong>/máy</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400 block">🎧 Phụ Kiện Cao Cấp (≥ 1 triệu):</span>
                    <p className="text-gray-300">AirPods, Củ sạc đa cổng GaN... → <strong className="text-emerald-400 font-mono">+80 điểm</strong>/món</p>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-cyan-400 block">🔌 Phụ Kiện Tiêu Chuẩn (300k - 999k):</span>
                    <p className="text-gray-300">Cáp sạc xịn, Sạc dự phòng... → <strong className="text-emerald-400 font-mono">+30 điểm</strong>/món</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Bảng Hạng Thẻ & Tỷ Lệ Chiết Khấu */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wide">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>2. Bảng Phân Hạng Thẻ & Mức Chiết Khấu Tự Động</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-[11px]">
                        <th className="py-2 px-2.5">Hạng Thẻ</th>
                        <th className="py-2 px-2.5">Điểm Tích Lũy</th>
                        <th className="py-2 px-2.5 text-center">Chiết Khấu Mặc Định</th>
                        <th className="py-2 px-2.5">Quyền Lợi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      {MEMBERSHIP_TIERS.map((tier, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${tier.badgeClass}`}>
                              {tier.tier}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-mono text-gray-300">
                            {tier.minPoints === 0 ? '< 1.000 điểm' : `≥ ${tier.minPoints.toLocaleString('vi-VN')} điểm`}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold text-amber-400 font-mono text-xs">
                            {tier.discountPercent}%
                          </td>
                          <td className="py-2 px-2.5 text-gray-400">
                            {tier.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Quy Định Phân Quyền Chiết Khấu */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">Quy định phân quyền chỉnh sửa % Chiết khấu:</p>
                  <p className="text-gray-300 leading-relaxed">
                    - Chiết khấu được tự động tính theo tỷ lệ của Hạng thẻ khách hàng đang sở hữu.<br />
                    - <strong>Chỉ Chủ shop (Admin)</strong> và <strong>Nhân viên bán hàng được cấp quyền (pos_discount)</strong> trong Bảng Ma Trận Phân Quyền mới được quyền sửa % chiết khấu thủ công.<br />
                    - Trường hợp nhân viên chưa có quyền, Quản lý / Chủ shop có thể nhập mã PIN tại quầy (mặc định: <strong>1807</strong>) để mở khóa duyệt chiết khấu nhanh cho đơn hàng.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTiersModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: XÁC THỰC MÃ PIN QUẢN LÝ ĐỂ SỬA CHIẾT KHẤU (Manager Auth) */}
      {/* ============================================================== */}
      {isManagerAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Xác Thực Phê Duyệt Chiết Khấu</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManagerAuthModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyManagerPin} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                Tài khoản nhân viên hiện tại chưa được cấp quyền chỉnh sửa % chiết khấu tự do. Vui lòng nhờ <strong>Chủ shop hoặc Quản lý</strong> nhập mã PIN để phê duyệt tại quầy.
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">
                  Mã PIN / Mật khẩu Quản lý phê duyệt: *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={managerPinInput}
                  onChange={(e) => {
                    setManagerPinInput(e.target.value);
                    setManagerPinError(null);
                  }}
                  placeholder="Nhập mã PIN (Mặc định: 1807)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold text-center tracking-widest text-base focus:outline-none focus:border-amber-400"
                />
                {managerPinError && (
                  <p className="text-rose-400 text-[11px] mt-1.5 font-semibold">
                    ✕ {managerPinError}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  * Gợi ý kiểm tra: PIN quản lý <strong>1807</strong> hoặc <strong>admin</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManagerAuthModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors cursor-pointer shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Xác Nhận Mở Khóa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
