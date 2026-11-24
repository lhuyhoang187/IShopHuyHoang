import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
} from '@/ThuVien/KiemTraHopLe';

const STOCK_SELECT = `
  ps.SoIMEI AS imei,
  ps.MaDienThoai AS phoneId,
  ps.MauSac AS color,
  ps.DungLuong AS capacity,
  ps.GiaVon AS costPrice,
  ps.GiaBan AS sellingPrice,
  ps.MaNhaCungCap AS supplierId,
  ps.NgayNhap AS importDate,
  ps.TrangThai AS status,
  ps.SoThangBaoHanh AS warrantyMonths,
  ps.NgayBan AS soldDate,
  ps.SoHoaDonBan AS soldInvoiceId,
  ps.DiemThuong AS pointsReward,
  ps.NgayTao AS createdAt,
  ps.NgayCapNhat AS updatedAt
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let sql = `
      SELECT ${STOCK_SELECT},
             p.TenDienThoai AS phoneName,
             s.TenNhaCungCap AS supplierName,
             c.HoTen AS soldToCustomerName,
             c.SoDienThoai AS soldToCustomerPhone
      FROM KhoDienThoai ps
      LEFT JOIN SanPhamDienThoai p ON ps.MaDienThoai = p.MaDienThoai
      LEFT JOIN NhaCungCap s ON ps.MaNhaCungCap = s.MaNhaCungCap
      LEFT JOIN HoaDon inv ON ps.SoHoaDonBan = inv.SoHoaDon
      LEFT JOIN KhachHang c ON inv.MaKhachHang = c.MaKhachHang
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE ps.TrangThai = ?';
      params.push(status);
    }

    sql += ' ORDER BY ps.NgayTao DESC';

    const items = await db.query(sql, params);

    const inStockCount = items.filter((i) => i.status === 'in_stock').length;
    const soldCount = items.filter((i) => i.status === 'sold').length;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: items.length,
      inStockCount,
      soldCount,
      data: items,
    });
  } catch (error: any) {
    console.error('Phone stock GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn kho máy: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const imei = sanitizeString(body.imei, 50);
    const phoneName = sanitizeString(body.phoneName, 191);
    const color = sanitizeString(body.color, 100);
    const capacity = sanitizeString(body.capacity, 50);
    const sellingPrice = Number(body.sellingPrice);
    const costPrice = Number(body.costPrice || 0);

    if (!imei || !isValidImei(imei)) {
      return NextResponse.json(
        { error: 'Số IMEI không hợp lệ (cần từ 8 đến 25 ký tự chữ và số, không chứa khoảng trắng)' },
        { status: 400 }
      );
    }

    if (!color || !capacity) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ màu sắc và dung lượng' },
        { status: 400 }
      );
    }

    if (!isValidAmount(sellingPrice, false)) {
      return NextResponse.json(
        { error: 'Giá bán của điện thoại phải là số dương hợp lệ' },
        { status: 400 }
      );
    }

    if (!isValidAmount(costPrice, true)) {
      return NextResponse.json(
        { error: 'Giá vốn của điện thoại không được âm' },
        { status: 400 }
      );
    }

    const exists = await db.queryOne('SELECT SoIMEI AS imei FROM KhoDienThoai WHERE SoIMEI = ?', [imei]);
    if (exists) {
      return NextResponse.json(
        { error: `Số IMEI ${imei} đã tồn tại trong hệ thống kho!` },
        { status: 409 }
      );
    }

    let resolvedPhoneId = body.phoneId ? sanitizeString(body.phoneId, 191) : null;
    if (resolvedPhoneId) {
      const found = await db.queryOne('SELECT MaDienThoai AS id FROM SanPhamDienThoai WHERE MaDienThoai = ?', [resolvedPhoneId]);
      if (!found) resolvedPhoneId = null;
    }
    if (!resolvedPhoneId && phoneName) {
      const byName = await db.queryOne('SELECT MaDienThoai AS id FROM SanPhamDienThoai WHERE TenDienThoai LIKE ? LIMIT 1', [`%${phoneName}%`]);
      if (byName) resolvedPhoneId = byName.id;
    }
    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT MaDienThoai AS id FROM SanPhamDienThoai LIMIT 1');
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
    }

    let resolvedSupplierId = body.supplierId ? sanitizeString(body.supplierId, 191) : null;
    if (resolvedSupplierId) {
      const supplierExists = await db.queryOne('SELECT MaNhaCungCap AS id FROM NhaCungCap WHERE MaNhaCungCap = ?', [resolvedSupplierId]);
      if (!supplierExists) resolvedSupplierId = null;
    }
    if (!resolvedSupplierId) {
      const firstSupplier = await db.queryOne('SELECT MaNhaCungCap AS id FROM NhaCungCap LIMIT 1');
      resolvedSupplierId = firstSupplier ? firstSupplier.id : null;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const importDate = body.importDate ? sanitizeString(body.importDate, 50) : now.split(' ')[0];
    const warrantyMonths = Math.max(0, Number(body.warrantyMonths || 12));

    await db.execute(
      `INSERT INTO KhoDienThoai
       (SoIMEI, MaDienThoai, MauSac, DungLuong, GiaVon, GiaBan, MaNhaCungCap, NgayNhap, TrangThai, SoThangBaoHanh, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, NOW(), NOW())`,
      [
        imei,
        resolvedPhoneId,
        color,
        capacity,
        costPrice,
        sellingPrice,
        resolvedSupplierId,
        importDate,
        warrantyMonths,
      ]
    );

    const newItem = await db.queryOne(
      `SELECT ${STOCK_SELECT}, p.TenDienThoai AS phoneName, s.TenNhaCungCap AS supplierName
       FROM KhoDienThoai ps
       LEFT JOIN SanPhamDienThoai p ON ps.MaDienThoai = p.MaDienThoai
       LEFT JOIN NhaCungCap s ON ps.MaNhaCungCap = s.MaNhaCungCap
       WHERE ps.SoIMEI = ?`,
      [imei]
    );

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Nhập máy vào kho thành công',
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Phone stock POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi nhập máy vào kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei')?.trim();

    if (!imei) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp số IMEI cần xóa' },
        { status: 400 }
      );
    }

    const existing = await db.queryOne('SELECT SoIMEI AS imei, TrangThai AS status FROM KhoDienThoai WHERE SoIMEI = ?', [imei]);
    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy máy có số IMEI này trong kho' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM KhoDienThoai WHERE SoIMEI = ?', [imei]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa số IMEI ${imei} khỏi kho CSDL thành công`,
    });
  } catch (error: any) {
    console.error('Phone stock DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa IMEI khỏi kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
