'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Search,
  AlertTriangle,
  Barcode,
  Package,
  Tag,
  Plus,
  Save,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  ExternalLink,
  Layers,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Check,
  FolderPlus,
  Settings,
  FolderEdit,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct, AccessoryCategoryItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventoryAccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryProduct[]>([]);
  const [categories, setCategories] = useState<AccessoryCategoryItem[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal Sửa / Thêm Phụ Kiện
  const [editingAccessory, setEditingAccessory] = useState<AccessoryProduct | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formState, setFormState] = useState<Partial<AccessoryProduct>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal Quản Lý Danh Mục
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatCode, setEditingCatCode] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Quick Price Edit inline
  const [quickEditPriceId, setQuickEditPriceId] = useState<string | null>(null);
  const [quickTempPrice, setQuickTempPrice] = useState<number>(0);

  const loadData = () => {
    // 1. Tải danh sách phụ kiện & danh mục từ store
    const local = IShopStore.getAccessories();
    const localCats = IShopStore.getAccessoryCategories();
    setAccessories(local);
    setCategories(localCats);
    setRole(IShopStore.getRole());

    // 2. Đồng bộ phụ kiện từ MySQL API
    fetch('/api/inventory/accessories')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAccessories(res.data);
          res.data.forEach((acc: AccessoryProduct) => {
            IShopStore.addAccessory(acc);
          });
        }
      })
      .catch((err) => console.error('Lỗi tải phụ kiện từ MySQL:', err));

    // 3. Đồng bộ danh mục từ API
    fetch('/api/inventory/accessories/categories')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          IShopStore.saveAccessoryCategories(res.data);
        }
      })
      .catch((err) => console.error('Lỗi tải danh mục từ API:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  // Lọc danh sách hãng duy nhất
  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(accessories.map((a) => a.brand))).filter(Boolean);
    return brands;
  }, [accessories]);

  // Xử lý mở Modal Chỉnh Sửa
  const handleOpenEdit = (acc: AccessoryProduct) => {
    setIsCreatingNew(false);
    setEditingAccessory(acc);
    setFormState({
      id: acc.id,
      name: acc.name,
      slug: acc.slug,
      category: acc.category,
      categoryName: acc.categoryName,
      barcode: acc.barcode,
      brand: acc.brand,
      costPrice: acc.costPrice,
      sellingPrice: acc.sellingPrice,
      originalPrice: acc.originalPrice || acc.sellingPrice,
      stock: acc.stock,
      minStockAlert: acc.minStockAlert || 5,
      imageUrl: acc.imageUrl,
      specs: acc.specs || '',
      description: acc.description || '',
      compatibleWith: acc.compatibleWith || '',
      discountWhenBoughtWithPhone: acc.discountWhenBoughtWithPhone ?? 15,
      pointsToRedeem: acc.pointsToRedeem || Math.ceil(acc.sellingPrice / 1000),
    });
  };

  // Xử lý mở Modal Thêm Mới
  const handleOpenCreateNew = () => {
    setIsCreatingNew(true);
    setEditingAccessory(null);
    const defaultCat = categories[0] || { code: 'charger', name: 'Củ sạc GaN' };
    setFormState({
      id: `acc-${Date.now()}`,
      name: '',
      slug: '',
      category: defaultCat.code,
      categoryName: defaultCat.name,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      brand: 'Apple',
      costPrice: 200000,
      sellingPrice: 350000,
      originalPrice: 400000,
      stock: 10,
      minStockAlert: 5,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      specs: 'Công suất cao, hỗ trợ sạc nhanh',
      description: 'Phụ kiện chính hãng bảo hành 12 tháng 1 đổi 1',
      compatibleWith: 'iPhone, iPad, AirPods',
      discountWhenBoughtWithPhone: 15,
      pointsToRedeem: 350,
    });
  };

  // Lưu thông tin chỉnh sửa / thêm mới
  const handleSaveModal = async () => {
    if (!formState.name?.trim()) {
      alert('Vui lòng nhập tên phụ kiện!');
      return;
    }
    if (!formState.barcode?.trim()) {
      alert('Vui lòng nhập mã Barcode!');
      return;
    }

    const matchedCat = categories.find((c) => c.code === formState.category);

    const payload: AccessoryProduct = {
      id: formState.id || `acc-${Date.now()}`,
      name: formState.name.trim(),
      slug:
        formState.slug ||
        formState.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      category: formState.category || 'other',
      categoryName: matchedCat?.name || formState.categoryName || 'Phụ kiện khác',
      barcode: formState.barcode.trim(),
      brand: formState.brand?.trim() || 'Khác',
      costPrice: Number(formState.costPrice) || 0,
      sellingPrice: Number(formState.sellingPrice) || 0,
      originalPrice: Number(formState.originalPrice) || Number(formState.sellingPrice) || 0,
      stock: Math.max(0, Math.floor(Number(formState.stock) || 0)),
      minStockAlert: Math.max(0, Math.floor(Number(formState.minStockAlert) || 5)),
      imageUrl:
        formState.imageUrl?.trim() ||
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      specs: formState.specs || '',
      description: formState.description || '',
      compatibleWith: formState.compatibleWith || 'Tất cả thiết bị',
      discountWhenBoughtWithPhone: Number(formState.discountWhenBoughtWithPhone) || 15,
      pointsToRedeem: Number(formState.pointsToRedeem) || Math.ceil((formState.sellingPrice || 0) / 1000),
    };

    // 1. Cập nhật local store
    if (isCreatingNew) {
      IShopStore.addAccessory(payload);
    } else {
      IShopStore.updateAccessory(payload.id, payload);
    }

    // 2. Gửi request lưu vào MySQL API
    try {
      const res = await fetch('/api/inventory/accessories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          action: isCreatingNew ? 'create' : 'update',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn('API Warning:', data.error);
      }
    } catch (e) {
      console.error('Lỗi gọi API lưu phụ kiện:', e);
    }

    // Đóng modal & hiển thị thông báo
    setEditingAccessory(null);
    setIsCreatingNew(false);
    setToastMsg(
      isCreatingNew
        ? '✓ Đã thêm phụ kiện mới thành công!'
        : '✓ Đã cập nhật toàn bộ thông tin phụ kiện thành công!'
    );
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // ==========================================
  // XỬ LÝ QUẢN LÝ DANH MỤC PHỤ KIỆN
  // ==========================================
  const getCategoryProductCount = (code: string) => {
    return accessories.filter((a) => a.category === code).length;
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const cleanName = newCatName.trim();
    const cleanCode = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)+/g, '');

    const newCat: AccessoryCategoryItem = {
      id: `cat-${cleanCode}-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      productCount: 0,
    };

    IShopStore.addAccessoryCategory(newCat);
    setCategories((prev) => {
      if (prev.some((c) => c.code === cleanCode)) return prev;
      return [...prev, newCat];
    });
    setNewCatName('');

    try {
      await fetch('/api/inventory/accessories/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', code: cleanCode, name: cleanName }),
      });
    } catch (e) {
      console.error(e);
    }

    setToastMsg(`✓ Đã thêm danh mục mới "${cleanName}" thành công!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRenameCategory = async (code: string) => {
    if (!editingCatName.trim()) return;
    const newName = editingCatName.trim();

    IShopStore.updateAccessoryCategory(code, newName);

    try {
      await fetch('/api/inventory/accessories/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', oldCode: code, code, name: newName }),
      });
    } catch (e) {
      console.error(e);
    }

    setCategories((prev) =>
      prev.map((c) => (c.code === code ? { ...c, name: newName } : c))
    );
    setEditingCatCode(null);
    setToastMsg(`✓ Đã đổi tên danh mục thành "${newName}" thành công!`);
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  const handleDeleteCategory = async (code: string, catName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa danh mục "${catName}"? Các sản phẩm thuộc danh mục này sẽ được chuyển về "Phụ kiện khác".`
      )
    ) {
      return;
    }

    IShopStore.deleteAccessoryCategory(code);

    try {
      await fetch(`/api/inventory/accessories/categories?code=${code}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error(e);
    }

    setCategories((prev) => prev.filter((c) => c.code !== code));
    setToastMsg(`✓ Đã xóa danh mục "${catName}" thành công!`);
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // Xóa phụ kiện
  const handleDeleteAccessory = async (accId: string) => {
    IShopStore.deleteAccessory(accId);

    try {
      await fetch(`/api/inventory/accessories?id=${accId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Lỗi gọi API xóa phụ kiện:', e);
    }

    setDeleteConfirmId(null);
    setEditingAccessory(null);
    setToastMsg('✓ Đã xóa phụ kiện khỏi kho thành công!');
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // Cập nhật nhanh số lượng tồn kho trực tiếp
  const handleQuickAdjustStock = (acc: AccessoryProduct, delta: number) => {
    const newStock = Math.max(0, acc.stock + delta);
    IShopStore.updateAccessory(acc.id, { stock: newStock });

    fetch('/api/inventory/accessories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: acc.id, stock: newStock }),
    }).catch(console.error);

    loadData();
  };

  // Lưu giá nhanh
  const handleQuickSavePrice = (accId: string) => {
    if (quickTempPrice <= 0) return;
    IShopStore.updateAccessory(accId, { sellingPrice: quickTempPrice });

    fetch('/api/inventory/accessories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accId, sellingPrice: quickTempPrice }),
    }).catch(console.error);

    setQuickEditPriceId(null);
    setToastMsg('✓ Đã cập nhật giá bán mới thành công!');
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // Danh sách đã lọc
  const filtered = accessories
    .filter((a) => (categoryFilter === 'all' ? true : a.category === categoryFilter))
    .filter((a) => (brandFilter === 'all' ? true : a.brand === brandFilter))
    .filter((a) => {
      if (stockFilter === 'out_of_stock') return a.stock === 0;
      if (stockFilter === 'low_stock') return a.stock > 0 && a.stock <= a.minStockAlert;
      if (stockFilter === 'in_stock') return a.stock > a.minStockAlert;
      return true;
    })
    .filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.barcode.includes(search.trim()) ||
        a.brand.toLowerCase().includes(search.toLowerCase())
    );

  // Tính toán chỉ số ước tính
  const totalStockCount = accessories.reduce((sum, a) => sum + a.stock, 0);
  const totalInventoryValue = accessories.reduce((sum, a) => sum + a.stock * a.costPrice, 0);
  const totalRetailValue = accessories.reduce((sum, a) => sum + a.stock * a.sellingPrice, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Phân hệ Kho Hàng</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Quản lý Barcode &amp; Toàn bộ thông tin</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Headphones className="w-6 h-6 text-emerald-600" />
            <span>Kho Phụ Kiện Chính Hãng (Barcode)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Củ sạc GaN, Pin MagSafe, Cáp sạc, Kính cường lực KingKong, Tai nghe AirPods — Quản lý giá, tồn kho, thông số chi tiết.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer shadow-2xs"
          >
            <FolderPlus className="w-4 h-4 text-emerald-600" />
            <span>Quản Lý Danh Mục ({categories.length})</span>
          </button>
          <Link
            href="/admin/promotions"
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-sm"
          >
            <Tag className="w-4 h-4 text-black" />
            <span>Điều Chỉnh Giá &amp; Khuyến Mãi</span>
          </Link>
          <button
            onClick={handleOpenCreateNew}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Thêm Phụ Kiện Mới</span>
          </button>
        </div>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap"
        >
          Kho Máy Mới (IMEI)
        </Link>
        <Link
          href="/admin/inventory/accessories"
          className="px-4 py-2 rounded-xl font-bold bg-slate-900 text-white shadow-sm whitespace-nowrap"
        >
          Kho Phụ Kiện (Barcode)
        </Link>
        <Link
          href="/admin/inventory/spare-parts"
          className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap"
        >
          Kho Linh Kiện Sửa Chữa
        </Link>
        <Link
          href="/admin/promotions"
          className="px-4 py-2 rounded-xl font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors whitespace-nowrap flex items-center gap-1.5 ml-auto"
        >
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>Cấu Hình Giá &amp; Flash Sale</span>
        </Link>
      </div>

      {/* Thống kê nhanh kho phụ kiện */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block">Tổng mã phụ kiện</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{accessories.length} mã</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block">Tổng số lượng tồn</span>
          <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{totalStockCount} cái</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block">Tổng giá trị tồn (Giá vốn)</span>
          <span className="text-xl font-black text-cyan-800 font-mono mt-0.5 block">
            {isCashier ? '*** Ẩn' : formatVND(totalInventoryValue)}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block">Dự kiến thu hồi (Bán lẻ)</span>
          <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">{formatVND(totalRetailValue)}</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vạch Barcode, tên phụ kiện, hãng (Apple, Baseus, Anker)..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Lọc Hãng */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="all">Tất cả hãng</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Lọc Danh mục */}
          <div className="flex items-center gap-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold"
            >
              <option value="all">Tất cả danh mục ({accessories.length})</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({getCategoryProductCount(c.code)})
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              title="Chỉnh sửa / Thêm danh mục"
              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 border border-slate-200 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Lọc Tình trạng tồn */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="all">Tất cả trạng thái tồn</option>
            <option value="in_stock">Còn nhiều hàng</option>
            <option value="low_stock">Sắp hết hàng (&le; Cảnh báo)</option>
            <option value="out_of_stock">Đã hết hàng (0 cái)</option>
          </select>

          {(search || categoryFilter !== 'all' || brandFilter !== 'all' || stockFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setBrandFilter('all');
                setStockFilter('all');
              }}
              className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold underline"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Accessories Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100/95 backdrop-blur-md text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 whitespace-nowrap bg-slate-100">Hình Ảnh &amp; Barcode</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Tên &amp; Thông Số Phụ Kiện</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Hãng &amp; Danh Mục</th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">Giá Bán Lẻ</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Tồn Kho</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Trạng Thái</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    Không tìm thấy phụ kiện nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const isOut = acc.stock === 0;
                  const isLow = acc.stock > 0 && acc.stock <= acc.minStockAlert;
                  const isQuickEditing = quickEditPriceId === acc.id;

                  return (
                    <tr key={acc.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Cột 1: Ảnh & Barcode */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="w-11 h-11 object-cover rounded-xl bg-slate-100 border border-slate-200 p-0.5 shrink-0 shadow-2xs"
                          />
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-800 block">
                              {acc.barcode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {acc.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Tên & Specs */}
                      <td className="p-4 max-w-xs">
                        <span className="font-bold text-slate-900 block leading-snug">{acc.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5 line-clamp-1">
                          {acc.specs || 'Chưa có thông số chi tiết'}
                        </span>
                        {acc.compatibleWith && (
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                            Tương thích: {acc.compatibleWith}
                          </span>
                        )}
                      </td>

                      {/* Cột 3: Hãng & Danh mục */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-slate-900 font-black block">{acc.brand}</span>
                        <span className="text-[11px] text-slate-500 font-semibold">{acc.categoryName}</span>
                      </td>

                      {/* Cột 4: Giá vốn */}
                      <td className="p-4 text-right font-medium text-slate-700 whitespace-nowrap font-mono">
                        {isCashier ? (
                          <span className="text-slate-400 italic">*** Ẩn</span>
                        ) : (
                          formatVND(acc.costPrice)
                        )}
                      </td>

                      {/* Cột 5: Giá bán lẻ */}
                      <td className="p-4 text-right font-black text-emerald-700 font-mono text-sm whitespace-nowrap">
                        {isQuickEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="10000"
                              value={quickTempPrice}
                              onChange={(e) => setQuickTempPrice(Number(e.target.value))}
                              className="w-28 p-1.5 bg-emerald-50 border-2 border-emerald-400 rounded-lg text-right font-bold text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickSavePrice(acc.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Lưu giá"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickEditPriceId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                              title="Hủy"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{formatVND(acc.sellingPrice)}</span>
                            <button
                              onClick={() => {
                                setQuickEditPriceId(acc.id);
                                setQuickTempPrice(acc.sellingPrice);
                              }}
                              className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                              title="Sửa giá nhanh"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Tồn kho hiện tại & Tăng giảm nhanh */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                          <button
                            onClick={() => handleQuickAdjustStock(acc, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors"
                            title="Giảm 1 cái"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-black text-sm px-2 ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {acc.stock}
                          </span>
                          <button
                            onClick={() => handleQuickAdjustStock(acc, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors"
                            title="Tăng 1 cái"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Cột 7: Cảnh báo tồn */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Sắp hết (&le; {acc.minStockAlert})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Đủ hàng
                          </span>
                        )}
                      </td>

                      {/* Cột 8: Nút Sửa Toàn Bộ Thông Tin */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-2xs hover:scale-105 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa thông tin</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL CHỈNH SỬA TOÀN BỘ THÔNG TIN PHỤ KIỆN (APPLE LIGHT) */}
      {/* ======================================================== */}
      {(editingAccessory || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-sm shrink-0">
                  <Headphones className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {isCreatingNew ? 'Thêm mới' : 'Chỉnh sửa toàn diện'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formState.barcode ? `Barcode: ${formState.barcode}` : ''}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {isCreatingNew
                      ? 'Thêm Phụ Kiện Mới Vào Kho'
                      : `Sửa Thông Tin: ${formState.name || 'Phụ kiện'}`}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingAccessory(null);
                  setIsCreatingNew(false);
                }}
                className="w-9 h-9 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {/* PHẦN 1: THÔNG TIN CƠ BẢN & MÃ VẠCH */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>1. Thông Tin Nhận Diện &amp; Danh Mục</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tên phụ kiện */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Tên Phụ Kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.name || ''}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="VD: Củ Sạc Nhanh Apple 20W USB-C Chính Hãng (A2305)..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-bold"
                    />
                  </div>

                  {/* Mã Barcode */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs">
                        Mã Vạch Barcode <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormState({
                            ...formState,
                            barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                          })
                        }
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        Tạo ngẫu nhiên
                      </button>
                    </div>
                    <div className="relative">
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formState.barcode || ''}
                        onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                        placeholder="VD: 194252157008"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Hãng sản xuất */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Hãng / Thương Hiệu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.brand || ''}
                      onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
                      placeholder="Apple, Baseus, Anker, KingKong, Ugreen..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-bold"
                    />
                  </div>

                  {/* Danh mục */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs">Danh Mục Phụ Kiện</label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FolderPlus className="w-3 h-3" />
                        <span>+ Thêm / Sửa danh mục</span>
                      </button>
                    </div>
                    <select
                      value={formState.category || (categories[0]?.code ?? 'charger')}
                      onChange={(e) => {
                        const selected = e.target.value;
                        const catObj = categories.find((c) => c.code === selected);
                        setFormState({
                          ...formState,
                          category: selected,
                          categoryName: catObj?.name || 'Phụ kiện khác',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Link ảnh hình ảnh */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Link Hình Ảnh (URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formState.imageUrl || ''}
                        onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono text-xs"
                      />
                      {formState.imageUrl && (
                        <img
                          src={formState.imageUrl}
                          alt="preview"
                          className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: QUẢN LÝ TỒN KHO & CẢNH BÁO TỒN */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3 flex items-center justify-between pb-1 border-b border-emerald-200/60">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>2. Quản Lý Tồn Kho &amp; Trạng Thái Còn / Hết Hàng</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Đồng bộ tức thì</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tồn kho hiện tại */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs">Số Lượng Tồn Kho Hiện Tại</label>
                      <span
                        className={`text-xs font-black ${
                          Number(formState.stock) === 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {Number(formState.stock) === 0 ? 'HẾT HÀNG' : `CÒN ${formState.stock} CÁI`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormState({
                            ...formState,
                            stock: Math.max(0, (Number(formState.stock) || 0) - 1),
                          })
                        }
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold hover:bg-slate-100 flex items-center justify-center text-slate-800"
                      >
                        -1
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={formState.stock ?? 0}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            stock: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="flex-1 text-center font-mono font-black text-lg py-1.5 bg-white border-2 border-emerald-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setFormState({
                            ...formState,
                            stock: (Number(formState.stock) || 0) + 1,
                          })
                        }
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold hover:bg-slate-100 flex items-center justify-center text-slate-800"
                      >
                        +1
                      </button>
                    </div>

                    {/* Phím bấm nhanh */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, stock: 0 })}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold hover:bg-rose-200"
                      >
                        Về 0 (Báo Hết)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, stock: 5 })}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold hover:bg-slate-200"
                      >
                        Đặt 5
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, stock: 20 })}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold hover:bg-slate-200"
                      >
                        Đặt 20
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, stock: 50 })}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold hover:bg-slate-200"
                      >
                        Đặt 50
                      </button>
                    </div>
                  </div>

                  {/* Cảnh báo tồn kho */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs">
                      Mức Cảnh Báo Tồn Kho Tối Thiểu
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formState.minStockAlert ?? 5}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          minStockAlert: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                    <p className="text-[11px] text-slate-500">
                      Khi số lượng tồn &le; mức này, hệ thống sẽ bật cảnh báo đỏ "Sắp hết hàng" để nhập thêm.
                    </p>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: GIÁ VỐN, GIÁ BÁN & TỶ SUẤT LỢI NHUẬN */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>3. Giá Bán Lẻ, Giá Vốn &amp; Lợi Nhuận</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Giá vốn nhập */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Giá Vốn Nhập <span className="text-slate-400 font-normal">(VNĐ)</span>
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formState.costPrice || 0}
                      onChange={(e) =>
                        setFormState({ ...formState, costPrice: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                    />
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {formatVND(Number(formState.costPrice) || 0)}
                    </span>
                  </div>

                  {/* Giá bán lẻ */}
                  <div className="space-y-1">
                    <label className="font-bold text-emerald-700 text-xs">
                      Giá Bán Lẻ <span className="text-slate-400 font-normal">(VNĐ)</span>
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formState.sellingPrice || 0}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          sellingPrice: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 font-mono font-black"
                    />
                    <span className="text-[11px] text-emerald-700 font-bold block font-mono">
                      {formatVND(Number(formState.sellingPrice) || 0)}
                    </span>
                  </div>

                  {/* Giá niêm yết gốc */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">
                      Giá Niêm Yết Gốc <span className="text-slate-400 font-normal">(Gạch ngang)</span>
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formState.originalPrice || 0}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          originalPrice: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                    />
                    <span className="text-[11px] text-slate-400 block font-mono line-through">
                      {formatVND(Number(formState.originalPrice) || 0)}
                    </span>
                  </div>
                </div>

                {/* Ước tính Lợi nhuận gộp */}
                {Number(formState.sellingPrice) > 0 && (
                  <div className="mt-3 p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Lãi gộp ước tính trên mỗi sản phẩm:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        {formatVND(
                          Math.max(0, (Number(formState.sellingPrice) || 0) - (Number(formState.costPrice) || 0))
                        )}
                      </span>
                      {Number(formState.sellingPrice) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          +
                          {Math.round(
                            ((Number(formState.sellingPrice) - Number(formState.costPrice)) /
                              Number(formState.sellingPrice)) *
                              100
                          )}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PHẦN 4: THÔNG SỐ KỸ THUẬT & ƯU ĐÃI KÈM MÁY */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>4. Thông Số Kỹ Thuật &amp; Chương Trình Mua Kèm</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Thông số kỹ thuật */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Thông Số Kỹ Thuật Tóm Tắt</label>
                    <input
                      type="text"
                      value={formState.specs || ''}
                      onChange={(e) => setFormState({ ...formState, specs: e.target.value })}
                      placeholder="VD: 20W, Cổng Type-C, Chân cắm tròn/dẹt EU/US..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  {/* Thiết bị tương thích */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Thiết Bị Tương Thích</label>
                    <input
                      type="text"
                      value={formState.compatibleWith || ''}
                      onChange={(e) => setFormState({ ...formState, compatibleWith: e.target.value })}
                      placeholder="VD: iPhone 12/13/14/15/16, iPad, AirPods..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  {/* Giảm giá khi mua kèm điện thoại */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">% Giảm Giá Khi Mua Kèm Máy Mới</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formState.discountWhenBoughtWithPhone ?? 15}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          discountWhenBoughtWithPhone: Math.max(0, Math.min(100, Number(e.target.value))),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                    />
                    <p className="text-[11px] text-slate-400">Hiển thị ở trang chi tiết máy khi khách tick mua kèm.</p>
                  </div>

                  {/* Điểm thưởng đổi quà */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Điểm Thưởng Cần Đổi Quà (Points)</label>
                    <input
                      type="number"
                      min="0"
                      value={formState.pointsToRedeem ?? 0}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          pointsToRedeem: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                    />
                  </div>

                  {/* Mô tả chi tiết */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Mô Tả &amp; Chính Sách Bảo Hành</label>
                    <textarea
                      rows={2}
                      value={formState.description || ''}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      placeholder="Mô tả công nghệ, tính năng, bảo hành 12 tháng 1 đổi 1..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80">
              <div>
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(formState.id || null)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold inline-flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa phụ kiện này</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccessory(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{isCreatingNew ? 'Thêm Phụ Kiện' : 'Lưu & Cập Nhật Tất Cả'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Xác Nhận Xóa Phụ Kiện?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Phụ kiện này sẽ bị xóa vĩnh viễn khỏi kho hàng và cơ sở dữ liệu. Thao tác không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteAccessory(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL QUẢN LÝ DANH MỤC PHỤ KIỆN (THÊM / ĐỔI TÊN / XÓA) */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shadow-2xs shrink-0">
                  <FolderPlus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Quản Lý Danh Mục Phụ Kiện
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thêm danh mục mới, đổi tên hoặc xóa danh mục phụ kiện trong kho
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatCode(null);
                  setNewCatName('');
                }}
                className="w-9 h-9 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Form Thêm danh mục mới */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <label className="text-xs font-black text-emerald-900 uppercase tracking-wide block">
                  + Thêm Danh Mục Mới
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    placeholder="VD: Bút Cảm Ứng, Bàn Phím iPad, Củ Sạc Ô Tô..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
                  >
                    Thêm Ngay
                  </button>
                </div>
              </div>

              {/* Danh sách danh mục hiện có */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Danh Sách Danh Mục ({categories.length})
                  </span>
                  <span className="text-[11px] text-slate-400">Bấm sửa để đổi tên danh mục</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                  {categories.map((cat) => {
                    const count = getCategoryProductCount(cat.code);
                    const isEditing = editingCatCode === cat.code;

                    return (
                      <div
                        key={cat.code}
                        className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCategory(cat.code);
                              }}
                              className="flex-1 px-3 py-1.5 bg-white border-2 border-emerald-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameCategory(cat.code)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Lưu tên mới"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCatCode(null)}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                              title="Hủy"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                                {cat.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400">
                                  Mã: {cat.code}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    count > 0 ? 'text-emerald-700' : 'text-slate-400'
                                  }`}
                                >
                                  {count} sản phẩm
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCatCode(cat.code);
                                  setEditingCatName(cat.name);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa tên</span>
                              </button>

                              {cat.code !== 'other' && (
                                <button
                                  onClick={() => handleDeleteCategory(cat.code, cat.name)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa danh mục"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50/80">
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatCode(null);
                  setNewCatName('');
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-transform hover:scale-105 cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
