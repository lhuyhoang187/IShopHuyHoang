import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServerStore } from '@/lib/serverStore';
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

    // Hỗ trợ cả định dạng Casso, SePay, và ngân hàng Napas
    const transferAmount = Number(
      body.transferAmount || body.amount || body.price || 0
    );
    const content = String(body.content || body.description || body.subAccount || '');
    const referenceCode = String(body.referenceCode || body.ref || body.id || '');
    const transactionDate = String(body.transactionDate || body.when || new Date().toISOString());

    if (!isValidAmount(transferAmount, false)) {
      return NextResponse.json(
        { error: 'Số tiền giao dịch không hợp lệ (phải lớn hơn 0)' },
        { status: 400 }
      );
    }

    // 1. Process in-memory store
    const result = ServerStore.processVietQRWebhook({
      gateway: body.gateway || 'MBBank Napas 247',
      transactionDate,
      accountNumber: body.accountNumber || body.subAccount || '0988888999',
      transferType: 'in',
      transferAmount,
      content,
      referenceCode,
    });

    // 2. Persist directly into MySQL database via db (mysql2)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM cashbookentry');
    const cashCount = countRow?.cnt || 0;
    const cashbookCode = `PT-NAPAS-${dateStr.replace(/-/g, '').slice(2)}-${String(cashCount + 1).padStart(3, '0')}`;
    const cbId = 'cb-webhook-' + Date.now();

    await db.execute(
      `INSERT INTO cashbookentry 
       (id, code, date, type, category, categoryLabel, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
       VALUES (?, ?, ?, 'receipt', ?, 'VietQR Napas 247 Webhook', ?, 'transfer', ?, ?, 'Hệ Thống Webhook Tự Động', NOW(), NOW())`,
      [
        cbId,
        cashbookCode,
        dateStr,
        result.type === 'repair' ? 'repair_service' : 'sale_phone',
        transferAmount,
        result.targetCode || referenceCode || 'WEBHOOK',
        `[Tự Động Napas 247] Nhận ${transferAmount.toLocaleString('vi-VN')}đ. Nội dung: ${content}`,
      ]
    );

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: 'Xử lý biến động số dư VietQR thành công và đã hạch toán CSDL',
      data: {
        ...result,
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
