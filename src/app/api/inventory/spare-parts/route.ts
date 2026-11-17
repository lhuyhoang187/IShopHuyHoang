import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    let sql = 'SELECT * FROM sparepart';
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }
    if (search) {
      whereClauses.push('(name LIKE ? OR barcode LIKE ? OR compatibleModels LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const spareParts = await db.query(sql, params);

    const parsed = spareParts.map((sp) => {
      let models: string[] = [];
      try {
        models = typeof sp.compatibleModels === 'string'
          ? (sp.compatibleModels.startsWith('[') ? JSON.parse(sp.compatibleModels) : sp.compatibleModels.split(',').map((s: string) => s.trim()).filter(Boolean))
          : [];
      } catch (e) {
        models = sp.compatibleModels ? [sp.compatibleModels] : [];
      }
      return {
        ...sp,
        compatibleModels: models,
      };
    });

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

    const cleanBarcode = barcode ? sanitizeString(barcode, 50) : `LK${Date.now()}`;
    const cleanId = id || `sp-${cleanBarcode}`;
    const cleanName = sanitizeString(name || 'Linh kiện thay thế', 191);
    const cleanCat = category || 'other';
    const cleanCatName = categoryName || 'Linh kiện khác';
    const cleanCost = Number(costPrice) || 0;
    const cleanRetail = Number(retailRepairPrice) || 0;
    const cleanStock = Math.max(0, Math.floor(Number(stock) || 0));
    const cleanUnit = unit ? sanitizeString(unit, 20) : 'cái';
    const cleanWarranty = Number(warrantyMonths) || 6;

    const formattedModels = Array.isArray(compatibleModels)
      ? JSON.stringify(compatibleModels)
      : typeof compatibleModels === 'string'
      ? JSON.stringify(compatibleModels.split(',').map((s: string) => s.trim()).filter(Boolean))
      : '[]';

    const existing = await db.queryOne('SELECT id FROM sparepart WHERE id = ?', [cleanId]);

    if (existing) {
      await db.execute(
        `UPDATE sparepart SET 
           name = ?, category = ?, categoryName = ?, barcode = ?, compatibleModels = ?, 
           costPrice = ?, retailRepairPrice = ?, stock = ?, unit = ?, warrantyMonths = ?, updatedAt = NOW()
         WHERE id = ?`,
        [
          cleanName,
          cleanCat,
          cleanCatName,
          cleanBarcode,
          formattedModels,
          cleanCost,
          cleanRetail,
          cleanStock,
          cleanUnit,
          cleanWarranty,
          cleanId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO sparepart 
         (id, name, category, categoryName, barcode, compatibleModels, costPrice, retailRepairPrice, stock, unit, warrantyMonths, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          cleanId,
          cleanName,
          cleanCat,
          cleanCatName,
          cleanBarcode,
          formattedModels,
          cleanCost,
          cleanRetail,
          cleanStock,
          cleanUnit,
          cleanWarranty,
        ]
      );
    }

    const part = await db.queryOne('SELECT * FROM sparepart WHERE id = ?', [cleanId]);

    return NextResponse.json({
      success: true,
      message: action === 'create' ? 'Đã thêm linh kiện mới thành công' : 'Cập nhật linh kiện thành công',
      data: part,
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
