import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { normalizePhone } from '@/ThuVien/KiemTraHopLe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (
    searchParams.get('q') ||
    searchParams.get('query') ||
    searchParams.get('imei') ||
    searchParams.get('phone') ||
    searchParams.get('code') ||
    ''
  ).trim();

  if (!q) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp số IMEI, số điện thoại hoặc mã phiếu cần tra cứu' },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(q);
  const upperCode = q.toUpperCase();

  try {
    const results: any[] = [];
    const seenIds = new Set<string>();

    const phoneStockItems = await db.query(
      `SELECT ps.SoIMEI AS imei, ps.MaDienThoai AS phoneId, ps.MauSac AS color,
              ps.DungLuong AS capacity, ps.GiaBan AS sellingPrice, ps.TrangThai AS status,
              ps.SoThangBaoHanh AS warrantyMonths, ps.NgayBan AS soldAt, ps.SoHoaDonBan AS soldInvoiceId,
              p.TenDienThoai AS phoneName,
              c.HoTen AS soldToCustomerName,
              c.SoDienThoai AS soldToCustomerPhone
       FROM KhoDienThoai ps
       LEFT JOIN SanPhamDienThoai p ON ps.MaDienThoai = p.MaDienThoai
       LEFT JOIN HoaDon inv ON ps.SoHoaDonBan = inv.SoHoaDon
       LEFT JOIN KhachHang c ON inv.MaKhachHang = c.MaKhachHang
       WHERE ps.SoIMEI = ? OR ps.SoIMEI = ? OR c.SoDienThoai = ? OR c.SoDienThoai = ? OR ps.SoHoaDonBan = ? OR ps.SoHoaDonBan = ?
       ORDER BY ps.NgayTao DESC`,
      [q, upperCode, q, normalizedPhone || q, q, upperCode]
    );

    const today = new Date();

    for (const item of phoneStockItems) {
      if (seenIds.has(item.imei)) continue;
      seenIds.add(item.imei);

      let isExpired = false;
      let remainingDays = 0;
      let expiryDateString = '';

      if (item.soldAt) {
        const soldDate = new Date(item.soldAt);
        if (!isNaN(soldDate.getTime())) {
          const expiryDate = new Date(soldDate);
          expiryDate.setMonth(expiryDate.getMonth() + (item.warrantyMonths || 12));
          expiryDateString = expiryDate.toISOString().substring(0, 10);
          remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          isExpired = remainingDays <= 0;
        }
      }

      results.push({
        type: 'phone',
        found: true,
        id: item.imei,
        imei: item.imei,
        phoneName: item.phoneName,
        color: item.color,
        capacity: item.capacity,
        sellingPrice: Number(item.sellingPrice || 0),
        status: item.status,
        warrantyMonths: Number(item.warrantyMonths || 12),
        soldAt: item.soldAt,
        soldInvoiceId: item.soldInvoiceId,
        soldToCustomerName: item.soldToCustomerName,
        soldToCustomerPhone: item.soldToCustomerPhone,
        expiryDate: expiryDateString,
        remainingDays,
        isExpired,
        warrantyType: 'Bảo hành điện tử 12 tháng chính hãng Apple / Nhà phân phối AAR',
        serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức',
      });
    }

    const repairTickets = await db.query(
      `SELECT r.SoPhieuSuaChua AS ticketCode, r.DongMay AS deviceModel, r.SoIMEIHoacSerial AS imeiOrSerial,
              r.TrangThai AS status, r.ThoiGianTiepNhan AS receivedAt, r.ThoiGianBanGiao AS deliveredAt,
              r.MoTaLoi AS issueDescription, r.GhiChuKyThuatVien AS technicianNotes,
              r.ThoiHanBaoHanh AS warrantyPeriod,
              c.HoTen AS customerName,
              c.SoDienThoai AS customerPhone,
              u.HoTen AS technicianName
       FROM PhieuSuaChua r
       LEFT JOIN KhachHang c ON r.MaKhachHang = c.MaKhachHang
       LEFT JOIN NguoiDung u ON r.MaKyThuatVien = u.MaNguoiDung
       WHERE r.SoPhieuSuaChua = ? OR r.SoPhieuSuaChua = ? OR r.SoIMEIHoacSerial = ? OR c.SoDienThoai = ? OR c.SoDienThoai = ?
       ORDER BY r.NgayTao DESC`,
      [q, upperCode, q, q, normalizedPhone || q]
    );

    for (const ticket of repairTickets) {
      if (seenIds.has(ticket.ticketCode)) continue;
      seenIds.add(ticket.ticketCode);

      const baseDate = ticket.deliveredAt ? new Date(ticket.deliveredAt) : new Date(ticket.receivedAt);
      let expiryDateString = '';
      let remainingDays = 0;
      let isExpired = false;

      if (!isNaN(baseDate.getTime())) {
        const expiryDate = new Date(baseDate);
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        expiryDateString = expiryDate.toISOString().substring(0, 10);
        remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        isExpired = remainingDays <= 0;
      }

      results.push({
        type: 'repair',
        found: true,
        id: ticket.ticketCode,
        ticketCode: ticket.ticketCode,
        phoneName: ticket.deviceModel,
        imei: ticket.imeiOrSerial,
        status: ticket.status,
        color: 'Theo máy sửa chữa',
        capacity: 'Tiếp nhận dịch vụ',
        warrantyMonths: 6,
        soldAt: ticket.receivedAt,
        soldInvoiceId: ticket.ticketCode,
        soldToCustomerName: ticket.customerName,
        soldToCustomerPhone: ticket.customerPhone,
        issueDescription: ticket.issueDescription,
        technicianNotes: ticket.technicianNotes,
        technicianName: ticket.technicianName,
        expiryDate: expiryDateString,
        remainingDays,
        isExpired,
        warrantyType: ticket.warrantyPeriod || 'Bảo hành 06 tháng linh kiện & dịch vụ sửa chữa iCare',
        serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức',
      });
    }

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          total: 0,
          message: `Không tìm thấy thông tin bảo hành cho từ khóa "${q}". Vui lòng kiểm tra lại số IMEI (15 số), số điện thoại hoặc mã phiếu hóa đơn/sửa chữa.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      query: q,
      total: results.length,
      data: results[0],
      items: results,
    });
  } catch (error: any) {
    console.error('Warranty query error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
