import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { isValidUsername, sanitizeString } from '@/ThuVien/KiemTraHopLe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = body.username;
    const rawPassword = body.password;
    const rawName = body.name;

    const username = sanitizeString(rawUsername, 50).toLowerCase();
    const password = String(rawPassword || '');
    const name = sanitizeString(rawName, 100);

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ tên đăng nhập, mật khẩu và họ tên nhân viên' },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Tên đăng nhập không hợp lệ (cần từ 3-30 ký tự chữ, số hoặc dấu gạch dưới, không chứa dấu tiếng Việt hay khoảng trắng)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có tối thiểu 6 ký tự để đảm bảo an toàn' },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Họ tên nhân viên phải có tối thiểu 2 ký tự' },
        { status: 400 }
      );
    }

    const exists = await db.queryOne('SELECT MaNguoiDung FROM NguoiDung WHERE LOWER(TenDangNhap) = ?', [username]);

    if (exists) {
      return NextResponse.json(
        { error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!' },
        { status: 409 }
      );
    }

    const newId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    await db.execute(
      `INSERT INTO NguoiDung (MaNguoiDung, TenDangNhap, MatKhau, HoTen, VaiTro, AnhDaiDien, DangHoatDong, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, 'pending', NULL, 1, NOW(), NOW())`,
      [newId, username, password, name]
    );

    return NextResponse.json(
      {
        success: true,
        isPending: true,
        message: 'Đăng ký tài khoản nhân viên thành công! Tài khoản đang ở trạng thái chờ Chủ Cửa Hàng (Admin) xét duyệt và cấp quyền.',
        data: {
          id: newId,
          username,
          name,
          role: 'pending',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Staff registration error:', error);
    return NextResponse.json(
      { error: 'Lỗi đăng ký tài khoản nhân viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
