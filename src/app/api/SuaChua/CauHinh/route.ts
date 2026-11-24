import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';
import {
  initialRepairDeviceOptions,
  initialRepairSymptoms,
  initialRepairTimeSlots,
} from '@/ThuVien/KhoDuLieu';

export const dynamic = 'force-dynamic';

async function resolveBrandId(brandName?: string): Promise<string | null> {
  if (!brandName || brandName === 'Chung' || brandName === 'Khác') return null;
  const found = await db.queryOne(
    'SELECT MaThuongHieu AS id FROM ThuongHieuDienThoai WHERE LOWER(TenThuongHieu) = LOWER(?)',
    [brandName.trim()]
  );
  return found?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const dbServices = await db.query(
      `SELECT s.MaDichVu AS id, s.TenDichVu AS name, s.DanhMuc AS category,
              s.MaThuongHieu AS brandId, s.CacDongMay AS deviceModels,
              s.GiaDichVu AS price, s.GiaGoc AS originalPrice,
              s.ThoiHanBaoHanh AS warrantyPeriod, s.ThoiGianDuKienPhut AS estimatedMinutes,
              s.MoTa AS description, s.DichVuNoiBat AS isFeatured, s.DangHoatDong AS isActive,
              COALESCE(b.TenThuongHieu, 'Chung') AS deviceBrand
       FROM DichVuSuaChua s
       LEFT JOIN ThuongHieuDienThoai b ON s.MaThuongHieu = b.MaThuongHieu
       WHERE s.DangHoatDong = 1
       ORDER BY s.DichVuNoiBat DESC, s.NgayTao DESC`
    );

    const services = dbServices.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category || 'other',
      deviceBrand: s.deviceBrand || 'Apple',
      deviceModels: s.deviceModels || 'Tất cả dòng máy',
      price: Number(s.price || 0),
      warranty: s.warrantyPeriod || '12 Tháng',
      estimatedMinutes: Number(s.estimatedMinutes || 30),
      description: s.description || '',
      isActive: Boolean(s.isActive),
    }));

    const options = await db.query(
      `SELECT o.MaTuyChon AS id, o.LoaiTuyChon AS optionType, o.MaThuongHieu AS brandId,
              o.MaCode AS code, o.TenHienThi AS label, o.NhanPhu AS subLabel,
              o.MoTa AS description, o.BieuTuong AS icon, o.ThuTuHienThi AS displayOrder,
              o.DangHoatDong AS isActive,
              COALESCE(b.TenThuongHieu, 'Khác') AS brandName
       FROM TuyChonDatLichSuaChua o
       LEFT JOIN ThuongHieuDienThoai b ON o.MaThuongHieu = b.MaThuongHieu
       WHERE o.DangHoatDong = 1
       ORDER BY o.ThuTuHienThi ASC, o.NgayTao ASC`
    );

    const deviceRows = options.filter((o) => o.optionType === 'device');
    const symptomRows = options.filter((o) => o.optionType === 'symptom');
    const timeSlotRows = options.filter((o) => o.optionType === 'timeslot');

    const devices =
      deviceRows.length > 0
        ? deviceRows.map((d) => ({
            id: d.id,
            name: d.label,
            brand: d.brandName || 'Khác',
            isActive: Boolean(d.isActive),
          }))
        : initialRepairDeviceOptions;

    const symptoms =
      symptomRows.length > 0
        ? symptomRows.map((s) => ({
            id: s.id,
            code: s.code || s.id,
            title: s.label,
            icon: s.icon || '🛠️',
            description: s.description || '',
            isActive: Boolean(s.isActive),
          }))
        : initialRepairSymptoms;

    const timeSlots =
      timeSlotRows.length > 0
        ? timeSlotRows.map((ts) => ({
            id: ts.id,
            time: ts.code || ts.label.slice(0, 5),
            label: ts.label,
            period: (ts.subLabel as 'morning' | 'afternoon' | 'evening') || 'morning',
            isActive: Boolean(ts.isActive),
          }))
        : initialRepairTimeSlots;

    return NextResponse.json({
      success: true,
      data: {
        devices,
        services,
        symptoms,
        timeSlots,
      },
    });
  } catch (error: any) {
    console.error('Repair config GET error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          devices: initialRepairDeviceOptions,
          services: [],
          symptoms: initialRepairSymptoms,
          timeSlots: initialRepairTimeSlots,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, item, id } = body;

    if (type === 'service') {
      if ((action === 'add' || action === 'update') && item) {
        const serviceId = item.id || 'srv_' + Date.now();
        const brandId = await resolveBrandId(item.deviceBrand);
        const existing = await db.queryOne('SELECT MaDichVu AS id FROM DichVuSuaChua WHERE MaDichVu = ?', [serviceId]);

        if (existing) {
          await db.execute(
            `UPDATE DichVuSuaChua SET
               TenDichVu = ?, DanhMuc = ?, MaThuongHieu = ?, CacDongMay = ?, GiaDichVu = ?,
               ThoiHanBaoHanh = ?, ThoiGianDuKienPhut = ?, MoTa = ?, DangHoatDong = ?, NgayCapNhat = NOW()
             WHERE MaDichVu = ?`,
            [
              sanitizeString(item.name, 191),
              item.category || 'other',
              brandId,
              item.deviceModels || 'Tất cả dòng máy',
              Number(item.price) || 0,
              item.warranty || '12 Tháng',
              Number(item.estimatedMinutes) || 30,
              item.description || null,
              item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1,
              serviceId,
            ]
          );
        } else {
          await db.execute(
            `INSERT INTO DichVuSuaChua
             (MaDichVu, TenDichVu, DanhMuc, MaThuongHieu, CacDongMay, GiaDichVu, ThoiHanBaoHanh, ThoiGianDuKienPhut, MoTa, DangHoatDong, NgayTao, NgayCapNhat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              serviceId,
              sanitizeString(item.name, 191),
              item.category || 'other',
              brandId,
              item.deviceModels || 'Tất cả dòng máy',
              Number(item.price) || 0,
              item.warranty || '12 Tháng',
              Number(item.estimatedMinutes) || 30,
              item.description || null,
              item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1,
            ]
          );
        }
      } else if (action === 'delete' && id) {
        await db.execute('DELETE FROM DichVuSuaChua WHERE MaDichVu = ?', [id]);
      }
    }

    if (type === 'device' || type === 'symptom' || type === 'timeSlot') {
      const optionType = type === 'timeSlot' ? 'timeslot' : type;

      if ((action === 'add' || action === 'update') && item) {
        const optId = item.id || `${optionType}_${Date.now()}`;
        const brandId = type === 'device' ? await resolveBrandId(item.brand) : null;
        const code =
          type === 'symptom'
            ? sanitizeString(item.code || optId, 50)
            : type === 'timeSlot'
            ? sanitizeString(item.time || '', 50)
            : null;
        const label =
          type === 'device'
            ? sanitizeString(item.name, 191)
            : type === 'symptom'
            ? sanitizeString(item.title, 191)
            : sanitizeString(item.label || item.time, 191);
        const subLabel = type === 'timeSlot' ? sanitizeString(item.period || 'morning', 100) : null;
        const description = type === 'symptom' ? sanitizeString(item.description || '', 500) : null;
        const icon = type === 'symptom' ? sanitizeString(item.icon || '🛠️', 50) : null;
        const isActive = item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1;

        const existing = await db.queryOne('SELECT MaTuyChon AS id FROM TuyChonDatLichSuaChua WHERE MaTuyChon = ?', [
          optId,
        ]);
        if (existing) {
          await db.execute(
            `UPDATE TuyChonDatLichSuaChua SET
               LoaiTuyChon = ?, MaThuongHieu = ?, MaCode = ?, TenHienThi = ?, NhanPhu = ?, MoTa = ?, BieuTuong = ?, DangHoatDong = ?, NgayCapNhat = NOW()
             WHERE MaTuyChon = ?`,
            [optionType, brandId, code, label, subLabel, description, icon, isActive, optId]
          );
        } else {
          const cnt = await db.queryOne(
            'SELECT COUNT(*) as c FROM TuyChonDatLichSuaChua WHERE LoaiTuyChon = ?',
            [optionType]
          );
          await db.execute(
            `INSERT INTO TuyChonDatLichSuaChua
             (MaTuyChon, LoaiTuyChon, MaThuongHieu, MaCode, TenHienThi, NhanPhu, MoTa, BieuTuong, ThuTuHienThi, DangHoatDong, NgayTao, NgayCapNhat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [optId, optionType, brandId, code, label, subLabel, description, icon, (cnt?.c || 0) + 1, isActive]
          );
        }
      } else if (action === 'delete' && id) {
        await db.execute('DELETE FROM TuyChonDatLichSuaChua WHERE MaTuyChon = ?', [id]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình bàn sửa chữa vào CSDL 3NF thành công',
    });
  } catch (error: any) {
    console.error('Repair config POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
