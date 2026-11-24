'use client';

import React from 'react';

// Bảng mã hóa Code 39 chuẩn công nghiệp (1: vạch/khoảng hẹp = 1.5px, 2: vạch/khoảng rộng = 3.8px)
// Mỗi ký tự gồm 9 thành phần: 5 vạch đen (B), 4 khoảng trắng (W) xen kẽ: BWBwBWBwb
const CODE39_ENCODING: Record<string, string> = {
  '0': '101020201',
  '1': '201010102',
  '2': '102010102',
  '3': '202010101',
  '4': '101020102',
  '5': '201020101',
  '6': '102020101',
  '7': '101010202',
  '8': '201010201',
  '9': '102010201',
  'A': '201010102',
  'B': '102010102',
  'C': '202010101',
  'D': '101020102',
  'E': '201020101',
  'F': '102020101',
  'G': '101010202',
  'H': '201010201',
  'I': '102010201',
  'J': '101020201',
  'K': '201010102',
  'L': '102010102',
  'M': '202010101',
  'N': '101020102',
  'O': '201020101',
  'P': '102020101',
  'Q': '101010202',
  'R': '201010201',
  'S': '102010201',
  'T': '101020201',
  'U': '201010102',
  'V': '102010102',
  'W': '202010101',
  'X': '101020102',
  'Y': '201020101',
  'Z': '102020101',
  '-': '101010202',
  '.': '201010101',
  ' ': '102010201',
  '*': '101020201', // Ký tự bắt đầu và kết thúc
};

interface BarcodeProps {
  value: string;
  height?: number;
  barColor?: string;
  className?: string;
}

export function Barcode({
  value,
  height = 44,
  barColor = '#0f172a',
  className = '',
}: BarcodeProps) {
  // Chuẩn hóa chuỗi chỉ gồm ký tự hợp lệ và bọc bởi '*'
  const cleanStr = (value || '0000000000')
    .toUpperCase()
    .replace(/[^0-9A-Z\-\. ]/g, '');
  const encodedText = `*${cleanStr}*`;

  // Tạo mảng các vạch (bar hoặc space)
  const elements: { isBar: boolean; width: number }[] = [];

  // Vạch hẹp = 2, vạch rộng = 4.5
  const narrow = 2;
  const wide = 4.5;
  const interCharGap = 2; // khoảng cách giữa các ký tự

  for (let i = 0; i < encodedText.length; i++) {
    const char = encodedText[i];
    const pattern = CODE39_ENCODING[char] || CODE39_ENCODING['0'];

    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const bit = pattern[j];
      const w = bit === '2' ? wide : narrow;
      elements.push({ isBar, width: w });
    }

    // Khoảng cách giữa các ký tự
    if (i < encodedText.length - 1) {
      elements.push({ isBar: false, width: interCharGap });
    }
  }

  // Tính tổng chiều rộng
  const totalWidth = elements.reduce((acc, el) => acc + el.width, 0);

  let currentX = 0;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      className={`w-full max-w-full overflow-hidden select-none ${className}`}
      style={{ height: `${height}px` }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {elements.map((el, idx) => {
        const x = currentX;
        currentX += el.width;
        if (!el.isBar) return null;
        return (
          <rect
            key={idx}
            x={x}
            y={0}
            width={el.width}
            height={height}
            fill={barColor}
          />
        );
      })}
    </svg>
  );
}
