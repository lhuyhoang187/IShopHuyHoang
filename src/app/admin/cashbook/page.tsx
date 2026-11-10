'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Store, Wallet } from 'lucide-react';

export default function AdminCashbookRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=cashbook');
  }, [router]);

  return (
    <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
        <Wallet className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-black text-slate-900">Tính năng đã được hợp nhất</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Phân hệ <strong>Sổ Quỹ &amp; Kế Toán</strong> đã được gộp chung trực tiếp vào trang <strong>Tổng Quan &amp; Kế Toán Sổ Quỹ</strong> để quản lý thuận tiện và tập trung.
      </p>
      <div className="pt-2">
        <Link
          href="/admin?tab=cashbook"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all"
        >
          <Store className="w-4 h-4" />
          <span>Chuyển Đến Trang Tổng Quan Hợp Nhất</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
