import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VALID_STAFF_ROLES, ValidStaffRole } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        phone: true,
        email: true,
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
    const { id, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID nhân viên cần cập nhật' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (role !== undefined) {
      if (!VALID_STAFF_ROLES.includes(role as ValidStaffRole)) {
        return NextResponse.json(
          { error: `Vai trò không hợp lệ. Chọn một trong: ${VALID_STAFF_ROLES.join(', ')}` },
          { status: 400 }
        );
      }

      // Business Constraint: Prevent removing the last active Admin
      if (targetUser.role === 'admin' && role !== 'admin') {
        const adminCount = await prisma.user.count({
          where: { role: 'admin', isActive: true },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Không thể hạ quyền Quản trị viên cuối cùng của hệ thống!' },
            { status: 403 }
          );
        }
      }

      updateData.role = role;
    }

    if (isActive !== undefined) {
      const boolActive = Boolean(isActive);
      if (targetUser.role === 'admin' && !boolActive) {
        const activeAdmins = await prisma.user.count({
          where: { role: 'admin', isActive: true },
        });
        if (activeAdmins <= 1) {
          return NextResponse.json(
            { error: 'Không thể khóa tài khoản Quản trị viên duy nhất đang hoạt động!' },
            { status: 403 }
          );
        }
      }
      updateData.isActive = boolActive;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: `Đã cập nhật tài khoản nhân viên ${updated.name}`,
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

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên cần xóa' },
        { status: 404 }
      );
    }

    if (target.username === 'admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản Quản trị viên tối cao (Super Admin)!' },
        { status: 403 }
      );
    }

    // Business Constraint: Do not delete if last admin
    if (target.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Không thể xóa Quản trị viên cuối cùng!' },
          { status: 403 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản nhân viên ${target.name} thành công`,
    });
  } catch (error: any) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa tài khoản nhân viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
