import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAmount, sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: suppliers.length,
      data: suppliers,
    });
  } catch (error: any) {
    console.error('Suppliers API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn nhà cung cấp: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, amount, paymentMethod, notes, creator } = body;

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Vui lòng chọn nhà cung cấp' },
        { status: 400 }
      );
    }

    const payAmount = Number(amount);
    if (!isValidAmount(payAmount, false)) {
      return NextResponse.json(
        { error: 'Số tiền thanh toán phải lớn hơn 0' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Không tìm thấy nhà cung cấp' },
        { status: 404 }
      );
    }

    // Atomic transaction: Deduct debt + create cashbook payment entry
    const result = await prisma.$transaction(async (tx) => {
      const updatedSupplier = await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentDebt: Math.max(0, supplier.currentDebt - payAmount),
        },
      });

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const cashCount = await tx.cashbookEntry.count();
      const code = `PC-NCC-${dateStr.replace(/-/g, '').slice(2)}-${String(cashCount + 1).padStart(3, '0')}`;

      const cashEntry = await tx.cashbookEntry.create({
        data: {
          id: 'cb-' + Date.now(),
          code,
          date: dateStr,
          type: 'payment',
          category: 'supplier_restock',
          categoryLabel: 'Thanh toán nợ NCC',
          amount: payAmount,
          paymentMethod: paymentMethod === 'cash' ? 'cash' : 'transfer',
          referenceCode: supplier.id,
          description: `Trả nợ nhà cung cấp ${supplier.name} - ${notes || 'Chuyển khoản/tiền mặt thanh toán công nợ'}`,
          creator: sanitizeString(creator || 'Quản lý cửa hàng', 100),
        },
      });

      return { supplier: updatedSupplier, cashbook: cashEntry };
    });

    return NextResponse.json({
      success: true,
      message: 'Thanh toán công nợ NCC và ghi sổ quỹ thành công',
      data: result,
    });
  } catch (error: any) {
    console.error('Suppliers API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi thanh toán công nợ: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

