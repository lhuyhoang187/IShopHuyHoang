'use client';

import React, { useState } from 'react';
import { Gift, Sparkles, Check, AlertCircle, ShoppingBag, ArrowRight, QrCode } from 'lucide-react';
import { IShopStore } from '@/lib/store';
import { AccessoryProduct, RedeemedGiftItem } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';
import { Barcode } from './Barcode';

interface RedeemGiftSectionProps {
  customerPhone: string;
  customerName: string;
  currentPoints: number;
  onRedeemSuccess?: () => void;
}

export function RedeemGiftSection({
  customerPhone,
  customerName,
  currentPoints,
  onRedeemSuccess,
}: RedeemGiftSectionProps) {
  const accessories = IShopStore.getAccessories();
  const redeemedGifts = IShopStore.getRedeemedGifts(customerPhone);
  const [activeSubTab, setActiveSubTab] = useState<'available' | 'history'>('available');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedGiftForBarcode, setSelectedGiftForBarcode] = useState<RedeemedGiftItem | null>(null);

  const handleRedeem = (item: AccessoryProduct) => {
    const pointsNeeded = item.pointsToRedeem || Math.ceil(item.sellingPrice / 1000);

    if (currentPoints < pointsNeeded) {
      setToast({
        message: `Bạn đang có ${currentPoints.toLocaleString('vi-VN')} điểm, cần thêm ${(pointsNeeded - currentPoints).toLocaleString('vi-VN')} điểm để đổi "${item.name}"!`,
        type: 'error',
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const res = IShopStore.redeemAccessoryWithPoints({
      customerPhone,
      customerName,
      accessoryId: item.id,
    });

    if (res.success) {
      setToast({
        message: res.message,
        type: 'success',
      });
      if (res.gift) {
        setSelectedGiftForBarcode(res.gift);
      }
      if (onRedeemSuccess) onRedeemSuccess();
      setTimeout(() => setToast(null), 5000);
    } else {
      setToast({
        message: res.message,
        type: 'error',
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Đổi Điểm Thưởng Lấy Phụ Kiện Chính Hãng
              </h3>
              <p className="text-xs text-slate-500">
                Sử dụng điểm tích lũy của bạn ({currentPoints.toLocaleString('vi-VN')} pts) để đổi củ sạc, cáp sạc, pin dự phòng hoặc ốp lưng miễn phí!
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('available')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'available'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kho Quà Đổi ({accessories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quà Đã Đổi ({redeemedGifts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH QUÀ CÓ THỂ ĐỔI */}
      {activeSubTab === 'available' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessories.map((item) => {
            const pointsNeeded = item.pointsToRedeem || Math.ceil(item.sellingPrice / 1000);
            const canAfford = currentPoints >= pointsNeeded;
            const progress = Math.min(100, Math.round((currentPoints / pointsNeeded) * 100));

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  canAfford
                    ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-sm hover:shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Badge đủ điểm */}
                {canAfford && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Đủ điểm đổi</span>
                  </div>
                )}

                <div>
                  <div className="w-full h-32 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center mb-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                    {item.categoryName} &bull; {item.brand}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 mt-0.5">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Giá niêm yết: <span className="line-through">{formatVND(item.sellingPrice)}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Điểm cần đổi:</span>
                    <span className="text-base font-black font-mono text-amber-700">
                      {pointsNeeded.toLocaleString('vi-VN')} pts
                    </span>
                  </div>

                  {/* Thanh tiến độ điểm */}
                  {!canAfford && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Tiến độ: {progress}%</span>
                        <span>Thiếu {(pointsNeeded - currentPoints).toLocaleString('vi-VN')} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford || item.stock <= 0}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      canAfford && item.stock > 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {item.stock <= 0 ? (
                      'Tạm hết hàng'
                    ) : canAfford ? (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>ĐỔI QUÀ NGAY (-{pointsNeeded} pts)</span>
                      </>
                    ) : (
                      <span>Cần thêm {pointsNeeded - currentPoints} điểm</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: LỊCH SỬ QUÀ ĐÃ ĐỔI */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {redeemedGifts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Gift className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Bạn chưa đổi phần quà nào.</p>
              <p className="text-[11px] text-slate-500">
                Hãy tích lũy điểm khi mua điện thoại hoặc phụ kiện để đổi quà miễn phí tại quầy!
              </p>
            </div>
          ) : (
            redeemedGifts.map((gift) => (
              <div
                key={gift.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={gift.accessoryImage}
                    alt={gift.accessoryName}
                    className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {gift.giftCode}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        Sẵn sàng nhận tại quầy
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{gift.accessoryName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Đã trừ {gift.pointsRedeemed.toLocaleString('vi-VN')} điểm &bull; Ngày đổi:{' '}
                      {new Date(gift.redeemedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGiftForBarcode(gift)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mã Vạch Nhận Quà</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Mã Vạch Nhận Quà */}
      {selectedGiftForBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h4 className="font-black text-slate-900 text-base">PHIẾU NHẬN QUÀ TẶNG</h4>
            <p className="text-xs text-slate-600">{selectedGiftForBarcode.accessoryName}</p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
              <Barcode value={selectedGiftForBarcode.giftCode} height={50} barColor="#0f172a" />
              <span className="font-mono font-bold text-sm text-slate-900 mt-2 tracking-widest">
                {selectedGiftForBarcode.giftCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Đưa mã vạch này cho nhân viên thu ngân tại cửa hàng để nhận trực tiếp phụ kiện!
            </p>

            <button
              onClick={() => setSelectedGiftForBarcode(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom duration-200 max-w-md ${
            toast.type === 'error'
              ? 'bg-red-950 text-red-100 border-red-500'
              : 'bg-emerald-950 text-emerald-100 border-emerald-500'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
