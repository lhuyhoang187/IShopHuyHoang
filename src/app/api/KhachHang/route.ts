import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/ThuVien/KiemTraHopLe';

const CUSTOMER_SELECT = `
  MaKhachHang AS id,
  HoTen AS name,
  SoDienThoai AS phone,
  Email AS email,
  DiaChi AS address,
  TongChiTieu AS totalSpent,
  DiemTichLuy AS points,
  SoLanMua AS purchaseCount,
  SoLanSuaChua AS repairCount,
  AnhDaiDien AS avatar,
  NgaySinh AS birthday,
  ThanhPho AS city,
  LoaiKhachHang AS customerType,
  GioiTinh AS gender,
  HangThanhVien AS membershipTier,
  GhiChu AS notes,
  MatKhau AS password,
  MaSoThue AS taxCode,
  NgayTao AS createdAt,
  NgayCapNhat AS updatedAt
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    let sql = `SELECT ${CUSTOMER_SELECT} FROM KhachHang`;
    const params: any[] = [];

    if (search) {
      const normalized = normalizePhone(search);
      sql += ' WHERE HoTen LIKE ? OR SoDienThoai LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
      if (normalized && normalized !== search) {
        sql += ' OR SoDienThoai LIKE ?';
        params.push(`%${normalized}%`);
      }
    }

    sql += ' ORDER BY NgayTao DESC LIMIT 50';

    const customers = await db.query(sql, params);

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    console.error('Customers API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh sách khách hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'change_password') {
      const targetId = body.id ? sanitizeString(body.id, 64) : '';
      const targetPhone = body.phone ? normalizePhone(body.phone) : '';
      const currentPassword = String(body.currentPassword || '');
      const newPassword = String(body.newPassword || '');

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có ít nhất 6 ký tự!' },
          { status: 400 }
        );
      }

      let customerRow: any = null;
      if (targetId) {
        customerRow = await db.queryOne(
          `SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE MaKhachHang = ?`,
          [targetId]
        );
      }
      if (!customerRow && targetPhone) {
        customerRow = await db.queryOne(
          `SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE SoDienThoai = ?`,
          [targetPhone]
        );
      }
      if (!customerRow) {
        return NextResponse.json(
          { error: 'Không tìm thấy tài khoản khách hàng trong CSDL!' },
          { status: 404 }
        );
      }

      if (customerRow.password && currentPassword && customerRow.password !== currentPassword) {
        return NextResponse.json(
          { error: 'Mật khẩu hiện tại không chính xác!' },
          { status: 401 }
        );
      }

      await db.execute('UPDATE KhachHang SET MatKhau = ?, NgayCapNhat = NOW() WHERE MaKhachHang = ?', [
        newPassword,
        customerRow.id,
      ]);

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật mật khẩu mới vào CSDL thành công!',
      });
    }

    const rawName = body.name;
    const rawPhone = body.phone;
    const rawEmail = body.email;
    const rawAddress = body.address;

    const name = sanitizeString(rawName, 100);
    const phone = normalizePhone(rawPhone);
    const email = rawEmail ? sanitizeString(rawEmail, 100).toLowerCase() : null;
    const address = rawAddress ? sanitizeString(rawAddress, 191) : null;

    let existing: any = null;
    if (body.id) {
      existing = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE MaKhachHang = ?`, [
        sanitizeString(body.id, 64),
      ]);
    }
    if (!existing && phone) {
      existing = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE SoDienThoai = ?`, [phone]);
    }

    if (!existing && (!name || name.length < 2)) {
      return NextResponse.json(
        { error: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!existing && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không đúng định dạng số điện thoại Việt Nam 10 số' },
        { status: 400 }
      );
    }

    if (existing && phone && phone !== existing.phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không đúng định dạng số điện thoại Việt Nam 10 số' },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Địa chỉ email không đúng định dạng chuẩn (ví dụ: khachhang@gmail.com)' },
        { status: 400 }
      );
    }

    if (existing) {
      const setClauses: string[] = ['NgayCapNhat = NOW()'];
      const params: any[] = [];

      if (name && name.length >= 2) {
        setClauses.push('HoTen = ?');
        params.push(name);
      }
      if (phone) {
        setClauses.push('SoDienThoai = ?');
        params.push(phone);
      }
      if (email !== null) {
        setClauses.push('Email = ?');
        params.push(email);
      }
      if (address !== null) {
        setClauses.push('DiaChi = ?');
        params.push(address);
      }
      if (body.gender) {
        setClauses.push('GioiTinh = ?');
        params.push(sanitizeString(body.gender, 20));
      }
      if (body.customerType) {
        setClauses.push('LoaiKhachHang = ?');
        params.push(sanitizeString(body.customerType, 50));
      }
      if (body.membershipTier) {
        setClauses.push('HangThanhVien = ?');
        params.push(sanitizeString(body.membershipTier, 50));
      }
      if (body.taxCode) {
        setClauses.push('MaSoThue = ?');
        params.push(sanitizeString(body.taxCode, 50));
      }
      if (body.birthday) {
        setClauses.push('NgaySinh = ?');
        params.push(sanitizeString(body.birthday, 50));
      }
      if (body.city) {
        setClauses.push('ThanhPho = ?');
        params.push(sanitizeString(body.city, 100));
      }
      if (body.notes !== undefined) {
        setClauses.push('GhiChu = ?');
        params.push(body.notes);
      }
      if (body.avatar !== undefined) {
        setClauses.push('AnhDaiDien = ?');
        params.push(body.avatar);
      }
      if (body.points !== undefined) {
        setClauses.push('DiemTichLuy = ?');
        params.push(Math.max(0, Math.floor(Number(body.points) || 0)));
      }

      params.push(existing.id);
      await db.execute(`UPDATE KhachHang SET ${setClauses.join(', ')} WHERE MaKhachHang = ?`, params);

      const updated = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE MaKhachHang = ?`, [
        existing.id,
      ]);

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Đã cập nhật khách hàng hiện có',
      });
    }

    const customerId = body.id || 'cust-' + Date.now();
    const points = Math.max(0, Math.floor(Number(body.points) || 0));

    await db.execute(
      `INSERT INTO KhachHang
       (MaKhachHang, HoTen, SoDienThoai, Email, DiaChi, DiemTichLuy, LoaiKhachHang, HangThanhVien, MaSoThue, NgaySinh, GioiTinh, ThanhPho, GhiChu, AnhDaiDien, TongChiTieu, SoLanMua, SoLanSuaChua, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(), NOW())`,
      [
        customerId,
        name,
        phone,
        email,
        address,
        points,
        body.customerType ? sanitizeString(body.customerType, 50) : 'Khách lẻ',
        body.membershipTier
          ? sanitizeString(body.membershipTier, 50)
          : points > 0
          ? 'Thành viên Thường'
          : 'Chưa xếp hạng',
        body.taxCode ? sanitizeString(body.taxCode, 50) : null,
        body.birthday ? sanitizeString(body.birthday, 50) : null,
        body.gender ? sanitizeString(body.gender, 20) : null,
        body.city ? sanitizeString(body.city, 100) : 'TP. Hồ Chí Minh',
        body.notes || null,
        body.avatar || null,
      ]
    );

    const created = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE MaKhachHang = ?`, [customerId]);

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Đã tạo mới khách hàng thành công',
    });
  } catch (error: any) {
    console.error('Customers API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu thông tin khách hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!id && !phone) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc số điện thoại khách hàng cần xóa' },
        { status: 400 }
      );
    }

    let existing = null;
    if (id) {
      existing = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE MaKhachHang = ?`, [id]);
    }
    if (!existing && phone) {
      existing = await db.queryOne(`SELECT ${CUSTOMER_SELECT} FROM KhachHang WHERE SoDienThoai = ?`, [phone]);
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy khách hàng để xóa' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM KhachHang WHERE MaKhachHang = ?', [existing.id]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa khách hàng ${existing.name} (${existing.phone}) thành công`,
    });
  } catch (error: any) {
    console.error('Customers API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa khách hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
