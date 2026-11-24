import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';

const SELECT_PERM_SQL = `
  SELECT MaQuyen AS id, PhanHe AS module, NhomChucNang AS category, MoTa AS description,
         QuyenQuanTri AS admin, QuyenKyThuat AS tech, QuyenThuNgan AS cashier,
         NgayTao AS createdAt, NgayCapNhat AS updatedAt
  FROM PhanQuyenVaiTro
  ORDER BY MaQuyen ASC
`;

export async function GET(request: NextRequest) {
  try {
    const permissions = await db.query(SELECT_PERM_SQL);

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

    for (const perm of permissions) {
      if (perm.id) {
        await db.execute(
          `INSERT INTO PhanQuyenVaiTro (MaQuyen, PhanHe, NhomChucNang, MoTa, QuyenQuanTri, QuyenKyThuat, QuyenThuNgan, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             QuyenQuanTri = VALUES(QuyenQuanTri),
             QuyenKyThuat = VALUES(QuyenKyThuat),
             QuyenThuNgan = VALUES(QuyenThuNgan),
             NgayCapNhat = NOW()`,
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

    const updated = await db.query(SELECT_PERM_SQL);
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
    await db.execute('DELETE FROM PhanQuyenVaiTro WHERE MaQuyen = ?', [id]);
    return NextResponse.json({ success: true, message: 'Đã xóa phân hệ quyền khỏi CSDL' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi xóa phân quyền: ' + (error?.message || '') }, { status: 500 });
  }
}
