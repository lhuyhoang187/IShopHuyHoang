import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
} from '@/lib/validation';

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

    // Clean and deduplicate IMEIs in the incoming batch
    const rawImeis: string[] = imeis.map((im: any) => String(im).trim()).filter(Boolean);
    const uniqueImeis = Array.from(new Set(rawImeis));

    if (uniqueImeis.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách IMEI không chứa mã IMEI hợp lệ' },
        { status: 400 }
      );
    }

    // Validate each IMEI
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

    // Resolve Supplier
    const supplier = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [supplierId]);

    if (!supplier) {
      return NextResponse.json(
        { error: `Không tìm thấy nhà cung cấp với mã ID: ${supplierId}` },
        { status: 404 }
      );
    }

    const supplierName = supplier.name;

    // Resolve PhoneProduct foreign key
    let resolvedPhoneId = phoneId ? sanitizeString(phoneId, 50) : null;
    if (resolvedPhoneId) {
      const existsPhone = await db.queryOne('SELECT id FROM phoneproduct WHERE id = ?', [resolvedPhoneId]);
      if (!existsPhone) resolvedPhoneId = null;
    }
    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT id FROM phoneproduct LIMIT 1');
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
    }

    const totalBatchCost = costNum * uniqueImeis.length;
    const paid = Math.min(paidNum, totalBatchCost);
    const debtIncrease = Math.max(0, totalBatchCost - paid);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.split(' ')[0];

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM supplierorder');
    const orderCount = countRow?.cnt || 0;
    const orderCode = `NH-2608-${String(orderCount + 1).padStart(3, '0')}`;

    // Execute in SQL Transaction for full atomic data integrity
    const result = await db.transaction(async (conn) => {
      // 1. Insert/Update PhoneStock for each IMEI
      for (const imei of uniqueImeis) {
        await conn.execute(
          `INSERT INTO phonestock 
           (imei, phoneId, phoneName, color, capacity, costPrice, sellingPrice, supplierId, supplierName, importDate, status, warrantyMonths, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', 12, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             phoneId = VALUES(phoneId),
             phoneName = VALUES(phoneName),
             color = VALUES(color),
             capacity = VALUES(capacity),
             costPrice = VALUES(costPrice),
             sellingPrice = VALUES(sellingPrice),
             supplierId = VALUES(supplierId),
             supplierName = VALUES(supplierName),
             status = 'in_stock',
             updatedAt = NOW()`,
          [
            imei,
            resolvedPhoneId,
            sanitizeString(phoneName || 'iPhone Mới Nhập', 191),
            sanitizeString(color || 'Titan Tự Nhiên', 100),
            sanitizeString(capacity || '256GB', 50),
            costNum,
            sellNum,
            supplierId,
            supplierName,
            dateStr,
          ]
        );
      }

      // 2. Create Supplier Order record
      const orderId = 'ord-' + Date.now();
      await conn.execute(
        `INSERT INTO supplierorder 
         (id, orderCode, supplierId, supplierName, date, type, itemsSummary, totalAmount, paidAmount, debtAmount, status, notes, importedImeis, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'phones', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          orderCode,
          supplierId,
          supplierName,
          dateStr,
          `Nhập ${uniqueImeis.length} cây ${phoneName || 'iPhone'} (${color || 'Titan'} - ${capacity || '256GB'})`,
          totalBatchCost,
          paid,
          debtIncrease,
          debtIncrease === 0 ? 'completed' : 'partial',
          sanitizeString(notes || 'Nhập lô hàng chính ngạch.', 1000),
          JSON.stringify(uniqueImeis),
        ]
      );

      // 2.1. Insert 3NF Normalized Supplier Order Items
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
            sanitizeString(phoneName || 'iPhone', 191),
            sanitizeString(color || 'Titan', 100),
            sanitizeString(capacity || '256GB', 50),
            costNum,
            costNum,
            imei,
          ]
        );
      }

      // 3. Update Supplier debt & purchase totals
      await conn.execute(
        `UPDATE supplier SET 
           totalPurchased = totalPurchased + ?, 
           currentDebt = currentDebt + ?, 
           updatedAt = NOW() 
         WHERE id = ?`,
        [totalBatchCost, debtIncrease, supplierId]
      );

      // 4. Auto-generate Cashbook Payment Entry (Phiếu Chi tiền mặt/chuyển khoản)
      let cashbookEntry = null;
      if (paid > 0) {
        const [cashCountRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM cashbookentry');
        const cashCount = cashCountRow[0]?.cnt || 0;
        const cashCode = `PC-2608-${String(cashCount + 1).padStart(3, '0')}`;
        const cashId = 'cb-' + Date.now();

        await conn.execute(
          `INSERT INTO cashbookentry 
           (id, code, date, type, category, categoryLabel, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
           VALUES (?, ?, ?, 'payment', 'supplier_restock', 'Nhập hàng nhà cung cấp', ?, 'transfer', ?, ?, 'Lê Huy Hoàng (Chủ Shop)', NOW(), NOW())`,
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
        cashbookEntry = cashRows[0];
      }

      const [orderRows]: any = await conn.query('SELECT * FROM supplierorder WHERE id = ?', [orderId]);

      return { order: orderRows[0], cashbookEntry, importedCount: uniqueImeis.length };
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
