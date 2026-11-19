'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Package,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Check,
  X,
  Palette,
  HardDrive,
  Tag,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Cpu,
  Trash2,
  Globe,
  Upload,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { Supplier, PhoneProduct, PhoneColor, PhoneCapacity } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

const ALL_STANDARD_CAPACITIES = ['128GB', '256GB', '512GB', '1TB', '2TB'];

const getBrandEmoji = (brandName: string) => {
  const lower = brandName.toLowerCase();
  if (lower.includes('apple') || lower.includes('iphone')) return '🍏';
  if (lower.includes('samsung')) return '🔷';
  if (lower.includes('xiaomi')) return '🟠';
  if (lower.includes('oppo')) return '🟢';
  if (lower.includes('sony')) return '🇯🇵';
  if (lower.includes('pixel') || lower.includes('google')) return '🌐';
  if (lower.includes('vivo')) return '🔵';
  if (lower.includes('asus') || lower.includes('rog')) return '⚡';
  if (lower.includes('realme')) return '🟡';
  if (lower.includes('oneplus')) return '🔴';
  return '📱';
};

export default function AdminRestockPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [phones, setPhones] = useState<PhoneProduct[]>([]);
  const [dbBrands, setDbBrands] = useState<{ id: string; name: string; country?: string | null; description?: string | null; logoUrl?: string | null }[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // 1. Brand selection
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // 2. Model selection & smart search
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');

  // 3. Capacity selection
  const [capacity, setCapacity] = useState<string>('256GB');

  // 4. Color selection
  const [color, setColor] = useState<string>('Đen (Black)');

  // Pricing (trống mặc định để người dùng tự nhập)
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');

  // Modal 1: Add Brand (ONLY Brand info: Name, Country/Origin, Description, Logo, Display Order)
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('Mỹ (Hoa Kỳ)');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  const [newBrandLogoEmoji, setNewBrandLogoEmoji] = useState('📱');
  const [newBrandDisplayOrder, setNewBrandDisplayOrder] = useState(10);
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  // Modal 2: Add Model (Brand + Model Name only; capacity, color & pricing are configured below)
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [newModelBrand, setNewModelBrand] = useState('Apple');
  const [newModelName, setNewModelName] = useState('');
  const [isSubmittingModel, setIsSubmittingModel] = useState(false);

  // Modal 3: Add Color
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [newColorImageUrl, setNewColorImageUrl] = useState('');
  const [isUploadingModalColorImage, setIsUploadingModalColorImage] = useState(false);
  const modalColorFileInputRef = useRef<HTMLInputElement>(null);

  // 5. Product Image per Color (Local File Upload)
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadImageError, setUploadImageError] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Batch IMEI and Payment
  const [imeiListText, setImeiListText] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const uploadLocalImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP, GIF)!');
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Ảnh vượt quá 15MB. Vui lòng chọn ảnh dung lượng nhỏ hơn!');
    }
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok || !json.success || !json.url) {
      throw new Error(json.error || 'Tải ảnh lên thất bại!');
    }
    return json.url as string;
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadImageError(null);
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadLocalImageFile(file);
      setProductImageUrl(uploadedUrl);

      // Nếu đang chọn 1 dòng máy và màu đã tồn tại trên dòng máy đó, lưu ngay ảnh mới vào MySQL
      if (currentPhone) {
        const currentColors = currentPhone.colors || [];
        const matchedIdx = currentColors.findIndex(
          (c) => c.name.toLowerCase() === color.toLowerCase()
        );
        const colorObjFromList = availableColors.find(
          (c) => c.name.toLowerCase() === color.toLowerCase()
        );
        const updatedColors =
          matchedIdx >= 0
            ? currentColors.map((c, idx) =>
                idx === matchedIdx ? { ...c, imageUrl: uploadedUrl } : c
              )
            : [
                ...currentColors,
                {
                  id: colorObjFromList?.id || `c-${Date.now()}`,
                  name: color,
                  hex: colorObjFromList?.hex || '#222222',
                  imageUrl: uploadedUrl,
                },
              ];

        await syncPhoneColorsToDb(currentPhone, updatedColors, false);
        setPhones((prev) =>
          prev.map((p) => (p.id === currentPhone.id ? { ...p, colors: updatedColors } : p))
        );
        IShopStore.updatePhone(currentPhone.id, { colors: updatedColors });
        setSuccessMessage(`✓ Đã tải và lưu ảnh cho "${currentPhone.name} - ${color}" vào CSDL!`);
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setUploadImageError(err?.message || 'Lỗi tải ảnh lên!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadModalColorImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingModalColorImage(true);
    try {
      const uploadedUrl = await uploadLocalImageFile(file);
      setNewColorImageUrl(uploadedUrl);
    } catch (err: any) {
      alert(err?.message || 'Lỗi tải ảnh lên!');
    } finally {
      setIsUploadingModalColorImage(false);
    }
  };

  const loadData = async () => {
    setSuppliers(IShopStore.getSuppliers());
    setPhones(IShopStore.getPhones());

    try {
      const [brandsRes, colorsRes, phonesRes, suppliersRes] = await Promise.all([
        fetch('/api/brands', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/colors', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/phones', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/suppliers', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      if (brandsRes?.success && Array.isArray(brandsRes.data)) {
        setDbBrands(brandsRes.data);
      }
      if (colorsRes?.success && Array.isArray(colorsRes.data) && colorsRes.data.length > 0) {
        setDefaultColors(colorsRes.data);
      }
      if (phonesRes?.success && Array.isArray(phonesRes.data)) {
        setPhones(phonesRes.data);
      }
      if (suppliersRes?.success && Array.isArray(suppliersRes.data)) {
        setSuppliers(suppliersRes.data);
      }
    } catch (e) {
      console.warn('Error loading restock data from database:', e);
    }
  };

  useEffect(() => {
    loadData();
    const listener = () => loadData();
    window.addEventListener('ishop_data_changed', listener);
    return () => window.removeEventListener('ishop_data_changed', listener);
  }, []);

  // Distinct Brands available (derived from database brands & catalog)
  const brandList = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    dbBrands.forEach((b) => {
      if (b.name && !seen.has(b.name)) {
        seen.add(b.name);
        list.push(b.name);
      }
    });

    phones.forEach((p) => {
      if (p.brand && !seen.has(p.brand)) {
        seen.add(p.brand);
        list.push(p.brand);
      }
    });

    return list;
  }, [phones, dbBrands]);

  // Phones filtered strictly by selected brand & quick search
  const filteredPhonesByBrand = useMemo(() => {
    const base = selectedBrand === 'all' ? phones : phones.filter((p) => p.brand === selectedBrand);
    if (!modelSearchQuery.trim()) return base;
    const q = modelSearchQuery.toLowerCase().trim();
    return base.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [phones, selectedBrand, modelSearchQuery]);

  const currentPhone = useMemo(() => {
    if (filteredPhonesByBrand.length > 0) {
      const matched = filteredPhonesByBrand.find((p) => p.id === selectedPhoneId);
      return matched || filteredPhonesByBrand[0];
    }
    return phones.find((p) => p.id === selectedPhoneId) || phones[0];
  }, [phones, selectedPhoneId, filteredPhonesByBrand]);

  // Handle Brand selection
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    if (brand !== 'all') {
      const firstPhone = phones.find((p) => p.brand === brand);
      if (firstPhone) {
        setSelectedPhoneId(firstPhone.id);
      }
    }
  };

  // Default fallback colors when no phone model is selected yet
  const [defaultColors, setDefaultColors] = useState([
    { id: 'c-default', name: 'Đen (Black)', hex: '#222222', imageUrl: '' },
    { id: 'c-white', name: 'Trắng (White)', hex: '#f0f0f0', imageUrl: '' },
  ]);

  // Always merge currentPhone.colors + defaultColors (phonecolorcatalog) so user can pick/add ANY color for 1 model
  const availableColors = useMemo(() => {
    const merged: { id: string; name: string; hex: string; imageUrl: string }[] = [];
    const seen = new Set<string>();

    (currentPhone?.colors || []).forEach((c) => {
      const key = c.name.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: c.id,
          name: c.name,
          hex: c.hex || '#222222',
          imageUrl: c.imageUrl || '',
        });
      }
    });

    defaultColors.forEach((c) => {
      const key = c.name.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: c.id,
          name: c.name,
          hex: c.hex || '#222222',
          imageUrl: c.imageUrl || '',
        });
      }
    });

    return merged;
  }, [currentPhone, defaultColors]);

  // Auto-sync selectedSupplierId to first valid supplier from MySQL
  useEffect(() => {
    if (suppliers.length > 0 && !suppliers.some((s) => s.id === selectedSupplierId)) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Auto-sync selectedPhoneId to currentPhone
  useEffect(() => {
    if (currentPhone && currentPhone.id !== selectedPhoneId) {
      setSelectedPhoneId(currentPhone.id);
    }
  }, [currentPhone, selectedPhoneId]);

  // When available colors change, only reset color if current selection no longer exists
  useEffect(() => {
    const matchedColor = availableColors.find(
      (c) => c.name.toLowerCase() === color.toLowerCase()
    );
    if (!matchedColor && availableColors.length > 0) {
      setColor(availableColors[0].name);
    }
  }, [selectedPhoneId, availableColors]);

  // Sync productImageUrl preview with currentPhone + selected color (ignore legacy auto Unsplash links)
  useEffect(() => {
    const matched = currentPhone?.colors?.find(
      (c) => c.name.toLowerCase() === color.toLowerCase()
    );
    const existingImg = matched?.imageUrl?.trim() || '';
    if (existingImg && !existingImg.includes('images.unsplash.com')) {
      setProductImageUrl(existingImg);
    } else {
      setProductImageUrl('');
    }
    setUploadImageError(null);
  }, [currentPhone?.id, color]);

  // Handle capacity selection (Standard list: 128GB -> 2TB, NO 64GB)
  const handleSelectCapacity = (capSize: string) => {
    setCapacity(capSize);
  };

  // Delete Brand from database & list
  const handleDeleteBrand = async (brandNameToDelete: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa thương hiệu "${brandNameToDelete}" khỏi danh mục hệ thống?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/brands?name=${encodeURIComponent(brandNameToDelete)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi khi xóa thương hiệu');
        return;
      }

      // Xóa các dòng máy của hãng này trong client store
      IShopStore.deletePhoneBrand(brandNameToDelete);

      // Cập nhật dbBrands ngay lập tức
      setDbBrands((prev) => prev.filter((b) => b.name.toLowerCase() !== brandNameToDelete.toLowerCase()));

      if (selectedBrand.toLowerCase() === brandNameToDelete.toLowerCase()) {
        setSelectedBrand('all');
      }

      setSuccessMessage(`✓ Đã xóa thành công thương hiệu "${brandNameToDelete}" khỏi hệ thống!`);
      await loadData();
    } catch (err: any) {
      console.error('Delete brand error:', err);
      alert('Không thể xóa thương hiệu: ' + (err?.message || 'Lỗi kết nối'));
    }
  };

  // Add new Brand (ONLY Brand info: Name, Country/Origin, Description, Logo, Display Order)
  const handleSaveNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBrand = newBrandName.trim();
    if (!trimmedBrand) {
      alert('Vui lòng nhập tên thương hiệu / hãng máy!');
      return;
    }

    setIsSubmittingBrand(true);

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedBrand,
          country: newBrandCountry.trim() || null,
          description: newBrandDescription.trim() || null,
          logoUrl: newBrandLogoEmoji || null,
          displayOrder: Number(newBrandDisplayOrder) || 10,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Lỗi lưu thương hiệu');
        setIsSubmittingBrand(false);
        return;
      }

      setSelectedBrand(trimmedBrand);
      setSuccessMessage(
        `✓ Đã thêm thành công thương hiệu "${trimmedBrand}" (Xuất xứ: ${newBrandCountry}) vào hệ thống!`
      );

      setIsAddBrandModalOpen(false);
      setNewBrandName('');
      setNewBrandDescription('');
      setIsSubmittingBrand(false);
      await loadData();
    } catch (err: any) {
      console.error('Save brand error:', err);
      alert('Lỗi lưu thương hiệu: ' + (err?.message || 'Lỗi kết nối'));
      setIsSubmittingBrand(false);
    }
  };

  // Add new Model for a specific brand (Brand + Name only; capacity/color/price configured in main form)
  const handleSaveNewModel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedModel = newModelName.trim();
    if (!trimmedModel) {
      alert('Vui lòng nhập tên dòng máy / model!');
      return;
    }

    setIsSubmittingModel(true);
    const targetBrand = newModelBrand || (selectedBrand !== 'all' ? selectedBrand : (brandList[0] || 'Apple'));
    const newId = `p-${Date.now()}`;
    const initialCapacity = capacity || '256GB';
    const initialPrice = Number(sellingPrice) > 0 ? Number(sellingPrice) : 0;
    const selectedColorMeta = availableColors.find(
      (c) => c.name.toLowerCase() === color.toLowerCase()
    ) || defaultColors[0];
    const initialColors = [
      {
        id: `c-${Date.now()}`,
        name: selectedColorMeta?.name || color || 'Đen (Black)',
        hex: selectedColorMeta?.hex || '#222222',
        imageUrl: productImageUrl || '',
      },
    ];

    const newPhoneItem: PhoneProduct = {
      id: newId,
      name: trimmedModel,
      slug: `${targetBrand}-${trimmedModel}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      brand: targetBrand,
      description: `Sản phẩm chính hãng thương hiệu ${targetBrand}.`,
      rating: 5.0,
      reviewCount: 1,
      isNew: true,
      warrantyInfo: 'Bảo hành 12 tháng chính hãng.',
      colors: initialColors,
      capacities: [
        {
          size: initialCapacity,
          price: initialPrice,
          originalPrice: initialPrice,
        },
      ],
      specs: {
        screen: '6.7 inch Super AMOLED 120Hz',
        chip: 'Chip hiệu năng cao thế hệ mới',
        ram: '8 GB / 12 GB',
        storage: initialCapacity,
        rearCamera: '50 MP OIS + Góc Siêu Rộng',
        frontCamera: '32 MP HDR Chân Dung',
        battery: '5000 mAh',
        charging: 'Sạc nhanh siêu tốc 67W',
        os: 'Android / iOS',
        sim: '2 SIM (Nano SIM + eSIM)',
        waterResistant: 'IP68 Kháng Nước & Bụi',
        weight: '198g',
      },
    };

    // 1. Lưu Dòng máy mới vào MySQL qua /api/phones
    try {
      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoneItem),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Không thể lưu dòng máy mới vào CSDL MySQL!');
        setIsSubmittingModel(false);
        return;
      }
    } catch (err: any) {
      alert('Lỗi kết nối khi lưu dòng máy vào MySQL: ' + (err?.message || ''));
      setIsSubmittingModel(false);
      return;
    }

    // 2. Lưu vào IShopStore đồng bộ tức thì cho client
    IShopStore.addPhone(newPhoneItem);

    // 3. Chọn ngay hãng và dòng máy mới trên giao diện
    setSelectedBrand(targetBrand);
    setSelectedPhoneId(newId);

    setSuccessMessage(
      `✓ Đã thêm thành công dòng máy "${trimmedModel}" (${targetBrand}) vào CSDL MySQL!`
    );

    setIsAddModelModalOpen(false);
    setNewModelName('');
    setIsSubmittingModel(false);
    await loadData();
  };

  // Sync phone colors to MySQL /api/phones
  const syncPhoneColorsToDb = async (
    phoneObj: PhoneProduct,
    updatedColors: PhoneProduct['colors'],
    syncDeleteColors = false
  ) => {
    const res = await fetch('/api/phones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: phoneObj.id,
        name: phoneObj.name,
        slug: phoneObj.slug,
        brand: phoneObj.brand,
        description: phoneObj.description,
        colors: updatedColors,
        capacities: phoneObj.capacities,
        specs: phoneObj.specs,
        syncDeleteColors,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Không thể đồng bộ màu sắc dòng máy vào CSDL MySQL');
    }
  };

  const handleSaveNewColor = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedColor = newColorName.trim();
    if (!trimmedColor) {
      alert('Vui lòng nhập tên màu sắc mới!');
      return;
    }

    try {
      // 1. Luôn lưu màu mới vào bảng danh mục màu sắc MySQL (phonecolorcatalog)
      const colRes = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedColor, hex: newColorHex }),
      });
      const colJson = await colRes.json();
      if (!colRes.ok || !colJson.success) {
        alert(colJson.error || 'Không thể lưu màu mới vào CSDL MySQL!');
        return;
      }

      const savedColorObj = {
        id: colJson.data?.id || `c-${Date.now()}`,
        name: trimmedColor,
        hex: newColorHex,
        imageUrl: newColorImageUrl || '',
      };

      setDefaultColors((prev) => {
        if (prev.some((c) => c.name.toLowerCase() === trimmedColor.toLowerCase())) {
          return prev.map((c) =>
            c.name.toLowerCase() === trimmedColor.toLowerCase() ? { ...c, hex: newColorHex } : c
          );
        }
        return [...prev, { ...savedColorObj, imageUrl: '' }];
      });

      // 2. Nếu đang chọn một dòng máy, đồng bộ THÊM màu mới (không xóa các màu cũ) vào bảng phonecolor
      if (currentPhone) {
        const updatedColors = [...(currentPhone.colors || [])];
        const existingIdx = updatedColors.findIndex(
          (c) => c.name.toLowerCase() === trimmedColor.toLowerCase()
        );
        if (existingIdx >= 0) {
          updatedColors[existingIdx] = {
            ...updatedColors[existingIdx],
            hex: newColorHex,
            imageUrl: newColorImageUrl || updatedColors[existingIdx].imageUrl || '',
          };
        } else {
          updatedColors.push({
            id: savedColorObj.id,
            name: trimmedColor,
            hex: newColorHex,
            imageUrl: newColorImageUrl || '',
          });
        }
        await syncPhoneColorsToDb(currentPhone, updatedColors, false);
        setPhones((prev) =>
          prev.map((p) => (p.id === currentPhone.id ? { ...p, colors: updatedColors } : p))
        );
        IShopStore.updatePhone(currentPhone.id, { colors: updatedColors });
      }

      setColor(trimmedColor);
      if (newColorImageUrl) {
        setProductImageUrl(newColorImageUrl);
      } else {
        setProductImageUrl('');
      }
      setIsAddColorModalOpen(false);
      setNewColorName('');
      setNewColorImageUrl('');
      setSuccessMessage(`✓ Đã lưu màu "${trimmedColor}" vào CSDL MySQL thành công!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadData();
    } catch (err: any) {
      alert('Lỗi lưu màu sắc mới vào CSDL: ' + (err?.message || 'Lỗi kết nối'));
    }
  };

  const handleDeleteColor = async (colorNameToDelete: string) => {
    if (availableColors.length <= 1) {
      alert('Cần giữ lại ít nhất 1 màu sắc trong danh sách!');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa màu "${colorNameToDelete}" khỏi danh sách màu sắc?`
    );
    if (!confirmed) return;

    const remainingAll = availableColors.filter(
      (c) => c.name.toLowerCase() !== colorNameToDelete.toLowerCase()
    );

    try {
      // 1. Xóa khỏi danh mục màu sắc MySQL (phonecolorcatalog)
      const delRes = await fetch(`/api/colors?name=${encodeURIComponent(colorNameToDelete)}`, {
        method: 'DELETE',
      });
      const delJson = await delRes.json();
      if (!delRes.ok && delRes.status !== 404) {
        if (!currentPhone) {
          alert(delJson.error || 'Không thể xóa màu khỏi CSDL MySQL!');
          return;
        }
      }

      setDefaultColors((prev) =>
        prev.filter((c) => c.name.toLowerCase() !== colorNameToDelete.toLowerCase())
      );

      // 2. Nếu đang chọn một dòng máy và màu này thuộc dòng máy đó, xóa khỏi phonecolor của dòng máy
      if (currentPhone) {
        const remainingPhoneColors = (currentPhone.colors || []).filter(
          (c) => c.name.toLowerCase() !== colorNameToDelete.toLowerCase()
        );
        if (remainingPhoneColors.length > 0 && remainingPhoneColors.length !== (currentPhone.colors || []).length) {
          await syncPhoneColorsToDb(currentPhone, remainingPhoneColors, true);
          setPhones((prev) =>
            prev.map((p) => (p.id === currentPhone.id ? { ...p, colors: remainingPhoneColors } : p))
          );
          IShopStore.updatePhone(currentPhone.id, { colors: remainingPhoneColors });
        }
      }

      if (color.toLowerCase() === colorNameToDelete.toLowerCase() && remainingAll.length > 0) {
        setColor(remainingAll[0].name);
      }

      setSuccessMessage(`✓ Đã xóa màu "${colorNameToDelete}" khỏi CSDL MySQL thành công!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadData();
    } catch (err: any) {
      alert('Lỗi xóa màu sắc khỏi CSDL: ' + (err?.message || 'Lỗi kết nối'));
    }
  };

  // Parse raw IMEI text into array of clean 15-digit numbers
  const parsedImeis = useMemo(() => {
    return imeiListText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);
  }, [imeiListText]);

  const numericCostPrice = Number(costPrice) || 0;
  const numericSellingPrice = Number(sellingPrice) || 0;
  const totalBatchCost = numericCostPrice * parsedImeis.length;
  const debtIncrease = Math.max(0, totalBatchCost - paidAmount);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedImeis.length === 0) {
      alert('Vui lòng nhập ít nhất 1 số IMEI hợp lệ!');
      return;
    }
    if (!selectedSupplierId) {
      alert('Vui lòng chọn hoặc tạo mới Nhà Cung Cấp trước khi nhập kho!');
      return;
    }
    if (!currentPhone) {
      alert('Vui lòng thêm hoặc chọn một Dòng Máy (Model) trước khi nạp IMEI!');
      return;
    }
    if (numericCostPrice <= 0 || numericSellingPrice <= 0) {
      alert('Vui lòng nhập đầy đủ giá vốn nhập và giá bán lẻ niêm yết!');
      return;
    }

    // 1. Post to live MySQL Database via /api/restock
    const activeColorObj = availableColors.find(
      (c) => c.name.toLowerCase() === color.toLowerCase()
    );
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          phoneId: currentPhone.id,
          phoneName: currentPhone.name,
          color,
          colorHex: activeColorObj?.hex || '#222222',
          imageUrl: productImageUrl || '',
          capacity,
          costPrice: numericCostPrice,
          sellingPrice: numericSellingPrice,
          imeis: parsedImeis,
          paidAmount,
          notes: `Nhập lô hàng chính ngạch: Hãng ${currentPhone.brand} - ${currentPhone.name} (${color} - ${capacity}).`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Lỗi lưu lô IMEI vào CSDL MySQL!');
        return;
      }
    } catch (err: any) {
      alert('Lỗi kết nối khi nhập kho vào MySQL: ' + (err?.message || ''));
      return;
    }

    // 2. Also save to client store for immediate reactivity
    IShopStore.importPhoneBatch(
      selectedSupplierId,
      currentPhone.id,
      color,
      capacity,
      numericCostPrice,
      numericSellingPrice,
      parsedImeis,
      paidAmount
    );

    setSuccessMessage(
      `✓ Đã nạp thành công ${parsedImeis.length} máy mới [Hãng: ${currentPhone.brand}] - ${currentPhone.name} (${color} - ${capacity}) vào kho CSDL! Tự động tạo Phiếu Chi: ${formatVND(
        paidAmount
      )} và cập nhật công nợ NCC: +${formatVND(debtIncrease)}.`
    );

    setImeiListText('');
    await IShopStore.hydrateFromDatabase(true);
    await loadData();
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Phân Hệ Mua Hàng &amp; Quản Lý Nhà Cung Cấp
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Inbound Restock &amp; Lô IMEI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>Mua Hàng &amp; Nạp Lô IMEI Từ Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Chọn biến thể chính xác theo <strong>Hãng máy</strong>, <strong>Dòng máy</strong>, <strong>Dung lượng</strong> và <strong>Màu sắc</strong> dạng danh sách (tránh gõ thủ công sai sót).
          </p>
        </div>

        <Link
          href="/admin/inventory/phones"
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-transform hover:scale-105"
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span>Xem Kho Máy Mới (IMEI)</span>
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Import Form Layout */}
      <form autoComplete="off" onSubmit={handleImport} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Batch IMEI Input & Supplier Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Box 1: IMEI input */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>1. Dán Danh Sách Số IMEI Cần Nhập Kho</span>
              </h2>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">
                Dán danh sách IMEI (Mỗi số 1 dòng hoặc cách nhau bởi dấu phẩy):
              </label>
              <textarea
                rows={7}
                required
                value={imeiListText}
                onChange={(e) => setImeiListText(e.target.value)}
                placeholder=""
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Parsed Previews */}
            {parsedImeis.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="text-slate-600 font-bold block text-[11px] uppercase tracking-wide">
                  Danh sách {parsedImeis.length} IMEI sẽ kích hoạt trong kho:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {parsedImeis.map((imei, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white text-blue-800 border border-slate-200 font-bold shadow-2xs"
                    >
                      {idx + 1}. {imei}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Supplier Debt & Payment */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Thông Tin Nhà Cung Cấp &amp; Công Nợ</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Nhà Cung Cấp phân phối *:
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Nợ hiện tại: {formatVND(s.currentDebt)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Số tiền thanh toán ngay cho NCC (VND):
                </label>
                <input autoComplete="off"
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Selection & Clean Variant Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 sticky top-24">
            {/* Header section 3 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                    Cấu Hình Hãng Máy, Dòng Máy &amp; Biến Thể
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Chọn nhanh dạng danh sách: Hãng máy → Dòng máy → Dung lượng → Màu sắc
                  </p>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 1. CHỌN HÃNG MÁY + NÚT THÊM & NÚT XÓA THƯƠNG HIỆU         */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-slate-700 font-bold block">
                  1. Chọn Hãng Máy (Thương hiệu) *:
                </label>
                <div className="flex items-center gap-2">
                  {selectedBrand !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(selectedBrand)}
                      title={`Xóa thương hiệu ${selectedBrand} khỏi hệ thống`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Hãng</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddBrandModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Thương Hiệu</span>
                  </button>
                </div>
              </div>

              {/* Smart Brand Selector Dropdown */}
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả thương hiệu ({phones.length} dòng máy)</option>
                {brandList.map((b) => {
                  const brandObj = dbBrands.find((d) => d.name.toLowerCase() === b.toLowerCase());
                  const cnt = phones.filter((p) => p.brand === b).length;
                  return (
                    <option key={b} value={b}>
                      {b} {brandObj?.country ? `(${brandObj.country})` : ''} — {cnt} model
                    </option>
                  );
                })}
              </select>
            </div>

            {/* ======================================================== */}
            {/* 2. CHỌN DÒNG MÁY (PHÂN LOẠI RÕ RÀNG THEO HÃNG ĐÃ CHỌN)   */}
            {/* ======================================================== */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold block">
                  2. Chọn Dòng Máy{' '}
                  {selectedBrand !== 'all' ? (
                    <span className="text-blue-700 uppercase font-black">
                      (Hãng {selectedBrand})
                    </span>
                  ) : (
                    ''
                  )}{' '}
                  *:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {filteredPhonesByBrand.length} model khả dụng
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewModelBrand(selectedBrand !== 'all' ? selectedBrand : (brandList[0] || 'Apple'));
                      setIsAddModelModalOpen(true);
                    }}
                    className="text-[11px] text-blue-700 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm Dòng Máy</span>
                  </button>
                </div>
              </div>

              {filteredPhonesByBrand.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <span>
                    Chưa có dòng máy nào khớp bộ lọc của hãng <strong>{selectedBrand}</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModelSearchQuery('');
                      setNewModelBrand(selectedBrand === 'all' ? 'Apple' : selectedBrand);
                      setIsAddModelModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 shadow-xs cursor-pointer"
                  >
                    + Thêm Dòng Máy Ngay
                  </button>
                </div>
              ) : (
                <select
                  value={selectedPhoneId}
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  {filteredPhonesByBrand.map((p) => (
                    <option key={p.id} value={p.id}>
                      {selectedBrand === 'all' ? `[${p.brand}] ` : ''}
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ======================================================== */}
            {/* 3. CHỌN DUNG LƯỢNG (128GB, 256GB, 512GB, 1TB, 2TB)       */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Chọn Dung Lượng (Bộ nhớ trong) *:</span>
                </label>
                <span className="text-blue-700 font-black font-mono text-xs">
                  Đã chọn: {capacity}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ALL_STANDARD_CAPACITIES.map((capSize) => {
                  const isCapSelected = capacity === capSize;
                  return (
                    <button
                      key={capSize}
                      type="button"
                      onClick={() => handleSelectCapacity(capSize)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isCapSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-black'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="font-mono text-xs block">{capSize}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 4. CHỌN MÀU SẮC (CHỈ CHỌN MÀU, KHÔNG HIỂN THỊ GIÁ)       */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Chọn Màu Sắc Máy *:</span>
                </label>
                <div className="flex items-center gap-2">
                  {color && availableColors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColor(color)}
                      title={`Xóa màu ${color}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Màu</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddColorModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Màu Mới</span>
                  </button>
                </div>
              </div>

              {/* Smart Color Dropdown Selector */}
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableColors.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ======================================================== */}
            {/* 5. HÌNH ẢNH SẢN PHẨM THEO MÀU (TẢI TỪ MÁY LÊN)          */}
            {/* ======================================================== */}
            <div className="space-y-2 text-xs">
              <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>5. Hình Ảnh Sản Phẩm Theo Màu "{color}" (Tải Từ Máy Lên):</span>
              </label>

              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                autoComplete="off"
                onChange={handleUploadProductImage}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => imageFileInputRef.current?.click()}
                  className="flex-1 px-4 py-3 bg-slate-50 hover:bg-blue-50 border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl text-slate-700 hover:text-blue-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang tải ảnh lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{productImageUrl ? 'Chọn Ảnh Khác Từ Máy' : 'Tải Ảnh Sản Phẩm Từ Máy Lên'}</span>
                    </>
                  )}
                </button>

                {productImageUrl && (
                  <div className="relative shrink-0">
                    <img
                      src={productImageUrl}
                      alt={`${currentPhone?.name || 'Sản phẩm'} - ${color}`}
                      className="w-14 h-14 object-cover rounded-2xl border border-slate-200 bg-white shadow-xs"
                    />
                    <button
                      type="button"
                      title="Gỡ ảnh"
                      onClick={async () => {
                        setProductImageUrl('');
                        if (currentPhone) {
                          const updatedColors = (currentPhone.colors || []).map((c) =>
                            c.name.toLowerCase() === color.toLowerCase() ? { ...c, imageUrl: '' } : c
                          );
                          try {
                            await syncPhoneColorsToDb(currentPhone, updatedColors, false);
                            setPhones((prev) =>
                              prev.map((p) =>
                                p.id === currentPhone.id ? { ...p, colors: updatedColors } : p
                              )
                            );
                            IShopStore.updatePhone(currentPhone.id, { colors: updatedColors });
                          } catch {}
                        }
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {uploadImageError && (
                <p className="text-[11px] font-semibold text-rose-600">{uploadImageError}</p>
              )}
            </div>

            {/* ======================================================== */}
            {/* 6. GIÁ VỐN & GIÁ BÁN LÔ HÀNG                             */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Giá vốn nhập/máy (VND) *:
                </label>
                <input autoComplete="off"
                  type="number"
                  required
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-sm font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Giá vốn hạch toán công nợ và lãi gộp
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Giá bán lẻ niêm yết (VND) *:
                </label>
                <input autoComplete="off"
                  type="number"
                  required
                  min={0}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-black text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Đồng bộ tức thì lên quầy POS và Web khách
                </span>
              </div>
            </div>

            {/* Cost & Debt Calculation Summary */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Số lượng máy nhập:</span>
                <span className="font-bold text-slate-900">{parsedImeis.length} máy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tổng giá trị lô hàng:</span>
                <span className="font-black text-slate-900 text-sm font-mono">
                  {formatVND(totalBatchCost)}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-bold">
                <span>Thanh toán ngay cho NCC:</span>
                <span className="font-mono text-sm">{formatVND(paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700 font-black border-t border-slate-100 pt-2">
                <span>Ghi nợ thêm cho NCC:</span>
                <span className="font-mono text-sm">+{formatVND(debtIncrease)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={parsedImeis.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Package className="w-4 h-4 text-white" />
              <span>
                XÁC NHẬN NẠP {parsedImeis.length} IMEI ({currentPhone?.brand} • {color} • {capacity})
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM THƯƠNG HIỆU / HÃNG MÁY MỚI (CHỈ HÃNG)      */}
      {/* ======================================================== */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Thêm Thương Hiệu (Hãng Máy) Mới</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Khai báo thương hiệu điện thoại vào danh mục CSDL hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBrandModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form autoComplete="off" onSubmit={handleSaveNewBrand} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên Hãng Máy (Thương hiệu) *:
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Xuất Xứ / Quốc Gia *:
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={newBrandCountry}
                  onChange={(e) => setNewBrandCountry(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Mô Tả / Giới Thiệu Thương Hiệu:
                </label>
                <textarea
                  rows={2}
                  value={newBrandDescription}
                  onChange={(e) => setNewBrandDescription(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-normal focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmittingBrand}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingBrand ? (
                    <span>Đang lưu thương hiệu...</span>
                  ) : (
                    <span>Lưu Thương Hiệu</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingBrand}
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÊM DÒNG MÁY (MODEL) MỚI CHO HÃNG             */}
      {/* ======================================================== */}
      {isAddModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>Thêm Dòng Máy (Model) Mới</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tạo model điện thoại mới vào danh mục sản phẩm của hãng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModelModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form autoComplete="off" onSubmit={handleSaveNewModel} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Hãng Máy (Thương hiệu) *:
                </label>
                <select
                  value={newModelBrand}
                  onChange={(e) => setNewModelBrand(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {brandList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên Dòng Máy (Model) *:
                </label>
                <input autoComplete="off"
                  type="text"
                  required
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmittingModel}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingModel ? (
                    <span>Đang lưu dòng máy...</span>
                  ) : (
                    <span>Lưu Dòng Máy</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingModel}
                  onClick={() => setIsAddModelModalOpen(false)}
                  className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: THÊM MÀU SẮC MỚI CHO DÒNG MÁY                   */}
      {/* ======================================================== */}
      {isAddColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  <span>Thêm Màu Sắc Mới Cho Dòng Máy</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dòng máy: <strong className="text-slate-900">{currentPhone?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddColorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form autoComplete="off" onSubmit={handleSaveNewColor} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Tên màu sắc mới *:
                </label>
                <input autoComplete="off"
                  type="text"
                  required
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Mã màu hiển thị (Hex):
                </label>
                <div className="flex items-center gap-3">
                  <input autoComplete="off"
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input autoComplete="off"
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold mb-1 block">
                  Ảnh sản phẩm màu này (Tải từ máy lên):
                </label>
                <input
                  ref={modalColorFileInputRef}
                  type="file"
                  accept="image/*"
                  autoComplete="off"
                  onChange={handleUploadModalColorImage}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingModalColorImage}
                    onClick={() => modalColorFileInputRef.current?.click()}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-slate-700 hover:text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingModalColorImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Đang tải ảnh lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>{newColorImageUrl ? 'Chọn Ảnh Khác Từ Máy' : 'Tải Ảnh Từ Máy Lên'}</span>
                      </>
                    )}
                  </button>

                  {newColorImageUrl && (
                    <div className="relative shrink-0">
                      <img
                        src={newColorImageUrl}
                        alt="preview"
                        className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setNewColorImageUrl('')}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-rose-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Lưu &amp; Thêm Vào Danh Sách Màu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddColorModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
