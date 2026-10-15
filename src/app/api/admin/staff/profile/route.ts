import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, name, phone, email, avatar, currentPassword, newPassword } = body;

    if (!id && !username) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc Tên đăng nhập của tài khoản' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findFirst({
      where: id ? { id } : { username: String(username).toLowerCase() },
    });

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

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = sanitizeString(name, 100);

    if (phone !== undefined) {
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone && !isValidPhone(cleanPhone)) {
        return NextResponse.json(
          { error: 'Số điện thoại cá nhân không đúng định dạng số ĐT Việt Nam' },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone || null;
    }

    if (email !== undefined) {
      const cleanEmail = email ? sanitizeString(email, 100).toLowerCase() : '';
      if (cleanEmail && !isValidEmail(cleanEmail)) {
        return NextResponse.json(
          { error: 'Địa chỉ email không đúng định dạng chuẩn' },
          { status: 400 }
        );
      }
      updateData.email = cleanEmail || null;
    }

    if (avatar !== undefined) updateData.avatar = avatar;
    if (newPassword) updateData.password = String(newPassword);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('Staff profile update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật hồ sơ: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
