import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ tên đăng nhập, mật khẩu và họ tên nhân viên' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (exists) {
      return NextResponse.json(
        { error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!' },
        { status: 409 }
      );
    }

    // New staff registers with pending role awaiting Admin approval
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: password,
        name: name.trim(),
        role: 'pending',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      },
    });

    return NextResponse.json(
      {
        success: true,
        isPending: true,
        message: 'Đăng ký tài khoản nhân viên thành công! Tài khoản đang ở trạng thái chờ Chủ Cửa Hàng (Admin) xét duyệt và cấp quyền.',
        data: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
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
