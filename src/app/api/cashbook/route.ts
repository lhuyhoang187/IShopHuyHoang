import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (!body.type || !body.amount || !body.category || !body.description) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ loại phiếu, số tiền, hạng mục và mô tả' },
        { status: 400 }
      );
    }

    const count = await prisma.cashbookEntry.count();
    const prefix = body.type === 'receipt' ? 'PT' : 'PC';
    const now = new Date();
    const code = `${prefix}-2608-${String(count + 1).padStart(3, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const newEntry = await prisma.cashbookEntry.create({
      data: {
        id: 'cb-' + Date.now(),
        code,
        date: dateStr,
        type: body.type, // 'receipt' | 'payment'
        category: body.category,
        categoryLabel: body.categoryLabel || (body.type === 'receipt' ? 'Thu tiền' : 'Chi tiền'),
        amount: Number(body.amount),
        paymentMethod: body.paymentMethod || 'cash',
        referenceCode: body.referenceCode || null,
        description: body.description,
        creator: body.creator || 'Lê Huy Hoàng (Chủ Shop)',
      },
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: `Tạo ${body.type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'} thành công`,
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
