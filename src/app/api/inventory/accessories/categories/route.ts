import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    // 1. Lấy danh sách category từ bảng AccessoryCategory trong MySQL
    const dbCategories = await prisma.accessoryCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const categoryCounts = await prisma.accessoryProduct.groupBy({
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
      source: 'mysql_accessory_category',
      data: categories,
    });
  } catch (error: any) {
    console.error('Accessories Categories GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục phụ kiện: ' + (error?.message || '') },
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
      // 1. Cập nhật bảng AccessoryCategory
      await prisma.accessoryCategory.upsert({
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

      // 2. Cập nhật toàn bộ sản phẩm thuộc danh mục này
      await prisma.accessoryProduct.updateMany({
        where: { category: oldCode },
        data: {
          category: cleanCode,
          categoryName: cleanName,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật tên danh mục thành công',
        data: { code: cleanCode, name: cleanName },
      });
    }

    // Action create
    const created = await prisma.accessoryCategory.upsert({
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
      message: 'Đã tạo danh mục mới thành công',
      data: created,
    });
  } catch (error: any) {
    console.error('Accessories Categories POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật danh mục: ' + (error?.message || '') },
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

    // 1. Xóa trong bảng AccessoryCategory
    await prisma.accessoryCategory.deleteMany({
      where: { code },
    });

    // 2. Chuyển toàn bộ sản phẩm thuộc category này về 'other'
    await prisma.accessoryProduct.updateMany({
      where: { category: code },
      data: {
        category: 'other',
        categoryName: 'Phụ kiện khác',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục và chuyển các sản phẩm liên quan về 'Phụ kiện khác'`,
    });
  } catch (error: any) {
    console.error('Accessories Categories DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa danh mục: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

