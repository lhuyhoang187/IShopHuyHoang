import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    const where: any = {};
    if (phone) {
      const cleanPhone = normalizePhone(phone);
      where.customerPhone = cleanPhone;
    }
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.repairBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            membershipTier: true,
            points: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
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

    const count = await prisma.repairBooking.count();
    const bookingCode = `DL-2608-${String(count + 1).padStart(3, '0')}`;

    // Tìm xem khách hàng đã có trong danh bạ chưa
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: customerPhone },
    });

    const booking = await prisma.repairBooking.create({
      data: {
        bookingCode,
        customerName,
        customerPhone,
        customerId: existingCustomer?.id || null,
        deviceModel: sanitizeString(model || 'Thiết bị di động', 100),
        serviceName: sanitizeString(service || 'Kiểm tra tổng quát', 191),
        appointmentDate: String(date || new Date().toISOString().substring(0, 10)),
        appointmentTime: String(time || '10:00'),
        notes: notes ? sanitizeString(notes, 500) : null,
        branchName: branchName || 'iShop Huy Hoàng - Chi Nhánh Thủ Đức',
        status: 'pending',
      },
    });

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

