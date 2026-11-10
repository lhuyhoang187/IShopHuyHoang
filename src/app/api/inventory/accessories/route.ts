import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAmount, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const accessories = await prisma.accessoryProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: accessories.length,
      data: accessories,
    });
  } catch (error: any) {
    console.error('Accessories API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh mục phụ kiện: ' + (error?.message || '') },
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
      slug,
      category,
      categoryName,
      barcode,
      brand,
      costPrice,
      sellingPrice,
      originalPrice,
      stock,
      minStockAlert,
      imageUrl,
      specs,
      description,
      compatibleWith,
      discountWhenBoughtWithPhone,
      pointsToRedeem,
      action,
    } = body;

    // 1. Tạo phụ kiện mới
    if (action === 'create' || !id) {
      if (!name || !barcode) {
        return NextResponse.json(
          { error: 'Vui lòng nhập đầy đủ tên phụ kiện và mã vạch Barcode' },
          { status: 400 }
        );
      }

      const generatedId = id || `acc-${Date.now()}`;
      const generatedSlug =
        slug ||
        name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

      const newAccessory = await prisma.accessoryProduct.create({
        data: {
          id: generatedId,
          name: sanitizeString(name, 191),
          slug: generatedSlug,
          category: category || 'other',
          categoryName: categoryName || 'Phụ kiện khác',
          barcode: sanitizeString(barcode, 50),
          brand: brand || 'Khác',
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          originalPrice: Number(originalPrice) || Number(sellingPrice) || 0,
          stock: Math.max(0, Math.floor(Number(stock) || 0)),
          minStockAlert: Math.max(0, Math.floor(Number(minStockAlert) || 5)),
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
          specs: specs || '',
          description: description || '',
          compatibleWith: compatibleWith || 'Tất cả thiết bị',
          discountWhenBoughtWithPhone: Number(discountWhenBoughtWithPhone) || 15,
          pointsToRedeem: pointsToRedeem !== undefined ? Math.max(0, Math.floor(Number(pointsToRedeem))) : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Thêm phụ kiện mới thành công',
        data: newAccessory,
      });
    }

    // 2. Chỉnh sửa phụ kiện đã có
    const updateData: any = {};
    if (name !== undefined) updateData.name = sanitizeString(name, 191);
    if (barcode !== undefined) updateData.barcode = sanitizeString(barcode, 50);
    if (brand !== undefined) updateData.brand = sanitizeString(brand, 100);
    if (category !== undefined) updateData.category = category;
    if (categoryName !== undefined) updateData.categoryName = categoryName;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (specs !== undefined) updateData.specs = specs;
    if (description !== undefined) updateData.description = description;
    if (compatibleWith !== undefined) updateData.compatibleWith = compatibleWith;

    if (costPrice !== undefined) {
      updateData.costPrice = Math.max(0, Number(costPrice));
    }
    if (sellingPrice !== undefined) {
      updateData.sellingPrice = Math.max(0, Number(sellingPrice));
    }
    if (originalPrice !== undefined) {
      updateData.originalPrice = Math.max(0, Number(originalPrice));
    }
    if (stock !== undefined) {
      updateData.stock = Math.max(0, Math.floor(Number(stock)));
    }
    if (minStockAlert !== undefined) {
      updateData.minStockAlert = Math.max(0, Math.floor(Number(minStockAlert)));
    }
    if (discountWhenBoughtWithPhone !== undefined) {
      updateData.discountWhenBoughtWithPhone = Math.max(0, Math.min(100, Number(discountWhenBoughtWithPhone)));
    }
    if (pointsToRedeem !== undefined) {
      updateData.pointsToRedeem = Math.max(0, Math.floor(Number(pointsToRedeem)));
    }

    const updated = await prisma.accessoryProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phụ kiện thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('Accessories API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật phụ kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID phụ kiện cần xóa' },
        { status: 400 }
      );
    }

    await prisma.accessoryProduct.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa phụ kiện thành công',
    });
  } catch (error: any) {
    console.error('Accessories API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa phụ kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

