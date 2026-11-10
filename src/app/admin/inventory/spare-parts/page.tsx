'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Search,
  Plus,
  Wrench,
  Package,
  Edit3,
  Trash2,
  Check,
  X,
  Settings,
  AlertCircle,
  FolderPlus,
  Minus,
  Barcode,
  Layers,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { SparePartItem, SparePartCategoryItem, Role } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

export default function InventorySparePartsPage() {
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [categories, setCategories] = useState<SparePartCategoryItem[]>([]);
  const [role, setRole] = useState<Role>('admin');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal Sửa / Thêm Linh Kiện
  const [editingPart, setEditingPart] = useState<SparePartItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formState, setFormState] = useState<Partial<SparePartItem>>({});
  const [compatibleInput, setCompatibleInput] = useState('');
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
    // 1. Lấy dữ liệu từ store local
    const local = IShopStore.getSpareParts();
    const localCats = IShopStore.getSparePartCategories();
    setParts(local);
    setCategories(localCats);
    setRole(IShopStore.getRole());

    // 2. Đồng bộ từ MySQL API
    fetch('/api/inventory/spare-parts')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setParts(res.data);
          res.data.forEach((p: SparePartItem) => {
            IShopStore.addSparePart(p);
          });
        }
      })
      .catch((err) => console.error('Lỗi tải linh kiện từ MySQL:', err));

    // 3. Đồng bộ danh mục từ MySQL API
    fetch('/api/inventory/spare-parts/categories')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          IShopStore.saveSparePartCategories(res.data);
        }
      })
      .catch((err) => console.error('Lỗi tải danh mục linh kiện:', err));
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  const isCashier = role === 'cashier';

  // Lọc danh sách linh kiện
  const filtered = useMemo(() => {
    return parts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.trim().toLowerCase()) ||
        (Array.isArray(p.compatibleModels) &&
          p.compatibleModels.some((m) => m.toLowerCase().includes(search.toLowerCase())));

      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [parts, search, selectedCategory]);

  // Xử lý mở Modal Chỉnh Sửa
  const handleOpenEdit = (part: SparePartItem) => {
    setIsCreatingNew(false);
    setEditingPart(part);
    setFormState({
      id: part.id,
      name: part.name,
      category: part.category,
      categoryName: part.categoryName,
      barcode: part.barcode,
      compatibleModels: part.compatibleModels || [],
      costPrice: part.costPrice,
      retailRepairPrice: part.retailRepairPrice,
      stock: part.stock,
      unit: part.unit || 'cái',
      warrantyMonths: part.warrantyMonths || 6,
    });
    setCompatibleInput(
      Array.isArray(part.compatibleModels) ? part.compatibleModels.join(', ') : ''
    );
  };

  // Xử lý mở Modal Thêm Mới
  const handleOpenCreateNew = () => {
    setIsCreatingNew(true);
    setEditingPart(null);
    const defaultCat = categories[0] || { code: 'screen', name: 'Màn hình zin & OEM' };
    const randomBarcode = `LK${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormState({
      id: `sp-${randomBarcode}`,
      name: '',
      category: defaultCat.code,
      categoryName: defaultCat.name,
      barcode: randomBarcode,
      compatibleModels: [],
      costPrice: 500000,
      retailRepairPrice: 850000,
      stock: 10,
      unit: 'cái',
      warrantyMonths: 12,
    });
    setCompatibleInput('iPhone 15 Pro Max, iPhone 15 Pro');
  };

  // Lưu chỉnh sửa / thêm mới linh kiện
  const handleSavePart = async () => {
    if (!formState.name?.trim()) {
      alert('Vui lòng nhập tên linh kiện');
      return;
    }
    if (!formState.barcode?.trim()) {
      alert('Vui lòng nhập mã linh kiện (Barcode)');
      return;
    }

    const currentCat = categories.find((c) => c.code === formState.category);
    const modelsArr = compatibleInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: SparePartItem = {
      id: formState.id || `sp-${Date.now()}`,
      name: formState.name.trim(),
      category: formState.category || 'other',
      categoryName: currentCat?.name || formState.categoryName || 'Linh kiện khác',
      barcode: formState.barcode.trim(),
      compatibleModels: modelsArr,
      costPrice: Number(formState.costPrice) || 0,
      retailRepairPrice: Number(formState.retailRepairPrice) || 0,
      stock: Math.max(0, Math.floor(Number(formState.stock) || 0)),
      unit: formState.unit || 'cái',
      warrantyMonths: Number(formState.warrantyMonths) || 6,
    };

    // 1. Cập nhật local store
    if (isCreatingNew) {
      IShopStore.addSparePart(payload);
    } else {
      IShopStore.updateSparePart(payload.id, payload);
    }

    // 2. Gửi request lưu vào MySQL API
    try {
      const res = await fetch('/api/inventory/spare-parts', {
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
      console.error('Lỗi gọi API lưu linh kiện:', e);
    }

    setEditingPart(null);
    setIsCreatingNew(false);
    setToastMsg(
      isCreatingNew
        ? '✓ Đã thêm linh kiện mới vào kho thành công!'
        : '✓ Đã cập nhật toàn bộ thông tin linh kiện thành công!'
    );
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // Xóa linh kiện
  const handleDeletePart = async (partId: string) => {
    IShopStore.deleteSparePart(partId);

    try {
      await fetch(`/api/inventory/spare-parts?id=${partId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Lỗi gọi API xóa linh kiện:', e);
    }

    setDeleteConfirmId(null);
    setToastMsg('✓ Đã xóa linh kiện khỏi kho thành công!');
    setTimeout(() => setToastMsg(null), 3000);
    loadData();
  };

  // Điều chỉnh tồn kho nhanh (+ / -)
  const handleQuickAdjustStock = async (part: SparePartItem, delta: number) => {
    const newStock = Math.max(0, part.stock + delta);
    IShopStore.updateSparePart(part.id, { stock: newStock });
    setParts((prev) =>
      prev.map((p) => (p.id === part.id ? { ...p, stock: newStock } : p))
    );

    try {
      await fetch('/api/inventory/spare-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: part.id, stock: newStock }),
      });
    } catch (e) {
      console.error(e);
    }

    setToastMsg(`✓ Đã cập nhật tồn kho linh kiện "${part.name}" thành: ${newStock} ${part.unit}`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Lưu sửa giá nhanh tại dòng
  const handleSaveQuickPrice = async (partId: string) => {
    if (quickTempPrice <= 0) return;
    IShopStore.updateSparePart(partId, { retailRepairPrice: quickTempPrice });
    setParts((prev) =>
      prev.map((p) => (p.id === partId ? { ...p, retailRepairPrice: quickTempPrice } : p))
    );
    setQuickEditPriceId(null);

    try {
      await fetch('/api/inventory/spare-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partId, retailRepairPrice: quickTempPrice }),
      });
    } catch (e) {
      console.error(e);
    }

    setToastMsg('✓ Đã cập nhật giá thay cho khách thành công!');
    setTimeout(() => setToastMsg(null), 2500);
  };

  // ==========================================
  // XỬ LÝ QUẢN LÝ DANH MỤC LINH KIỆN
  // ==========================================
  const getCategoryProductCount = (code: string) => {
    return parts.filter((p) => p.category === code).length;
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

    const newCat: SparePartCategoryItem = {
      id: `cat-sp-${cleanCode}-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      productCount: 0,
    };

    IShopStore.addSparePartCategory(newCat);
    setCategories((prev) => {
      if (prev.some((c) => c.code === cleanCode)) return prev;
      return [...prev, newCat];
    });
    setNewCatName('');

    try {
      await fetch('/api/inventory/spare-parts/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', code: cleanCode, name: cleanName }),
      });
    } catch (e) {
      console.error(e);
    }

    setToastMsg(`✓ Đã thêm danh mục linh kiện "${cleanName}" thành công!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRenameCategory = async (code: string) => {
    if (!editingCatName.trim()) return;
    const newName = editingCatName.trim();

    IShopStore.updateSparePartCategory(code, newName);

    try {
      await fetch('/api/inventory/spare-parts/categories', {
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
        `Bạn có chắc chắn muốn xóa danh mục "${catName}"? Các linh kiện thuộc danh mục này sẽ được chuyển về "Linh kiện khác".`
      )
    ) {
      return;
    }

    IShopStore.deleteSparePartCategory(code);

    try {
      await fetch(`/api/inventory/spare-parts/categories?code=${code}`, {
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

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Phân hệ Kho Hàng
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Quản lý theo Barcode &amp; Mã LK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1 tracking-tight">
            <Cpu className="w-6 h-6 text-amber-500" />
            <span>Kho Linh Kiện Sửa Chữa (Màn hình, Pin Pisen, Kính, Cáp)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Linh kiện phục vụ sửa chữa iCare. Hỗ trợ nhập mới, điều chỉnh giá thay, số lượng tồn kho và quản lý danh mục.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenCreateNew}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập / Thêm Linh Kiện Mới</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-600" />
            <span>📁 Quản Lý Danh Mục</span>
          </button>

          <Link
            href="/admin/repairs"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Vào Bàn Sửa Chữa</span>
          </Link>
        </div>
      </div>

      {/* Subnav 3 inventory groups */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Kho Máy Mới (IMEI)
        </Link>
        <Link
          href="/admin/inventory/accessories"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Kho Phụ Kiện (Barcode)
        </Link>
        <Link
          href="/admin/inventory/spare-parts"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-sm"
        >
          Kho Linh Kiện Sửa Chữa
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã linh kiện, tên linh kiện, dòng máy (iPhone 15, S24 Ultra, Pisen...)..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        {/* Bộ lọc danh mục & Nút Cài Đặt Danh Mục ⚙ */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Danh mục:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Tất cả danh mục ({parts.length})</option>
            {categories.map((c) => {
              const count = getCategoryProductCount(c.code);
              return (
                <option key={c.id || c.code} value={c.code}>
                  {c.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Nút biểu tượng bánh răng để mở nhanh modal quản lý danh mục */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            title="Quản lý và chỉnh sửa các danh mục linh kiện"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 text-slate-600 hover:text-amber-700 transition-all cursor-pointer shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spare Parts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100/95 backdrop-blur-md text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-4 whitespace-nowrap bg-slate-100">Mã Linh Kiện</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Tên Linh Kiện &amp; Loại</th>
                <th className="p-4 whitespace-nowrap bg-slate-100">Dòng Máy Tương Thích</th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">
                  {isCashier ? 'Giá Vốn' : 'Giá Vốn Nhập'}
                </th>
                <th className="p-4 text-right whitespace-nowrap bg-slate-100">Giá Thay Cho Khách</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Tồn Kho Hiện Tại</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Bảo Hành</th>
                <th className="p-4 text-center whitespace-nowrap bg-slate-100">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-sm text-slate-600">
                      Không tìm thấy linh kiện nào phù hợp
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy thử tìm kiếm với từ khóa khác hoặc bấm "+ Nhập / Thêm Linh Kiện Mới"
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((part) => (
                  <tr
                    key={part.id}
                    className="hover:bg-amber-50/30 transition-colors group"
                  >
                    {/* Mã Barcode */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-amber-700 text-xs px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 inline-flex items-center gap-1.5 shadow-xs">
                        <Barcode className="w-3.5 h-3.5 text-amber-600" />
                        {part.barcode}
                      </span>
                    </td>

                    {/* Tên Linh Kiện & Loại */}
                    <td className="p-4 min-w-[240px]">
                      <span className="font-bold text-slate-900 block text-sm leading-snug">
                        {part.name}
                      </span>
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {part.categoryName || 'Linh kiện'}
                      </span>
                    </td>

                    {/* Dòng máy tương thích */}
                    <td className="p-4 min-w-[200px]">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(part.compatibleModels) && part.compatibleModels.length > 0 ? (
                          part.compatibleModels.map((m, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đa năng / Mọi dòng</span>
                        )}
                      </div>
                    </td>

                    {/* Giá vốn nhập */}
                    <td className="p-4 text-right font-medium text-slate-700 whitespace-nowrap">
                      {isCashier ? (
                        <span className="text-slate-400 italic text-xs">*** Ẩn</span>
                      ) : (
                        formatVND(part.costPrice)
                      )}
                    </td>

                    {/* Giá thay cho khách (Inline Edit) */}
                    <td className="p-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {quickEditPriceId === part.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={quickTempPrice}
                            onChange={(e) => setQuickTempPrice(Number(e.target.value))}
                            className="w-28 px-2 py-1 text-right border border-emerald-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveQuickPrice(part.id)}
                            className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                            title="Lưu giá"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQuickEditPriceId(null)}
                            className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setQuickEditPriceId(part.id);
                            setQuickTempPrice(part.retailRepairPrice);
                          }}
                          className="cursor-pointer hover:underline inline-flex items-center gap-1"
                          title="Bấm để sửa nhanh giá thay cho khách"
                        >
                          <span>{formatVND(part.retailRepairPrice)}</span>
                          <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    {/* Tồn kho hiện tại & Nút tăng giảm nhanh */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => handleQuickAdjustStock(part, -1)}
                          disabled={part.stock <= 0}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-700 font-bold transition-all disabled:opacity-40 cursor-pointer"
                          title="Giảm 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span
                          className={`min-w-[3rem] text-center font-bold text-sm ${
                            part.stock <= 2
                              ? 'text-rose-600'
                              : part.stock <= 5
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {part.stock}{' '}
                          <span className="text-[11px] font-normal text-slate-500">
                            {part.unit || 'cái'}
                          </span>
                        </span>

                        <button
                          onClick={() => handleQuickAdjustStock(part, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-slate-700 font-bold transition-all cursor-pointer"
                          title="Tăng 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Thời hạn bảo hành */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {part.warrantyMonths} Tháng
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(part)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(part.id)}
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                          title="Xóa linh kiện này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CHỈNH SỬA / THÊM MỚI LINH KIỆN SỬA CHỮA */}
      {/* ========================================================= */}
      {(editingPart || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {isCreatingNew ? 'Thêm Linh Kiện Mới Vào Kho' : 'Chỉnh Sửa Toàn Bộ Thông Tin Linh Kiện'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật mã linh kiện, tên, nhóm phân loại, giá thay cho khách và tồn kho.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingPart(null);
                  setIsCreatingNew(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên linh kiện */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên linh kiện <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="VD: Màn Hình Zin Bóc Máy iPhone 15 Pro Max, Pin Pisen..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Mã linh kiện (Barcode) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã linh kiện (Barcode) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formState.barcode || ''}
                      onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                      placeholder="VD: LK8930192801"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Danh mục / Loại linh kiện */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Danh mục linh kiện <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      + Quản lý danh mục
                    </button>
                  </div>
                  <select
                    value={formState.category || 'screen'}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.code === e.target.value);
                      setFormState({
                        ...formState,
                        category: e.target.value,
                        categoryName: selectedCat?.name || e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dòng máy tương thích */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Dòng máy tương thích (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={compatibleInput}
                    onChange={(e) => setCompatibleInput(e.target.value)}
                    placeholder="VD: iPhone 15 Pro Max, iPhone 15 Pro, iPhone 14 Pro Max"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gợi ý: Nhập danh sách model máy mà linh kiện này có thể lắp vừa và hoạt động hoàn hảo.
                  </span>
                </div>

                {/* Giá vốn nhập */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá vốn nhập gốc (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formState.costPrice || 0}
                    onChange={(e) =>
                      setFormState({ ...formState, costPrice: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {formatVND(Number(formState.costPrice) || 0)}
                  </span>
                </div>

                {/* Giá thay cho khách (Bán lẻ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá thay cho khách (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formState.retailRepairPrice || 0}
                    onChange={(e) =>
                      setFormState({ ...formState, retailRepairPrice: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                    {formatVND(Number(formState.retailRepairPrice) || 0)}
                  </span>
                </div>

                {/* Tồn kho */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.stock ?? 0}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        stock: Math.max(0, Math.floor(Number(e.target.value))),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, stock: 0 })}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      Về 0
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({
                          ...formState,
                          stock: (formState.stock || 0) + 5,
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({
                          ...formState,
                          stock: (formState.stock || 0) + 10,
                        })
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Đơn vị tính & Thời gian bảo hành */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Đơn vị tính
                    </label>
                    <input
                      type="text"
                      value={formState.unit || 'cái'}
                      onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                      placeholder="cái / bộ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bảo hành (tháng)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formState.warrantyMonths || 6}
                      onChange={(e) =>
                        setFormState({ ...formState, warrantyMonths: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setEditingPart(null);
                  setIsCreatingNew(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSavePart}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isCreatingNew ? 'Thêm Linh Kiện Mới' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUẢN LÝ DANH MỤC LINH KIỆN SỬA CHỮA */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Quản Lý Danh Mục Linh Kiện Sửa Chữa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Thêm, đổi tên hoặc xóa các nhóm linh kiện thay thế tại bàn iCare
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatCode(null);
                  setNewCatName('');
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Form thêm mới */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  + Thêm danh mục linh kiện mới:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="VD: Cáp Loa Trong & Cảm Biến, Khay SIM..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Danh sách danh mục */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  Danh sách nhóm linh kiện hiện tại ({categories.length}):
                </h4>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {categories.map((c) => {
                    const count = getCategoryProductCount(c.code);
                    const isEditing = editingCatCode === c.code;

                    return (
                      <div
                        key={c.id || c.code}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 mr-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={(e) => setEditingCatName(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs border border-amber-500 rounded-lg text-slate-900 focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameCategory(c.code);
                                  if (e.key === 'Escape') setEditingCatCode(null);
                                }}
                              />
                              <button
                                onClick={() => handleRenameCategory(c.code)}
                                className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                                title="Lưu tên mới"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCatCode(null)}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({c.code})
                              </span>
                              <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                {count} linh kiện
                              </span>
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCatCode(c.code);
                                setEditingCatName(c.name);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                              title="Đổi tên danh mục"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {c.code !== 'other' && (
                              <button
                                onClick={() => handleDeleteCategory(c.code, c.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Xóa danh mục này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* ========================================================= */}
      {/* MODAL 3: XÁC NHẬN XÓA LINH KIỆN */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Xác nhận xóa linh kiện?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Linh kiện này sẽ bị xóa vĩnh viễn khỏi danh sách tồn kho bàn sửa chữa.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeletePart(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
