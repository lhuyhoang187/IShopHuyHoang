'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, UserCog, X } from 'lucide-react';

interface IncompleteProfileCardProps {
  missingFields: string[];
  actionLabel?: string;
}

export function IncompleteProfileCard({
  missingFields,
  actionLabel = 'đặt hàng hoặc đặt lịch sửa chữa',
}: IncompleteProfileCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-rose-50/90 border-2 border-rose-200 shadow-sm space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-sm sm:text-base font-black text-rose-900">
            Chưa thể {actionLabel} — Hồ sơ chưa đầy đủ!
          </h3>
          <p className="text-xs text-rose-800/90 leading-relaxed">
            Bạn cần cập nhật đầy đủ địa chỉ và thông tin cá nhân trong phần <strong>Hồ Sơ Cá Nhân</strong> trước khi tiến hành {actionLabel}.
          </p>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="pl-0 sm:pl-14 space-y-1.5">
          <span className="text-[11px] font-bold text-rose-700 block">
            Thông tin còn thiếu ({missingFields.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((field) => (
              <span
                key={field}
                className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-[11px] font-bold"
              >
                • {field}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pl-0 sm:pl-14 pt-1">
        <Link
          href="/account?tab=profile"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <UserCog className="w-4 h-4" />
          <span>Cập Nhật Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

interface IncompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  actionLabel?: string;
}

export function IncompleteProfileModal({
  isOpen,
  onClose,
  missingFields,
  actionLabel = 'đặt hàng hoặc đặt lịch sửa chữa',
}: IncompleteProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2.5 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Vui Lòng Cập Nhật Hồ Sơ Cá Nhân
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn chưa cập nhật đầy đủ địa chỉ và thông tin cá nhân trong phần hồ sơ nên chưa thể {actionLabel}.
          </p>
        </div>

        {missingFields.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <p className="text-[11px] font-bold text-rose-800">
              Các thông tin cần bổ sung trong hồ sơ:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-[11px] font-bold"
                >
                  • {field}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Để Sau
          </button>
          <Link
            href="/account?tab=profile"
            onClick={onClose}
            className="flex-[1.6] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <UserCog className="w-4 h-4" />
            <span>Cập Nhật Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
