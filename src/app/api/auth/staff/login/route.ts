import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

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

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Check account active status constraint
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản nhân viên này đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ Quản trị viên!' },
        { status: 403 }
      );
    }

    // Check if role is pending approval by Admin
    if (user.role === 'pending') {
      return NextResponse.json({
        success: false,
        isPending: true,
        message: 'Tài khoản của bạn đã được tạo thành công nhưng đang chờ Chủ Cửa Hàng (Admin) phê duyệt cấp quyền trước khi có thể truy cập hệ thống.',
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
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
