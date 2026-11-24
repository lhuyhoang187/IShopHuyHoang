import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

export async function GET() {
  try {
    const dbCategories = await db.query(
      `SELECT MaDanhMuc AS id, MaCode AS code, TenDanhMuc AS name, MoTa AS description,
              BieuTuong AS icon, ThuTuHienThi AS displayOrder, DangHoatDong AS isActive
       FROM DanhMucPhuKien
       WHERE DangHoatDong = 1
       ORDER BY ThuTuHienThi ASC`
    );

    const counts = await db.query(
      'SELECT MaDanhMuc AS categoryId, COUNT(*) as cnt FROM SanPhamPhuKien GROUP BY MaDanhMuc'
    );

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.categoryId] = Number(c.cnt || 0);
    }

    const categories = dbCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      productCount: countMap[c.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_accessory_category',
      data: categories,
    });
  } catch (error: any) {
    console.error('Accessories Categories GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục phụ kiện: ' + (error?.message || '') },
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
      const existing = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ?', [oldCode]);
      if (existing) {
        await db.execute(
          `UPDATE DanhMucPhuKien SET
             MaCode = ?, TenDanhMuc = ?, MoTa = ?, NgayCapNhat = NOW()
           WHERE MaDanhMuc = ?`,
          [cleanCode, cleanName, description || null, existing.id]
        );
      } else {
        await db.execute(
          `INSERT INTO DanhMucPhuKien (MaDanhMuc, MaCode, TenDanhMuc, MoTa, DangHoatDong, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
          ['acc_cat_' + Date.now(), cleanCode, cleanName, description || null]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật tên danh mục thành công',
        data: { code: cleanCode, name: cleanName },
      });
    }

    const existing = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ?', [cleanCode]);
    let catId = existing?.id;
    if (existing) {
      await db.execute(
        `UPDATE DanhMucPhuKien SET TenDanhMuc = ?, MoTa = ?, DangHoatDong = 1, NgayCapNhat = NOW() WHERE MaDanhMuc = ?`,
        [cleanName, description || null, catId]
      );
    } else {
      catId = 'acc_cat_' + Date.now();
      await db.execute(
        `INSERT INTO DanhMucPhuKien (MaDanhMuc, MaCode, TenDanhMuc, MoTa, DangHoatDong, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [catId, cleanCode, cleanName, description || null]
      );
    }

    const created = await db.queryOne(
      `SELECT MaDanhMuc AS id, MaCode AS code, TenDanhMuc AS name, MoTa AS description,
              BieuTuong AS icon, ThuTuHienThi AS displayOrder, DangHoatDong AS isActive,
              NgayTao AS createdAt, NgayCapNhat AS updatedAt
       FROM DanhMucPhuKien WHERE MaDanhMuc = ?`,
      [catId]
    );

    return NextResponse.json({
      success: true,
      message: 'Đã tạo danh mục mới thành công',
      data: created,
    });
  } catch (error: any) {
    console.error('Accessories Categories POST error:', error);
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

    const target = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ?', [code]);
    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục cần xóa' }, { status: 404 });
    }

    let otherCat = await db.queryOne('SELECT MaDanhMuc AS id FROM DanhMucPhuKien WHERE MaCode = ?', ['other']);
    if (!otherCat) {
      const otherId = 'acc_cat_other_' + Date.now();
      await db.execute(
        `INSERT INTO DanhMucPhuKien (MaDanhMuc, MaCode, TenDanhMuc, DangHoatDong, NgayTao, NgayCapNhat)
         VALUES (?, 'other', 'Phụ kiện khác', 1, NOW(), NOW())`,
        [otherId]
      );
      otherCat = { id: otherId };
    }

    if (target.id !== otherCat.id) {
      await db.execute(
        'UPDATE SanPhamPhuKien SET MaDanhMuc = ?, NgayCapNhat = NOW() WHERE MaDanhMuc = ?',
        [otherCat.id, target.id]
      );
      await db.execute('DELETE FROM DanhMucPhuKien WHERE MaDanhMuc = ?', [target.id]);
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa danh mục và chuyển các sản phẩm liên quan về 'Phụ kiện khác'`,
    });
  } catch (error: any) {
    console.error('Accessories Categories DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa danh mục: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
