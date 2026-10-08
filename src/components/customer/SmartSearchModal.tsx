'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Smartphone, Wrench, Headphones, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { IShopStore } from '@/lib/store';
import { formatVND } from '@/lib/vietqr';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartSearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [phones, setPhones] = useState(IShopStore.getPhones());
  const [accessories, setAccessories] = useState(IShopStore.getAccessories());

  useEffect(() => {
    setPhones(IShopStore.getPhones());
    setAccessories(IShopStore.getAccessories());
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { phones: [], accessories: [], repairs: [] };
    const q = query.toLowerCase().trim();

    const matchedPhones = phones.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.specs.chip.toLowerCase().includes(q)
    );

    const matchedAccessories = accessories.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.categoryName.toLowerCase().includes(q)
    );

    // Mock repair keywords
    const repairServices = [
      { name: 'Thay pin iPhone chính hãng Pisen (Bảo hành 12T)', model: 'iPhone 11 - 15 Pro Max', price: 'từ 450.000đ', url: '/repair' },
      { name: 'Ép kính màn hình cảm ứng chân không lấy ngay', model: 'iPhone, Samsung, Xiaomi', price: 'từ 350.000đ', url: '/repair' },
      { name: 'Thay cụm màn hình OLED Zin 120Hz ProMotion', model: 'iPhone 13 - 16 Series', price: 'từ 1.950.000đ', url: '/repair' },
      { name: 'Thay chân sạc Type-C, mic thoại, chuông loa ngoài', model: 'Tất cả dòng máy', price: 'từ 250.000đ', url: '/repair' },
    ];
    const matchedRepairs = repairServices.filter((r) => r.name.toLowerCase().includes(q) || r.model.toLowerCase().includes(q) || 'sửa chữa thay pin ép kính'.includes(q));

    return {
      phones: matchedPhones,
      accessories: matchedAccessories,
      repairs: matchedRepairs,
    };
  }, [query, phones, accessories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-amber-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm điện thoại (iPhone 16 Pro Max...), phụ kiện sạc, dịch vụ sửa chữa..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-base sm:text-lg font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Xóa
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2.5">
                Gợi ý tìm kiếm phổ biến
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'iPhone 16 Pro Max',
                  'Samsung S24 Ultra',
                  'Củ sạc 65W GaN',
                  'Pin Pisen iPhone',
                  'Ép kính màn hình',
                  'Cáp Anker Type-C',
                  'Tai nghe AirPods',
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 transition-colors border border-slate-200 font-medium"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Phones results */}
              {searchResults.phones.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-700 font-bold mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Điện Thoại Mới 100% ({searchResults.phones.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.phones.map((phone) => (
                      <Link
                        key={phone.id}
                        href={`/phones/${phone.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 hover:border-slate-300 group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={phone.colors[0]?.imageUrl}
                            alt={phone.name}
                            className="w-12 h-12 object-cover rounded-xl bg-white p-1 border border-slate-200"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {phone.name}
                            </h4>
                            <p className="text-xs text-slate-500">{phone.specs.chip} • {phone.specs.screen.split(',')[0]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-600 block">
                            {formatVND(phone.capacities[0].price)}
                          </span>
                          <span className="flex items-center text-xs text-slate-500 group-hover:text-amber-600 justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            Xem máy <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessories results */}
              {searchResults.accessories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-700 font-bold mb-2">
                    <Headphones className="w-4 h-4" />
                    <span>Phụ Kiện Chính Hãng ({searchResults.accessories.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.accessories.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/accessories/${acc.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 hover:border-slate-300 group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="w-12 h-12 object-cover rounded-xl bg-white p-1 border border-slate-200"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {acc.name}
                            </h4>
                            <p className="text-xs text-slate-500">{acc.brand} • {acc.categoryName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600">
                            {formatVND(acc.sellingPrice)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Repairs results */}
              {searchResults.repairs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-700 font-bold mb-2">
                    <Wrench className="w-4 h-4" />
                    <span>Dịch Vụ Sửa Chữa Chuyên Nghiệp</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.repairs.map((rep, idx) => (
                      <Link
                        key={idx}
                        href={rep.url}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 hover:border-slate-300 group shadow-sm"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {rep.name}
                          </h4>
                          <p className="text-xs text-slate-500">Áp dụng: {rep.model}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            {rep.price}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.phones.length === 0 &&
                searchResults.accessories.length === 0 &&
                searchResults.repairs.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Không tìm thấy kết quả nào phù hợp với &quot;{query}&quot;</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy thử tìm theo tên máy, hãng (Apple, Samsung), hoặc dịch vụ (thay pin, ép kính).
                    </p>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Gợi ý: Tìm theo tên máy hoặc từ khóa linh kiện sửa chữa</span>
          <span className="hidden sm:inline">Nhấn ESC để đóng</span>
        </div>
      </div>
    </div>
  );
}
