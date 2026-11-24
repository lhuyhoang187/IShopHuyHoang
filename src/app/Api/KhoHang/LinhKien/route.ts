import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

const PART_SELECT = `
  sp.MaLinhKien AS id,
  sp.TenLinhKien AS name,
  sp.MaDanhMuc AS categoryId,
  sp.MaVach AS barcode,
  sp.GiaVon AS costPrice,
  sp.GiaThayThe AS retailRepairPrice,
  sp.TonKho AS stock,
  sp.DonViTinh AS unit,
  sp.SoThangBaoHanh AS warrantyMonths,
  sp.NgayTao AS createdAt,
  sp.NgayCapNhat AS updatedAt,
  sc.MaCode AS category,
  sc.TenDanhMuc AS categoryName
`;

async function resolveSparePartCategoryId(code?: string, categoryName?: string): Promise<string> {
  const cleanCode = sanitizeString(code || 'other', 50).toLowerCase();
  const cat = await db.queryOne(
    'SELECT MaDanhMuc AS id FROM DanhMucLinhKien WHERE MaCode = ? OR MaDanhMuc = ?',
    [cleanCode, code || '']
  );
  if (cat?.id) return cat.id;

  const fallback = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucLinhKien WHERE MaCode = ?', ['other']);
  if (fallback?.id) return fallback.id;

  const newId = 'sp_cat_' + Date.now();
  await db.execute(
    `INSERT INTO DanhMucLinhKien (MaDanhMuc, MaCode, TenDanhMuc, DangHoatDong, NgayTao, NgayCapNhat)
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
      SELECT ${PART_SELECT}
      FROM LinhKienSuaChua sp
      LEFT JOIN DanhMucLinhKien sc ON sp.MaDanhMuc = sc.MaDanhMuc
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClauses.push('(sc.MaCode = ? OR sp.MaDanhMuc = ?)');
      params.push(category, category);
    }
    if (search) {
      whereClauses.push(
        '(sp.TenLinhKien LIKE ? OR sp.MaVach LIKE ? OR EXISTS (SELECT 1 FROM TuongThichLinhKien c WHERE c.MaLinhKien = sp.MaLinhKien AND c.DongMay LIKE ?))'
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY sp.NgayTao DESC';

    const spareParts = await db.query(sql, params);
    const allCompats = await db.query(
      'SELECT MaLinhKien AS sparePartId, DongMay AS deviceModel FROM TuongThichLinhKien ORDER BY MaTuongThich ASC'
    );

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

    const existing = id
      ? await db.queryOne('SELECT MaLinhKien AS id, TenLinhKien AS name FROM LinhKienSuaChua WHERE MaLinhKien = ?', [id])
      : null;

    if (existing) {
      await db.transaction(async (conn) => {
        const setClauses: string[] = [];
        const params: any[] = [];

        if (name !== undefined) {
          setClauses.push('TenLinhKien = ?');
          params.push(sanitizeString(name || existing.name, 191));
        }
        if (categoryId !== undefined || category !== undefined) {
          const resolvedCategoryId = await resolveSparePartCategoryId(categoryId || category, categoryName);
          setClauses.push('MaDanhMuc = ?');
          params.push(resolvedCategoryId);
        }
        if (barcode !== undefined) {
          setClauses.push('MaVach = ?');
          params.push(sanitizeString(barcode, 50));
        }
        if (costPrice !== undefined) {
          setClauses.push('GiaVon = ?');
          params.push(Math.max(0, Number(costPrice) || 0));
        }
        if (retailRepairPrice !== undefined) {
          setClauses.push('GiaThayThe = ?');
          params.push(Math.max(0, Number(retailRepairPrice) || 0));
        }
        if (stock !== undefined) {
          setClauses.push('TonKho = ?');
          params.push(Math.max(0, Math.floor(Number(stock) || 0)));
        }
        if (unit !== undefined) {
          setClauses.push('DonViTinh = ?');
          params.push(sanitizeString(unit, 20) || 'cái');
        }
        if (warrantyMonths !== undefined) {
          setClauses.push('SoThangBaoHanh = ?');
          params.push(Number(warrantyMonths) || 6);
        }

        if (setClauses.length > 0) {
          setClauses.push('NgayCapNhat = NOW()');
          params.push(existing.id);
          await conn.execute(`UPDATE LinhKienSuaChua SET ${setClauses.join(', ')} WHERE MaLinhKien = ?`, params);
        }

        if (compatibleModels !== undefined) {
          const modelList: string[] = Array.isArray(compatibleModels)
            ? compatibleModels.map((m: any) => sanitizeString(String(m), 150)).filter(Boolean)
            : typeof compatibleModels === 'string'
            ? compatibleModels.split(',').map((s: string) => sanitizeString(s, 150)).filter(Boolean)
            : [];
          await conn.execute('DELETE FROM TuongThichLinhKien WHERE MaLinhKien = ?', [existing.id]);
          for (const m of Array.from(new Set(modelList))) {
            const compatId = 'spc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await conn.execute(
              `INSERT INTO TuongThichLinhKien (MaTuongThich, MaLinhKien, DongMay, NgayTao)
               VALUES (?, ?, ?, NOW())`,
              [compatId, existing.id, m]
            );
          }
        }
      });

      const part = await db.queryOne(
        `SELECT ${PART_SELECT}
         FROM LinhKienSuaChua sp
         LEFT JOIN DanhMucLinhKien sc ON sp.MaDanhMuc = sc.MaDanhMuc
         WHERE sp.MaLinhKien = ?`,
        [existing.id]
      );
      const compats = await db.query(
        'SELECT DongMay AS deviceModel FROM TuongThichLinhKien WHERE MaLinhKien = ? ORDER BY MaTuongThich ASC',
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
        `INSERT INTO LinhKienSuaChua
         (MaLinhKien, TenLinhKien, MaDanhMuc, MaVach, GiaVon, GiaThayThe, TonKho, DonViTinh, SoThangBaoHanh, NgayTao, NgayCapNhat)
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
          `INSERT INTO TuongThichLinhKien (MaTuongThich, MaLinhKien, DongMay, NgayTao)
           VALUES (?, ?, ?, NOW())`,
          [compatId, cleanId, m]
        );
      }
    });

    const part = await db.queryOne(
      `SELECT ${PART_SELECT}
       FROM LinhKienSuaChua sp
       LEFT JOIN DanhMucLinhKien sc ON sp.MaDanhMuc = sc.MaDanhMuc
       WHERE sp.MaLinhKien = ?`,
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

    await db.execute('DELETE FROM LinhKienSuaChua WHERE MaLinhKien = ?', [id]);

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
