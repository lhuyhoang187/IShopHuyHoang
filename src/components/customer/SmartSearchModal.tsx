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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121826] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm điện thoại (iPhone 16 Pro Max...), phụ kiện sạc, dịch vụ sửa chữa..."
            className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-base sm:text-lg"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded"
            >
              Xóa
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
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
                    className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 text-gray-300 transition-colors border border-white/5"
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400 font-semibold mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Điện Thoại Mới 100% ({searchResults.phones.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.phones.map((phone) => (
                      <Link
                        key={phone.id}
                        href={`/phones/${phone.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={phone.colors[0]?.imageUrl}
                            alt={phone.name}
                            className="w-12 h-12 object-cover rounded-lg bg-black/40 p-1"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {phone.name}
                            </h4>
                            <p className="text-xs text-gray-400">{phone.specs.chip} • {phone.specs.screen.split(',')[0]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-amber-400">
                            {formatVND(phone.capacities[0].price)}
                          </span>
                          <span className="flex items-center text-xs text-blue-400 justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2">
                    <Headphones className="w-4 h-4" />
                    <span>Phụ Kiện Chính Hãng ({searchResults.accessories.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.accessories.map((acc) => (
                      <Link
                        key={acc.id}
                        href={`/accessories/${acc.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="w-12 h-12 object-cover rounded-lg bg-black/40 p-1"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                              {acc.name}
                            </h4>
                            <p className="text-xs text-gray-400">{acc.brand} • {acc.categoryName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-400">
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
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">
                    <Wrench className="w-4 h-4" />
                    <span>Dịch Vụ Sửa Chữa Chuyên Nghiệp</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.repairs.map((rep, idx) => (
                      <Link
                        key={idx}
                        href={rep.url}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 group"
                      >
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                            {rep.name}
                          </h4>
                          <p className="text-xs text-gray-400">Áp dụng: {rep.model}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
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
                  <div className="text-center py-10 text-gray-400">
                    <Search className="w-10 h-10 mx-auto text-gray-500 mb-2 opacity-50" />
                    <p>Không tìm thấy kết quả nào phù hợp với &quot;{query}&quot;</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hãy thử tìm theo tên máy, hãng (Apple, Samsung), hoặc dịch vụ (thay pin, ép kính).
                    </p>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Gợi ý: Tìm theo tên máy hoặc từ khóa linh kiện sửa chữa</span>
          <span className="hidden sm:inline">Nhấn ESC để đóng</span>
        </div>
      </div>
    </div>
  );
}
