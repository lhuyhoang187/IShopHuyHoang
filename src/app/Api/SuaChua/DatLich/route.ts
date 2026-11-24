import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { normalizePhone, isValidPhone, sanitizeString } from '@/ThuVien/KiemTraHopLe';

const BOOKING_SELECT = `
  b.MaLichHen AS id,
  b.SoLichHen AS bookingCode,
  b.MaKhachHang AS customerId,
  b.DongMay AS deviceModel,
  b.TenDichVu AS serviceName,
  b.NgayHen AS appointmentDate,
  b.GioHen AS appointmentTime,
  b.GhiChu AS notes,
  b.TrangThai AS status,
  b.SoPhieuSuaChua AS ticketCode,
  b.ChiNhanh AS branchName,
  b.NgayTao AS createdAt,
  b.NgayCapNhat AS updatedAt,
  c.HoTen AS customerName,
  c.SoDienThoai AS customerPhone,
  c.HangThanhVien AS membershipTier,
  c.DiemTichLuy AS points
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    let sql = `
      SELECT ${BOOKING_SELECT}
      FROM LichHenSuaChua b
      LEFT JOIN KhachHang c ON b.MaKhachHang = c.MaKhachHang
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (phone) {
      const cleanPhone = normalizePhone(phone);
      whereClauses.push('c.SoDienThoai = ?');
      params.push(cleanPhone);
    }
    if (status) {
      whereClauses.push('b.TrangThai = ?');
      params.push(status);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY b.NgayTao DESC';

    const bookings = await db.query(sql, params);

    const parsed = bookings.map((b) => ({
      ...b,
      customer: b.customerId
        ? {
            name: b.customerName,
            phone: b.customerPhone,
            membershipTier: b.membershipTier || 'Thành viên mới',
            points: Number(b.points || 0),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Repair booking GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn lịch hẹn sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, model, service, date, time, notes, branchName } = body;

    const customerName = sanitizeString(name, 100);
    const rawPhone = String(phone || '');
    const customerPhone = normalizePhone(rawPhone);

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: 'Họ và tên khách hàng không được để trống' },
        { status: 400 }
      );
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ (cần 10 số đầu 03, 05, 07, 08, 09)' },
        { status: 400 }
      );
    }

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM LichHenSuaChua');
    const count = countRow?.cnt || 0;
    const bookingCode = `DL-2608-${String(count + 1).padStart(3, '0')}`;

    const existingCustomer = await db.queryOne(
      'SELECT MaKhachHang AS id FROM KhachHang WHERE SoDienThoai = ?',
      [customerPhone]
    );
    let customerId: string;
    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      customerId = 'cust-' + Date.now();
      await db.execute(
        `INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, TongChiTieu, SoLanMua, SoLanSuaChua, DiemTichLuy, HangThanhVien, LoaiKhachHang, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, 0, 0, 0, 0, 'Thành viên mới', 'Khách lẻ', NOW(), NOW())`,
        [customerId, customerName, customerPhone]
      );
    }

    const bookingId = 'rb_' + Date.now();
    await db.execute(
      `INSERT INTO LichHenSuaChua
       (MaLichHen, SoLichHen, MaKhachHang, DongMay, TenDichVu, NgayHen, GioHen, GhiChu, ChiNhanh, TrangThai, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        bookingId,
        bookingCode,
        customerId,
        sanitizeString(model || 'Thiết bị di động', 100),
        sanitizeString(service || 'Kiểm tra tổng quát', 191),
        String(date || new Date().toISOString().substring(0, 10)),
        String(time || '10:00'),
        notes ? sanitizeString(notes, 500) : null,
        branchName || 'iShop Huy Hoàng - Chi Nhánh Thủ Đức',
      ]
    );

    const booking = await db.queryOne(
      `SELECT ${BOOKING_SELECT}
       FROM LichHenSuaChua b
       LEFT JOIN KhachHang c ON b.MaKhachHang = c.MaKhachHang
       WHERE b.MaLichHen = ?`,
      [bookingId]
    );

    return NextResponse.json({
      success: true,
      message: 'Đặt lịch hẹn sửa chữa thành công',
      data: booking,
    });
  } catch (error: any) {
    console.error('Repair booking POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi đặt lịch hẹn sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
