import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const permissions = await db.query('SELECT * FROM rolepermission ORDER BY id ASC');

    const mapped = permissions.map((p) => ({
      ...p,
      admin: Boolean(p.admin),
      tech: Boolean(p.tech),
      cashier: Boolean(p.cashier),
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: mapped.length,
      data: mapped,
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

    // Upsert each permission into MySQL
    for (const perm of permissions) {
      if (perm.id) {
        await db.execute(
          `INSERT INTO rolepermission (id, module, category, description, admin, tech, cashier, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             admin = VALUES(admin),
             tech = VALUES(tech),
             cashier = VALUES(cashier),
             updatedAt = NOW()`,
          [
            perm.id,
            perm.module || perm.id,
            perm.category || 'hệ thống',
            perm.description || null,
            perm.admin ? 1 : 0,
            perm.tech ? 1 : 0,
            perm.cashier ? 1 : 0,
          ]
        );
      }
    }

    const updated = await db.query('SELECT * FROM rolepermission ORDER BY id ASC');
    const mapped = updated.map((p) => ({
      ...p,
      admin: Boolean(p.admin),
      tech: Boolean(p.tech),
      cashier: Boolean(p.cashier),
    }));

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ma trận phân quyền thành công vào CSDL',
      data: mapped,
    });
  } catch (error: any) {
    console.error('Permissions API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật ma trận phân quyền: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID quyền cần xóa' }, { status: 400 });
    }
    await db.execute('DELETE FROM rolepermission WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Đã xóa phân hệ quyền khỏi CSDL' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi xóa phân quyền: ' + (error?.message || '') }, { status: 500 });
  }
}
