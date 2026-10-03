import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp số điện thoại hoặc email' },
        { status: 400 }
      );
    }

    // Try finding existing customer by phone or email
    let customer = null;
    if (phone) {
      customer = await prisma.customer.findFirst({
        where: { phone: String(phone).trim() },
      });
    }

    if (!customer && email) {
      customer = await prisma.customer.findFirst({
        where: { email: String(email).trim().toLowerCase() },
      });
    }

    // If not found, create new customer in MySQL
    if (!customer) {
      const customerName = name ? String(name).trim() : (email ? email.split('@')[0] : 'Khách Hàng');
      const customerPhone = phone ? String(phone).trim() : '09' + Math.floor(10000000 + Math.random() * 90000000);

      customer = await prisma.customer.create({
        data: {
          id: 'cust-' + Date.now(),
          name: customerName,
          phone: customerPhone,
          email: email ? String(email).trim().toLowerCase() : null,
          points: 100,
          totalSpent: 0,
          purchaseCount: 0,
          repairCount: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        points: customer.points,
      },
    });
  } catch (error: any) {
    console.error('Customer Auth Error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xác thực khách hàng: ' + (error?.message || 'Lỗi server') },
      { status: 500 }
    );
  }
}
