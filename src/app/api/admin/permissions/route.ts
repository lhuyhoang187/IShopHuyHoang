import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const permissions = await prisma.rolePermission.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: permissions.length,
      data: permissions,
    });
  } catch (error: any) {
    console.error('Permissions API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn ma trận phân quyền: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Dữ liệu phân quyền phải là danh sách (array)' },
        { status: 400 }
      );
    }

    // Upsert each permission
    for (const perm of permissions) {
      if (perm.id) {
        await prisma.rolePermission.upsert({
          where: { id: perm.id },
          update: {
            admin: Boolean(perm.admin),
            tech: Boolean(perm.tech),
            cashier: Boolean(perm.cashier),
          },
          create: {
            id: perm.id,
            module: perm.module || perm.id,
            category: perm.category || 'hệ thống',
            description: perm.description || null,
            admin: Boolean(perm.admin),
            tech: Boolean(perm.tech),
            cashier: Boolean(perm.cashier),
          },
        });
      }
    }

    const updated = await prisma.rolePermission.findMany();
    return NextResponse.json({
      success: true,
      message: 'Cập nhật ma trận phân quyền thành công vào CSDL',
      data: updated,
    });
  } catch (error: any) {
    console.error('Permissions API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật ma trận phân quyền: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

