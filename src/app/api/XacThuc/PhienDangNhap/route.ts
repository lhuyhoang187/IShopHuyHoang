import { NextRequest, NextResponse } from 'next/server';
import { db, SERVER_BOOT_ID } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = sanitizeString(searchParams.get('staffId') || '', 64);
    const staffUsername = sanitizeString(searchParams.get('staffUsername') || '', 64).toLowerCase();
    const customerId = sanitizeString(searchParams.get('customerId') || '', 64);
    const customerPhone = sanitizeString(searchParams.get('customerPhone') || '', 30);
    const customerEmail = sanitizeString(searchParams.get('customerEmail') || '', 100).toLowerCase();

    let staffValid = false;
    let staffUser: any = null;

    if (staffId || staffUsername) {
      let row: any = null;
      if (staffId) {
        row = await db.queryOne(
          'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro, AnhDaiDien, DangHoatDong FROM NguoiDung WHERE MaNguoiDung = ?',
          [staffId]
        );
      }
      if (!row && staffUsername) {
        row = await db.queryOne(
          'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro, AnhDaiDien, DangHoatDong FROM NguoiDung WHERE LOWER(TenDangNhap) = ?',
          [staffUsername]
        );
      }
      if (row && Number(row.DangHoatDong) === 1 && row.VaiTro !== 'pending') {
        staffValid = true;
        staffUser = {
          id: row.MaNguoiDung,
          username: row.TenDangNhap,
          name: row.HoTen,
          role: row.VaiTro,
          avatar: row.AnhDaiDien || undefined,
        };
      }
    }

    let customerValid = false;
    let customerUser: any = null;

    if (customerId || customerPhone || customerEmail) {
      let row: any = null;
      if (customerId) {
        row = await db.queryOne('SELECT * FROM KhachHang WHERE MaKhachHang = ?', [customerId]);
      }
      if (!row && customerPhone) {
        row = await db.queryOne('SELECT * FROM KhachHang WHERE SoDienThoai = ?', [customerPhone]);
      }
      if (!row && customerEmail) {
        row = await db.queryOne('SELECT * FROM KhachHang WHERE LOWER(Email) = ?', [customerEmail]);
      }
      if (row) {
        customerValid = true;
        customerUser = {
          id: row.MaKhachHang,
          name: row.HoTen,
          phone: row.SoDienThoai,
          email: row.Email || undefined,
          membershipTier: row.HangThanhVien,
          points: Number(row.DiemTichLuy || 0),
          totalSpent: Number(row.TongChiTieu || 0),
          purchaseCount: Number(row.SoLanMua || 0),
          repairCount: Number(row.SoLanSuaChua || 0),
          avatar: row.AnhDaiDien || undefined,
          birthday: row.NgaySinh || undefined,
          gender: row.GioiTinh || undefined,
          city: row.ThanhPho || undefined,
          address: row.DiaChi || undefined,
        };
      }
    }

    return NextResponse.json({
      success: true,
      bootId: SERVER_BOOT_ID,
      staffValid,
      staffUser,
      customerValid,
      customerUser,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      {
        success: false,
        bootId: SERVER_BOOT_ID,
        error: 'Lỗi kiểm tra phiên đăng nhập: ' + (error?.message || ''),
      },
      { status: 500 }
    );
  }
}
