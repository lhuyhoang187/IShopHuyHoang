import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, isValidPhone, isValidImei, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();
    const imei = searchParams.get('imei')?.trim();

    const where: any = {};
    if (phone) {
      const normalized = normalizePhone(phone);
      where.OR = [
        { customerPhone: phone },
        ...(normalized ? [{ customerPhone: normalized }] : []),
      ];
    }
    if (imei) {
      where.imei = imei;
    }

    const devices = await prisma.registeredDevice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = devices.map((d) => ({
      ...d,
      repairHistoryCodes: d.repairHistoryCodes ? JSON.parse(d.repairHistoryCodes) : [],
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Loyalty devices API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu hộ chiếu thiết bị: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imei,
      productName,
      phoneId,
      color,
      capacity,
      customerPhone,
      customerName,
      customerEmail,
      purchaseInvoiceCode,
      purchaseDate,
      warrantyExpiryDate,
      purchasePrice,
      repairCode,
    } = body;

    const cleanImei = String(imei || '').trim();
    if (!cleanImei || !isValidImei(cleanImei)) {
      return NextResponse.json(
        { error: 'Số IMEI không đúng định dạng hợp lệ' },
        { status: 400 }
      );
    }

    const normPhone = normalizePhone(customerPhone || '');
    if (!isValidPhone(normPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existing = await prisma.registeredDevice.findUnique({
      where: { imei: cleanImei },
    });

    let currentRepairs: string[] = [];
    if (existing?.repairHistoryCodes) {
      try {
        currentRepairs = JSON.parse(existing.repairHistoryCodes);
      } catch {}
    }
    if (repairCode && !currentRepairs.includes(repairCode)) {
      currentRepairs.push(repairCode);
    }

    const device = await prisma.registeredDevice.upsert({
      where: { imei: cleanImei },
      update: {
        productName: sanitizeString(productName || existing?.productName || 'Thiết bị Apple', 191),
        customerPhone: normPhone,
        customerName: sanitizeString(customerName || existing?.customerName || 'Khách hàng', 100),
        customerEmail: customerEmail ? sanitizeString(customerEmail, 100).toLowerCase() : existing?.customerEmail,
        repairHistoryCodes: JSON.stringify(currentRepairs),
      },
      create: {
        id: 'dev-' + Date.now(),
        imei: cleanImei,
        productName: sanitizeString(productName || 'Thiết bị Apple', 191),
        phoneId: phoneId || null,
        color: color || null,
        capacity: capacity || null,
        customerPhone: normPhone,
        customerName: sanitizeString(customerName || 'Khách hàng', 100),
        customerEmail: customerEmail ? sanitizeString(customerEmail, 100).toLowerCase() : null,
        purchaseInvoiceCode: purchaseInvoiceCode || null,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        warrantyExpiryDate: warrantyExpiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        purchasePrice: Number(purchasePrice || 0),
        repairHistoryCodes: JSON.stringify(currentRepairs),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu hộ chiếu thiết bị thành công',
      data: {
        ...device,
        repairHistoryCodes: currentRepairs,
      },
    });
  } catch (error: any) {
    console.error('Loyalty devices API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi đăng ký hộ chiếu thiết bị: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

