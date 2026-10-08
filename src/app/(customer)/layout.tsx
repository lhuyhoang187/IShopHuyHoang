'use client';

import React from 'react';
import Header from '@/components/customer/Header';
import Footer from '@/components/customer/Footer';
import ComparisonFloatingBar from '@/components/customer/ComparisonFloatingBar';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800 selection:bg-amber-400 selection:text-black">
      <Header />
      <main className="flex-1">{children}</main>
      <ComparisonFloatingBar />
      <Footer />
    </div>
  );
}
