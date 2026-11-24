import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/about", destination: "/GioiThieu", permanent: false },
      { source: "/accessories", destination: "/PhuKien", permanent: false },
      { source: "/accessories/:DuongDan", destination: "/PhuKien/:DuongDan", permanent: false },
      { source: "/account", destination: "/TaiKhoan", permanent: false },
      { source: "/cart", destination: "/GioHang", permanent: false },
      { source: "/checkout", destination: "/ThanhToan", permanent: false },
      { source: "/compare", destination: "/SoSanh", permanent: false },
      { source: "/phones", destination: "/DienThoai", permanent: false },
      { source: "/phones/:DuongDan", destination: "/DienThoai/:DuongDan", permanent: false },
      { source: "/repair", destination: "/SuaChua", permanent: false },
      { source: "/repair/tracking", destination: "/SuaChua/TheoDoi", permanent: false },
      { source: "/warranty", destination: "/BaoHanh", permanent: false },
      { source: "/login", destination: "/DangNhap", permanent: false },
      { source: "/register", destination: "/DangKy", permanent: false },
      { source: "/admin", destination: "/QuanTri", permanent: false },
      { source: "/admin/inventory/phones", destination: "/QuanTri/KhoHang/DienThoai", permanent: false },
      { source: "/admin/inventory/accessories", destination: "/QuanTri/KhoHang/PhuKien", permanent: false },
      { source: "/admin/inventory/spare-parts", destination: "/QuanTri/KhoHang/LinhKien", permanent: false },
      { source: "/admin/partners", destination: "/QuanTri/DoiTac", permanent: false },
      { source: "/admin/pos", destination: "/QuanTri/BanHang", permanent: false },
      { source: "/admin/profile", destination: "/QuanTri/HoSo", permanent: false },
      { source: "/admin/promotions", destination: "/QuanTri/KhuyenMai", permanent: false },
      { source: "/admin/repairs", destination: "/QuanTri/SuaChua", permanent: false },
      { source: "/admin/restock", destination: "/QuanTri/NhapKho", permanent: false },
      { source: "/admin/settings", destination: "/QuanTri/CauHinh", permanent: false },
      { source: "/admin/staff", destination: "/QuanTri/NhanSu", permanent: false },
      { source: "/api/uploads/:TenTep", destination: "/Api/TepTaiLen/:TenTep", permanent: false },
    ];
  },
};

export default nextConfig;
