import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/lib/validation';

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

    // Find user in database
    const user = id
      ? await db.queryOne('SELECT * FROM user WHERE id = ?', [id])
      : await db.queryOne('SELECT * FROM user WHERE LOWER(username) = ?', [String(username).toLowerCase()]);

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên trong CSDL' },
        { status: 404 }
      );
    }

    // If changing password, verify current password
    if (newPassword) {
      if (currentPassword && user.password !== currentPassword) {
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

    // Prepare update clauses
    const setClauses: string[] = [];
    const params: any[] = [];

    if (name) {
      setClauses.push('name = ?');
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
      setClauses.push('phone = ?');
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
      setClauses.push('email = ?');
      params.push(cleanEmail || null);
    }

    if (avatar !== undefined) {
      setClauses.push('avatar = ?');
      params.push(avatar);
    }
    if (department !== undefined) {
      setClauses.push('department = ?');
      params.push(sanitizeString(department, 100));
    }
    if (birthday !== undefined) {
      setClauses.push('birthday = ?');
      params.push(sanitizeString(birthday, 50));
    }
    if (address !== undefined) {
      setClauses.push('address = ?');
      params.push(sanitizeString(address, 191));
    }
    if (bio !== undefined) {
      setClauses.push('bio = ?');
      params.push(bio);
    }
    if (newPassword) {
      setClauses.push('password = ?');
      params.push(String(newPassword));
    }

    if (setClauses.length > 0) {
      setClauses.push('updatedAt = NOW()');
      params.push(user.id);
      await db.execute(
        `UPDATE user SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    }

    const updated = await db.queryOne(
      `SELECT id, username, name, role, phone, email, avatar, department, birthday, address, bio, createdAt, updatedAt 
       FROM user WHERE id = ?`,
      [user.id]
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
      ? await db.queryOne(
          `SELECT id, username, name, role, phone, email, avatar, department, birthday, address, bio, createdAt, updatedAt 
           FROM user WHERE id = ?`,
          [id]
        )
      : await db.queryOne(
          `SELECT id, username, name, role, phone, email, avatar, department, birthday, address, bio, createdAt, updatedAt 
           FROM user WHERE LOWER(username) = ?`,
          [String(username).toLowerCase()]
        );

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
