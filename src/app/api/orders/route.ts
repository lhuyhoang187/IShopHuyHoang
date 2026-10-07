import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerStore } from '@/lib/serverStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [
            { invoiceCode: code },
            { customerPhone: code },
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

      const fallback = ServerStore.getInvoiceByCode(code);
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

    if (!body.customerName || !body.customerPhone || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ tên, số điện thoại và danh sách sản phẩm' },
        { status: 400 }
      );
    }

    const count = await prisma.invoice.count();
    const invoiceCode = `HD-2608-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const totalAmount = Number(body.totalAmount || 0);
    const subtotal = Number(body.subtotal || totalAmount);
    const discount = Number(body.discount || 0);
    const earnedPoints =
      typeof body.earnedPoints === 'number' && body.earnedPoints >= 0
        ? Number(body.earnedPoints)
        : Math.floor(totalAmount / 100000);

    // 1. Ensure Customer exists and update loyalty stats (Toàn vẹn khóa ngoại)
    await prisma.customer.upsert({
      where: { phone: body.customerPhone.trim() },
      update: {
        name: body.customerName.trim(),
        totalSpent: { increment: totalAmount },
        purchaseCount: { increment: 1 },
        points: { increment: earnedPoints },
      },
      create: {
        id: 'cust-' + Date.now(),
        name: body.customerName.trim(),
        phone: body.customerPhone.trim(),
        totalSpent: totalAmount,
        purchaseCount: 1,
        points: earnedPoints,
      },
    });

    // 2. Create Invoice in MySQL
    const newInvoice = await prisma.invoice.create({
      data: {
        id: 'inv-' + Date.now(),
        invoiceCode,
        customerName: body.customerName,
        customerPhone: body.customerPhone.trim(),
        items: JSON.stringify(body.items),
        subtotal,
        discount,
        totalAmount,
        paymentMethod: body.paymentMethod || 'vietqr',
        cashReceived: body.cashReceived ? Number(body.cashReceived) : null,
        cashChange: body.cashChange ? Number(body.cashChange) : null,
        cashierName: body.cashierName || 'Website Online Order',
        createdAt: new Date(),
        warrantyNote: 'Bảo hành điện tử 12 tháng theo IMEI/Hóa đơn.',
      },
    });

    // 2. Mark sold PhoneStock items in MySQL
    for (const item of body.items) {
      if (item.imei) {
        await prisma.phoneStock.updateMany({
          where: { imei: item.imei },
          data: {
            status: 'sold',
            soldAt: now,
            soldInvoiceId: invoiceCode,
            soldToCustomerName: body.customerName,
            soldToCustomerPhone: body.customerPhone,
          },
        });
      }
    }

    // 3. If paid by cash or instant transfer, automatically create a cashbook entry in MySQL!
    const cashbookEntryCode = `PT-${String(Date.now()).slice(-6)}`;
    await prisma.cashbookEntry.create({
      data: {
        id: 'cb-' + Date.now(),
        code: cashbookEntryCode,
        date: now.split(' ')[0],
        type: 'receipt',
        category: 'sale_phone',
        categoryLabel: 'Bán điện thoại & phụ kiện',
        amount: totalAmount,
        paymentMethod: body.paymentMethod === 'cash' ? 'cash' : 'transfer',
        referenceCode: invoiceCode,
        description: `Thu tiền đơn hàng ${invoiceCode} - Khách ${body.customerName} (${body.customerPhone})`,
        creator: body.cashierName || 'Thu ngân Website',
      },
    });

    // Sync in-memory fallback
    ServerStore.createInvoice({
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      items: body.items,
      subtotal,
      discount,
      totalAmount,
      paymentMethod: body.paymentMethod || 'vietqr',
      cashierName: body.cashierName || 'Website Online Order',
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
      { error: 'Lỗi xử lý dữ liệu đơn hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
