import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const branches = await prisma.storeBranch.findMany({
      where: { isActive: true },
      orderBy: [{ isMainBranch: 'desc' }, { code: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: branches,
    });
  } catch (error: any) {
    console.error('Store branches GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách chi nhánh: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, phone, address, district, city, openingHours, isMainBranch, mapUrl } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: 'Mã, tên và địa chỉ chi nhánh không được để trống' }, { status: 400 });
    }

    const cleanCode = sanitizeString(code, 50).toUpperCase();
    const branch = await prisma.storeBranch.upsert({
      where: { code: cleanCode },
      update: {
        name: sanitizeString(name, 150),
        phone: sanitizeString(phone || '', 20),
        address: sanitizeString(address, 191),
        district: district ? sanitizeString(district, 100) : null,
        city: city ? sanitizeString(city, 100) : 'TP. Hồ Chí Minh',
        openingHours: openingHours ? sanitizeString(openingHours, 100) : '08:00 - 21:30',
        isMainBranch: Boolean(isMainBranch),
        mapUrl: mapUrl || null,
        isActive: true,
      },
      create: {
        code: cleanCode,
        name: sanitizeString(name, 150),
        phone: sanitizeString(phone || '', 20),
        address: sanitizeString(address, 191),
        district: district ? sanitizeString(district, 100) : null,
        city: city ? sanitizeString(city, 100) : 'TP. Hồ Chí Minh',
        openingHours: openingHours ? sanitizeString(openingHours, 100) : '08:00 - 21:30',
        isMainBranch: Boolean(isMainBranch),
        mapUrl: mapUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu chi nhánh thành công',
      data: branch,
    });
  } catch (error: any) {
    console.error('Store branches POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu chi nhánh: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

