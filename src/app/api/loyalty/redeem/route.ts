import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();

    const where: any = {};
    if (phone) {
      const normalized = normalizePhone(phone);
      where.OR = [
        { customerPhone: phone },
        ...(normalized ? [{ customerPhone: normalized }] : []),
      ];
    }

    const gifts = await prisma.redeemedGift.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: gifts.length,
      data: gifts,
    });
  } catch (error: any) {
    console.error('Redeem gifts API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu lịch sử đổi quà: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerPhone, customerName, accessoryId } = body;

    const normPhone = normalizePhone(customerPhone || '');
    if (!isValidPhone(normPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ' },
        { status: 400 }
      );
    }

    if (!accessoryId) {
      return NextResponse.json(
        { error: 'Vui lòng chọn phụ kiện quà tặng cần đổi' },
        { status: 400 }
      );
    }

    // Atomic transaction for gift redemption
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check accessory
      const accessory = await tx.accessoryProduct.findUnique({
        where: { id: accessoryId },
      });

      if (!accessory) {
        throw new Error('Phụ kiện quà tặng không tồn tại');
      }

      if (accessory.stock <= 0) {
        throw new Error(`Phụ kiện "${accessory.name}" hiện đã hết hàng trong kho quà tặng`);
      }

      const pointsNeeded = accessory.pointsToRedeem || Math.ceil(accessory.sellingPrice / 1000);

      // 2. Check customer
      const customer = await tx.customer.findUnique({
        where: { phone: normPhone },
      });

      if (!customer) {
        throw new Error('Khách hàng chưa đăng ký thành viên iShop');
      }

      if (customer.points < pointsNeeded) {
        throw new Error(`Khách hàng chỉ có ${customer.points} điểm, cần ${pointsNeeded} điểm để đổi quà này`);
      }

      // 3. Deduct points and deduct accessory stock
      await tx.customer.update({
        where: { phone: normPhone },
        data: {
          points: { decrement: pointsNeeded },
        },
      });

      await tx.accessoryProduct.update({
        where: { id: accessoryId },
        data: {
          stock: { decrement: 1 },
        },
      });

      // 4. Create gift redemption record
      const count = await tx.redeemedGift.count();
      const giftCode = `GIFT-2608-${String(count + 1).padStart(3, '0')}`;

      const gift = await tx.redeemedGift.create({
        data: {
          id: 'gift-' + Date.now(),
          giftCode,
          customerId: customer.id,
          customerPhone: normPhone,
          customerName: sanitizeString(customerName || customer.name, 100),
          accessoryId: accessory.id,
          accessoryName: accessory.name,
          accessoryImage: accessory.imageUrl,
          pointsRedeemed: pointsNeeded,
          redeemedAt: new Date(),
          status: 'active',
        },
      });

      return { gift, remainingPoints: customer.points - pointsNeeded };
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi quà thành công!',
      data: result,
    });
  } catch (error: any) {
    console.error('Redeem gifts API POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi đổi quà bằng điểm' },
      { status: 400 }
    );
  }
}

