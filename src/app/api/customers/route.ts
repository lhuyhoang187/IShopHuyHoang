import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    let sql = 'SELECT * FROM customer';
    const params: any[] = [];

    if (search) {
      const normalized = normalizePhone(search);
      sql += ' WHERE name LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
      if (normalized && normalized !== search) {
        sql += ' OR phone LIKE ?';
        params.push(`%${normalized}%`);
      }
    }

    sql += ' ORDER BY createdAt DESC LIMIT 50';

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
    const rawName = body.name;
    const rawPhone = body.phone;
    const rawEmail = body.email;
    const rawAddress = body.address;

    const name = sanitizeString(rawName, 100);
    const phone = normalizePhone(rawPhone);
    const email = rawEmail ? sanitizeString(rawEmail, 100).toLowerCase() : null;
    const address = rawAddress ? sanitizeString(rawAddress, 191) : null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
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

    const existing = await db.queryOne('SELECT * FROM customer WHERE phone = ?', [phone]);

    if (existing) {
      const setClauses: string[] = ['name = ?', 'updatedAt = NOW()'];
      const params: any[] = [name];

      if (email !== null) {
        setClauses.push('email = ?');
        params.push(email);
      }
      if (address !== null) {
        setClauses.push('address = ?');
        params.push(address);
      }
      if (body.customerType) {
        setClauses.push('customerType = ?');
        params.push(sanitizeString(body.customerType, 50));
      }
      if (body.membershipTier) {
        setClauses.push('membershipTier = ?');
        params.push(sanitizeString(body.membershipTier, 50));
      }
      if (body.taxCode) {
        setClauses.push('taxCode = ?');
        params.push(sanitizeString(body.taxCode, 50));
      }
      if (body.birthday) {
        setClauses.push('birthday = ?');
        params.push(sanitizeString(body.birthday, 50));
      }
      if (body.city) {
        setClauses.push('city = ?');
        params.push(sanitizeString(body.city, 100));
      }
      if (body.notes !== undefined) {
        setClauses.push('notes = ?');
        params.push(body.notes);
      }
      if (body.avatar !== undefined) {
        setClauses.push('avatar = ?');
        params.push(body.avatar);
      }
      if (body.points !== undefined) {
        setClauses.push('points = ?');
        params.push(Math.max(0, Math.floor(Number(body.points) || 0)));
      }

      params.push(existing.id);
      await db.execute(`UPDATE customer SET ${setClauses.join(', ')} WHERE id = ?`, params);

      const updated = await db.queryOne('SELECT * FROM customer WHERE id = ?', [existing.id]);

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Đã cập nhật khách hàng hiện có',
      });
    }

    const customerId = body.id || 'cust-' + Date.now();
    const points = Math.max(0, Math.floor(Number(body.points) || 0));

    await db.execute(
      `INSERT INTO customer 
       (id, name, phone, email, address, points, customerType, membershipTier, taxCode, birthday, city, notes, avatar, totalSpent, purchaseCount, repairCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(), NOW())`,
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
          : (points > 0 ? 'Thành viên Thường' : 'Chưa xếp hạng'),
        body.taxCode ? sanitizeString(body.taxCode, 50) : null,
        body.birthday ? sanitizeString(body.birthday, 50) : null,
        body.city ? sanitizeString(body.city, 100) : 'TP. Hồ Chí Minh',
        body.notes || null,
        body.avatar || null,
      ]
    );

    const created = await db.queryOne('SELECT * FROM customer WHERE id = ?', [customerId]);

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
      existing = await db.queryOne('SELECT * FROM customer WHERE id = ?', [id]);
    }
    if (!existing && phone) {
      existing = await db.queryOne('SELECT * FROM customer WHERE phone = ?', [phone]);
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy khách hàng để xóa' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM customer WHERE id = ?', [existing.id]);

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
