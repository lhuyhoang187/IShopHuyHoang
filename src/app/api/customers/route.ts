import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const normalized = search ? normalizePhone(search) : '';

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            ...(normalized ? [{ phone: { contains: normalized } }] : []),
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

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

    const existing = await prisma.customer.findUnique({
      where: { phone },
    });

    const updateFields: any = {
      name,
      email: email || existing?.email,
      address: address || existing?.address,
    };
    if (body.customerType) updateFields.customerType = sanitizeString(body.customerType, 50);
    if (body.membershipTier) updateFields.membershipTier = sanitizeString(body.membershipTier, 50);
    if (body.taxCode) updateFields.taxCode = sanitizeString(body.taxCode, 50);
    if (body.birthday) updateFields.birthday = sanitizeString(body.birthday, 50);
    if (body.city) updateFields.city = sanitizeString(body.city, 100);
    if (body.notes) updateFields.notes = body.notes;
    if (body.avatar) updateFields.avatar = body.avatar;
    if (body.points !== undefined) updateFields.points = Math.max(0, Math.floor(Number(body.points) || 0));

    if (existing) {
      const updated = await prisma.customer.update({
        where: { phone },
        data: updateFields,
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Đã cập nhật khách hàng hiện có',
      });
    }

    const points = Math.max(0, Math.floor(Number(body.points) || 0));

    const created = await prisma.customer.create({
      data: {
        id: 'cust-' + Date.now(),
        name,
        phone,
        email,
        address,
        points,
        customerType: body.customerType || 'Khách lẻ',
        membershipTier: body.membershipTier || 'Thành viên mới',
        taxCode: body.taxCode || null,
        birthday: body.birthday || null,
        city: body.city || 'TP. Hồ Chí Minh',
        notes: body.notes || null,
        avatar: body.avatar || null,
      },
    });

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
