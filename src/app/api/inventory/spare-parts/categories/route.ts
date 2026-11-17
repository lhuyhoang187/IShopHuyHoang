import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const dbCategories = await db.query(
      'SELECT * FROM sparepartcategory WHERE isActive = 1 ORDER BY displayOrder ASC'
    );

    const counts = await db.query(
      'SELECT category, COUNT(*) as cnt FROM sparepart GROUP BY category'
    );

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.category] = Number(c.cnt || 0);
    }

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
      const existing = await db.queryOne('SELECT id FROM sparepartcategory WHERE code = ?', [oldCode]);
      if (existing) {
        await db.execute(
          `UPDATE sparepartcategory SET 
             code = ?, name = ?, description = ?, updatedAt = NOW()
           WHERE id = ?`,
          [cleanCode, cleanName, description || null, existing.id]
        );
      } else {
        await db.execute(
          `INSERT INTO sparepartcategory (id, code, name, description, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
          ['sp_cat_' + Date.now(), cleanCode, cleanName, description || null]
        );
      }

      await db.execute(
        `UPDATE sparepart SET category = ?, categoryName = ?, updatedAt = NOW() WHERE category = ?`,
        [cleanCode, cleanName, oldCode]
      );

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật tên danh mục linh kiện thành công',
        data: { code: cleanCode, name: cleanName },
      });
    }

    // Action create
    const existing = await db.queryOne('SELECT id FROM sparepartcategory WHERE code = ?', [cleanCode]);
    let catId = existing?.id;
    if (existing) {
      await db.execute(
        `UPDATE sparepartcategory SET name = ?, description = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
        [cleanName, description || null, catId]
      );
    } else {
      catId = 'sp_cat_' + Date.now();
      await db.execute(
        `INSERT INTO sparepartcategory (id, code, name, description, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [catId, cleanCode, cleanName, description || null]
      );
    }

    const created = await db.queryOne('SELECT * FROM sparepartcategory WHERE id = ?', [catId]);

    return NextResponse.json({
      success: true,
      message: 'Đã tạo danh mục linh kiện mới thành công',
      data: created,
    });
  } catch (error: any) {
    console.error('Spare Part Categories POST error:', error);
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

    await db.execute('DELETE FROM sparepartcategory WHERE code = ?', [code]);
    await db.execute(
      'UPDATE sparepart SET category = "other", categoryName = "Linh kiện khác", updatedAt = NOW() WHERE category = ?',
      [code]
    );

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục và chuyển các linh kiện liên quan về 'Linh kiện khác'`,
    });
  } catch (error: any) {
    console.error('Spare Part Categories DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa danh mục: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
