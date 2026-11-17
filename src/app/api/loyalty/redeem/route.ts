import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();

    let sql = 'SELECT * FROM redeemedgift';
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (phone) {
      const normalized = normalizePhone(phone);
      whereClauses.push('(customerPhone = ? OR customerPhone = ?)');
      params.push(phone, normalized);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const gifts = await db.query(sql, params);

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
    const result = await db.transaction(async (conn) => {
      // 1. Check accessory
      const [accRows]: any = await conn.query('SELECT * FROM accessoryproduct WHERE id = ?', [accessoryId]);
      const accessory = accRows[0];

      if (!accessory) {
        throw new Error('Phụ kiện quà tặng không tồn tại');
      }

      if (accessory.stock <= 0) {
        throw new Error(`Phụ kiện "${accessory.name}" hiện đã hết hàng trong kho quà tặng`);
      }

      const pointsNeeded = accessory.pointsToRedeem || Math.ceil(accessory.sellingPrice / 1000);

      // 2. Check customer
      const [custRows]: any = await conn.query('SELECT * FROM customer WHERE phone = ?', [normPhone]);
      const customer = custRows[0];

      if (!customer) {
        throw new Error('Khách hàng chưa đăng ký thành viên iShop');
      }

      if (customer.points < pointsNeeded) {
        throw new Error(`Khách hàng chỉ có ${customer.points} điểm, cần ${pointsNeeded} điểm để đổi quà này`);
      }

      // 3. Deduct points and deduct accessory stock
      await conn.execute(
        'UPDATE customer SET points = points - ?, updatedAt = NOW() WHERE phone = ?',
        [pointsNeeded, normPhone]
      );

      await conn.execute(
        'UPDATE accessoryproduct SET stock = stock - 1, updatedAt = NOW() WHERE id = ?',
        [accessoryId]
      );

      // 4. Create gift redemption record
      const [countRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM redeemedgift');
      const count = countRow[0]?.cnt || 0;
      const giftCode = `GIFT-2608-${String(count + 1).padStart(3, '0')}`;
      const giftId = 'gift-' + Date.now();

      await conn.execute(
        `INSERT INTO redeemedgift 
         (id, giftCode, customerId, customerPhone, customerName, accessoryId, accessoryName, accessoryImage, pointsRedeemed, redeemedAt, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active', NOW(), NOW())`,
        [
          giftId,
          giftCode,
          customer.id,
          normPhone,
          sanitizeString(customerName || customer.name, 100),
          accessory.id,
          accessory.name,
          accessory.imageUrl,
          pointsNeeded,
        ]
      );

      const [giftRows]: any = await conn.query('SELECT * FROM redeemedgift WHERE id = ?', [giftId]);

      return { gift: giftRows[0], remainingPoints: customer.points - pointsNeeded };
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
