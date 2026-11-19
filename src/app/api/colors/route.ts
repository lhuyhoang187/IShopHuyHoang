import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

let tableInitialized = false;

async function ensureColorCatalogTable() {
  if (tableInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS phonecolorcatalog (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      hex VARCHAR(30) NOT NULL DEFAULT '#222222',
      displayOrder INT NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const countRow = await db.queryOne('SELECT COUNT(*) AS cnt FROM phonecolorcatalog');
  if (!countRow || Number(countRow.cnt) === 0) {
    await db.execute(
      `INSERT IGNORE INTO phonecolorcatalog (id, name, hex, displayOrder, createdAt, updatedAt)
       VALUES
         ('col-default-black', 'Đen (Black)', '#222222', 1, NOW(), NOW()),
         ('col-default-white', 'Trắng (White)', '#f0f0f0', 2, NOW(), NOW())`
    );
  }

  tableInitialized = true;
}

export async function GET() {
  try {
    await ensureColorCatalogTable();
    const colors = await db.query(
      'SELECT id, name, hex, displayOrder FROM phonecolorcatalog ORDER BY displayOrder ASC, createdAt ASC'
    );

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: colors.length,
      data: colors.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex || '#222222',
        imageUrl: '',
      })),
    });
  } catch (error: any) {
    console.error('Colors API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh sách màu sắc: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureColorCatalogTable();
    const body = await request.json();
    const name = sanitizeString(body.name || '', 100);
    const hex = sanitizeString(body.hex || '#2563EB', 30);

    if (!name) {
      return NextResponse.json(
        { error: 'Tên màu sắc không được để trống' },
        { status: 400 }
      );
    }

    const existing = await db.queryOne(
      'SELECT * FROM phonecolorcatalog WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (existing) {
      await db.execute(
        'UPDATE phonecolorcatalog SET hex = ?, updatedAt = NOW() WHERE id = ?',
        [hex, existing.id]
      );
      const updated = await db.queryOne('SELECT id, name, hex FROM phonecolorcatalog WHERE id = ?', [existing.id]);
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật màu "${name}" trong CSDL`,
        data: { ...updated, imageUrl: '' },
      });
    }

    const maxOrderRow = await db.queryOne('SELECT COALESCE(MAX(displayOrder), 0) AS maxOrder FROM phonecolorcatalog');
    const nextOrder = Number(maxOrderRow?.maxOrder || 0) + 1;
    const id = 'col-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    await db.execute(
      `INSERT INTO phonecolorcatalog (id, name, hex, displayOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [id, name, hex, nextOrder]
    );

    const created = await db.queryOne('SELECT id, name, hex FROM phonecolorcatalog WHERE id = ?', [id]);
    return NextResponse.json(
      {
        success: true,
        message: `Đã lưu màu "${name}" vào CSDL MySQL thành công`,
        data: { ...created, imageUrl: '' },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Colors API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu màu sắc mới vào CSDL: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureColorCatalogTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const name = searchParams.get('name')?.trim();

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Thiếu mã hoặc tên màu sắc cần xóa' },
        { status: 400 }
      );
    }

    const countRow = await db.queryOne('SELECT COUNT(*) AS cnt FROM phonecolorcatalog');
    if (Number(countRow?.cnt || 0) <= 1) {
      return NextResponse.json(
        { error: 'Cần giữ lại ít nhất 1 màu sắc trong danh sách!' },
        { status: 400 }
      );
    }

    if (id) {
      await db.execute('DELETE FROM phonecolorcatalog WHERE id = ?', [id]);
    } else if (name) {
      await db.execute('DELETE FROM phonecolorcatalog WHERE LOWER(name) = LOWER(?)', [name]);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa màu sắc khỏi CSDL MySQL thành công',
    });
  } catch (error: any) {
    console.error('Colors API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa màu sắc: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
