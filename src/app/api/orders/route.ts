import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [
            { invoiceCode: cleanCode },
            { customerPhone: cleanCode },
            ...(normalizedPhone ? [{ customerPhone: normalizedPhone }] : []),
          ],
        },
      });

      if (invoice) {
        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...invoice,
            items: invoice.items ? JSON.parse(invoice.items) : [],
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

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = invoices.map((inv) => ({
      ...inv,
      items: inv.items ? JSON.parse(inv.items) : [],
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

    const count = await prisma.invoice.count();
    const invoiceCode = `HD-2608-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const earnedPoints =
      typeof body.earnedPoints === 'number' && body.earnedPoints >= 0
        ? Number(body.earnedPoints)
        : Math.floor(totalAmount / 10000); // 10.000đ = 1 điểm

    // Atomic Transaction to execute Order, Customer update, Stock deduction, Cashbook entry
    const newInvoice = await prisma.$transaction(async (tx) => {
      // 1. Check IMEI availability for phones
      for (const item of body.items) {
        if (item.imei) {
          const stockItem = await tx.phoneStock.findUnique({
            where: { imei: item.imei },
          });

          if (stockItem && stockItem.status === 'sold') {
            throw new Error(`Điện thoại IMEI ${item.imei} (${stockItem.phoneName}) đã được bán trước đó!`);
          }
        }
      }

      // 2. Ensure Customer exists and update loyalty stats
      await tx.customer.upsert({
        where: { phone: customerPhone },
        update: {
          name: customerName,
          totalSpent: { increment: totalAmount },
          purchaseCount: { increment: 1 },
          points: { increment: earnedPoints },
        },
        create: {
          id: 'cust-' + Date.now(),
          name: customerName,
          phone: customerPhone,
          totalSpent: totalAmount,
          purchaseCount: 1,
          points: earnedPoints,
        },
      });

      // 3. Create Invoice in MySQL
      const inv = await tx.invoice.create({
        data: {
          id: 'inv-' + Date.now(),
          invoiceCode,
          customerName,
          customerPhone,
          items: JSON.stringify(body.items),
          subtotal,
          discount,
          totalAmount,
          paymentMethod,
          cashReceived: body.cashReceived ? Number(body.cashReceived) : null,
          cashChange: body.cashChange ? Number(body.cashChange) : null,
          cashierName: sanitizeString(body.cashierName || 'Website Online Order', 100),
          createdAt: new Date(),
          warrantyNote: sanitizeString(body.warrantyNote || 'Bảo hành điện tử 12 tháng theo IMEI/Hóa đơn.', 500),
        },
      });

      // 4. Mark PhoneStock as sold & update accessory stock
      for (const item of body.items) {
        if (item.imei) {
          await tx.phoneStock.updateMany({
            where: { imei: item.imei },
            data: {
              status: 'sold',
              soldAt: now,
              soldInvoiceId: invoiceCode,
              soldToCustomerName: customerName,
              soldToCustomerPhone: customerPhone,
            },
          });
        }

        // Deduct Accessory stock if item is an accessory
        const accessoryId = item.accessoryId || item.id;
        const qty = Number(item.quantity || 1);
        if (accessoryId && item.type === 'accessory') {
          await tx.accessoryProduct.updateMany({
            where: { id: accessoryId, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
        }
      }

      // 5. If paid by cash, card, or vietqr transfer, create a cashbook entry
      if (totalAmount > 0) {
        const cashCount = await tx.cashbookEntry.count();
        const cashbookEntryCode = `PT-2608-${String(cashCount + 1).padStart(3, '0')}`;
        await tx.cashbookEntry.create({
          data: {
            id: 'cb-' + Date.now(),
            code: cashbookEntryCode,
            date: now.split(' ')[0],
            type: 'receipt',
            category: 'sale_phone',
            categoryLabel: 'Bán điện thoại & phụ kiện',
            amount: totalAmount,
            paymentMethod: paymentMethod === 'cash' ? 'cash' : 'transfer',
            referenceCode: invoiceCode,
            description: `Thu tiền đơn hàng ${invoiceCode} - Khách ${customerName} (${customerPhone})`,
            creator: sanitizeString(body.cashierName || 'Thu ngân Website', 100),
          },
        });
      }

      return inv;
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
