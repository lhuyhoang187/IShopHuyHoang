import { NextRequest, NextResponse } from 'next/server';
import { db, SERVER_BOOT_ID } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = sanitizeString(body.username, 50).toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    const user = await db.queryOne(
      'SELECT MaNguoiDung, TenDangNhap, MatKhau, HoTen, VaiTro, AnhDaiDien, DangHoatDong FROM NguoiDung WHERE LOWER(TenDangNhap) = ?',
      [username]
    );

    if (!user || user.MatKhau !== password) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (!user.DangHoatDong) {
      return NextResponse.json(
        { error: 'Tài khoản nhân viên này đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ Quản trị viên!' },
        { status: 403 }
      );
    }

    if (user.VaiTro === 'pending') {
      return NextResponse.json({
        success: false,
        isPending: true,
        message: 'Tài khoản của bạn đã được tạo thành công nhưng đang chờ Chủ Cửa Hàng (Admin) phê duyệt cấp quyền trước khi có thể truy cập hệ thống.',
        data: {
          id: user.MaNguoiDung,
          username: user.TenDangNhap,
          name: user.HoTen,
          role: user.VaiTro,
        },
      });
    }

    return NextResponse.json({
      success: true,
      bootId: SERVER_BOOT_ID,
      message: 'Đăng nhập thành công',
      data: {
        id: user.MaNguoiDung,
        username: user.TenDangNhap,
        name: user.HoTen,
        role: user.VaiTro,
        avatar: user.AnhDaiDien,
      },
    });
  } catch (error: any) {
    console.error('Staff login error:', error);
    return NextResponse.json(
      { error: 'Lỗi đăng nhập: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
