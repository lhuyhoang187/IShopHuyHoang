import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = users.filter((u) => u.role === 'pending').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const cashierCount = users.filter((u) => u.role === 'cashier').length;
    const techCount = users.filter((u) => u.role === 'technician').length;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: users.length,
      pendingCount,
      adminCount,
      cashierCount,
      techCount,
      data: users,
    });
  } catch (error: any) {
    console.error('Staff GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh sách nhân sự: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID nhân viên và quyền hạn cần cấp' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'cashier', 'technician', 'pending'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Vai trò không hợp lệ. Chọn admin, cashier, technician hoặc pending' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: `Đã cập nhật phân quyền cho nhân viên ${updated.name} thành ${updated.role}`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Staff PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật quyền nhân viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID nhân viên cần xóa' },
        { status: 400 }
      );
    }

    // Do not allow deleting the primary admin
    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.username === 'admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản Quản trị viên tối cao (Super Admin)!' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tài khoản nhân viên thành công',
    });
  } catch (error: any) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa tài khoản nhân viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
