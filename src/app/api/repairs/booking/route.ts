import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    let sql = `
      SELECT b.*, c.name as customer_name, c.membershipTier, c.points 
      FROM repairbooking b
      LEFT JOIN customer c ON b.customerId = c.id
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (phone) {
      const cleanPhone = normalizePhone(phone);
      whereClauses.push('b.customerPhone = ?');
      params.push(cleanPhone);
    }
    if (status) {
      whereClauses.push('b.status = ?');
      params.push(status);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY b.createdAt DESC';

    const bookings = await db.query(sql, params);

    const parsed = bookings.map((b) => ({
      ...b,
      customer: b.customerId
        ? {
            name: b.customer_name || b.customerName,
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
    const {
      name,
      phone,
      model,
      service,
      date,
      time,
      notes,
      branchName,
    } = body;

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

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM repairbooking');
    const count = countRow?.cnt || 0;
    const bookingCode = `DL-2608-${String(count + 1).padStart(3, '0')}`;

    // Tìm xem khách hàng đã có trong danh bạ chưa
    const existingCustomer = await db.queryOne('SELECT id FROM customer WHERE phone = ?', [customerPhone]);

    const bookingId = 'rb_' + Date.now();
    await db.execute(
      `INSERT INTO repairbooking 
       (id, bookingCode, customerName, customerPhone, customerId, deviceModel, serviceName, appointmentDate, appointmentTime, notes, branchName, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        bookingId,
        bookingCode,
        customerName,
        customerPhone,
        existingCustomer?.id || null,
        sanitizeString(model || 'Thiết bị di động', 100),
        sanitizeString(service || 'Kiểm tra tổng quát', 191),
        String(date || new Date().toISOString().substring(0, 10)),
        String(time || '10:00'),
        notes ? sanitizeString(notes, 500) : null,
        branchName || 'iShop Huy Hoàng - Chi Nhánh Thủ Đức',
      ]
    );

    const booking = await db.queryOne('SELECT * FROM repairbooking WHERE id = ?', [bookingId]);

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
