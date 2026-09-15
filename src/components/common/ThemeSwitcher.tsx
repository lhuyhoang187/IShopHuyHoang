'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

export interface ThemeOption {
  id: 'titanium' | 'cobalt' | 'mocha' | 'teal' | 'cream' | 'dusk';
  name: string;
  sub: string;
  tag: string;
  dotColor: string;
  previewGradient: string;
  textColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'titanium',
    name: 'Titanium Desert Gold',
    sub: 'Sắc Titan Sa Mạc ánh kim cao cấp (Chuẩn iPhone 16 & Video)',
    tag: 'ĐẸP NHẤT • MẶC ĐỊNH',
    dotColor: '#e2b774',
    previewGradient: 'from-[#0e0b08] via-[#241a12] to-[#e2b774]',
    textColor: 'text-amber-300',
  },
  {
    id: 'cobalt',
    name: 'Cosmic Royal Cobalt',
    sub: 'Sắc xanh lam hoàng gia / Sapphire vũ trụ',
    tag: 'SAPPHIRE TECH',
    dotColor: '#6366f1',
    previewGradient: 'from-[#111c44] via-[#312e81] to-[#38bdf8]',
    textColor: 'text-indigo-300',
  },
  {
    id: 'mocha',
    name: 'Mocha Velvet',
    sub: 'Sắc nâu cà phê cacao ấm áp & quý phái',
    tag: 'WARM COCOA',
    dotColor: '#f43f5e',
    previewGradient: 'from-[#2d1a25] via-[#4c1d35] to-[#f43f5e]',
    textColor: 'text-rose-300',
  },
  {
    id: 'teal',
    name: 'Transformative Teal',
    sub: 'Sắc xanh ngọc biển sâu WGSN 2026',
    tag: 'KEY COLOR 2026',
    dotColor: '#14b8a6',
    previewGradient: 'from-[#0a2e35] via-[#134e5a] to-[#14b8a6]',
    textColor: 'text-teal-300',
  },
  {
    id: 'cream',
    name: 'Titanium Desert Cream',
    sub: 'Màu kem sa mạc ánh kim (Sáng sang trọng)',
    tag: 'APPLE LUXURY',
    dotColor: '#e2b774',
    previewGradient: 'from-[#f6f3ed] via-[#fef08a] to-[#e2b774]',
    textColor: 'text-amber-300',
  },
  {
    id: 'dusk',
    name: 'Future Dusk',
    sub: 'Sắc xanh đêm chạng vạng vũ trụ huyền ảo',
    tag: 'MIDNIGHT SLATE',
    dotColor: '#818cf8',
    previewGradient: 'from-[#121a33] via-[#1e293b] to-[#818cf8]',
    textColor: 'text-blue-300',
  },
];

export default function ThemeSwitcher({
  className = '',
  dropDirection = 'auto',
  buttonRounded = 'rounded-2xl',
}: {
  className?: string;
  dropDirection?: 'up' | 'down' | 'auto';
  buttonRounded?: string;
}) {
  const [currentTheme, setCurrentTheme] = useState<string>('titanium');
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(dropDirection === 'up');
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Đọc theme đã lưu hoặc mặc định là 'titanium'
    const saved = localStorage.getItem('ishop_theme') || 'titanium';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

    const listener = () => {
      const active = localStorage.getItem('ishop_theme') || 'titanium';
      setCurrentTheme(active);
      document.documentElement.setAttribute('data-theme', active);
    };

    window.addEventListener('ishop_theme_changed', listener);
    return () => window.removeEventListener('ishop_theme_changed', listener);
  }, []);

  const selectTheme = (themeId: string) => {
    localStorage.setItem('ishop_theme', themeId);
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    window.dispatchEvent(new Event('ishop_theme_changed'));
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      if (dropDirection === 'up') {
        setOpenUpwards(true);
      } else if (dropDirection === 'down') {
        setOpenUpwards(false);
      } else {
        // Tự động phát hiện khoảng trống bên dưới
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 420);
      }
    }
    setIsOpen(!isOpen);
  };

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="Bấm để đổi màu nền xu hướng 2026"
        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 ${buttonRounded} bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-amber-400/50 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:scale-105 active:scale-95`}
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
          style={{ backgroundColor: activeOption.dotColor }}
        />
        <span className="hidden sm:inline font-black text-xs tracking-wide">
          Bảng Màu 2026:
        </span>
        <span className={`text-xs font-black ${activeOption.textColor}`}>
          {activeOption.name.split(' ')[0]}
        </span>
        <Palette className="w-4 h-4 text-amber-300 opacity-80" />
      </button>

      {/* Popover Menu with trending palettes (Hỗ trợ mở hướng lên hoặc xuống thông minh) */}
      {isOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`absolute right-0 w-80 sm:w-96 rounded-3xl bg-[#140e0a]/95 backdrop-blur-3xl border border-amber-500/30 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-in fade-in duration-200 text-white space-y-2 ${
              openUpwards
                ? 'bottom-full mb-3 slide-in-from-bottom-3'
                : 'top-full mt-3 slide-in-from-top-3'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 font-black text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>CHỌN BẢNG MÀU XU HƯỚNG 2026</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono font-semibold">Tức thì 0s</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => selectTheme(theme.id)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all group ${
                      isSelected
                        ? 'bg-white/[0.14] border border-amber-400/60 shadow-lg'
                        : 'hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Color Preview Swatch */}
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.previewGradient} border border-white/30 shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors">
                            {theme.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-white/10 text-gray-200 border border-white/15">
                            {theme.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 font-medium mt-0.5 leading-snug">
                          {theme.sub}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(226,183,116,0.6)]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 px-3 py-1 text-[11px] text-gray-400 text-center font-medium">
              💡 Bạn có thể bấm chọn thử từng màu để xem giao diện đổi màu ngay lập tức!
            </div>
          </div>
        </>
      )}
    </div>
  );
}
