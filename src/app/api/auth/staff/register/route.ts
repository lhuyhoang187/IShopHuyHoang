import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidUsername, sanitizeString } from '@/lib/validation';

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

    const exists = await prisma.user.findUnique({
      where: { username },
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
        username,
        password,
        name,
        role: 'pending',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        isActive: true,
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
