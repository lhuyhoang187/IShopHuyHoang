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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
