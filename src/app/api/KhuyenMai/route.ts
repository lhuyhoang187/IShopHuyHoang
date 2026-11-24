import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

export const dynamic = 'force-dynamic';

const PROMO_SELECT = `
  MaKhuyenMai AS id,
  LoaiKhuyenMai AS promoType,
  MaGiamGia AS code,
  TieuDe AS title,
  MoTa AS description,
  NhanHienThi AS badgeText,
  LoaiGiamGia AS discountType,
  GiaTriGiam AS discountValue,
  DonToiThieu AS minOrderValue,
  NgayBatDau AS startDate,
  NgayKetThuc AS endDate,
  DangHoatDong AS isActive,
  DanhMucApDung AS targetCategory,
  KieuBanner AS bannerStyle,
  DuLieuQR AS qrPayload,
  NgayTao AS createdAt,
  NgayCapNhat AS updatedAt
`;

export async function GET(request: NextRequest) {
  try {
    const rows = await db.query(`SELECT ${PROMO_SELECT} FROM KhuyenMai ORDER BY NgayTao DESC`);

    const campaigns = rows
      .filter((r) => r.promoType === 'campaign')
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        badgeText: c.badgeText,
        discountType: c.discountType,
        discountValue: Number(c.discountValue || 0),
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: Boolean(c.isActive),
        targetCategory: c.targetCategory || 'all',
        bannerGradient: c.bannerStyle,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

    const promoQRs = rows
      .filter((r) => r.promoType === 'qrcode')
      .map((q) => ({
        id: q.id,
        code: q.code,
        title: q.title,
        description: q.description || '',
        discountType: q.discountType,
        discountValue: Number(q.discountValue || 0),
        minOrderValue: Number(q.minOrderValue || 0),
        startDate: q.startDate,
        endDate: q.endDate,
        isActive: Boolean(q.isActive),
        qrPayload: q.qrPayload,
        bannerColor: q.bannerStyle,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      data: {
        campaigns,
        promoQRs,
      },
    });
  } catch (error: any) {
    console.error('Promotions API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn khuyến mãi: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'campaign') {
      const {
        id,
        title,
        description,
        badgeText,
        discountType,
        discountValue,
        startDate,
        endDate,
        isActive,
        targetCategory,
        bannerGradient,
      } = data;

      if (!title || !discountValue) {
        return NextResponse.json({ error: 'Tiêu đề và mức chiết khấu không được để trống' }, { status: 400 });
      }

      const campId = id || 'camp-' + Date.now();
      const existing = await db.queryOne('SELECT MaKhuyenMai AS id FROM KhuyenMai WHERE MaKhuyenMai = ?', [campId]);

      const start = startDate
        ? new Date(startDate).toISOString().replace('T', ' ').substring(0, 19)
        : new Date().toISOString().replace('T', ' ').substring(0, 19);
      const end = endDate
        ? new Date(endDate).toISOString().replace('T', ' ').substring(0, 19)
        : new Date(Date.now() + 7 * 86400000).toISOString().replace('T', ' ').substring(0, 19);
      const boolActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

      if (existing) {
        await db.execute(
          `UPDATE KhuyenMai SET
             LoaiKhuyenMai = 'campaign', TieuDe = ?, MoTa = ?, NhanHienThi = ?, LoaiGiamGia = ?, GiaTriGiam = ?,
             NgayBatDau = ?, NgayKetThuc = ?, DangHoatDong = ?, DanhMucApDung = ?, KieuBanner = ?, NgayCapNhat = NOW()
           WHERE MaKhuyenMai = ?`,
          [
            sanitizeString(title, 191),
            description || '',
            badgeText || null,
            discountType || 'percentage',
            Number(discountValue),
            start,
            end,
            boolActive,
            targetCategory || 'all',
            bannerGradient || null,
            campId,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO KhuyenMai
           (MaKhuyenMai, LoaiKhuyenMai, MaGiamGia, TieuDe, MoTa, NhanHienThi, LoaiGiamGia, GiaTriGiam, DonToiThieu, NgayBatDau, NgayKetThuc, DangHoatDong, DanhMucApDung, KieuBanner, DuLieuQR, NgayTao, NgayCapNhat)
           VALUES (?, 'campaign', NULL, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
          [
            campId,
            sanitizeString(title, 191),
            description || '',
            badgeText || null,
            discountType || 'percentage',
            Number(discountValue),
            start,
            end,
            boolActive,
            targetCategory || 'all',
            bannerGradient || null,
          ]
        );
      }

      const campaign = await db.queryOne(`SELECT ${PROMO_SELECT} FROM KhuyenMai WHERE MaKhuyenMai = ?`, [campId]);
      return NextResponse.json({
        success: true,
        message: 'Đã lưu chiến dịch khuyến mãi',
        data: campaign
          ? { ...campaign, bannerGradient: campaign.bannerStyle, isActive: Boolean(campaign.isActive) }
          : null,
      });
    }

    if (type === 'qrcode') {
      const {
        id,
        code,
        title,
        description,
        discountType,
        discountValue,
        minOrderValue,
        startDate,
        endDate,
        isActive,
        qrPayload,
        bannerColor,
      } = data;

      if (!code || !title || !discountValue) {
        return NextResponse.json({ error: 'Mã voucher, tiêu đề và mức giảm không được để trống' }, { status: 400 });
      }

      const cleanCode = sanitizeString(code, 50).toUpperCase().replace(/\s+/g, '-');
      const existing = await db.queryOne('SELECT MaKhuyenMai AS id FROM KhuyenMai WHERE MaGiamGia = ?', [cleanCode]);
      const qrId = existing?.id || id || 'qr-promo-' + Date.now();

      const start = startDate
        ? new Date(startDate).toISOString().replace('T', ' ').substring(0, 19)
        : new Date().toISOString().replace('T', ' ').substring(0, 19);
      const end = endDate
        ? new Date(endDate).toISOString().replace('T', ' ').substring(0, 19)
        : new Date(Date.now() + 7 * 86400000).toISOString().replace('T', ' ').substring(0, 19);
      const boolActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

      if (existing) {
        await db.execute(
          `UPDATE KhuyenMai SET
             LoaiKhuyenMai = 'qrcode', TieuDe = ?, MoTa = ?, LoaiGiamGia = ?, GiaTriGiam = ?, DonToiThieu = ?,
             NgayBatDau = ?, NgayKetThuc = ?, DangHoatDong = ?, DuLieuQR = ?, KieuBanner = ?, NgayCapNhat = NOW()
           WHERE MaKhuyenMai = ?`,
          [
            sanitizeString(title, 191),
            description || '',
            discountType || 'percentage',
            Number(discountValue),
            Number(minOrderValue || 0),
            start,
            end,
            boolActive,
            qrPayload || `https://ishop.vn/promo/${cleanCode}`,
            bannerColor || null,
            qrId,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO KhuyenMai
           (MaKhuyenMai, LoaiKhuyenMai, MaGiamGia, TieuDe, MoTa, NhanHienThi, LoaiGiamGia, GiaTriGiam, DonToiThieu, NgayBatDau, NgayKetThuc, DangHoatDong, DanhMucApDung, KieuBanner, DuLieuQR, NgayTao, NgayCapNhat)
           VALUES (?, 'qrcode', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'all', ?, ?, NOW(), NOW())`,
          [
            qrId,
            cleanCode,
            sanitizeString(title, 191),
            description || '',
            discountType || 'percentage',
            Number(discountValue),
            Number(minOrderValue || 0),
            start,
            end,
            boolActive,
            bannerColor || null,
            qrPayload || `https://ishop.vn/promo/${cleanCode}`,
          ]
        );
      }

      const promoQR = await db.queryOne(`SELECT ${PROMO_SELECT} FROM KhuyenMai WHERE MaKhuyenMai = ?`, [qrId]);
      return NextResponse.json({
        success: true,
        message: 'Đã lưu mã QR khuyến mãi',
        data: promoQR
          ? { ...promoQR, bannerColor: promoQR.bannerStyle, isActive: Boolean(promoQR.isActive) }
          : null,
      });
    }

    return NextResponse.json({ error: 'Loại thao tác không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Promotions API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu khuyến mãi: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID khuyến mãi cần xóa' }, { status: 400 });
    }

    await db.execute('DELETE FROM KhuyenMai WHERE MaKhuyenMai = ? OR MaGiamGia = ?', [id, id]);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa khuyến mãi khỏi CSDL thành công',
    });
  } catch (error: any) {
    console.error('Promotions API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa khuyến mãi: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
