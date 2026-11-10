import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const dbCategories = await prisma.sparePartCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const categoryCounts = await prisma.sparePart.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const countMap: Record<string, number> = {};
    categoryCounts.forEach((c) => {
      countMap[c.category] = c._count.id;
    });

    const categories = dbCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      productCount: countMap[c.code] || 0,
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_spare_part_category',
      data: categories,
    });
  } catch (error: any) {
    console.error('Spare Part Categories GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục linh kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code, name, oldCode, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên danh mục không được để trống' }, { status: 400 });
    }

    const cleanName = sanitizeString(name, 100);
    const cleanCode = sanitizeString(
      code ||
        cleanName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/(^_|_$)+/g, ''),
      50
    );

    if (action === 'update' && oldCode) {
      // 1. Cập nhật bảng SparePartCategory
      await prisma.sparePartCategory.upsert({
        where: { code: oldCode },
        update: {
          code: cleanCode,
          name: cleanName,
          description: description || null,
        },
        create: {
          code: cleanCode,
          name: cleanName,
          description: description || null,
          isActive: true,
        },
      });

      // 2. Cập nhật các linh kiện thuộc danh mục này
      await prisma.sparePart.updateMany({
        where: { category: oldCode },
        data: {
          category: cleanCode,
          categoryName: cleanName,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật tên danh mục linh kiện thành công',
        data: { code: cleanCode, name: cleanName },
      });
    }

    // Action create
    const created = await prisma.sparePartCategory.upsert({
      where: { code: cleanCode },
      update: {
        name: cleanName,
        description: description || null,
        isActive: true,
      },
      create: {
        code: cleanCode,
        name: cleanName,
        description: description || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã tạo danh mục linh kiện mới thành công',
      data: created,
    });
  } catch (error: any) {
    console.error('Spare Part Categories POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật danh mục linh kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Thiếu mã danh mục' }, { status: 400 });
    }

    // 1. Xóa trong bảng SparePartCategory
    await prisma.sparePartCategory.deleteMany({
      where: { code },
    });

    // 2. Chuyển toàn bộ linh kiện thuộc category này về 'other'
    await prisma.sparePart.updateMany({
      where: { category: code },
      data: {
        category: 'other',
        categoryName: 'Linh kiện khác',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục và chuyển các linh kiện liên quan về 'Linh kiện khác'`,
    });
  } catch (error: any) {
    console.error('Spare Part Categories DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa danh mục linh kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

