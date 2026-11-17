import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let sql = 'SELECT * FROM phonestock';
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY createdAt DESC';

    const items = await db.query(sql, params);

    const inStockCount = items.filter((i) => i.status === 'in_stock').length;
    const soldCount = items.filter((i) => i.status === 'sold').length;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: items.length,
      inStockCount,
      soldCount,
      data: items,
    });
  } catch (error: any) {
    console.error('Phone stock GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn kho máy: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const imei = sanitizeString(body.imei, 50);
    const phoneName = sanitizeString(body.phoneName, 191);
    const color = sanitizeString(body.color, 100);
    const capacity = sanitizeString(body.capacity, 50);
    const sellingPrice = Number(body.sellingPrice);
    const costPrice = Number(body.costPrice || 0);

    // Business Constraints Validation
    if (!imei || !isValidImei(imei)) {
      return NextResponse.json(
        { error: 'Số IMEI không hợp lệ (cần từ 8 đến 25 ký tự chữ và số, không chứa khoảng trắng)' },
        { status: 400 }
      );
    }

    if (!phoneName || !color || !capacity) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ tên máy, màu sắc và dung lượng' },
        { status: 400 }
      );
    }

    if (!isValidAmount(sellingPrice, false)) {
      return NextResponse.json(
        { error: 'Giá bán của điện thoại phải là số dương hợp lệ' },
        { status: 400 }
      );
    }

    if (!isValidAmount(costPrice, true)) {
      return NextResponse.json(
        { error: 'Giá vốn của điện thoại không được âm' },
        { status: 400 }
      );
    }

    const exists = await db.queryOne('SELECT imei FROM phonestock WHERE imei = ?', [imei]);

    if (exists) {
      return NextResponse.json(
        { error: `Số IMEI ${imei} đã tồn tại trong hệ thống kho!` },
        { status: 409 }
      );
    }

    // Resolve or fallback PhoneProduct to strictly satisfy Foreign Key constraint
    let resolvedPhoneId = body.phoneId ? sanitizeString(body.phoneId, 50) : null;
    if (resolvedPhoneId) {
      const phoneProductExists = await db.queryOne('SELECT id FROM phoneproduct WHERE id = ?', [resolvedPhoneId]);
      if (!phoneProductExists) {
        resolvedPhoneId = null;
      }
    }

    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT id FROM phoneproduct LIMIT 1');
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
    }

    // Resolve or fallback Supplier to strictly satisfy Foreign Key constraint
    let resolvedSupplierId = body.supplierId ? sanitizeString(body.supplierId, 50) : null;
    let resolvedSupplierName = body.supplierName ? sanitizeString(body.supplierName, 150) : null;

    if (resolvedSupplierId) {
      const supplierExists = await db.queryOne('SELECT id, name FROM supplier WHERE id = ?', [resolvedSupplierId]);
      if (supplierExists) {
        resolvedSupplierName = supplierExists.name;
      } else {
        resolvedSupplierId = null;
      }
    }

    if (!resolvedSupplierId) {
      const firstSupplier = await db.queryOne('SELECT id, name FROM supplier LIMIT 1');
      resolvedSupplierId = firstSupplier ? firstSupplier.id : 'sup-1';
      resolvedSupplierName = firstSupplier ? firstSupplier.name : 'Apple Authorized Distributor VN';
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const importDate = body.importDate ? sanitizeString(body.importDate, 50) : now.split(' ')[0];
    const warrantyMonths = Math.max(0, Number(body.warrantyMonths || 12));

    await db.execute(
      `INSERT INTO phonestock 
       (imei, phoneId, phoneName, color, capacity, costPrice, sellingPrice, supplierId, supplierName, importDate, status, warrantyMonths, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, NOW(), NOW())`,
      [
        imei,
        resolvedPhoneId,
        phoneName,
        color,
        capacity,
        costPrice,
        sellingPrice,
        resolvedSupplierId,
        resolvedSupplierName || 'Nhà Phân Phối Chính Hãng',
        importDate,
        warrantyMonths,
      ]
    );

    const newItem = await db.queryOne('SELECT * FROM phonestock WHERE imei = ?', [imei]);

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Nhập máy vào kho thành công',
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Phone stock POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
