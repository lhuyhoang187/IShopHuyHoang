-- iShop Huy Hoàng - MySQL Database Schema & DDL
-- Cơ sở dữ liệu chuẩn hóa Dạng chuẩn 3 (3NF) cho WampServer
-- Ngày xuất: 2026-11-24T07:16:41.912Z

CREATE DATABASE IF NOT EXISTS `ishop_huyhoang` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ishop_huyhoang`;

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for table `bienthedienthoai`
DROP TABLE IF EXISTS `bienthedienthoai`;
CREATE TABLE `bienthedienthoai` (
  `MaBienThe` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMauSac` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DungLuong` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaBan` double NOT NULL,
  `GiaGoc` double DEFAULT NULL,
  `HetHang` tinyint(1) NOT NULL DEFAULT '0',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaBienThe`),
  UNIQUE KEY `PhoneVariant_color_cap_key` (`MaMauSac`,`DungLuong`),
  KEY `PhoneVariant_capacity_idx` (`DungLuong`),
  CONSTRAINT `FK_BienTheDienThoai_MauSacDienThoai` FOREIGN KEY (`MaMauSac`) REFERENCES `mausacdienthoai` (`MaMauSac`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `cauhinhcuahang`
DROP TABLE IF EXISTS `cauhinhcuahang`;
CREATE TABLE `cauhinhcuahang` (
  `MaCauHinh` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `TenCuaHang` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'iShop Huy Hoàng',
  `DuongDayNong` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0909.123.456',
  `DiaChi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '45 Lê Văn Việt, TP. Thủ Đức, TP.HCM',
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contact@ishophuyhoang.vn',
  `MaNganHang` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MB',
  `SoTaiKhoan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0988888999',
  `TenTaiKhoan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NGUYEN HUY HOANG',
  `GhiChuBaoHanhMacDinh` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bảo hành điện tử chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DuyetGiamGiaBanHang` tinyint(1) NOT NULL DEFAULT '1',
  `ChanTrangHoaDon` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ChinhSachDoiTra` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaCauHinh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `chitietdonnhaphang`
DROP TABLE IF EXISTS `chitietdonnhaphang`;
CREATE TABLE `chitietdonnhaphang` (
  `MaChiTietNhap` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDonNhap` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiSanPham` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone',
  `MaSanPham` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TenSanPham` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MauSac` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DungLuong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `DonGiaNhap` double NOT NULL,
  `ThanhTien` double NOT NULL,
  `SoIMEI` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaChiTietNhap`),
  KEY `SupplierOrderItem_orderCode_idx` (`SoDonNhap`),
  KEY `SupplierOrderItem_productId_idx` (`MaSanPham`),
  KEY `SupplierOrderItem_imei_idx` (`SoIMEI`),
  CONSTRAINT `FK_ChiTietDonNhapHang_DonNhapHang` FOREIGN KEY (`SoDonNhap`) REFERENCES `donnhaphang` (`SoDonNhap`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `chitiethoadon`
DROP TABLE IF EXISTS `chitiethoadon`;
CREATE TABLE `chitiethoadon` (
  `MaChiTiet` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoHoaDon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiSanPham` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaSanPham` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TenSanPham` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoIMEI` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MauSac` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DungLuong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DonGia` double NOT NULL,
  `GiaVon` double NOT NULL DEFAULT '0',
  `SoLuong` int NOT NULL DEFAULT '1',
  `GiamGia` double NOT NULL DEFAULT '0',
  `ThanhTien` double NOT NULL,
  `SoThangBaoHanh` int NOT NULL DEFAULT '12',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaChiTiet`),
  KEY `InvoiceItem_invoiceCode_idx` (`SoHoaDon`),
  KEY `InvoiceItem_productId_idx` (`MaSanPham`),
  KEY `InvoiceItem_imei_idx` (`SoIMEI`),
  CONSTRAINT `FK_ChiTietHoaDon_HoaDon` FOREIGN KEY (`SoHoaDon`) REFERENCES `hoadon` (`SoHoaDon`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `danhmuclinhkien`
DROP TABLE IF EXISTS `danhmuclinhkien`;
CREATE TABLE `danhmuclinhkien` (
  `MaDanhMuc` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDanhMuc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaDanhMuc`),
  UNIQUE KEY `SparePartCategory_code_key` (`MaCode`),
  KEY `SparePartCategory_code_idx` (`MaCode`),
  KEY `SparePartCategory_isActive_idx` (`DangHoatDong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `danhmucmausac`
DROP TABLE IF EXISTS `danhmucmausac`;
CREATE TABLE `danhmucmausac` (
  `MaMauDanhMuc` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenMau` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMauHex` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#222222',
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `NgayCapNhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaMauDanhMuc`),
  UNIQUE KEY `name` (`TenMau`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `danhmucphukien`
DROP TABLE IF EXISTS `danhmucphukien`;
CREATE TABLE `danhmucphukien` (
  `MaDanhMuc` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDanhMuc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `BieuTuong` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaDanhMuc`),
  UNIQUE KEY `AccessoryCategory_code_key` (`MaCode`),
  KEY `AccessoryCategory_code_idx` (`MaCode`),
  KEY `AccessoryCategory_isActive_idx` (`DangHoatDong`),
  KEY `AccessoryCategory_displayOrder_idx` (`ThuTuHienThi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `dichvusuachua`
DROP TABLE IF EXISTS `dichvusuachua`;
CREATE TABLE `dichvusuachua` (
  `MaDichVu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDichVu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DanhMuc` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaThuongHieu` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CacDongMay` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaDichVu` double NOT NULL,
  `GiaGoc` double DEFAULT NULL,
  `ThoiHanBaoHanh` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '12 Tháng',
  `ThoiGianDuKienPhut` int NOT NULL DEFAULT '30',
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `DichVuNoiBat` tinyint(1) NOT NULL DEFAULT '0',
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaDichVu`),
  KEY `RepairService_category_idx` (`DanhMuc`),
  KEY `RepairService_isActive_idx` (`DangHoatDong`),
  KEY `RepairService_isFeatured_idx` (`DichVuNoiBat`),
  KEY `RepairService_brandId_idx` (`MaThuongHieu`),
  CONSTRAINT `FK_DichVuSuaChua_ThuongHieuDienThoai` FOREIGN KEY (`MaThuongHieu`) REFERENCES `thuonghieudienthoai` (`MaThuongHieu`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `donnhaphang`
DROP TABLE IF EXISTS `donnhaphang`;
CREATE TABLE `donnhaphang` (
  `MaDonNhap` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDonNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaNhaCungCap` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TomTatSanPham` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `TongTien` double NOT NULL,
  `DaThanhToan` double NOT NULL,
  `ConNo` double NOT NULL,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaDonNhap`),
  UNIQUE KEY `SupplierOrder_orderCode_key` (`SoDonNhap`),
  KEY `SupplierOrder_supplierId_idx` (`MaNhaCungCap`),
  KEY `SupplierOrder_date_idx` (`NgayNhap`),
  KEY `SupplierOrder_status_idx` (`TrangThai`),
  KEY `SupplierOrder_createdAt_idx` (`NgayTao`),
  CONSTRAINT `FK_DonNhapHang_NhaCungCap` FOREIGN KEY (`MaNhaCungCap`) REFERENCES `nhacungcap` (`MaNhaCungCap`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `hoadon`
DROP TABLE IF EXISTS `hoadon`;
CREATE TABLE `hoadon` (
  `MaHoaDon` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoHoaDon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhachHang` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TamTinh` double NOT NULL,
  `GiamGia` double NOT NULL DEFAULT '0',
  `TongTien` double NOT NULL,
  `PhuongThucThanhToan` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `TienKhachDua` double DEFAULT NULL,
  `TienThua` double DEFAULT NULL,
  `TenThuNgan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `GhiChuBaoHanh` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `GhiChuDuyet` text COLLATE utf8mb4_unicode_ci,
  `NgayDuyet` datetime(3) DEFAULT NULL,
  `NguoiDuyet` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TienCoc` double DEFAULT NULL,
  `PhanTramCoc` double DEFAULT NULL,
  `NgayGiaoDuKien` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LaDonLon` tinyint(1) NOT NULL DEFAULT '0',
  `LaDonDatTruoc` tinyint(1) NOT NULL DEFAULT '0',
  `DiemTichDuoc` int NOT NULL DEFAULT '0',
  `TienConLai` double DEFAULT NULL,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  PRIMARY KEY (`MaHoaDon`),
  UNIQUE KEY `Invoice_invoiceCode_key` (`SoHoaDon`),
  KEY `Invoice_paymentMethod_idx` (`PhuongThucThanhToan`),
  KEY `Invoice_createdAt_idx` (`NgayTao`),
  KEY `Invoice_status_idx` (`TrangThai`),
  KEY `Invoice_customerId_idx` (`MaKhachHang`),
  CONSTRAINT `FK_HoaDon_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `khachhang`
DROP TABLE IF EXISTS `khachhang`;
CREATE TABLE `khachhang` (
  `MaKhachHang` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiaChi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TongChiTieu` double NOT NULL DEFAULT '0',
  `DiemTichLuy` int NOT NULL DEFAULT '0',
  `SoLanMua` int NOT NULL DEFAULT '0',
  `SoLanSuaChua` int NOT NULL DEFAULT '0',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `AnhDaiDien` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `NgaySinh` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThanhPho` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'TP. Hồ Chí Minh',
  `LoaiKhachHang` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Khách lẻ',
  `GioiTinh` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'male',
  `HangThanhVien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Chưa xếp hạng',
  `GhiChu` text COLLATE utf8mb4_unicode_ci,
  `MatKhau` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaSoThue` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaKhachHang`),
  UNIQUE KEY `Customer_phone_key` (`SoDienThoai`),
  KEY `Customer_phone_idx` (`SoDienThoai`),
  KEY `Customer_name_idx` (`HoTen`),
  KEY `Customer_points_idx` (`DiemTichLuy`),
  KEY `Customer_totalSpent_idx` (`TongChiTieu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `khodienthoai`
DROP TABLE IF EXISTS `khodienthoai`;
CREATE TABLE `khodienthoai` (
  `SoIMEI` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaDienThoai` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MauSac` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DungLuong` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaVon` double NOT NULL,
  `GiaBan` double NOT NULL,
  `MaNhaCungCap` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_stock',
  `SoThangBaoHanh` int NOT NULL DEFAULT '12',
  `NgayBan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoHoaDonBan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DiemThuong` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`SoIMEI`),
  KEY `PhoneStock_phoneId_idx` (`MaDienThoai`),
  KEY `PhoneStock_supplierId_idx` (`MaNhaCungCap`),
  KEY `PhoneStock_status_idx` (`TrangThai`),
  KEY `PhoneStock_soldInvoiceId_idx` (`SoHoaDonBan`),
  KEY `PhoneStock_importDate_idx` (`NgayNhap`),
  CONSTRAINT `FK_KhoDienThoai_HoaDon` FOREIGN KEY (`SoHoaDonBan`) REFERENCES `hoadon` (`SoHoaDon`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_KhoDienThoai_NhaCungCap` FOREIGN KEY (`MaNhaCungCap`) REFERENCES `nhacungcap` (`MaNhaCungCap`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_KhoDienThoai_SanPhamDienThoai` FOREIGN KEY (`MaDienThoai`) REFERENCES `sanphamdienthoai` (`MaDienThoai`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `khuyenmai`
DROP TABLE IF EXISTS `khuyenmai`;
CREATE TABLE `khuyenmai` (
  `MaKhuyenMai` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiKhuyenMai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'campaign',
  `MaGiamGia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TieuDe` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `NhanHienThi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LoaiGiamGia` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `GiaTriGiam` double NOT NULL DEFAULT '0',
  `DonToiThieu` double NOT NULL DEFAULT '0',
  `NgayBatDau` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayKetThuc` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `DanhMucApDung` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `KieuBanner` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DuLieuQR` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaKhuyenMai`),
  UNIQUE KEY `Promotion_code_key` (`MaGiamGia`),
  KEY `Promotion_type_active_idx` (`LoaiKhuyenMai`,`DangHoatDong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `lichhensuachua`
DROP TABLE IF EXISTS `lichhensuachua`;
CREATE TABLE `lichhensuachua` (
  `MaLichHen` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoLichHen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhachHang` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DongMay` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDichVu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayHen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GioHen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` text COLLATE utf8mb4_unicode_ci,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `SoPhieuSuaChua` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ChiNhanh` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaLichHen`),
  UNIQUE KEY `RepairBooking_bookingCode_key` (`SoLichHen`),
  KEY `RepairBooking_bookingCode_idx` (`SoLichHen`),
  KEY `RepairBooking_status_idx` (`TrangThai`),
  KEY `RepairBooking_appointmentDate_idx` (`NgayHen`),
  KEY `FK_LichHenSuaChua_KhachHang` (`MaKhachHang`),
  KEY `FK_LichHenSuaChua_PhieuSuaChua` (`SoPhieuSuaChua`),
  CONSTRAINT `FK_LichHenSuaChua_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_LichHenSuaChua_PhieuSuaChua` FOREIGN KEY (`SoPhieuSuaChua`) REFERENCES `phieusuachua` (`SoPhieuSuaChua`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `lichsutrangthaisuachua`
DROP TABLE IF EXISTS `lichsutrangthaisuachua`;
CREATE TABLE `lichsutrangthaisuachua` (
  `MaLichSu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoPhieuSuaChua` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenTrangThai` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChu` text COLLATE utf8mb4_unicode_ci,
  `NguoiCapNhat` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaLichSu`),
  KEY `RepairStatusHistory_ticketCode_idx` (`SoPhieuSuaChua`),
  KEY `RepairStatusHistory_status_idx` (`TrangThai`),
  KEY `RepairStatusHistory_createdAt_idx` (`NgayTao`),
  CONSTRAINT `FK_LichSuTrangThai_PhieuSuaChua` FOREIGN KEY (`SoPhieuSuaChua`) REFERENCES `phieusuachua` (`SoPhieuSuaChua`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `linhkienphieusuachua`
DROP TABLE IF EXISTS `linhkienphieusuachua`;
CREATE TABLE `linhkienphieusuachua` (
  `MaChiTietLinhKien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoPhieuSuaChua` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLinhKien` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `GiaVon` double NOT NULL DEFAULT '0',
  `DonGia` double NOT NULL,
  `SoThangBaoHanh` int NOT NULL DEFAULT '6',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaChiTietLinhKien`),
  KEY `RepairTicketPart_ticketCode_idx` (`SoPhieuSuaChua`),
  KEY `RepairTicketPart_sparePartId_idx` (`MaLinhKien`),
  CONSTRAINT `FK_LinhKienPhieuSuaChua_LinhKienSuaChua` FOREIGN KEY (`MaLinhKien`) REFERENCES `linhkiensuachua` (`MaLinhKien`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_LinhKienPhieuSuaChua_PhieuSuaChua` FOREIGN KEY (`SoPhieuSuaChua`) REFERENCES `phieusuachua` (`SoPhieuSuaChua`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `linhkiensuachua`
DROP TABLE IF EXISTS `linhkiensuachua`;
CREATE TABLE `linhkiensuachua` (
  `MaLinhKien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLinhKien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaDanhMuc` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaVach` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaVon` double NOT NULL,
  `GiaThayThe` double NOT NULL,
  `TonKho` int NOT NULL DEFAULT '0',
  `DonViTinh` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cái',
  `SoThangBaoHanh` int NOT NULL DEFAULT '6',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaLinhKien`),
  UNIQUE KEY `SparePart_barcode_key` (`MaVach`),
  KEY `SparePart_barcode_idx` (`MaVach`),
  KEY `SparePart_stock_idx` (`TonKho`),
  KEY `SparePart_categoryId_idx` (`MaDanhMuc`),
  CONSTRAINT `FK_LinhKienSuaChua_DanhMucLinhKien` FOREIGN KEY (`MaDanhMuc`) REFERENCES `danhmuclinhkien` (`MaDanhMuc`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `mausacdienthoai`
DROP TABLE IF EXISTS `mausacdienthoai`;
CREATE TABLE `mausacdienthoai` (
  `MaMauSac` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaDienThoai` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenMau` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaMauHex` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2B2B2B',
  `HinhAnh` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaMauSac`),
  UNIQUE KEY `PhoneColor_phoneId_name_key` (`MaDienThoai`,`TenMau`),
  KEY `PhoneColor_phoneId_idx` (`MaDienThoai`),
  CONSTRAINT `FK_MauSacDienThoai_SanPhamDienThoai` FOREIGN KEY (`MaDienThoai`) REFERENCES `sanphamdienthoai` (`MaDienThoai`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `nguoidung`
DROP TABLE IF EXISTS `nguoidung`;
CREATE TABLE `nguoidung` (
  `MaNguoiDung` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDangNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MatKhau` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `VaiTro` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cashier',
  `AnhDaiDien` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `SoDienThoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DiaChi` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `GioiThieu` text COLLATE utf8mb4_unicode_ci,
  `NgaySinh` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PhongBan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaNguoiDung`),
  UNIQUE KEY `User_username_key` (`TenDangNhap`),
  UNIQUE KEY `User_email_key` (`Email`),
  KEY `User_role_idx` (`VaiTro`),
  KEY `User_isActive_idx` (`DangHoatDong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `nhacungcap`
DROP TABLE IF EXISTS `nhacungcap`;
CREATE TABLE `nhacungcap` (
  `MaNhaCungCap` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenNhaCungCap` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoDienThoai` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DiaChi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NguoiLienHe` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TongGiaTriNhap` double NOT NULL DEFAULT '0',
  `CongNoHienTai` double NOT NULL DEFAULT '0',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaNhaCungCap`),
  KEY `Supplier_name_idx` (`TenNhaCungCap`),
  KEY `Supplier_phone_idx` (`SoDienThoai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phanquyenvaitro`
DROP TABLE IF EXISTS `phanquyenvaitro`;
CREATE TABLE `phanquyenvaitro` (
  `MaQuyen` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PhanHe` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NhomChucNang` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `QuyenQuanTri` tinyint(1) NOT NULL DEFAULT '1',
  `QuyenKyThuat` tinyint(1) NOT NULL DEFAULT '0',
  `QuyenThuNgan` tinyint(1) NOT NULL DEFAULT '0',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaQuyen`),
  KEY `RolePermission_category_idx` (`NhomChucNang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `phieusuachua`
DROP TABLE IF EXISTS `phieusuachua`;
CREATE TABLE `phieusuachua` (
  `MaPhieuSuaChua` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoPhieuSuaChua` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaKhachHang` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DongMay` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoIMEIHoacSerial` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MatKhauMoKhoa` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TinhTrangNgoaiHinh` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `PhuKienKemTheo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTaLoi` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `GhiChuKyThuatVien` text COLLATE utf8mb4_unicode_ci,
  `TrangThai` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `TienCong` double NOT NULL DEFAULT '0',
  `TongTien` double NOT NULL DEFAULT '0',
  `NgayTraDuKien` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThoiGianTiepNhan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThoiGianBanGiao` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaKyThuatVien` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThoiHanBaoHanh` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NguoiPhanCong` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HanXuLyPhut` int DEFAULT '60',
  `ThoiHanHoanThanh` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaPhieuSuaChua`),
  UNIQUE KEY `RepairTicket_ticketCode_key` (`SoPhieuSuaChua`),
  KEY `RepairTicket_status_idx` (`TrangThai`),
  KEY `RepairTicket_imeiOrSerial_idx` (`SoIMEIHoacSerial`),
  KEY `RepairTicket_technicianId_idx` (`MaKyThuatVien`),
  KEY `RepairTicket_createdAt_idx` (`NgayTao`),
  KEY `RepairTicket_customerId_idx` (`MaKhachHang`),
  CONSTRAINT `FK_PhieuSuaChua_KhachHang` FOREIGN KEY (`MaKhachHang`) REFERENCES `khachhang` (`MaKhachHang`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_PhieuSuaChua_NguoiDung` FOREIGN KEY (`MaKyThuatVien`) REFERENCES `nguoidung` (`MaNguoiDung`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sanphamdienthoai`
DROP TABLE IF EXISTS `sanphamdienthoai`;
CREATE TABLE `sanphamdienthoai` (
  `MaDienThoai` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDienThoai` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DuongDan` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaThuongHieu` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `DanhGia` double NOT NULL DEFAULT '5',
  `SoLuotDanhGia` int NOT NULL DEFAULT '0',
  `SanPhamNoiBat` tinyint(1) NOT NULL DEFAULT '0',
  `SanPhamMoi` tinyint(1) NOT NULL DEFAULT '0',
  `ManHinh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ChipXuLy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Ram` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `BoNhoTrong` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CameraSau` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CameraTruoc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DungLuongPin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CongNgheSac` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HeDieuHanh` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Sim` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `KhangNuoc` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrongLuong` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThongTinBaoHanh` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaDienThoai`),
  UNIQUE KEY `PhoneProduct_slug_key` (`DuongDan`),
  KEY `PhoneProduct_isHot_idx` (`SanPhamNoiBat`),
  KEY `PhoneProduct_isNew_idx` (`SanPhamMoi`),
  KEY `PhoneProduct_createdAt_idx` (`NgayTao`),
  KEY `PhoneProduct_brandId_idx` (`MaThuongHieu`),
  CONSTRAINT `FK_SanPhamDienThoai_ThuongHieuDienThoai` FOREIGN KEY (`MaThuongHieu`) REFERENCES `thuonghieudienthoai` (`MaThuongHieu`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sanphamphukien`
DROP TABLE IF EXISTS `sanphamphukien`;
CREATE TABLE `sanphamphukien` (
  `MaPhuKien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenPhuKien` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DuongDan` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaDanhMuc` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaVach` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThuongHieu` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiaVon` double NOT NULL,
  `GiaBan` double NOT NULL,
  `GiaGoc` double NOT NULL,
  `TonKho` int NOT NULL DEFAULT '0',
  `CanhBaoTonToiThieu` int NOT NULL DEFAULT '5',
  `HinhAnh` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThongSo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `TuongThich` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `GiamGiaKhiMuaKem` int NOT NULL DEFAULT '15',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `DiemDoiQua` int DEFAULT NULL,
  `DiemThuong` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`MaPhuKien`),
  UNIQUE KEY `AccessoryProduct_slug_key` (`DuongDan`),
  UNIQUE KEY `AccessoryProduct_barcode_key` (`MaVach`),
  KEY `AccessoryProduct_brand_idx` (`ThuongHieu`),
  KEY `AccessoryProduct_barcode_idx` (`MaVach`),
  KEY `AccessoryProduct_stock_idx` (`TonKho`),
  KEY `AccessoryProduct_categoryId_idx` (`MaDanhMuc`),
  CONSTRAINT `FK_SanPhamPhuKien_DanhMucPhuKien` FOREIGN KEY (`MaDanhMuc`) REFERENCES `danhmucphukien` (`MaDanhMuc`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `soquy`
DROP TABLE IF EXISTS `soquy`;
CREATE TABLE `soquy` (
  `MaPhieu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaCodePhieu` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayGiaoDich` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiPhieu` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HangMuc` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoTien` double NOT NULL,
  `PhuongThucThanhToan` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaThamChieu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `NguoiTao` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaPhieu`),
  UNIQUE KEY `CashbookEntry_code_key` (`MaCodePhieu`),
  KEY `CashbookEntry_date_idx` (`NgayGiaoDich`),
  KEY `CashbookEntry_type_idx` (`LoaiPhieu`),
  KEY `CashbookEntry_category_idx` (`HangMuc`),
  KEY `CashbookEntry_referenceCode_idx` (`MaThamChieu`),
  KEY `CashbookEntry_createdAt_idx` (`NgayTao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `thuonghieudienthoai`
DROP TABLE IF EXISTS `thuonghieudienthoai`;
CREATE TABLE `thuonghieudienthoai` (
  `MaThuongHieu` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenThuongHieu` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DuongDan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Logo` text COLLATE utf8mb4_unicode_ci,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `QuocGia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaThuongHieu`),
  UNIQUE KEY `PhoneBrand_name_key` (`TenThuongHieu`),
  UNIQUE KEY `PhoneBrand_slug_key` (`DuongDan`),
  KEY `PhoneBrand_slug_idx` (`DuongDan`),
  KEY `PhoneBrand_isActive_idx` (`DangHoatDong`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `tuongthichlinhkien`
DROP TABLE IF EXISTS `tuongthichlinhkien`;
CREATE TABLE `tuongthichlinhkien` (
  `MaTuongThich` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaLinhKien` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DongMay` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaTuongThich`),
  UNIQUE KEY `SparePartCompat_part_model_key` (`MaLinhKien`,`DongMay`),
  KEY `SparePartCompat_part_idx` (`MaLinhKien`),
  CONSTRAINT `FK_TuongThichLinhKien_LinhKienSuaChua` FOREIGN KEY (`MaLinhKien`) REFERENCES `linhkiensuachua` (`MaLinhKien`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `tuychondatlichsuachua`
DROP TABLE IF EXISTS `tuychondatlichsuachua`;
CREATE TABLE `tuychondatlichsuachua` (
  `MaTuyChon` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiTuyChon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaThuongHieu` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TenHienThi` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NhanPhu` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MoTa` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `BieuTuong` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ThuTuHienThi` int NOT NULL DEFAULT '0',
  `DangHoatDong` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `NgayCapNhat` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`MaTuyChon`),
  KEY `RepairBookingOption_type_idx` (`LoaiTuyChon`),
  KEY `RepairBookingOption_brandId_idx` (`MaThuongHieu`),
  CONSTRAINT `FK_TuyChonDatLich_ThuongHieuDienThoai` FOREIGN KEY (`MaThuongHieu`) REFERENCES `thuonghieudienthoai` (`MaThuongHieu`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
