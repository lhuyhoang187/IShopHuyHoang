import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
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
    const { name, phone, email, address } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Tên và Số điện thoại khách hàng là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
    });

    if (existing) {
      const updated = await prisma.customer.update({
        where: { phone: phone.trim() },
        data: {
          name: name.trim(),
          email: email?.trim() || existing.email,
          address: address?.trim() || existing.address,
        },
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Đã cập nhật khách hàng hiện có',
      });
    }

    const created = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        points: Number(body.points) || 0,
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
