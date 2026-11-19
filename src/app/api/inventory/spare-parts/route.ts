import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

async function resolveSparePartCategoryId(code?: string, categoryName?: string): Promise<string> {
  const cleanCode = sanitizeString(code || 'other', 50).toLowerCase();
  const cat = await db.queryOne('SELECT id FROM sparepartcategory WHERE code = ? OR id = ?', [cleanCode, code || '']);
  if (cat?.id) return cat.id;

  const fallback = await db.queryOne('SELECT id FROM sparepartcategory WHERE code = ?', ['other']);
  if (fallback?.id) return fallback.id;

  const newId = 'sp_cat_' + Date.now();
  await db.execute(
    `INSERT INTO sparepartcategory (id, code, name, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [newId, cleanCode || 'other', sanitizeString(categoryName || 'Linh kiện khác', 100)]
  );
  return newId;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    let sql = `
      SELECT sp.*, sc.code AS category, sc.name AS categoryName
      FROM sparepart sp
      LEFT JOIN sparepartcategory sc ON sp.categoryId = sc.id
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClauses.push('(sc.code = ? OR sp.categoryId = ?)');
      params.push(category, category);
    }
    if (search) {
      whereClauses.push(
        '(sp.name LIKE ? OR sp.barcode LIKE ? OR EXISTS (SELECT 1 FROM sparepartcompatibility c WHERE c.sparePartId = sp.id AND c.deviceModel LIKE ?))'
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY sp.createdAt DESC';

    const spareParts = await db.query(sql, params);
    const allCompats = await db.query('SELECT sparePartId, deviceModel FROM sparepartcompatibility ORDER BY id ASC');

    const compatMap: Record<string, string[]> = {};
    for (const c of allCompats) {
      if (!compatMap[c.sparePartId]) compatMap[c.sparePartId] = [];
      compatMap[c.sparePartId].push(c.deviceModel);
    }

    const parsed = spareParts.map((sp) => ({
      ...sp,
      compatibleModels: compatMap[sp.id] || [],
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('SpareParts API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh mục linh kiện: ' + (error?.message || '') },
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
      categoryId,
      categoryName,
      barcode,
      compatibleModels,
      costPrice,
      retailRepairPrice,
      stock,
      unit,
      warrantyMonths,
      action,
    } = body;

    if (!id && !barcode) {
      return NextResponse.json(
        { error: 'Thiếu ID hoặc mã Barcode linh kiện' },
        { status: 400 }
      );
    }

    const existing = id ? await db.queryOne('SELECT * FROM sparepart WHERE id = ?', [id]) : null;

    if (existing) {
      await db.transaction(async (conn) => {
        const setClauses: string[] = [];
        const params: any[] = [];

        if (name !== undefined) {
          setClauses.push('name = ?');
          params.push(sanitizeString(name || existing.name, 191));
        }
        if (categoryId !== undefined || category !== undefined) {
          const resolvedCategoryId = await resolveSparePartCategoryId(categoryId || category, categoryName);
          setClauses.push('categoryId = ?');
          params.push(resolvedCategoryId);
        }
        if (barcode !== undefined) {
          setClauses.push('barcode = ?');
          params.push(sanitizeString(barcode, 50));
        }
        if (costPrice !== undefined) {
          setClauses.push('costPrice = ?');
          params.push(Math.max(0, Number(costPrice) || 0));
        }
        if (retailRepairPrice !== undefined) {
          setClauses.push('retailRepairPrice = ?');
          params.push(Math.max(0, Number(retailRepairPrice) || 0));
        }
        if (stock !== undefined) {
          setClauses.push('stock = ?');
          params.push(Math.max(0, Math.floor(Number(stock) || 0)));
        }
        if (unit !== undefined) {
          setClauses.push('unit = ?');
          params.push(sanitizeString(unit, 20) || 'cái');
        }
        if (warrantyMonths !== undefined) {
          setClauses.push('warrantyMonths = ?');
          params.push(Number(warrantyMonths) || 6);
        }

        if (setClauses.length > 0) {
          setClauses.push('updatedAt = NOW()');
          params.push(existing.id);
          await conn.execute(`UPDATE sparepart SET ${setClauses.join(', ')} WHERE id = ?`, params);
        }

        if (compatibleModels !== undefined) {
          const modelList: string[] = Array.isArray(compatibleModels)
            ? compatibleModels.map((m: any) => sanitizeString(String(m), 150)).filter(Boolean)
            : typeof compatibleModels === 'string'
            ? compatibleModels.split(',').map((s: string) => sanitizeString(s, 150)).filter(Boolean)
            : [];
          await conn.execute('DELETE FROM sparepartcompatibility WHERE sparePartId = ?', [existing.id]);
          for (const m of Array.from(new Set(modelList))) {
            const compatId = 'spc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await conn.execute(
              `INSERT INTO sparepartcompatibility (id, sparePartId, deviceModel, createdAt)
               VALUES (?, ?, ?, NOW())`,
              [compatId, existing.id, m]
            );
          }
        }
      });

      const part = await db.queryOne(
        `SELECT sp.*, sc.code AS category, sc.name AS categoryName
         FROM sparepart sp
         LEFT JOIN sparepartcategory sc ON sp.categoryId = sc.id
         WHERE sp.id = ?`,
        [existing.id]
      );
      const compats = await db.query(
        'SELECT deviceModel FROM sparepartcompatibility WHERE sparePartId = ? ORDER BY id ASC',
        [existing.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Cập nhật linh kiện thành công',
        data: part ? { ...part, compatibleModels: compats.map((c) => c.deviceModel) } : null,
      });
    }

    const cleanBarcode = barcode ? sanitizeString(barcode, 50) : `LK${Date.now()}`;
    const cleanId = id || `sp-${cleanBarcode}`;
    const cleanName = sanitizeString(name || 'Linh kiện thay thế', 191);
    const resolvedCategoryId = await resolveSparePartCategoryId(categoryId || category, categoryName);
    const cleanCost = Number(costPrice) || 0;
    const cleanRetail = Number(retailRepairPrice) || 0;
    const cleanStock = Math.max(0, Math.floor(Number(stock) || 0));
    const cleanUnit = unit ? sanitizeString(unit, 20) : 'cái';
    const cleanWarranty = Number(warrantyMonths) || 6;

    const modelList: string[] = Array.isArray(compatibleModels)
      ? compatibleModels.map((m: any) => sanitizeString(String(m), 150)).filter(Boolean)
      : typeof compatibleModels === 'string'
      ? compatibleModels.split(',').map((s: string) => sanitizeString(s, 150)).filter(Boolean)
      : [];

    await db.transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO sparepart
         (id, name, categoryId, barcode, costPrice, retailRepairPrice, stock, unit, warrantyMonths, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          cleanId,
          cleanName,
          resolvedCategoryId,
          cleanBarcode,
          cleanCost,
          cleanRetail,
          cleanStock,
          cleanUnit,
          cleanWarranty,
        ]
      );

      for (const m of Array.from(new Set(modelList))) {
        const compatId = 'spc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO sparepartcompatibility (id, sparePartId, deviceModel, createdAt)
           VALUES (?, ?, ?, NOW())`,
          [compatId, cleanId, m]
        );
      }
    });

    const part = await db.queryOne(
      `SELECT sp.*, sc.code AS category, sc.name AS categoryName
       FROM sparepart sp
       LEFT JOIN sparepartcategory sc ON sp.categoryId = sc.id
       WHERE sp.id = ?`,
      [cleanId]
    );

    return NextResponse.json({
      success: true,
      message: action === 'create' ? 'Đã thêm linh kiện mới thành công' : 'Cập nhật linh kiện thành công',
      data: part ? { ...part, compatibleModels: Array.from(new Set(modelList)) } : null,
    });
  } catch (error: any) {
    console.error('SpareParts API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu thông tin linh kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID linh kiện' }, { status: 400 });
    }

    await db.execute('DELETE FROM sparepart WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa linh kiện khỏi kho thành công',
    });
  } catch (error: any) {
    console.error('SpareParts API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa linh kiện: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
