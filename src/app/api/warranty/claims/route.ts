import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');
    const phone = searchParams.get('phone');

    const where: any = {};
    if (imei) where.imeiOrSerial = imei.trim();
    if (phone) where.customerPhone = normalizePhone(phone);

    const claims = await prisma.warrantyClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            membershipTier: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: claims,
    });
  } catch (error: any) {
    console.error('Warranty claim GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách yêu cầu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imeiOrSerial,
      customerName,
      customerPhone,
      customerEmail,
      productName,
      issueDescription,
    } = body;

    const rawPhone = String(customerPhone || '');
    const cleanPhone = normalizePhone(rawPhone);
    const cleanName = sanitizeString(customerName, 100);
    const cleanImei = sanitizeString(imeiOrSerial, 50);

    if (!cleanImei) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp số IMEI hoặc số Serial máy' },
        { status: 400 }
      );
    }

    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      );
    }

    const count = await prisma.warrantyClaim.count();
    const claimCode = `BH-2608-${String(count + 1).padStart(3, '0')}`;

    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    const claim = await prisma.warrantyClaim.create({
      data: {
        claimCode,
        imeiOrSerial: cleanImei,
        customerName: cleanName || 'Khách hàng',
        customerPhone: cleanPhone,
        customerEmail: customerEmail ? sanitizeString(customerEmail, 100) : null,
        customerId: existingCustomer?.id || null,
        productName: sanitizeString(productName || 'Thiết bị di động', 191),
        issueDescription: sanitizeString(issueDescription || 'Yêu cầu kiểm tra bảo hành thiết bị', 1000),
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu bảo hành thành công. Chuyên viên sẽ liên hệ trong 30 phút.',
      data: claim,
    });
  } catch (error: any) {
    console.error('Warranty claim POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi gửi yêu cầu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

