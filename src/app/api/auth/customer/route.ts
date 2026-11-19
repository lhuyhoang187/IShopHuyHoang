import { NextResponse } from 'next/server';
import { db, SERVER_BOOT_ID } from '@/lib/db';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode = 'login', name, phone, email, password, avatar, birthday, gender, city, address } = body;

    const normalizedPhone = phone ? normalizePhone(phone) : '';
    const cleanEmail = email ? sanitizeString(email, 100).toLowerCase() : '';

    if (!normalizedPhone && !cleanEmail) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp số điện thoại hoặc email' },
        { status: 400 }
      );
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại không đúng định dạng chuẩn 10 số của Việt Nam' },
        { status: 400 }
      );
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ email không đúng định dạng hợp lệ' },
        { status: 400 }
      );
    }

    // Try finding existing customer by phone or email
    let customer: any = null;
    if (normalizedPhone) {
      customer = await db.queryOne('SELECT * FROM customer WHERE phone = ?', [normalizedPhone]);
    }

    if (!customer && cleanEmail) {
      customer = await db.queryOne('SELECT * FROM customer WHERE LOWER(email) = ?', [cleanEmail]);
    }

    if (mode === 'login') {
      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tài khoản khách hàng chưa tồn tại trên hệ thống. Vui lòng chuyển sang tab Đăng ký (Sign up) để tạo tài khoản mới!',
          },
          { status: 401 }
        );
      }

      if (customer.password) {
        if (!password || customer.password !== String(password)) {
          return NextResponse.json(
            { success: false, error: 'Mật khẩu đăng nhập không chính xác!' },
            { status: 401 }
          );
        }
      }
    } else if (mode === 'signup') {
      if (customer && customer.password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email hoặc số điện thoại này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập!',
          },
          { status: 409 }
        );
      }
    }

    // If not found (only reachable in signup or update mode), create new customer in MySQL
    if (!customer) {
      const customerName = name ? sanitizeString(name, 100) : (cleanEmail ? cleanEmail.split('@')[0] : 'Khách Hàng');
      const customerPhone = normalizedPhone || ('09' + Math.floor(10000000 + Math.random() * 90000000));
      const customerId = 'cust-' + Date.now();

      await db.execute(
        `INSERT INTO customer 
         (id, name, phone, email, password, avatar, birthday, gender, city, address, points, totalSpent, purchaseCount, repairCount, membershipTier, customerType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'Chưa xếp hạng', 'Khách lẻ', NOW(), NOW())`,
        [
          customerId,
          customerName,
          customerPhone,
          cleanEmail || null,
          password ? String(password) : null,
          avatar || null,
          birthday || null,
          gender || 'male',
          city || 'TP. Hồ Chí Minh',
          address ? sanitizeString(address, 191) : null,
        ]
      );

      customer = await db.queryOne('SELECT * FROM customer WHERE id = ?', [customerId]);
    } else if (mode !== 'login') {
      // If updating fields during signup of existing walk-in customer or profile update
      const setClauses: string[] = [];
      const params: any[] = [];

      if (name) {
        setClauses.push('name = ?');
        params.push(sanitizeString(name, 100));
      }
      if (cleanEmail && !customer.email) {
        setClauses.push('email = ?');
        params.push(cleanEmail);
      }
      if (password) {
        setClauses.push('password = ?');
        params.push(String(password));
      }
      if (avatar !== undefined) {
        setClauses.push('avatar = ?');
        params.push(avatar);
      }
      if (birthday !== undefined) {
        setClauses.push('birthday = ?');
        params.push(birthday);
      }
      if (gender !== undefined) {
        setClauses.push('gender = ?');
        params.push(gender);
      }
      if (city !== undefined) {
        setClauses.push('city = ?');
        params.push(city);
      }
      if (address !== undefined) {
        setClauses.push('address = ?');
        params.push(sanitizeString(address, 191));
      }

      if (setClauses.length > 0) {
        setClauses.push('updatedAt = NOW()');
        params.push(customer.id);
        await db.execute(
          `UPDATE customer SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );
        customer = await db.queryOne('SELECT * FROM customer WHERE id = ?', [customer.id]);
      }
    }

    return NextResponse.json({
      success: true,
      bootId: SERVER_BOOT_ID,
      message: 'Đăng nhập / Đồng bộ thông tin khách hàng thành công',
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        membershipTier: customer.membershipTier,
        points: customer.points,
        totalSpent: customer.totalSpent,
        purchaseCount: customer.purchaseCount,
        repairCount: customer.repairCount,
        avatar: customer.avatar,
        birthday: customer.birthday,
        gender: customer.gender,
        city: customer.city,
        address: customer.address,
      },
    });
  } catch (error: any) {
    console.error('Customer auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xác thực khách hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
