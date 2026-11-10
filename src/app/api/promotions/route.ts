import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const campaigns = await prisma.promotionCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const promoQRs = await prisma.promoQRCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

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
    const { type, data } = body; // type: 'campaign' | 'qrcode'

    if (type === 'campaign') {
      const { id, title, description, badgeText, discountType, discountValue, startDate, endDate, isActive, targetCategory, bannerGradient } = data;
      if (!title || !discountValue) {
        return NextResponse.json({ error: 'Tiêu đề và mức chiết khấu không được để trống' }, { status: 400 });
      }

      const campaign = await prisma.promotionCampaign.upsert({
        where: { id: id || 'camp-' + Date.now() },
        update: {
          title: sanitizeString(title, 191),
          description: description || '',
          badgeText: badgeText || null,
          discountType: discountType || 'percentage',
          discountValue: Number(discountValue),
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now() + 7 * 86400000),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          targetCategory: targetCategory || 'all',
          bannerGradient: bannerGradient || null,
        },
        create: {
          id: id || 'camp-' + Date.now(),
          title: sanitizeString(title, 191),
          description: description || '',
          badgeText: badgeText || null,
          discountType: discountType || 'percentage',
          discountValue: Number(discountValue),
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now() + 7 * 86400000),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          targetCategory: targetCategory || 'all',
          bannerGradient: bannerGradient || null,
        },
      });

      return NextResponse.json({ success: true, message: 'Đã lưu chiến dịch khuyến mãi', data: campaign });
    }

    if (type === 'qrcode') {
      const { id, code, title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive, qrPayload, bannerColor } = data;
      if (!code || !title || !discountValue) {
        return NextResponse.json({ error: 'Mã voucher, tiêu đề và mức giảm không được để trống' }, { status: 400 });
      }

      const cleanCode = sanitizeString(code, 50).toUpperCase().replace(/\s+/g, '-');
      const promoQR = await prisma.promoQRCode.upsert({
        where: { code: cleanCode },
        update: {
          title: sanitizeString(title, 191),
          description: description || '',
          discountType: discountType || 'percentage',
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue || 0),
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now() + 7 * 86400000),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          qrPayload: qrPayload || `https://ishop.vn/promo/${cleanCode}`,
          bannerColor: bannerColor || null,
        },
        create: {
          id: id || 'qr-promo-' + Date.now(),
          code: cleanCode,
          title: sanitizeString(title, 191),
          description: description || '',
          discountType: discountType || 'percentage',
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue || 0),
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now() + 7 * 86400000),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          qrPayload: qrPayload || `https://ishop.vn/promo/${cleanCode}`,
          bannerColor: bannerColor || null,
        },
      });

      return NextResponse.json({ success: true, message: 'Đã lưu mã QR khuyến mãi', data: promoQR });
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

