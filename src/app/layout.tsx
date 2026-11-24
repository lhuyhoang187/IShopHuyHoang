import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iShop Huy Hoàng - Điện Thoại Mới 100% & Dịch Vụ Sửa Chữa Chuyên Nghiệp",
  description:
    "Hệ thống bán lẻ điện thoại mới 100% nguyên seal chính hãng Apple, Samsung, Xiaomi, phụ kiện cao cấp, công cụ so sánh máy, tra cứu bảo hành IMEI và đặt lịch sửa chữa lấy ngay.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/PhongChu/PhongChu.css" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
