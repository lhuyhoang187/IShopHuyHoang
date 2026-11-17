import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizePhone, isValidPhone, isValidImei, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();
    const imei = searchParams.get('imei')?.trim();

    let sql = 'SELECT * FROM registereddevice';
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (phone) {
      const normalized = normalizePhone(phone);
      whereClauses.push('(customerPhone = ? OR customerPhone = ?)');
      params.push(phone, normalized);
    }
    if (imei) {
      whereClauses.push('imei = ?');
      params.push(imei);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const devices = await db.query(sql, params);

    const parsed = devices.map((d) => ({
      ...d,
      repairHistoryCodes: d.repairHistoryCodes ? JSON.parse(d.repairHistoryCodes) : [],
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Loyalty devices API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu hộ chiếu thiết bị: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imei,
      productName,
      phoneId,
      color,
      capacity,
      customerPhone,
      customerName,
      customerEmail,
      purchaseInvoiceCode,
      purchaseDate,
      warrantyExpiryDate,
      purchasePrice,
      repairCode,
    } = body;

    const cleanImei = String(imei || '').trim();
    if (!cleanImei || !isValidImei(cleanImei)) {
      return NextResponse.json(
        { error: 'Số IMEI không đúng định dạng hợp lệ' },
        { status: 400 }
      );
    }

    const normPhone = normalizePhone(customerPhone || '');
    if (!isValidPhone(normPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existing = await db.queryOne('SELECT * FROM registereddevice WHERE imei = ?', [cleanImei]);

    let currentRepairs: string[] = [];
    if (existing?.repairHistoryCodes) {
      try {
        currentRepairs = JSON.parse(existing.repairHistoryCodes);
      } catch {}
    }
    if (repairCode && !currentRepairs.includes(repairCode)) {
      currentRepairs.push(repairCode);
    }

    const devId = existing?.id || 'dev_' + Date.now();
    const cName = sanitizeString(customerName || existing?.customerName || 'Khách hàng', 100);
    const cPhone = normPhone;
    const cEmail = customerEmail ? sanitizeString(customerEmail, 100) : existing?.customerEmail || null;
    const pName = sanitizeString(productName || existing?.productName || 'iPhone', 191);
    const pDate = purchaseDate || existing?.purchaseDate || new Date().toISOString().substring(0, 10);
    const wExpiry = warrantyExpiryDate || existing?.warrantyExpiryDate || null;
    const pPrice = purchasePrice !== undefined ? Number(purchasePrice) : Number(existing?.purchasePrice || 0);

    if (existing) {
      await db.execute(
        `UPDATE registereddevice SET 
           customerName = ?, customerPhone = ?, customerEmail = ?, productName = ?, 
           purchaseInvoiceCode = COALESCE(?, purchaseInvoiceCode), purchaseDate = ?, warrantyExpiryDate = ?, 
           purchasePrice = ?, repairHistoryCodes = ?, updatedAt = NOW()
         WHERE id = ?`,
        [
          cName,
          cPhone,
          cEmail,
          pName,
          purchaseInvoiceCode || null,
          pDate,
          wExpiry,
          pPrice,
          JSON.stringify(currentRepairs),
          devId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO registereddevice 
         (id, imei, productName, phoneId, color, capacity, customerPhone, customerName, customerEmail, purchaseInvoiceCode, purchaseDate, warrantyExpiryDate, purchasePrice, repairHistoryCodes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          devId,
          cleanImei,
          pName,
          phoneId || null,
          color ? sanitizeString(color, 100) : null,
          capacity ? sanitizeString(capacity, 50) : null,
          cPhone,
          cName,
          cEmail,
          purchaseInvoiceCode || null,
          pDate,
          wExpiry,
          pPrice,
          JSON.stringify(currentRepairs),
        ]
      );
    }

    const device = await db.queryOne('SELECT * FROM registereddevice WHERE id = ?', [devId]);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật hộ chiếu thiết bị thành công',
      data: {
        ...device,
        repairHistoryCodes: device.repairHistoryCodes ? JSON.parse(device.repairHistoryCodes) : [],
      },
    });
  } catch (error: any) {
    console.error('Loyalty devices API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi đăng ký hộ chiếu thiết bị: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
