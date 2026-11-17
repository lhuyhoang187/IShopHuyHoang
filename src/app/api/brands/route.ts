import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const brands = await db.query(
      `SELECT * FROM phonebrand 
       WHERE isActive = 1 
       ORDER BY displayOrder ASC`
    );

    const mapped = brands.map((b) => ({
      ...b,
      isActive: Boolean(b.isActive),
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    console.error('Phone brands GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, country, description, logoUrl, displayOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên thương hiệu không được để trống' }, { status: 400 });
    }

    const cleanName = sanitizeString(name, 50);
    const cleanSlug = sanitizeString(
      slug ||
        cleanName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      50
    );

    const existing = await db.queryOne(
      'SELECT id, name, slug, country, description, logoUrl, displayOrder FROM phonebrand WHERE name = ? OR slug = ?',
      [cleanName, cleanSlug]
    );

    let brandId = existing?.id;
    if (existing) {
      await db.execute(
        `UPDATE phonebrand SET 
           name = ?, country = ?, description = ?, logoUrl = ?, displayOrder = ?, isActive = 1, updatedAt = NOW()
         WHERE id = ?`,
        [
          cleanName,
          country ? sanitizeString(country, 50) : existing.country,
          description || existing.description,
          logoUrl || existing.logoUrl,
          displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
          brandId,
        ]
      );
    } else {
      brandId = 'brand_' + Date.now();
      await db.execute(
        `INSERT INTO phonebrand 
         (id, name, slug, country, description, logoUrl, displayOrder, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          brandId,
          cleanName,
          cleanSlug,
          country ? sanitizeString(country, 50) : null,
          description || null,
          logoUrl || null,
          Number(displayOrder) || 0,
        ]
      );
    }

    const brand = await db.queryOne('SELECT * FROM phonebrand WHERE id = ?', [brandId]);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thương hiệu thành công',
      data: brand ? { ...brand, isActive: Boolean(brand.isActive) } : null,
    });
  } catch (error: any) {
    console.error('Phone brands POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let name = searchParams.get('name');

    if (!id && !name) {
      try {
        const body = await request.json();
        id = body.id;
        name = body.name;
      } catch (e) {
        // ignore parse error if no body
      }
    }

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc Tên thương hiệu cần xóa' },
        { status: 400 }
      );
    }

    const cleanName = name ? sanitizeString(name, 50) : undefined;

    let target = null;
    if (id) {
      target = await db.queryOne('SELECT * FROM phonebrand WHERE id = ?', [id]);
    }
    if (!target && cleanName) {
      target = await db.queryOne('SELECT * FROM phonebrand WHERE name = ?', [cleanName]);
    }

    if (!target) {
      return NextResponse.json(
        { error: 'Không tìm thấy thương hiệu cần xóa' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM phonebrand WHERE id = ?', [target.id]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa thương hiệu "${target.name}" thành công`,
      data: target,
    });
  } catch (error: any) {
    console.error('Phone brands DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
