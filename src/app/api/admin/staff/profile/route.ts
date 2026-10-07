import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      where: id ? { id } : { username: username.toLowerCase() },
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
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (newPassword) updateData.password = newPassword;

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
