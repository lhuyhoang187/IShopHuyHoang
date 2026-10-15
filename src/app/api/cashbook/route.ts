import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  isValidAmount,
  sanitizeString,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const entries = await prisma.cashbookEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalReceipt = entries
      .filter((e) => e.type === 'receipt')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPayment = entries
      .filter((e) => e.type === 'payment')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = totalReceipt - totalPayment;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      totalReceipt,
      totalPayment,
      balance,
      data: entries,
    });
  } catch (error: any) {
    console.error('Cashbook GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn sổ quỹ: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type = body.type === 'receipt' || body.type === 'payment' ? body.type : null;
    if (!type) {
      return NextResponse.json(
        { error: 'Loại phiếu không hợp lệ. Chỉ chấp nhận "receipt" (Thu) hoặc "payment" (Chi)' },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (!isValidAmount(amount, false)) {
      return NextResponse.json(
        { error: 'Số tiền phiếu thu/chi phải là số dương lớn hơn 0' },
        { status: 400 }
      );
    }

    const category = sanitizeString(body.category, 50);
    const description = sanitizeString(body.description, 1000);

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ hạng mục và mô tả nội dung thu/chi' },
        { status: 400 }
      );
    }

    const paymentMethod = body.paymentMethod === 'transfer' ? 'transfer' : 'cash';
    const categoryLabel = sanitizeString(
      body.categoryLabel || (type === 'receipt' ? 'Thu tiền mặt / chuyển khoản' : 'Chi tiền mặt / chuyển khoản'),
      100
    );

    const count = await prisma.cashbookEntry.count();
    const prefix = type === 'receipt' ? 'PT' : 'PC';
    const now = new Date();
    const code = `${prefix}-2608-${String(count + 1).padStart(3, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const newEntry = await prisma.cashbookEntry.create({
      data: {
        id: 'cb-' + Date.now(),
        code,
        date: dateStr,
        type,
        category,
        categoryLabel,
        amount,
        paymentMethod,
        referenceCode: body.referenceCode ? sanitizeString(body.referenceCode, 50) : null,
        description,
        creator: sanitizeString(body.creator || 'Lê Huy Hoàng (Chủ Shop)', 100),
      },
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: `Tạo ${type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'} thành công`,
        data: newEntry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Cashbook POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi tạo phiếu thu/chi: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
