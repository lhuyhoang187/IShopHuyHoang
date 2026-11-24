import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { VALID_STAFF_ROLES, ValidStaffRole } from '@/ThuVien/KiemTraHopLe';

export async function GET(request: NextRequest) {
  try {
    const users = await db.query(
      `SELECT MaNguoiDung AS id, TenDangNhap AS username, HoTen AS name, VaiTro AS role,
              AnhDaiDien AS avatar, DangHoatDong AS isActive, SoDienThoai AS phone,
              Email AS email, NgayTao AS createdAt
       FROM NguoiDung
       ORDER BY NgayTao DESC`
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

    const targetUser = await db.queryOne('SELECT MaNguoiDung, VaiTro, DangHoatDong FROM NguoiDung WHERE MaNguoiDung = ?', [id]);
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

      if (targetUser.VaiTro === 'admin' && role !== 'admin') {
        const adminCheck = await db.queryOne(
          'SELECT COUNT(*) as cnt FROM NguoiDung WHERE VaiTro = "admin" AND DangHoatDong = 1'
        );
        if ((adminCheck?.cnt || 0) <= 1) {
          return NextResponse.json(
            { error: 'Không thể hạ quyền Quản trị viên cuối cùng của hệ thống!' },
            { status: 403 }
          );
        }
      }

      setClauses.push('VaiTro = ?');
      params.push(role);
    }

    if (isActive !== undefined) {
      const boolActive = Boolean(isActive);
      if (targetUser.VaiTro === 'admin' && !boolActive) {
        const adminCheck = await db.queryOne(
          'SELECT COUNT(*) as cnt FROM NguoiDung WHERE VaiTro = "admin" AND DangHoatDong = 1'
        );
        if ((adminCheck?.cnt || 0) <= 1) {
          return NextResponse.json(
            { error: 'Không thể khóa tài khoản Quản trị viên duy nhất đang hoạt động!' },
            { status: 403 }
          );
        }
      }

      setClauses.push('DangHoatDong = ?');
      params.push(boolActive ? 1 : 0);
    }

    if (setClauses.length > 0) {
      setClauses.push('NgayCapNhat = NOW()');
      params.push(id);
      await db.execute(
        `UPDATE NguoiDung SET ${setClauses.join(', ')} WHERE MaNguoiDung = ?`,
        params
      );
    }

    const updated = await db.queryOne(
      `SELECT MaNguoiDung AS id, TenDangNhap AS username, HoTen AS name, VaiTro AS role,
              AnhDaiDien AS avatar, DangHoatDong AS isActive, SoDienThoai AS phone,
              Email AS email, NgayTao AS createdAt, NgayCapNhat AS updatedAt
       FROM NguoiDung WHERE MaNguoiDung = ?`,
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

    const user = await db.queryOne(
      'SELECT MaNguoiDung, HoTen, TenDangNhap, VaiTro FROM NguoiDung WHERE MaNguoiDung = ?',
      [id]
    );
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản nhân viên' },
        { status: 404 }
      );
    }

    if (user.VaiTro === 'admin') {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản Quản trị viên hệ thống!' },
        { status: 403 }
      );
    }

    await db.execute('DELETE FROM NguoiDung WHERE MaNguoiDung = ?', [id]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản nhân viên ${user.HoTen} (${user.TenDangNhap})`,
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
