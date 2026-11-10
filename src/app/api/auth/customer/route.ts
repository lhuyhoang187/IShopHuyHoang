import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  sanitizeString,
} from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password, avatar, birthday, gender, city, address } = body;

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
    let customer = null;
    if (normalizedPhone) {
      customer = await prisma.customer.findFirst({
        where: { phone: normalizedPhone },
      });
    }

    if (!customer && cleanEmail) {
      customer = await prisma.customer.findFirst({
        where: { email: cleanEmail },
      });
    }

    // If customer exists and password is provided for login check
    if (customer && password && customer.password) {
      if (customer.password !== password) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu đăng nhập không chính xác' },
          { status: 401 }
        );
      }
    }

    // If not found, create new customer in MySQL
    if (!customer) {
      const customerName = name ? sanitizeString(name, 100) : (cleanEmail ? cleanEmail.split('@')[0] : 'Khách Hàng');
      const customerPhone = normalizedPhone || ('09' + Math.floor(10000000 + Math.random() * 90000000));

      customer = await prisma.customer.create({
        data: {
          id: 'cust-' + Date.now(),
          name: customerName,
          phone: customerPhone,
          email: cleanEmail || null,
          password: password ? String(password) : null,
          avatar: avatar || null,
          birthday: birthday || null,
          gender: gender || 'male',
          city: city || 'TP. Hồ Chí Minh',
          address: address ? sanitizeString(address, 191) : null,
          points: 100, // Thưởng 100 điểm chào mừng thành viên mới
          totalSpent: 0,
          purchaseCount: 0,
          repairCount: 0,
          membershipTier: 'Thành viên mới',
          customerType: 'Khách lẻ',
        },
      });
    } else {
      // If updating fields
      const updateData: any = {};
      if (name) updateData.name = sanitizeString(name, 100);
      if (cleanEmail && !customer.email) updateData.email = cleanEmail;
      if (password) updateData.password = String(password);
      if (avatar !== undefined) updateData.avatar = avatar;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (gender !== undefined) updateData.gender = gender;
      if (city !== undefined) updateData.city = city;
      if (address !== undefined) updateData.address = sanitizeString(address, 191);

      if (Object.keys(updateData).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: updateData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        points: customer.points,
        membershipTier: customer.membershipTier,
        customerType: customer.customerType,
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
      { success: false, error: 'Lỗi xác thực thành viên: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
