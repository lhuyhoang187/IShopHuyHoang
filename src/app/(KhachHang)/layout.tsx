'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/ThanhPhan/KhachHang/DauTrang';
import Footer from '@/ThanhPhan/KhachHang/ChanTrang';
import { IShopStore } from '@/ThuVien/KhoDuLieu';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    IShopStore.hydrateFromDatabase();
  }, [pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        IShopStore.hydrateFromDatabase();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800 selection:bg-amber-400 selection:text-black">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
