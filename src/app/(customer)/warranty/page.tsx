'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Smartphone,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Award,
  ChevronRight,
  Phone,
  FileText,
  Wrench,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { IShopStore } from '@/lib/store';

export default function WarrantyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 text-xs font-semibold">Đang tải trang tra cứu bảo hành...</div>}>
      <WarrantyContent />
    </Suspense>
  );
}

function WarrantyContent() {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams?.get('q') ||
    searchParams?.get('imei') ||
    searchParams?.get('phone') ||
    searchParams?.get('code') ||
    '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [resultsList, setResultsList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const detectSearchType = (val: string) => {
    const clean = val.trim();
    if (!clean) return null;
    const cleanPhone = clean.replace(/[\s.\-()]/g, '');
    if (/^(03|05|07|08|09)\d{8}$/.test(cleanPhone) || /^\+84/.test(cleanPhone)) {
      return { type: 'phone', label: 'Tra cứu theo Số điện thoại', icon: Phone, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
    }
    if (/^[0-9]{14,18}$/.test(clean)) {
      return { type: 'imei', label: 'Tra cứu theo Số IMEI (15 số)', icon: Smartphone, badgeColor: 'bg-amber-50 text-amber-700 border-amber-300' };
    }
    if (/^HD[-_]?/i.test(clean)) {
      return { type: 'invoice', label: 'Tra cứu theo Mã hóa đơn bán lẻ', icon: FileText, badgeColor: 'bg-sky-50 text-sky-700 border-sky-300' };
    }
    if (/^SC[-_]?/i.test(clean)) {
      return { type: 'repair', label: 'Tra cứu theo Mã phiếu sửa chữa iCare', icon: Wrench, badgeColor: 'bg-purple-50 text-purple-700 border-purple-300' };
    }
    return { type: 'general', label: 'Tra cứu tổng hợp (IMEI / SĐT / Mã phiếu)', icon: Search, badgeColor: 'bg-slate-100 text-slate-700 border-slate-300' };
  };

  const detected = detectSearchType(searchInput);

  const handleSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch || searchInput).trim();
    if (!query) return;
    setSearchedQuery(query);
    setIsLoading(true);
    setNotFound(false);

    try {
      const res = await fetch(`/api/warranty?q=${encodeURIComponent(query)}`);
      const json = await res.json();

      if (res.ok && json.success && Array.isArray(json.items) && json.items.length > 0) {
        setResultsList(json.items);
        setSelectedItem(json.items[0]);
        setNotFound(false);
        return;
      }

      // Local storage fallback
      const localMatches = IShopStore.lookupWarranty(query);
      if (localMatches.length > 0) {
        const formatted = localMatches.map((item) => {
          const soldDate = item.soldAt ? new Date(item.soldAt) : null;
          let isExpired = false;
          let remainingDays = 0;
          let expiryDateString = '';

          if (soldDate && !isNaN(soldDate.getTime())) {
            const expiryDate = new Date(soldDate);
            expiryDate.setMonth(expiryDate.getMonth() + (item.warrantyMonths || 12));
            expiryDateString = expiryDate.toISOString().substring(0, 10);
            const today = new Date();
            remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            isExpired = remainingDays <= 0;
          }

          return {
            type: 'phone',
            found: true,
            id: item.imei,
            imei: item.imei,
            phoneName: item.phoneName,
            color: item.color,
            capacity: item.capacity,
            sellingPrice: item.sellingPrice,
            status: item.status,
            warrantyMonths: item.warrantyMonths,
            soldAt: item.soldAt,
            soldInvoiceId: item.soldInvoiceId,
            soldToCustomerName: item.soldToCustomerName,
            soldToCustomerPhone: item.soldToCustomerPhone,
            expiryDate: expiryDateString,
            remainingDays,
            isExpired,
            warrantyType: 'Bảo hành điện tử chính hãng Apple Việt Nam (AAR)',
            serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức',
          };
        });

        setResultsList(formatted);
        setSelectedItem(formatted[0]);
        setNotFound(false);
        return;
      }

      setResultsList([]);
      setSelectedItem(null);
      setNotFound(true);
    } catch {
      setResultsList([]);
      setSelectedItem(null);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchInput(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const sampleQueries = [
    { type: 'imei', query: '358921104999888', label: 'IMEI: 358921104999888', desc: 'iPhone 16 Pro Max' },
    { type: 'imei', query: '358921104829104', label: 'IMEI: 358921104829104', desc: 'Máy mới nguyên seal' },
    { type: 'phone', query: '0986898197', label: 'SĐT: 0986.898.197', desc: 'Khách hàng 2 máy' },
    { type: 'phone', query: '0912345678', label: 'SĐT: 0912.345.678', desc: 'Phiếu sửa chữa' },
    { type: 'code', query: 'HD-2608-001', label: 'Mã HĐ: HD-2608-001', desc: 'Hóa đơn mua máy' },
    { type: 'code', query: 'SC-2608-001', label: 'Mã Phiếu: SC-2608-001', desc: 'Sửa chữa iCare' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>HỆ THỐNG TRA CỨU BẢO HÀNH ĐIỆN TỬ 2026</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Tra Cứu Bảo Hành Điện Tử
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Tra cứu nhanh bằng <strong>Số IMEI (15 số)</strong>, <strong>Số điện thoại khách hàng</strong> hoặc <strong>Mã phiếu hóa đơn / sửa chữa</strong> để kiểm tra thời hạn và chứng nhận bảo hành chính hãng.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200 shadow-md space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập số IMEI, Số điện thoại hoặc Mã hóa đơn/phiếu SC..."
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-mono text-sm sm:text-base transition-colors"
                maxLength={30}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 text-xs font-bold px-2 py-1"
                >
                  Xóa
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 text-white animate-spin" />
                  <span>Đang tra cứu...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Tra Cứu Ngay</span>
                </>
              )}
            </button>
          </div>

          {/* Dynamic Search Type Auto-Detector Badge */}
          {detected && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Nhận diện phương thức:</span>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${detected.badgeColor}`}>
                <detected.icon className="w-3.5 h-3.5" />
                <span>{detected.label}</span>
              </div>
            </div>
          )}
        </form>

        {/* Quick test sample queries */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-bold block mb-2.5">
            Mẫu tra cứu nhanh để bạn trải nghiệm ngay:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => {
                  setSearchInput(item.query);
                  handleSearch(item.query);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs text-left transition-all font-semibold cursor-pointer"
              >
                <span className="font-mono font-bold text-slate-900">{item.label}</span>
                <span className="text-[10px] text-slate-500 ml-1.5 font-medium">({item.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {searchedQuery && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Multiple Results Switcher List */}
          {resultsList.length > 1 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-sm">
                    Tìm thấy <span className="text-amber-600">{resultsList.length} thiết bị / hồ sơ bảo hành</span> cho từ khóa: &quot;{searchedQuery}&quot;
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Nhấp vào từng máy để xem giấy chứng nhận chi tiết
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultsList.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.type === 'repair' ? (
                            <Wrench className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {item.phoneName}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500">
                          {item.type === 'repair' ? `Mã phiếu: ${item.ticketCode}` : `IMEI: ${item.imei}`}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {item.status === 'sold' || item.type === 'repair' ? (
                          item.isExpired ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-700">
                              Hết hạn
                            </span>
                          ) : (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                              Còn {item.remainingDays} ngày
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-sky-100 text-sky-800">
                            Máy mới
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Item Certificate Display */}
          {selectedItem && (
            <div className="bg-white rounded-3xl p-7 sm:p-9 border border-amber-300 shadow-lg space-y-7 relative overflow-hidden">
              {/* Card top banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shadow-sm shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider block">
                      CHỨNG NHẬN BẢO HÀNH ĐIỆN TỬ CHÍNH HÃNG
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {selectedItem.phoneName}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedItem.type === 'repair' ? `Mã tiếp nhận SC: ${selectedItem.ticketCode}` : `Số IMEI: ${selectedItem.imei}`}
                    </p>
                  </div>
                </div>

                <div>
                  {selectedItem.status === 'sold' || selectedItem.type === 'repair' ? (
                    selectedItem.isExpired ? (
                      <span className="px-4 py-2 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300 inline-block">
                        ĐÃ HẾT HẠN BẢO HÀNH
                      </span>
                    ) : (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                          ✓
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                            BẢO HÀNH CÒN HIỆU LỰC
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            Còn {selectedItem.remainingDays} ngày
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 inline-block">
                      MÁY MỚI 100% CHƯA KÍCH HOẠT
                    </span>
                  )}
                </div>
              </div>

              {/* Warranty Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Phiên bản & Màu sắc:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedItem.color} • Dung lượng {selectedItem.capacity}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Chế độ bảo hành:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedItem.warrantyType}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Ngày mua máy / Tiếp nhận:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedItem.soldAt ? selectedItem.soldAt : 'Chưa xuất bán (Sẵn sàng kích hoạt)'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Ngày hết hạn bảo hành:</span>
                  <p className="text-sm font-bold text-amber-700">
                    {selectedItem.expiryDate ? selectedItem.expiryDate : '12 tháng kể từ ngày kích hoạt bán'}
                  </p>
                </div>

                {selectedItem.soldToCustomerName && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Chủ sở hữu máy:</span>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedItem.soldToCustomerName}{' '}
                      {selectedItem.soldToCustomerPhone && (
                        <span className="text-slate-600 font-mono">
                          ({selectedItem.soldToCustomerPhone.slice(0, 4)}***{selectedItem.soldToCustomerPhone.slice(-3)})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {selectedItem.soldInvoiceId && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Mã chứng từ / Hóa đơn:</span>
                    <p className="text-sm font-bold text-sky-700 font-mono">
                      {selectedItem.soldInvoiceId}
                    </p>
                  </div>
                )}

                {selectedItem.issueDescription && (
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 sm:col-span-2 space-y-1">
                    <span className="text-purple-800 font-bold">Tình trạng tiếp nhận dịch vụ kỹ thuật:</span>
                    <p className="text-slate-700">{selectedItem.issueDescription}</p>
                    {selectedItem.technicianName && (
                      <p className="text-xs text-purple-700 font-semibold pt-1">
                        Kỹ thuật viên phụ trách: {selectedItem.technicianName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Service Center Info */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Trung tâm bảo hành iShop: 168 Đường 3/2, Quận 10 & 45 Lê Văn Việt, TP. Thủ Đức
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-800 font-bold hover:bg-sky-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Phiếu</span>
                  </button>
                  <a
                    href="tel:0988888999"
                    className="font-bold text-slate-900 hover:text-blue-700 shrink-0 font-mono"
                  >
                    Hotline: 0988.888.999
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Not Found View */}
          {notFound && (
            <div className="bg-white rounded-3xl p-9 border border-red-300 text-center space-y-4 shadow-md">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">
                Không Tìm Thấy Thông Tin Bảo Hành Với: &quot;{searchedQuery}&quot;
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                Hệ thống chưa tìm thấy dữ liệu bảo hành tương ứng với số IMEI, số điện thoại hoặc mã phiếu trên. Vui lòng kiểm tra lại:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto text-xs text-slate-700 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">1. Số IMEI:</strong>
                  Bấm <span className="font-mono font-bold text-amber-700">*#06#</span> trên điện thoại để lấy đúng 15 chữ số.
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">2. Số điện thoại:</strong>
                  Dùng đúng số điện thoại đã cung cấp khi mua máy tại quầy thu ngân.
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">3. Mã hóa đơn / phiếu:</strong>
                  Xem góc trên cùng biên nhận mua hàng (HD-...) hoặc phiếu sửa (SC-...).
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide how to check IMEI */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-3 text-xs text-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Hướng dẫn lấy thông tin bảo hành máy nhanh:</span>
        </h3>
        <ol className="list-decimal pl-5 space-y-2 text-slate-600">
          <li><strong>Tra cứu bằng số điện thoại:</strong> Nhập số điện thoại của bạn để xem tất cả các thiết bị Apple & Android từng mua hoặc gửi sửa chữa tại iShop Huy Hoàng.</li>
          <li><strong>Tra cứu bằng IMEI:</strong> Mở ứng dụng <strong>Điện Thoại</strong> và bấm cú pháp: <strong className="text-slate-900 font-mono">*#06#</strong> để xem IMEI ngay lập tức.</li>
          <li><strong>Tra cứu bằng mã phiếu:</strong> Nhập mã phiếu hóa đơn bán hàng (VD: <em>HD-2608-001</em>) hoặc mã phiếu tiếp nhận sửa chữa (VD: <em>SC-2608-001</em>).</li>
        </ol>
      </div>
    </div>
  );
}
