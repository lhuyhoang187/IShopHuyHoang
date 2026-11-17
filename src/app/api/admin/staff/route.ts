import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VALID_STAFF_ROLES, ValidStaffRole } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const users = await db.query(
      `SELECT id, username, name, role, avatar, isActive, phone, email, createdAt 
       FROM user 
       ORDER BY createdAt DESC`
    );

    const mapped = users.map((u) => ({
      ...u,
      isActive: Boolean(u.isActive),
    }));

    const pendingCount = mapped.filter((u) => u.role === 'pending').length;
    const adminCount = mapped.filter((u) => u.role === 'admin').length;
    const cashierCount = mapped.filter((u) => u.role === 'cashier').length;
    const techCount = mapped.filter((u) => u.role === 'technician').length;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: mapped.length,
      pendingCount,
      adminCount,
      cashierCount,
      techCount,
      data: mapped,
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

    const targetUser = await db.queryOne('SELECT * FROM user WHERE id = ?', [id]);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên' },
        { status: 404 }
      );
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (role !== undefined) {
      if (!VALID_STAFF_ROLES.includes(role as ValidStaffRole)) {
        return NextResponse.json(
          { error: `Vai trò không hợp lệ. Chọn một trong: ${VALID_STAFF_ROLES.join(', ')}` },
          { status: 400 }
        );
      }

      // Business Constraint: Prevent removing the last active Admin
      if (targetUser.role === 'admin' && role !== 'admin') {
        const adminCheck = await db.queryOne(
          'SELECT COUNT(*) as cnt FROM user WHERE role = "admin" AND isActive = 1'
        );
        if ((adminCheck?.cnt || 0) <= 1) {
          return NextResponse.json(
            { error: 'Không thể hạ quyền Quản trị viên cuối cùng của hệ thống!' },
            { status: 403 }
          );
        }
      }

      setClauses.push('role = ?');
      params.push(role);
    }

    if (isActive !== undefined) {
      const boolActive = Boolean(isActive);
      if (targetUser.role === 'admin' && !boolActive) {
        const adminCheck = await db.queryOne(
          'SELECT COUNT(*) as cnt FROM user WHERE role = "admin" AND isActive = 1'
        );
        if ((adminCheck?.cnt || 0) <= 1) {
          return NextResponse.json(
            { error: 'Không thể khóa tài khoản Quản trị viên duy nhất đang hoạt động!' },
            { status: 403 }
          );
        }
      }

      setClauses.push('isActive = ?');
      params.push(boolActive ? 1 : 0);
    }

    if (setClauses.length > 0) {
      setClauses.push('updatedAt = NOW()');
      params.push(id);
      await db.execute(
        `UPDATE user SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    }

    const updated = await db.queryOne(
      `SELECT id, username, name, role, avatar, isActive, phone, email, createdAt, updatedAt 
       FROM user WHERE id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công',
      data: updated ? { ...updated, isActive: Boolean(updated.isActive) } : null,
    });
  } catch (error: any) {
    console.error('Staff PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật nhân viên: ' + (error?.message || '') },
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

    const user = await db.queryOne('SELECT * FROM user WHERE id = ?', [id]);
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên' },
        { status: 404 }
      );
    }

    // Constraint: Prevent deleting admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản Quản trị viên hệ thống!' },
        { status: 403 }
      );
    }

    await db.execute('DELETE FROM user WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản nhân viên ${user.name} (${user.username})`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa tài khoản nhân viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
