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
    let sql = `
      SELECT ps.*,
             p.name AS phoneName,
             s.name AS supplierName,
             c.name AS soldToCustomerName,
             c.phone AS soldToCustomerPhone
      FROM phonestock ps
      LEFT JOIN phoneproduct p ON ps.phoneId = p.id
      LEFT JOIN supplier s ON ps.supplierId = s.id
      LEFT JOIN invoice inv ON ps.soldInvoiceId = inv.invoiceCode
      LEFT JOIN customer c ON inv.customerId = c.id
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE ps.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ps.createdAt DESC';

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

    if (!imei || !isValidImei(imei)) {
      return NextResponse.json(
        { error: 'Số IMEI không hợp lệ (cần từ 8 đến 25 ký tự chữ và số, không chứa khoảng trắng)' },
        { status: 400 }
      );
    }

    if (!color || !capacity) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ màu sắc và dung lượng' },
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

    // Resolve PhoneProduct FK
    let resolvedPhoneId = body.phoneId ? sanitizeString(body.phoneId, 191) : null;
    if (resolvedPhoneId) {
      const found = await db.queryOne('SELECT id FROM phoneproduct WHERE id = ?', [resolvedPhoneId]);
      if (!found) resolvedPhoneId = null;
    }
    if (!resolvedPhoneId && phoneName) {
      const byName = await db.queryOne('SELECT id FROM phoneproduct WHERE name LIKE ? LIMIT 1', [`%${phoneName}%`]);
      if (byName) resolvedPhoneId = byName.id;
    }
    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT id FROM phoneproduct LIMIT 1');
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
    }

    // Resolve Supplier FK
    let resolvedSupplierId = body.supplierId ? sanitizeString(body.supplierId, 191) : null;
    if (resolvedSupplierId) {
      const supplierExists = await db.queryOne('SELECT id FROM supplier WHERE id = ?', [resolvedSupplierId]);
      if (!supplierExists) resolvedSupplierId = null;
    }
    if (!resolvedSupplierId) {
      const firstSupplier = await db.queryOne('SELECT id FROM supplier LIMIT 1');
      resolvedSupplierId = firstSupplier ? firstSupplier.id : null;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const importDate = body.importDate ? sanitizeString(body.importDate, 50) : now.split(' ')[0];
    const warrantyMonths = Math.max(0, Number(body.warrantyMonths || 12));

    await db.execute(
      `INSERT INTO phonestock
       (imei, phoneId, color, capacity, costPrice, sellingPrice, supplierId, importDate, status, warrantyMonths, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', ?, NOW(), NOW())`,
      [
        imei,
        resolvedPhoneId,
        color,
        capacity,
        costPrice,
        sellingPrice,
        resolvedSupplierId,
        importDate,
        warrantyMonths,
      ]
    );

    const newItem = await db.queryOne(
      `SELECT ps.*, p.name AS phoneName, s.name AS supplierName
       FROM phonestock ps
       LEFT JOIN phoneproduct p ON ps.phoneId = p.id
       LEFT JOIN supplier s ON ps.supplierId = s.id
       WHERE ps.imei = ?`,
      [imei]
    );

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
      { error: 'Lỗi nhập máy vào kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei')?.trim();

    if (!imei) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp số IMEI cần xóa' },
        { status: 400 }
      );
    }

    const existing = await db.queryOne('SELECT imei, status FROM phonestock WHERE imei = ?', [imei]);
    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy máy có số IMEI này trong kho' },
        { status: 404 }
      );
    }

    await db.execute('DELETE FROM phonestock WHERE imei = ?', [imei]);

    return NextResponse.json({
      success: true,
      message: `Đã xóa số IMEI ${imei} khỏi kho CSDL thành công`,
    });
  } catch (error: any) {
    console.error('Phone stock DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa IMEI khỏi kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
