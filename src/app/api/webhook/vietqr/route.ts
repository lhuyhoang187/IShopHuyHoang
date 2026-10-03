import { NextRequest, NextResponse } from 'next/server';
import { ServerStore } from '@/lib/serverStore';

/**
 * Endpoint tiếp nhận Webhook ngân hàng tự động (Casso / SePay / Napas 247)
 * POST /api/webhook/vietqr
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
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

    // Hỗ trợ cả định dạng Casso và SePay
    const transferAmount = Number(
      body.transferAmount || body.amount || body.price || 0
    );
    const content = String(body.content || body.description || body.subAccount || '');
    const referenceCode = String(body.referenceCode || body.ref || body.id || '');
    const transactionDate = String(body.transactionDate || body.when || new Date().toISOString());

    if (transferAmount <= 0) {
      return NextResponse.json(
        { error: 'Số tiền giao dịch không hợp lệ' },
        { status: 400 }
      );
    }

    const result = ServerStore.processVietQRWebhook({
      gateway: body.gateway || 'MBBank Napas 247',
      transactionDate,
      accountNumber: body.accountNumber || body.subAccount || '0988888999',
      transferType: 'in',
      transferAmount,
      content,
      referenceCode,
    });

    return NextResponse.json({
      success: true,
      message: 'Xử lý biến động số dư VietQR thành công',
      data: result,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý webhook: ' + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
