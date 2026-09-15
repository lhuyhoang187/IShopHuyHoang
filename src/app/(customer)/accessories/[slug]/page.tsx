'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Headphones,
  ShieldCheck,
  RotateCcw,
  Truck,
  ShoppingCart,
  Zap,
  Check,
  ChevronRight,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import VietQRModal from '@/components/customer/VietQRModal';

export default function AccessoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [accessory, setAccessory] = useState<AccessoryProduct | null>(null);
  const [isVietQROpen, setIsVietQROpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const found = IShopStore.getAccessoryBySlug(slug);
    if (found) setAccessory(found);
  }, [slug]);

  if (!accessory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Đang tải thông tin phụ kiện...</h2>
        <Link href="/accessories" className="text-sm text-blue-400 hover:underline">
          Quay lại danh sách phụ kiện
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    IShopStore.addToCart({
      productId: accessory.id,
      type: 'accessory',
      name: accessory.name,
      slug: accessory.slug,
      imageUrl: accessory.imageUrl,
      price: accessory.sellingPrice,
      originalPrice: accessory.originalPrice,
      quantity: 1,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 flex items-center gap-2">
        <Link href="/" className="hover:text-white">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/accessories" className="hover:text-white">Phụ kiện</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-emerald-400 truncate">{accessory.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card rounded-3xl p-8 border border-white/10 text-center relative bg-[#0e1422]">
            <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-black/40 p-4">
              <img
                src={accessory.imageUrl}
                alt={accessory.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Mã Barcode: <strong className="font-mono text-white">{accessory.barcode}</strong>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-300">
            <div className="glass-card p-3 rounded-2xl border border-white/5">
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
              <span className="font-semibold block text-white">Bảo Hành 12T</span>
              <span className="text-[10px] text-gray-400">1 đổi 1 nhanh chóng</span>
            </div>
            <div className="glass-card p-3 rounded-2xl border border-white/5">
              <RotateCcw className="w-5 h-5 mx-auto text-blue-400 mb-1" />
              <span className="font-semibold block text-white">Chính Hãng 100%</span>
              <span className="text-[10px] text-gray-400">Tem phân phối</span>
            </div>
            <div className="glass-card p-3 rounded-2xl border border-white/5">
              <Truck className="w-5 h-5 mx-auto text-amber-400 mb-1" />
              <span className="font-semibold block text-white">Ship Toàn Quốc</span>
              <span className="text-[10px] text-gray-400">Đồng kiểm khi nhận</span>
            </div>
          </div>
        </div>

        {/* Right: Info & Buy */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Hãng {accessory.brand} • {accessory.categoryName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {accessory.name}
            </h1>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {accessory.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.07] to-transparent flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-400 line-through block">
                {formatVND(accessory.originalPrice)}
              </span>
              <span className="text-3xl font-black text-emerald-400">
                {formatVND(accessory.sellingPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Giảm 15% khi mua kèm điện thoại
              </span>
              <div className="text-xs text-gray-400 mt-1">
                Tồn kho sẵn có: <strong className="text-white">{accessory.stock} cái</strong>
              </div>
            </div>
          </div>

          {/* Specs & Compatibility */}
          <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Thông số kỹ thuật:</span>
              <span className="font-semibold text-white text-right">{accessory.specs}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-400">Tương thích:</span>
              <span className="font-semibold text-white text-right">{accessory.compatibleWith}</span>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setIsVietQROpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-current" />
                <span>MUA NGAY (VIETQR)</span>
              </button>

              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Thêm Vào Giỏ Hàng</span>
              </button>
            </div>

            {addedToast && (
              <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl text-center shadow-lg animate-in fade-in duration-200">
                ✓ Đã thêm {accessory.name} vào giỏ hàng thành công!
              </div>
            )}
          </div>
        </div>
      </div>

      <VietQRModal
        isOpen={isVietQROpen}
        onClose={() => setIsVietQROpen(false)}
        amount={accessory.sellingPrice}
        orderCode={`PK${Date.now().toString().slice(-6)}`}
        onPaymentSuccess={() => {
          alert('Cảm ơn quý khách! iShop Huy Hoàng đã ghi nhận thanh toán phụ kiện.');
        }}
      />
    </div>
  );
}
