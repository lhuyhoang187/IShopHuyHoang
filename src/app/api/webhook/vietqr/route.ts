import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidAmount } from '@/lib/validation';

/**
 * Endpoint tiếp nhận Webhook ngân hàng tự động (Casso / SePay / Napas 247)
 * POST /api/webhook/vietqr
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Dữ liệu webhook không phải định dạng JSON hợp lệ' },
          { status: 400 }
        );
      }
    }

    const transferAmount = Number(body.transferAmount || body.amount || body.price || 0);
    const content = String(body.content || body.description || body.subAccount || '');
    const referenceCode = String(body.referenceCode || body.ref || body.id || '');

    if (!isValidAmount(transferAmount, false)) {
      return NextResponse.json(
        { error: 'Số tiền giao dịch không hợp lệ (phải lớn hơn 0)' },
        { status: 400 }
      );
    }

    // Đối soát mã đơn hàng HD-xxxx hoặc phiếu sửa SC-xxxx trực tiếp trong MySQL
    const upperContent = content.toUpperCase();
    const invoiceMatch = upperContent.match(/HD[-_]?\d+[-_]?\d+/i);
    const repairMatch = upperContent.match(/SC[-_]?\d+[-_]?\d+/i);

    let matched = false;
    let type: 'invoice' | 'repair' | 'unknown' = 'unknown';
    let targetCode: string | null = null;

    if (invoiceMatch) {
      const code = invoiceMatch[0].replace(/_/g, '-');
      const inv = await db.queryOne('SELECT invoiceCode FROM invoice WHERE UPPER(invoiceCode) = ?', [code]);
      if (inv) {
        matched = true;
        type = 'invoice';
        targetCode = inv.invoiceCode;
      }
    } else if (repairMatch) {
      const code = repairMatch[0].replace(/_/g, '-');
      const rep = await db.queryOne('SELECT ticketCode FROM repairticket WHERE UPPER(ticketCode) = ?', [code]);
      if (rep) {
        matched = true;
        type = 'repair';
        targetCode = rep.ticketCode;
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM cashbookentry');
    const cashCount = countRow?.cnt || 0;
    const cashbookCode = `PT-NAPAS-${dateStr.replace(/-/g, '').slice(2)}-${String(cashCount + 1).padStart(3, '0')}`;
    const cbId = 'cb-webhook-' + Date.now();

    await db.execute(
      `INSERT INTO cashbookentry
       (id, code, date, type, category, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
       VALUES (?, ?, ?, 'receipt', ?, ?, 'transfer', ?, ?, 'Hệ Thống Webhook Tự Động', NOW(), NOW())`,
      [
        cbId,
        cashbookCode,
        dateStr,
        type === 'repair' ? 'repair_service' : 'sale_phone',
        transferAmount,
        targetCode || referenceCode || 'WEBHOOK',
        `[Tự Động Napas 247] Nhận ${transferAmount.toLocaleString('vi-VN')}đ. Nội dung: ${content}`,
      ]
    );

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: 'Xử lý biến động số dư VietQR thành công và đã hạch toán CSDL',
      data: {
        success: true,
        matched,
        type,
        targetCode,
        amountReceived: transferAmount,
        cashbookEntryCode: cashbookCode,
        mysqlCashbookCode: cashbookCode,
      },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý webhook: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
