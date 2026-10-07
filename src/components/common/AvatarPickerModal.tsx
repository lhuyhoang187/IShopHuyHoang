'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Link as LinkIcon, Check, X, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';

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
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'apple_genius_2',
    label: 'Chuyên Viên Apple Nữ',
    category: 'Pro',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech_expert_1',
    label: 'Kỹ Thuật Viên Tech',
    category: 'Pro',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_1',
    label: 'Khách Hàng VIP Hoàng Gia',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_2',
    label: 'Nữ Doanh Nhân VIP',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxe_vip_3',
    label: 'Chuyên Gia Tối Giản',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&auto=format&fit=crop&q=80',
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý upload file ảnh từ máy (chuyển sang base64 data url)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tập tin hình ảnh hợp lệ (PNG, JPG, WebP...)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa 5MB');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedAvatar(dataUrl);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg('Không thể đọc file ảnh. Vui lòng thử lại');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      setErrorMsg('Vui lòng nhập đường link ảnh hợp lệ');
      return;
    }
    setErrorMsg(null);
    setSelectedAvatar(customUrl.trim());
  };

  const handleConfirm = () => {
    onSaveAvatar(selectedAvatar);
    onClose();
  };

  const handleRemove = () => {
    setSelectedAvatar(null);
    setCustomUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c1220] border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-[11px] text-gray-400">Chọn hoặc tải ảnh thể hiện phong cách của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-xl overflow-hidden">
              <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center overflow-hidden">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setErrorMsg('Không tải được ảnh từ đường link đã chọn')}
                  />
                ) : (
                  <span className="text-2xl font-black text-amber-300">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {selectedAvatar && (
              <button
                type="button"
                onClick={handleRemove}
                title="Gỡ ảnh này"
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white shadow-md hover:scale-110 transition-transform"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-bold text-white text-sm">{name}</p>
            <p className="text-gray-400 text-[11px]">
              {selectedAvatar ? 'Đang chọn ảnh tùy chỉnh' : 'Đang sử dụng ký tự viết tắt mặc định'}
            </p>
            <p className="text-[10px] text-amber-400/80">
              Khuyến nghị ảnh vuông, tỉ lệ 1:1, dung lượng dưới 5MB
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh Lên</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'preset' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bộ Sưu Tập</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'url' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Đường Dẫn URL</span>
          </button>
        </div>

        {/* Tab 1: Upload from local device */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04] space-y-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-bold text-xs">Nhấn để chọn ảnh từ điện thoại hoặc máy tính</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tối đa 5MB)</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Preset Gallery */}
        {activeTab === 'preset' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Chọn 1 avatar chuẩn phong cách iShop Flagship:</p>
            <div className="grid grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.url)}
                    className={`relative rounded-2xl p-1 border transition-all text-left group overflow-hidden ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'border-white/10 hover:border-white/30 bg-white/[0.03]'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-black/40">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="block text-[9px] font-semibold text-gray-300 truncate mt-1 text-center">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shadow">
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
            <label className="text-gray-300 font-semibold text-xs block">
              Dán đường dẫn ảnh trực tuyến (URL):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 shrink-0"
              >
                Xem Trước
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Đặt lại mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs border border-white/10 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Ảnh Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
