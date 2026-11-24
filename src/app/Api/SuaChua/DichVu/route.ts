import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

const SERVICE_SELECT = `
  s.MaDichVu AS id,
  s.TenDichVu AS name,
  s.DanhMuc AS category,
  s.MaThuongHieu AS brandId,
  s.CacDongMay AS deviceModels,
  s.GiaDichVu AS price,
  s.GiaGoc AS originalPrice,
  s.ThoiHanBaoHanh AS warrantyPeriod,
  s.ThoiGianDuKienPhut AS estimatedMinutes,
  s.MoTa AS description,
  s.DichVuNoiBat AS isFeatured,
  s.DangHoatDong AS isActive,
  s.NgayTao AS createdAt,
  s.NgayCapNhat AS updatedAt,
  COALESCE(b.TenThuongHieu, 'Chung') AS deviceBrand
`;

async function resolveBrandId(deviceBrand?: string): Promise<string | null> {
  if (!deviceBrand || deviceBrand.toLowerCase() === 'chung' || deviceBrand.toLowerCase() === 'all') {
    return null;
  }
  const clean = sanitizeString(deviceBrand, 50);
  const found = await db.queryOne(
    'SELECT MaThuongHieu AS id FROM ThuongHieuDienThoai WHERE LOWER(TenThuongHieu) = LOWER(?) OR MaThuongHieu = ?',
    [clean, clean]
  );
  return found?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    let sql = `
      SELECT ${SERVICE_SELECT}
      FROM DichVuSuaChua s
      LEFT JOIN ThuongHieuDienThoai b ON s.MaThuongHieu = b.MaThuongHieu
      WHERE s.DangHoatDong = 1
    `;
    const params: any[] = [];

    if (brand && brand !== 'all') {
      sql += ' AND (b.TenThuongHieu = ? OR s.MaThuongHieu = ?)';
      params.push(brand, brand);
    }
    if (category && category !== 'all') {
      sql += ' AND s.DanhMuc = ?';
      params.push(category);
    }

    sql += ' ORDER BY s.DichVuNoiBat DESC, s.NgayTao DESC';

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
    const existing = await db.queryOne('SELECT MaDichVu AS id FROM DichVuSuaChua WHERE MaDichVu = ?', [srvId]);
    const boolFeatured = isFeatured ? 1 : 0;

    if (existing) {
      await db.execute(
        `UPDATE DichVuSuaChua SET
           TenDichVu = ?, DanhMuc = ?, MaThuongHieu = ?, CacDongMay = ?, GiaDichVu = ?, GiaGoc = ?,
           ThoiHanBaoHanh = ?, ThoiGianDuKienPhut = ?, MoTa = ?, DichVuNoiBat = ?, NgayCapNhat = NOW()
         WHERE MaDichVu = ?`,
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
        `INSERT INTO DichVuSuaChua
         (MaDichVu, TenDichVu, DanhMuc, MaThuongHieu, CacDongMay, GiaDichVu, GiaGoc, ThoiHanBaoHanh, ThoiGianDuKienPhut, MoTa, DichVuNoiBat, DangHoatDong, NgayTao, NgayCapNhat)
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
      `SELECT ${SERVICE_SELECT}
       FROM DichVuSuaChua s
       LEFT JOIN ThuongHieuDienThoai b ON s.MaThuongHieu = b.MaThuongHieu
       WHERE s.MaDichVu = ?`,
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

    await db.execute('DELETE FROM DichVuSuaChua WHERE MaDichVu = ?', [id]);

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
