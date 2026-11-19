'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Link as LinkIcon, Check, X, Trash2, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  name: string;
  onSaveAvatar: (avatarUrl: string | null) => void;
  title?: string;
}

// Bộ sưu tập avatar cao cấp đa dạng dành cho cả Khách hàng và Nhân viên / Chủ Shop
export const PRESET_AVATARS = [
  {
    id: 'apple_genius_1',
    label: 'Chuyên Viên Apple Nam',
    category: 'Pro',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'apple_genius_2',
    label: 'Chuyên Viên Apple Nữ',
    category: 'Pro',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech_expert_1',
    label: 'Kỹ Thuật Viên Tech',
    category: 'Pro',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_1',
    label: 'Khách Hàng VIP Hoàng Gia',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_2',
    label: 'Nữ Doanh Nhân VIP',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_3',
    label: 'Chuyên Gia Tối Giản',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'robot_titanium',
    label: 'iCare Cyber Bot',
    category: 'Creative',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=HuyHoangCyber',
  },
  {
    id: 'adventurer_luxe',
    label: 'Titanium Adventurer',
    category: 'Creative',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=IShopVIPCard',
  },
];

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  name,
  onSaveAvatar,
  title = 'Cập Nhật Ảnh Đại Diện',
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageMeta, setImageMeta] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedAvatar(currentAvatar || null);
    setErrorMsg(null);
    setImageMeta(null);
  }, [currentAvatar, isOpen]);

  if (!isOpen) return null;

  // Xử lý nén và cắt ảnh vuông tâm (Center Crop) bằng Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tập tin hình ảnh hợp lệ (PNG, JPG, WebP, GIF...)');
      return;
    }

    // Cho phép ảnh gốc dung lượng đến 15MB vì sẽ được nén tối ưu ngay trên trình duyệt
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Tập tin ảnh gốc vượt quá 15MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    setImageMeta(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setErrorMsg('Không thể đọc dữ liệu file ảnh. Vui lòng thử lại.');
        setIsUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const targetSize = 400; // 400x400 sắc nét chuẩn Retina avatar
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Tính toán cắt vuông ở chính giữa (Center Crop) không bị méo tỉ lệ
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            // Nền trắng mềm nếu là PNG trong suốt
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetSize, targetSize);

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

            // Xuất JPEG tối ưu chất lượng cao 90% (dung lượng nhẹ ~30-45KB)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
            setSelectedAvatar(compressedDataUrl);
            setImageMeta(`✓ Đã nén & cắt vuông chuẩn 400x400px (${Math.round((compressedDataUrl.length * 3) / 4 / 1024)} KB)`);
          } else {
            setSelectedAvatar(rawDataUrl);
          }
        } catch (cropErr) {
          console.warn('Canvas optimization fallback:', cropErr);
          setSelectedAvatar(rawDataUrl);
        } finally {
          setIsUploading(false);
        }
      };

      img.onerror = () => {
        setErrorMsg('Tập tin ảnh bị lỗi hoặc không tương thích.');
        setIsUploading(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('Không thể đọc tập tin ảnh từ thiết bị.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    // Reset file input value to allow re-selecting the same file if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      setErrorMsg('Vui lòng nhập đường link ảnh hợp lệ');
      return;
    }
    setErrorMsg(null);
    setIsUploading(true);

    const testImg = new Image();
    testImg.onload = () => {
      setSelectedAvatar(customUrl.trim());
      setImageMeta('✓ Đường dẫn ảnh hợp lệ');
      setIsUploading(false);
    };
    testImg.onerror = () => {
      setErrorMsg('Không thể tải ảnh từ liên kết URL đã nhập. Vui lòng kiểm tra lại');
      setIsUploading(false);
    };
    testImg.src = customUrl.trim();
  };

  const handleConfirm = () => {
    onSaveAvatar(selectedAvatar);
    onClose();
  };

  const handleRemove = () => {
    setSelectedAvatar(null);
    setCustomUrl('');
    setImageMeta(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white text-slate-900 border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">Tải ảnh hoặc chọn avatar phong cách chuẩn iShop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-md overflow-hidden">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                ) : selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setErrorMsg('Không thể hiển thị ảnh đã chọn. Vui lòng chọn ảnh khác.');
                      setSelectedAvatar(null);
                    }}
                  />
                ) : (
                  <span className="text-2xl font-black text-amber-300">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {selectedAvatar && !isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                title="Gỡ ảnh này"
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white shadow-md hover:scale-110 transition-transform cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-900 text-sm">{name}</p>
            <p className="text-slate-500 text-[11px]">
              {selectedAvatar ? 'Đang chọn ảnh tùy chỉnh' : 'Đang sử dụng ký tự viết tắt mặc định'}
            </p>
            {imageMeta ? (
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                {imageMeta}
              </p>
            ) : (
              <p className="text-[10px] text-amber-700 font-semibold">
                Khuyến nghị ảnh vuông, tự động nén &amp; canh tâm chuẩn tỉ lệ 1:1
              </p>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh Lên</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'preset' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bộ Sưu Tập</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'url' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Đường Dẫn URL</span>
          </button>
        </div>

        {/* Tab 1: Upload from local device */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input autoComplete="off"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-slate-900 font-bold text-xs">
                  {isUploading ? 'Đang nén & tối ưu ảnh...' : 'Nhấn để chọn ảnh hoặc kéo thả vào đây'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động cắt vuông 1:1, hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 15MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Preset Gallery */}
        {activeTab === 'preset' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 font-medium">Chọn 1 avatar chuẩn phong cách iShop Flagship:</p>
            <div className="grid grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(preset.url);
                      setImageMeta(`✓ Đã chọn mẫu: ${preset.label}`);
                    }}
                    className={`relative rounded-2xl p-1.5 border transition-all text-left group overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-400/40'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="block text-[9px] font-bold text-slate-700 truncate mt-1 text-center">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <label className="text-slate-700 font-bold text-xs block">
              Dán đường dẫn ảnh trực tuyến (URL):
            </label>
            <div className="flex gap-2">
              <input autoComplete="off"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder=""
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs border border-slate-900 shrink-0 cursor-pointer disabled:opacity-50"
              >
                Kiểm Tra &amp; Áp Dụng
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Đặt lại mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Lưu &amp; Áp Dụng Ảnh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
