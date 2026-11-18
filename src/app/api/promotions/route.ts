import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const campaigns = await db.query('SELECT * FROM promotioncampaign ORDER BY createdAt DESC');
    const promoQRs = await db.query('SELECT * FROM promoqrcode ORDER BY createdAt DESC');

    const mappedCampaigns = campaigns.map((c) => ({
      ...c,
      isActive: Boolean(c.isActive),
    }));

    const mappedPromoQRs = promoQRs.map((q) => ({
      ...q,
      isActive: Boolean(q.isActive),
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      data: {
        campaigns: mappedCampaigns,
        promoQRs: mappedPromoQRs,
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
    const { type, data } = body; // type: 'campaign' | 'qrcode'

    if (type === 'campaign') {
      const { id, title, description, badgeText, discountType, discountValue, startDate, endDate, isActive, targetCategory, bannerGradient } = data;
      if (!title || !discountValue) {
        return NextResponse.json({ error: 'Tiêu đề và mức chiết khấu không được để trống' }, { status: 400 });
      }

      const campId = id || 'camp-' + Date.now();
      const existing = await db.queryOne('SELECT id FROM promotioncampaign WHERE id = ?', [campId]);

      const start = startDate ? new Date(startDate).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);
      const end = endDate ? new Date(endDate).toISOString().replace('T', ' ').substring(0, 19) : new Date(Date.now() + 7 * 86400000).toISOString().replace('T', ' ').substring(0, 19);
      const boolActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

      if (existing) {
        await db.execute(
          `UPDATE promotioncampaign SET 
             title = ?, description = ?, badgeText = ?, discountType = ?, discountValue = ?, 
             startDate = ?, endDate = ?, isActive = ?, targetCategory = ?, bannerGradient = ?, updatedAt = NOW()
           WHERE id = ?`,
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
          `INSERT INTO promotioncampaign 
           (id, title, description, badgeText, discountType, discountValue, startDate, endDate, isActive, targetCategory, bannerGradient, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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

      const campaign = await db.queryOne('SELECT * FROM promotioncampaign WHERE id = ?', [campId]);
      return NextResponse.json({
        success: true,
        message: 'Đã lưu chiến dịch khuyến mãi',
        data: campaign ? { ...campaign, isActive: Boolean(campaign.isActive) } : null,
      });
    }

    if (type === 'qrcode') {
      const { id, code, title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive, qrPayload, bannerColor } = data;
      if (!code || !title || !discountValue) {
        return NextResponse.json({ error: 'Mã voucher, tiêu đề và mức giảm không được để trống' }, { status: 400 });
      }

      const cleanCode = sanitizeString(code, 50).toUpperCase().replace(/\s+/g, '-');
      const existing = await db.queryOne('SELECT id FROM promoqrcode WHERE code = ?', [cleanCode]);
      const qrId = existing?.id || id || 'qr-promo-' + Date.now();

      const start = startDate ? new Date(startDate).toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);
      const end = endDate ? new Date(endDate).toISOString().replace('T', ' ').substring(0, 19) : new Date(Date.now() + 7 * 86400000).toISOString().replace('T', ' ').substring(0, 19);
      const boolActive = isActive !== undefined ? (isActive ? 1 : 0) : 1;

      if (existing) {
        await db.execute(
          `UPDATE promoqrcode SET 
             title = ?, description = ?, discountType = ?, discountValue = ?, minOrderValue = ?, 
             startDate = ?, endDate = ?, isActive = ?, qrPayload = ?, bannerColor = ?, updatedAt = NOW()
           WHERE id = ?`,
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
          `INSERT INTO promoqrcode 
           (id, code, title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive, qrPayload, bannerColor, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
            qrPayload || `https://ishop.vn/promo/${cleanCode}`,
            bannerColor || null,
          ]
        );
      }

      const promoQR = await db.queryOne('SELECT * FROM promoqrcode WHERE id = ?', [qrId]);
      return NextResponse.json({
        success: true,
        message: 'Đã lưu mã QR khuyến mãi',
        data: promoQR ? { ...promoQR, isActive: Boolean(promoQR.isActive) } : null,
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
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID khuyến mãi cần xóa' }, { status: 400 });
    }

    if (type === 'qrcode') {
      await db.execute('DELETE FROM promoqrcode WHERE id = ? OR code = ?', [id, id]);
    } else {
      await db.execute('DELETE FROM promotioncampaign WHERE id = ?', [id]);
    }

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
