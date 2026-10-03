import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerStore } from '@/lib/serverStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei')?.trim();

  if (!imei) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp tham số imei cần tra cứu' },
      { status: 400 }
    );
  }

  try {
    // 1. Query MySQL database via Prisma
    const stockItem = await prisma.phoneStock.findUnique({
      where: { imei },
    });

    if (stockItem) {
      const soldDate = stockItem.soldAt ? new Date(stockItem.soldAt) : null;
      let isExpired = false;
      let remainingDays = 0;
      let expiryDateString = '';

      if (soldDate) {
        const expiryDate = new Date(soldDate);
        expiryDate.setMonth(expiryDate.getMonth() + (stockItem.warrantyMonths || 12));
        expiryDateString = expiryDate.toISOString().substring(0, 10);

        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpired = remainingDays <= 0;
      }

      return NextResponse.json({
        success: true,
        source: 'mysql_database',
        data: {
          found: true,
          imei: stockItem.imei,
          phoneName: stockItem.phoneName,
          color: stockItem.color,
          capacity: stockItem.capacity,
          sellingPrice: stockItem.sellingPrice,
          status: stockItem.status,
          warrantyMonths: stockItem.warrantyMonths,
          soldAt: stockItem.soldAt,
          soldInvoiceId: stockItem.soldInvoiceId,
          soldToCustomerName: stockItem.soldToCustomerName,
          soldToCustomerPhone: stockItem.soldToCustomerPhone,
          expiryDate: expiryDateString,
          remainingDays,
          isExpired,
        },
      });
    }

    // 2. Fallback to ServerStore if not in MySQL yet
    const fallback = ServerStore.checkWarranty(imei);
    if (!fallback.found) {
      return NextResponse.json(
        {
          success: false,
          message: 'Không tìm thấy số IMEI trong hệ thống',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'fallback_store',
      data: fallback,
    });
  } catch (error: any) {
    console.error('Warranty query error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
