import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
  getCashbookCategoryLabel,
} from '@/lib/validation';

export async function GET() {
  try {
    const orders = await db.query(
      `SELECT so.*, s.name AS supplierName
       FROM supplierorder so
       LEFT JOIN supplier s ON so.supplierId = s.id
       ORDER BY so.createdAt DESC`
    );
    const items = await db.query('SELECT * FROM supplierorderitem ORDER BY createdAt ASC');

    const itemsByOrder: Record<string, any[]> = {};
    for (const it of items) {
      if (!itemsByOrder[it.orderCode]) itemsByOrder[it.orderCode] = [];
      itemsByOrder[it.orderCode].push(it);
    }

    const mapped = orders.map((ord) => {
      const ordItems = itemsByOrder[ord.orderCode] || [];
      return {
        ...ord,
        items: ordItems,
        importedImeis: ordItems.map((x) => x.imei).filter(Boolean),
      };
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    console.error('Restock GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn lịch sử nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      supplierId,
      phoneId,
      phoneName,
      color,
      capacity,
      costPrice,
      sellingPrice,
      imeis,
      paidAmount,
      notes,
    } = body;

    if (!supplierId || !imeis || !Array.isArray(imeis) || imeis.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nhà cung cấp và danh sách số IMEI hợp lệ' },
        { status: 400 }
      );
    }

    const rawImeis: string[] = imeis.map((im: any) => String(im).trim()).filter(Boolean);
    const uniqueImeis = Array.from(new Set(rawImeis));

    if (uniqueImeis.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách IMEI không chứa mã IMEI hợp lệ' },
        { status: 400 }
      );
    }

    for (const imei of uniqueImeis) {
      if (!isValidImei(imei)) {
        return NextResponse.json(
          { error: `Số IMEI "${imei}" không đúng định dạng hợp lệ (8 - 25 ký tự chữ và số)` },
          { status: 400 }
        );
      }
    }

    const costNum = Number(costPrice || 0);
    const sellNum = Number(sellingPrice || 0);
    const paidNum = Number(paidAmount || 0);

    if (!isValidAmount(costNum, true) || !isValidAmount(sellNum, true) || !isValidAmount(paidNum, true)) {
      return NextResponse.json(
        { error: 'Giá vốn, giá bán hoặc số tiền thanh toán không được âm' },
        { status: 400 }
      );
    }

    const supplier = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [supplierId]);
    if (!supplier) {
      return NextResponse.json(
        { error: `Không tìm thấy nhà cung cấp với mã ID: ${supplierId}` },
        { status: 404 }
      );
    }

    const supplierName = supplier.name;

    let resolvedPhoneId = phoneId ? sanitizeString(phoneId, 191) : null;
    let resolvedPhoneName = sanitizeString(phoneName || '', 191);
    if (resolvedPhoneId) {
      const existsPhone = await db.queryOne('SELECT id, name FROM phoneproduct WHERE id = ?', [resolvedPhoneId]);
      if (existsPhone) {
        resolvedPhoneName = resolvedPhoneName || existsPhone.name;
      } else {
        resolvedPhoneId = null;
      }
    }
    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT id, name FROM phoneproduct LIMIT 1');
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
      resolvedPhoneName = resolvedPhoneName || firstPhone?.name || 'iPhone Mới Nhập';
    }

    const totalBatchCost = costNum * uniqueImeis.length;
    const paid = Math.min(paidNum, totalBatchCost);
    const debtIncrease = Math.max(0, totalBatchCost - paid);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.split(' ')[0];

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM supplierorder');
    const orderCount = countRow?.cnt || 0;
    const orderCode = `NH-2608-${String(orderCount + 1).padStart(3, '0')}`;

    const result = await db.transaction(async (conn) => {
      // 1. Insert/Update 3NF PhoneStock (no transitive phoneName / supplierName)
      for (const imei of uniqueImeis) {
        await conn.execute(
          `INSERT INTO phonestock
           (imei, phoneId, color, capacity, costPrice, sellingPrice, supplierId, importDate, status, warrantyMonths, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', 12, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             phoneId = VALUES(phoneId),
             color = VALUES(color),
             capacity = VALUES(capacity),
             costPrice = VALUES(costPrice),
             sellingPrice = VALUES(sellingPrice),
             supplierId = VALUES(supplierId),
             status = 'in_stock',
             updatedAt = NOW()`,
          [
            imei,
            resolvedPhoneId,
            sanitizeString(color || 'Titan Tự Nhiên', 100),
            sanitizeString(capacity || '256GB', 50),
            costNum,
            sellNum,
            supplierId,
            dateStr,
          ]
        );
      }

      // 2. Create 3NF SupplierOrder (no supplierName / importedImeis JSON)
      const orderId = 'ord-' + Date.now();
      await conn.execute(
        `INSERT INTO supplierorder
         (id, orderCode, supplierId, date, type, itemsSummary, totalAmount, paidAmount, debtAmount, status, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'phones', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          orderCode,
          supplierId,
          dateStr,
          `Nhập ${uniqueImeis.length} cây ${resolvedPhoneName} (${color || 'Titan'} - ${capacity || '256GB'})`,
          totalBatchCost,
          paid,
          debtIncrease,
          debtIncrease === 0 ? 'completed' : 'partial',
          sanitizeString(notes || 'Nhập lô hàng chính ngạch.', 1000),
        ]
      );

      // 2.1. Insert 3NF Normalized SupplierOrderItem rows
      for (const imei of uniqueImeis) {
        const itemId = 'soi_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO supplierorderitem
           (id, orderCode, itemType, productId, productName, color, capacity, quantity, unitCost, totalCost, imei, createdAt)
           VALUES (?, ?, 'phone', ?, ?, ?, ?, 1, ?, ?, ?, NOW())`,
          [
            itemId,
            orderCode,
            resolvedPhoneId,
            resolvedPhoneName,
            sanitizeString(color || 'Titan', 100),
            sanitizeString(capacity || '256GB', 50),
            costNum,
            costNum,
            imei,
          ]
        );
      }

      // 3. Update Supplier totals
      await conn.execute(
        `UPDATE supplier SET
           totalPurchased = totalPurchased + ?,
           currentDebt = currentDebt + ?,
           updatedAt = NOW()
         WHERE id = ?`,
        [totalBatchCost, debtIncrease, supplierId]
      );

      // 4. Create 3NF Cashbook Payment Entry (no categoryLabel column)
      let cashbookEntry = null;
      if (paid > 0) {
        const [cashCountRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM cashbookentry');
        const cashCount = cashCountRow[0]?.cnt || 0;
        const cashCode = `PC-2608-${String(cashCount + 1).padStart(3, '0')}`;
        const cashId = 'cb-' + Date.now();

        await conn.execute(
          `INSERT INTO cashbookentry
           (id, code, date, type, category, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
           VALUES (?, ?, ?, 'payment', 'supplier_restock', ?, 'transfer', ?, ?, 'Lê Huy Hoàng (Chủ Shop)', NOW(), NOW())`,
          [
            cashId,
            cashCode,
            dateStr,
            paid,
            orderCode,
            `Thanh toán tiền nhập lô ${uniqueImeis.length} máy đơn hàng ${orderCode} cho ${supplierName}`,
          ]
        );

        const [cashRows]: any = await conn.query('SELECT * FROM cashbookentry WHERE id = ?', [cashId]);
        cashbookEntry = cashRows[0]
          ? { ...cashRows[0], categoryLabel: getCashbookCategoryLabel(cashRows[0].category, cashRows[0].type) }
          : null;
      }

      const [orderRows]: any = await conn.query(
        `SELECT so.*, s.name AS supplierName FROM supplierorder so LEFT JOIN supplier s ON so.supplierId = s.id WHERE so.id = ?`,
        [orderId]
      );

      return {
        order: orderRows[0] ? { ...orderRows[0], importedImeis: uniqueImeis } : null,
        cashbookEntry,
        importedCount: uniqueImeis.length,
      };
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: `Đã nhập thành công ${result.importedCount} máy vào CSDL MySQL và tự động hạch toán Sổ Quỹ!`,
      data: result,
    });
  } catch (error: any) {
    console.error('Restock API error:', error);
    return NextResponse.json(
      { error: 'Lỗi thực hiện nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
