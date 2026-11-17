import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServerStore } from '@/lib/serverStore';
import {
  normalizePhone,
  isValidPhone,
  isValidAmount,
  sanitizeString,
  VALID_PAYMENT_METHODS,
  ValidPaymentMethod,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      const cleanCode = code.trim();
      const normalizedPhone = normalizePhone(cleanCode);

      const invoice = await db.queryOne(
        `SELECT * FROM invoice 
         WHERE invoiceCode = ? OR customerPhone = ? OR customerPhone = ?
         LIMIT 1`,
        [cleanCode, cleanCode, normalizedPhone || cleanCode]
      );

      if (invoice) {
        const items = await db.query('SELECT * FROM invoiceitem WHERE invoiceCode = ?', [invoice.invoiceCode]);
        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...invoice,
            items: invoice.items ? JSON.parse(invoice.items) : items,
            invoiceItems: items,
          },
        });
      }

      const fallback = ServerStore.getInvoiceByCode(cleanCode);
      if (!fallback) {
        return NextResponse.json(
          { error: 'Không tìm thấy hóa đơn' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, source: 'fallback_store', data: fallback });
    }

    const invoices = await db.query('SELECT * FROM invoice ORDER BY createdAt DESC');
    const allItems = await db.query('SELECT * FROM invoiceitem');

    const itemsByInvoice: Record<string, any[]> = {};
    for (const it of allItems) {
      if (!itemsByInvoice[it.invoiceCode]) itemsByInvoice[it.invoiceCode] = [];
      itemsByInvoice[it.invoiceCode].push(it);
    }

    const parsed = invoices.map((inv) => ({
      ...inv,
      items: inv.items ? JSON.parse(inv.items) : (itemsByInvoice[inv.invoiceCode] || []),
      invoiceItems: itemsByInvoice[inv.invoiceCode] || [],
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn đơn hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerName = sanitizeString(body.customerName, 100);
    const rawPhone = String(body.customerPhone || '');
    const customerPhone = normalizePhone(rawPhone);

    // Business Constraints Validation
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ (cần đúng 10 số đầu 03, 05, 07, 08, 09)' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Đơn hàng phải chứa ít nhất 1 sản phẩm' },
        { status: 400 }
      );
    }

    const totalAmount = Number(body.totalAmount ?? 0);
    const subtotal = Number(body.subtotal ?? totalAmount);
    const discount = Number(body.discount ?? 0);

    if (!isValidAmount(totalAmount) || !isValidAmount(subtotal) || !isValidAmount(discount)) {
      return NextResponse.json(
        { error: 'Số tiền thanh toán, tạm tính hoặc giảm giá không hợp lệ (không được âm)' },
        { status: 400 }
      );
    }

    if (discount > subtotal) {
      return NextResponse.json(
        { error: 'Số tiền giảm giá không thể lớn hơn tổng tạm tính của đơn hàng' },
        { status: 400 }
      );
    }

    const paymentMethod: ValidPaymentMethod = VALID_PAYMENT_METHODS.includes(body.paymentMethod)
      ? body.paymentMethod
      : 'vietqr';

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM invoice');
    const count = countRow?.cnt || 0;
    const invoiceCode = `HD-2608-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const earnedPoints =
      typeof body.earnedPoints === 'number' && body.earnedPoints >= 0
        ? Number(body.earnedPoints)
        : Math.floor(totalAmount / 10000); // 10.000đ = 1 điểm

    const invId = 'inv-' + Date.now();

    // Atomic SQL Transaction
    const newInvoice = await db.transaction(async (conn) => {
      // 1. Check IMEI availability for phones
      for (const item of body.items) {
        if (item.imei) {
          const [stockRows]: any = await conn.query('SELECT status, phoneName FROM phonestock WHERE imei = ?', [item.imei]);
          const stockItem = stockRows[0];
          if (stockItem && stockItem.status === 'sold') {
            throw new Error(`Điện thoại IMEI ${item.imei} (${stockItem.phoneName}) đã được bán trước đó!`);
          }
        }
      }

      // 2. Ensure Customer exists and update loyalty stats
      const [custRows]: any = await conn.query('SELECT id FROM customer WHERE phone = ?', [customerPhone]);
      if (custRows.length > 0) {
        await conn.execute(
          `UPDATE customer SET 
             name = ?, totalSpent = totalSpent + ?, purchaseCount = purchaseCount + 1, points = points + ?, updatedAt = NOW()
           WHERE phone = ?`,
          [customerName, totalAmount, earnedPoints, customerPhone]
        );
      } else {
        await conn.execute(
          `INSERT INTO customer (id, name, phone, points, totalSpent, purchaseCount, repairCount, membershipTier, customerType, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 1, 0, 'Thành viên mới', 'Khách lẻ', NOW(), NOW())`,
          ['cust-' + Date.now(), customerName, customerPhone, earnedPoints, totalAmount]
        );
      }

      // 3. Create Invoice in MySQL
      await conn.execute(
        `INSERT INTO invoice 
         (id, invoiceCode, customerName, customerPhone, items, subtotal, discount, totalAmount, paymentMethod, cashReceived, cashChange, cashierName, warrantyNote, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), NOW())`,
        [
          invId,
          invoiceCode,
          customerName,
          customerPhone,
          JSON.stringify(body.items),
          subtotal,
          discount,
          totalAmount,
          paymentMethod,
          body.cashReceived ? Number(body.cashReceived) : null,
          body.cashChange ? Number(body.cashChange) : null,
          sanitizeString(body.cashierName || 'Website Online Order', 100),
          sanitizeString(body.warrantyNote || 'Bảo hành điện tử 12 tháng theo IMEI/Hóa đơn.', 500),
        ]
      );

      // 3.1. Insert 3NF Normalized Invoice Items
      for (const item of body.items) {
        const itemId = 'ii_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO invoiceitem 
           (id, invoiceCode, itemType, productId, productName, imei, color, capacity, unitPrice, quantity, discount, subtotal, warrantyMonths, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 12, NOW(), NOW())`,
          [
            itemId,
            invoiceCode,
            item.type || (item.imei ? 'phone' : 'accessory'),
            item.productId || item.id || null,
            sanitizeString(item.name || 'Sản phẩm', 191),
            item.imei || null,
            item.color || (item.variant ? item.variant.split('/')[0]?.trim() : null),
            item.capacity || (item.variant ? item.variant.split('/')[1]?.trim() : null),
            Number(item.unitPrice || item.price) || 0,
            Number(item.quantity) || 1,
            Number(item.discount) || 0,
            Number(item.subtotal || item.total || item.unitPrice || item.price) || 0,
          ]
        );
      }

      // 4. Mark PhoneStock as sold & update accessory stock
      for (const item of body.items) {
        if (item.imei) {
          await conn.execute(
            `UPDATE phonestock SET 
               status = 'sold', soldAt = ?, soldInvoiceId = ?, soldToCustomerName = ?, soldToCustomerPhone = ?, updatedAt = NOW()
             WHERE imei = ?`,
            [now, invoiceCode, customerName, customerPhone, item.imei]
          );
        }

        // Deduct Accessory stock if item is an accessory
        const accessoryId = item.accessoryId || item.id;
        const qty = Number(item.quantity || 1);
        if (accessoryId && item.type === 'accessory') {
          await conn.execute(
            'UPDATE accessoryproduct SET stock = GREATEST(0, stock - ?), updatedAt = NOW() WHERE id = ?',
            [qty, accessoryId]
          );
        }
      }

      // 5. If paid by cash, card, or vietqr transfer, create a cashbook entry
      if (totalAmount > 0) {
        const [cashCountRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM cashbookentry');
        const cashCount = cashCountRow[0]?.cnt || 0;
        const cashbookEntryCode = `PT-2608-${String(cashCount + 1).padStart(3, '0')}`;
        await conn.execute(
          `INSERT INTO cashbookentry 
           (id, code, date, type, category, categoryLabel, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
           VALUES (?, ?, ?, 'receipt', 'sale_phone', 'Bán điện thoại & phụ kiện', ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            'cb-' + Date.now(),
            cashbookEntryCode,
            now.split(' ')[0],
            totalAmount,
            paymentMethod === 'cash' ? 'cash' : 'transfer',
            invoiceCode,
            `Thu tiền đơn hàng ${invoiceCode} - Khách ${customerName} (${customerPhone})`,
            sanitizeString(body.cashierName || 'Thu ngân Website', 100),
          ]
        );
      }

      const [invRows]: any = await conn.query('SELECT * FROM invoice WHERE id = ?', [invId]);
      return invRows[0];
    });

    // Sync in-memory fallback
    ServerStore.createInvoice({
      customerName,
      customerPhone,
      items: body.items,
      subtotal,
      discount,
      totalAmount,
      paymentMethod: paymentMethod === 'vietqr' ? 'vietqr' : 'cash',
      cashierName: sanitizeString(body.cashierName || 'Website Online Order', 100),
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Đặt hàng thành công và đã hạch toán vào CSDL',
        data: {
          ...newInvoice,
          items: body.items,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi đặt hàng và thanh toán' },
      { status: 400 }
    );
  }
}
