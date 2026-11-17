import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    let sql = 'SELECT * FROM accessoryproduct';
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (search) {
      whereClauses.push('(name LIKE ? OR barcode LIKE ? OR brand LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const accessories = await db.query(sql, params);

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

      await db.execute(
        `INSERT INTO accessoryproduct 
         (id, name, slug, category, categoryName, barcode, brand, costPrice, sellingPrice, originalPrice, stock, minStockAlert, imageUrl, specs, description, compatibleWith, discountWhenBoughtWithPhone, pointsToRedeem, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          generatedId,
          sanitizeString(name, 191),
          generatedSlug,
          category || 'other',
          categoryName || 'Phụ kiện khác',
          sanitizeString(barcode, 50),
          brand || 'Khác',
          Number(costPrice) || 0,
          Number(sellingPrice) || 0,
          Number(originalPrice) || Number(sellingPrice) || 0,
          Math.max(0, Math.floor(Number(stock) || 0)),
          Math.max(0, Math.floor(Number(minStockAlert) || 5)),
          imageUrl || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
          specs || '',
          description || '',
          compatibleWith || 'Tất cả thiết bị',
          Number(discountWhenBoughtWithPhone) || 15,
          pointsToRedeem !== undefined ? Math.max(0, Math.floor(Number(pointsToRedeem))) : null,
        ]
      );

      const newAccessory = await db.queryOne('SELECT * FROM accessoryproduct WHERE id = ?', [generatedId]);

      return NextResponse.json({
        success: true,
        message: 'Thêm phụ kiện mới thành công',
        data: newAccessory,
      });
    }

    // 2. Chỉnh sửa phụ kiện đã có
    const setClauses: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      setClauses.push('name = ?');
      params.push(sanitizeString(name, 191));
    }
    if (barcode !== undefined) {
      setClauses.push('barcode = ?');
      params.push(sanitizeString(barcode, 50));
    }
    if (brand !== undefined) {
      setClauses.push('brand = ?');
      params.push(sanitizeString(brand, 100));
    }
    if (category !== undefined) {
      setClauses.push('category = ?');
      params.push(category);
    }
    if (categoryName !== undefined) {
      setClauses.push('categoryName = ?');
      params.push(categoryName);
    }
    if (imageUrl !== undefined) {
      setClauses.push('imageUrl = ?');
      params.push(imageUrl);
    }
    if (specs !== undefined) {
      setClauses.push('specs = ?');
      params.push(specs);
    }
    if (description !== undefined) {
      setClauses.push('description = ?');
      params.push(description);
    }
    if (compatibleWith !== undefined) {
      setClauses.push('compatibleWith = ?');
      params.push(compatibleWith);
    }
    if (costPrice !== undefined) {
      setClauses.push('costPrice = ?');
      params.push(Math.max(0, Number(costPrice)));
    }
    if (sellingPrice !== undefined) {
      setClauses.push('sellingPrice = ?');
      params.push(Math.max(0, Number(sellingPrice)));
    }
    if (originalPrice !== undefined) {
      setClauses.push('originalPrice = ?');
      params.push(Math.max(0, Number(originalPrice)));
    }
    if (stock !== undefined) {
      setClauses.push('stock = ?');
      params.push(Math.max(0, Math.floor(Number(stock))));
    }
    if (minStockAlert !== undefined) {
      setClauses.push('minStockAlert = ?');
      params.push(Math.max(0, Math.floor(Number(minStockAlert))));
    }
    if (discountWhenBoughtWithPhone !== undefined) {
      setClauses.push('discountWhenBoughtWithPhone = ?');
      params.push(Math.max(0, Math.min(100, Number(discountWhenBoughtWithPhone))));
    }
    if (pointsToRedeem !== undefined) {
      setClauses.push('pointsToRedeem = ?');
      params.push(Math.max(0, Math.floor(Number(pointsToRedeem))));
    }

    if (setClauses.length > 0) {
      setClauses.push('updatedAt = NOW()');
      params.push(id);
      await db.execute(`UPDATE accessoryproduct SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const updated = await db.queryOne('SELECT * FROM accessoryproduct WHERE id = ?', [id]);

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

    await db.execute('DELETE FROM accessoryproduct WHERE id = ?', [id]);

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
