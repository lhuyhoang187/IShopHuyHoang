import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

async function resolveBrandId(deviceBrand?: string): Promise<string | null> {
  if (!deviceBrand || deviceBrand.toLowerCase() === 'chung' || deviceBrand.toLowerCase() === 'all') {
    return null;
  }
  const clean = sanitizeString(deviceBrand, 50);
  const found = await db.queryOne('SELECT id FROM phonebrand WHERE LOWER(name) = LOWER(?) OR id = ?', [clean, clean]);
  return found?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    let sql = `
      SELECT s.*, COALESCE(b.name, 'Chung') AS deviceBrand
      FROM repairservice s
      LEFT JOIN phonebrand b ON s.brandId = b.id
      WHERE s.isActive = 1
    `;
    const params: any[] = [];

    if (brand && brand !== 'all') {
      sql += ' AND (b.name = ? OR s.brandId = ?)';
      params.push(brand, brand);
    }
    if (category && category !== 'all') {
      sql += ' AND s.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY s.isFeatured DESC, s.createdAt DESC';

    const services = await db.query(sql, params);

    const mapped = services.map((s) => ({
      ...s,
      isFeatured: Boolean(s.isFeatured),
      isActive: Boolean(s.isActive),
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
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
      brandId,
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
    const srvId = id || `srv-${Date.now()}`;
    const resolvedBrandId = brandId || (await resolveBrandId(deviceBrand));
    const existing = await db.queryOne('SELECT id FROM repairservice WHERE id = ?', [srvId]);
    const boolFeatured = isFeatured ? 1 : 0;

    if (existing) {
      await db.execute(
        `UPDATE repairservice SET
           name = ?, category = ?, brandId = ?, deviceModels = ?, price = ?, originalPrice = ?,
           warrantyPeriod = ?, estimatedMinutes = ?, description = ?, isFeatured = ?, updatedAt = NOW()
         WHERE id = ?`,
        [
          cleanName,
          category || 'other',
          resolvedBrandId,
          deviceModels || '',
          Number(price),
          originalPrice ? Number(originalPrice) : null,
          warrantyPeriod || '12 Tháng',
          Number(estimatedMinutes) || 30,
          description || null,
          boolFeatured,
          srvId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO repairservice
         (id, name, category, brandId, deviceModels, price, originalPrice, warrantyPeriod, estimatedMinutes, description, isFeatured, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          srvId,
          cleanName,
          category || 'other',
          resolvedBrandId,
          deviceModels || '',
          Number(price),
          originalPrice ? Number(originalPrice) : null,
          warrantyPeriod || '12 Tháng',
          Number(estimatedMinutes) || 30,
          description || null,
          boolFeatured,
        ]
      );
    }

    const service = await db.queryOne(
      `SELECT s.*, COALESCE(b.name, 'Chung') AS deviceBrand
       FROM repairservice s
       LEFT JOIN phonebrand b ON s.brandId = b.id
       WHERE s.id = ?`,
      [srvId]
    );

    return NextResponse.json({
      success: true,
      message: 'Đã lưu dịch vụ sửa chữa thành công',
      data: service ? { ...service, isFeatured: Boolean(service.isFeatured), isActive: Boolean(service.isActive) } : null,
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

    await db.execute('DELETE FROM repairservice WHERE id = ?', [id]);

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
