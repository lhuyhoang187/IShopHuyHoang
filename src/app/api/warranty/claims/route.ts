import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizePhone, isValidPhone, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');
    const phone = searchParams.get('phone');

    let sql = `
      SELECT w.*, c.name as customer_name, c.membershipTier 
      FROM warrantyclaim w
      LEFT JOIN customer c ON w.customerId = c.id
    `;
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (imei) {
      whereClauses.push('w.imeiOrSerial = ?');
      params.push(imei.trim());
    }
    if (phone) {
      whereClauses.push('w.customerPhone = ?');
      params.push(normalizePhone(phone));
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY w.createdAt DESC';

    const claims = await db.query(sql, params);

    const parsed = claims.map((cl) => ({
      ...cl,
      customer: cl.customerId
        ? {
            name: cl.customer_name || cl.customerName,
            membershipTier: cl.membershipTier || 'Thành viên mới',
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Warranty claim GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách yêu cầu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imeiOrSerial,
      customerName,
      customerPhone,
      customerEmail,
      productName,
      issueDescription,
    } = body;

    const rawPhone = String(customerPhone || '');
    const cleanPhone = normalizePhone(rawPhone);
    const cleanName = sanitizeString(customerName, 100);
    const cleanImei = sanitizeString(imeiOrSerial, 50);

    if (!cleanImei) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp số IMEI hoặc số Serial máy' },
        { status: 400 }
      );
    }

    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      );
    }

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM warrantyclaim');
    const count = countRow?.cnt || 0;
    const claimCode = `BH-2608-${String(count + 1).padStart(3, '0')}`;

    const existingCustomer = await db.queryOne('SELECT id FROM customer WHERE phone = ?', [cleanPhone]);

    const claimId = 'claim_' + Date.now();
    await db.execute(
      `INSERT INTO warrantyclaim 
       (id, claimCode, imeiOrSerial, customerName, customerPhone, customerEmail, customerId, productName, issueDescription, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        claimId,
        claimCode,
        cleanImei,
        cleanName || 'Khách hàng',
        cleanPhone,
        customerEmail ? sanitizeString(customerEmail, 100) : null,
        existingCustomer?.id || null,
        sanitizeString(productName || 'Thiết bị di động', 191),
        sanitizeString(issueDescription || 'Yêu cầu kiểm tra bảo hành thiết bị', 1000),
      ]
    );

    const claim = await db.queryOne('SELECT * FROM warrantyclaim WHERE id = ?', [claimId]);

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu bảo hành thành công. Chuyên viên sẽ liên hệ trong 30 phút.',
      data: claim,
    });
  } catch (error: any) {
    console.error('Warranty claim POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi gửi yêu cầu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
