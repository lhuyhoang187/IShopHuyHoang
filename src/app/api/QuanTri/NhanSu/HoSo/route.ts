import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/ThuVien/KiemTraHopLe';

const SELECT_PROFILE_COLS = `
  MaNguoiDung AS id, TenDangNhap AS username, HoTen AS name, VaiTro AS role,
  SoDienThoai AS phone, Email AS email, AnhDaiDien AS avatar, PhongBan AS department,
  NgaySinh AS birthday, DiaChi AS address, GioiThieu AS bio,
  NgayTao AS createdAt, NgayCapNhat AS updatedAt
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, name, phone, email, avatar, department, birthday, address, bio, currentPassword, newPassword } = body;

    if (!id && !username) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc Tên đăng nhập của tài khoản' },
        { status: 400 }
      );
    }

    const user = id
      ? await db.queryOne('SELECT MaNguoiDung, MatKhau FROM NguoiDung WHERE MaNguoiDung = ?', [id])
      : await db.queryOne('SELECT MaNguoiDung, MatKhau FROM NguoiDung WHERE LOWER(TenDangNhap) = ?', [String(username).toLowerCase()]);

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên trong CSDL' },
        { status: 404 }
      );
    }

    if (newPassword) {
      if (currentPassword && user.MatKhau !== currentPassword) {
        return NextResponse.json(
          { error: 'Mật khẩu hiện tại không chính xác' },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' },
          { status: 400 }
        );
      }
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (name) {
      setClauses.push('HoTen = ?');
      params.push(sanitizeString(name, 100));
    }

    if (phone !== undefined) {
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone && !isValidPhone(cleanPhone)) {
        return NextResponse.json(
          { error: 'Số điện thoại cá nhân không đúng định dạng số ĐT Việt Nam' },
          { status: 400 }
        );
      }
      setClauses.push('SoDienThoai = ?');
      params.push(cleanPhone || null);
    }

    if (email !== undefined) {
      const cleanEmail = email ? sanitizeString(email, 100).toLowerCase() : '';
      if (cleanEmail && !isValidEmail(cleanEmail)) {
        return NextResponse.json(
          { error: 'Địa chỉ email không đúng định dạng chuẩn' },
          { status: 400 }
        );
      }
      setClauses.push('Email = ?');
      params.push(cleanEmail || null);
    }

    if (avatar !== undefined) {
      setClauses.push('AnhDaiDien = ?');
      params.push(avatar);
    }
    if (department !== undefined) {
      setClauses.push('PhongBan = ?');
      params.push(sanitizeString(department, 100));
    }
    if (birthday !== undefined) {
      setClauses.push('NgaySinh = ?');
      params.push(sanitizeString(birthday, 50));
    }
    if (address !== undefined) {
      setClauses.push('DiaChi = ?');
      params.push(sanitizeString(address, 191));
    }
    if (bio !== undefined) {
      setClauses.push('GioiThieu = ?');
      params.push(bio);
    }
    if (newPassword) {
      setClauses.push('MatKhau = ?');
      params.push(String(newPassword));
    }

    if (setClauses.length > 0) {
      setClauses.push('NgayCapNhat = NOW()');
      params.push(user.MaNguoiDung);
      await db.execute(
        `UPDATE NguoiDung SET ${setClauses.join(', ')} WHERE MaNguoiDung = ?`,
        params
      );
    }

    const updated = await db.queryOne(
      `SELECT ${SELECT_PROFILE_COLS} FROM NguoiDung WHERE MaNguoiDung = ?`,
      [user.MaNguoiDung]
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công trong CSDL',
      data: updated,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật hồ sơ cá nhân: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const id = searchParams.get('id');

    if (!username && !id) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp username hoặc id nhân viên' },
        { status: 400 }
      );
    }

    const user = id
      ? await db.queryOne(`SELECT ${SELECT_PROFILE_COLS} FROM NguoiDung WHERE MaNguoiDung = ?`, [id])
      : await db.queryOne(`SELECT ${SELECT_PROFILE_COLS} FROM NguoiDung WHERE LOWER(TenDangNhap) = ?`, [String(username).toLowerCase()]);

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu hồ sơ: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
