import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    const where: any = { isActive: true };
    if (brand && brand !== 'all') {
      where.deviceBrand = brand;
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const services = await prisma.repairService.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error('Repair services GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục dịch vụ sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      category,
      deviceBrand,
      deviceModels,
      price,
      originalPrice,
      warrantyPeriod,
      estimatedMinutes,
      description,
      isFeatured,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Tên dịch vụ và giá sửa chữa không được để trống' },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(name, 191);
    const service = await prisma.repairService.upsert({
      where: { id: id || `srv-${Date.now()}` },
      update: {
        name: cleanName,
        category: category || 'other',
        deviceBrand: deviceBrand || 'Apple',
        deviceModels: deviceModels || '',
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        warrantyPeriod: warrantyPeriod || '12 Tháng',
        estimatedMinutes: Number(estimatedMinutes) || 30,
        description: description || null,
        isFeatured: Boolean(isFeatured),
      },
      create: {
        id: id || `srv-${Date.now()}`,
        name: cleanName,
        category: category || 'other',
        deviceBrand: deviceBrand || 'Apple',
        deviceModels: deviceModels || '',
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        warrantyPeriod: warrantyPeriod || '12 Tháng',
        estimatedMinutes: Number(estimatedMinutes) || 30,
        description: description || null,
        isFeatured: Boolean(isFeatured),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu dịch vụ sửa chữa thành công',
      data: service,
    });
  } catch (error: any) {
    console.error('Repair services POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật dịch vụ sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID dịch vụ' }, { status: 400 });
    }

    await prisma.repairService.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa dịch vụ sửa chữa thành công',
    });
  } catch (error: any) {
    console.error('Repair services DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa dịch vụ sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

