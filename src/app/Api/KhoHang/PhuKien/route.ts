import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

const ACC_SELECT = `
  a.MaPhuKien AS id,
  a.TenPhuKien AS name,
  a.DuongDan AS slug,
  a.MaDanhMuc AS categoryId,
  a.MaVach AS barcode,
  a.ThuongHieu AS brand,
  a.GiaVon AS costPrice,
  a.GiaBan AS sellingPrice,
  a.GiaGoc AS originalPrice,
  a.TonKho AS stock,
  a.CanhBaoTonToiThieu AS minStockAlert,
  a.HinhAnh AS imageUrl,
  a.MoTa AS description,
  a.ThongSo AS specs,
  a.TuongThich AS compatibleWith,
  a.GiamGiaKhiMuaKem AS discountWhenBoughtWithPhone,
  a.DiemDoiQua AS pointsToRedeem,
  a.DiemThuong AS pointsReward,
  a.NgayTao AS createdAt,
  a.NgayCapNhat AS updatedAt,
  c.MaCode AS category,
  c.TenDanhMuc AS categoryName
`;

async function resolveAccessoryCategoryId(code?: string, categoryName?: string): Promise<string> {
  const cleanCode = sanitizeString(code || 'other', 50).toLowerCase();
  const cat = await db.queryOne(
    'SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ? OR MaDanhMuc = ?',
    [cleanCode, code || '']
  );
  if (cat?.id) return cat.id;

  const fallback = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ?', ['other']);
  if (fallback?.id) return fallback.id;

  const newId = 'acc_cat_' + Date.now();
  await db.execute(
    `INSERT INTO DanhMucPhuKien (MaDanhMuc, MaCode, TenDanhMuc, DangHoatDong, NgayTao, NgayCapNhat)
     VALUES (?, ?, ?, 1, NOW(), NOW())`,
    [newId, cleanCode || 'other', sanitizeString(categoryName || 'Phụ kiện khác', 100)]
  );
  return newId;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    let sql = `
      SELECT ${ACC_SELECT}
      FROM SanPhamPhuKien a
      LEFT JOIN DanhMucPhuKien c ON a.MaDanhMuc = c.MaDanhMuc
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      whereClauses.push('(c.MaCode = ? OR a.MaDanhMuc = ?)');
      params.push(category, category);
    }
    if (search) {
      whereClauses.push('(a.TenPhuKien LIKE ? OR a.MaVach LIKE ? OR a.ThuongHieu LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY a.NgayTao DESC';

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
      categoryId,
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

      const resolvedCategoryId = await resolveAccessoryCategoryId(categoryId || category, categoryName);

      await db.execute(
        `INSERT INTO SanPhamPhuKien
         (MaPhuKien, TenPhuKien, DuongDan, MaDanhMuc, MaVach, ThuongHieu, GiaVon, GiaBan, GiaGoc, TonKho, CanhBaoTonToiThieu, HinhAnh, ThongSo, MoTa, TuongThich, GiamGiaKhiMuaKem, DiemDoiQua, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          generatedId,
          sanitizeString(name, 191),
          generatedSlug,
          resolvedCategoryId,
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

      const newAccessory = await db.queryOne(
        `SELECT ${ACC_SELECT}
         FROM SanPhamPhuKien a
         LEFT JOIN DanhMucPhuKien c ON a.MaDanhMuc = c.MaDanhMuc
         WHERE a.MaPhuKien = ?`,
        [generatedId]
      );

      return NextResponse.json({
        success: true,
        message: 'Thêm phụ kiện mới thành công',
        data: newAccessory,
      });
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      setClauses.push('TenPhuKien = ?');
      params.push(sanitizeString(name, 191));
    }
    if (barcode !== undefined) {
      setClauses.push('MaVach = ?');
      params.push(sanitizeString(barcode, 50));
    }
    if (brand !== undefined) {
      setClauses.push('ThuongHieu = ?');
      params.push(sanitizeString(brand, 100));
    }
    if (categoryId !== undefined || category !== undefined) {
      const resolvedCatId = await resolveAccessoryCategoryId(categoryId || category, categoryName);
      setClauses.push('MaDanhMuc = ?');
      params.push(resolvedCatId);
    }
    if (imageUrl !== undefined) {
      setClauses.push('HinhAnh = ?');
      params.push(imageUrl);
    }
    if (specs !== undefined) {
      setClauses.push('ThongSo = ?');
      params.push(specs);
    }
    if (description !== undefined) {
      setClauses.push('MoTa = ?');
      params.push(description);
    }
    if (compatibleWith !== undefined) {
      setClauses.push('TuongThich = ?');
      params.push(compatibleWith);
    }
    if (costPrice !== undefined) {
      setClauses.push('GiaVon = ?');
      params.push(Math.max(0, Number(costPrice)));
    }
    if (sellingPrice !== undefined) {
      setClauses.push('GiaBan = ?');
      params.push(Math.max(0, Number(sellingPrice)));
    }
    if (originalPrice !== undefined) {
      setClauses.push('GiaGoc = ?');
      params.push(Math.max(0, Number(originalPrice)));
    }
    if (stock !== undefined) {
      setClauses.push('TonKho = ?');
      params.push(Math.max(0, Math.floor(Number(stock))));
    }
    if (minStockAlert !== undefined) {
      setClauses.push('CanhBaoTonToiThieu = ?');
      params.push(Math.max(0, Math.floor(Number(minStockAlert))));
    }
    if (discountWhenBoughtWithPhone !== undefined) {
      setClauses.push('GiamGiaKhiMuaKem = ?');
      params.push(Math.max(0, Math.min(100, Number(discountWhenBoughtWithPhone))));
    }
    if (pointsToRedeem !== undefined) {
      setClauses.push('DiemDoiQua = ?');
      params.push(Math.max(0, Math.floor(Number(pointsToRedeem))));
    }

    if (setClauses.length > 0) {
      setClauses.push('NgayCapNhat = NOW()');
      params.push(id);
      await db.execute(`UPDATE SanPhamPhuKien SET ${setClauses.join(', ')} WHERE MaPhuKien = ?`, params);
    }

    const updated = await db.queryOne(
      `SELECT ${ACC_SELECT}
       FROM SanPhamPhuKien a
       LEFT JOIN DanhMucPhuKien c ON a.MaDanhMuc = c.MaDanhMuc
       WHERE a.MaPhuKien = ?`,
      [id]
    );

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

    await db.execute('DELETE FROM SanPhamPhuKien WHERE MaPhuKien = ?', [id]);

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
