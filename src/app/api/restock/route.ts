import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      supplierId,
      phoneId,
      phoneName,
      color,
      capacity,
      costPrice,
      sellingPrice,
      imeis,
      paidAmount,
      notes,
    } = body;

    if (!supplierId || !imeis || !Array.isArray(imeis) || imeis.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nhà cung cấp và danh sách số IMEI hợp lệ' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    const supplierName = supplier?.name || 'Nhà Cung Cấp Phân Phối';
    const totalBatchCost = Number(costPrice || 0) * imeis.length;
    const paid = Number(paidAmount || 0);
    const debtIncrease = Math.max(0, totalBatchCost - paid);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.split(' ')[0];

    const orderCount = await prisma.supplierOrder.count();
    const orderCode = `NH-2608-${String(orderCount + 1).padStart(3, '0')}`;

    // Execute in Prisma Transaction for full atomic data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Insert PhoneStock for each IMEI
      for (const imei of imeis) {
        await tx.phoneStock.upsert({
          where: { imei },
          update: {
            phoneId: phoneId || 'p-1',
            phoneName: phoneName || 'iPhone Mới Nhập',
            color: color || 'Titan Tự Nhiên',
            capacity: capacity || '256GB',
            costPrice: Number(costPrice || 0),
            sellingPrice: Number(sellingPrice || 0),
            supplierId,
            supplierName,
            status: 'in_stock',
          },
          create: {
            imei,
            phoneId: phoneId || 'p-1',
            phoneName: phoneName || 'iPhone Mới Nhập',
            color: color || 'Titan Tự Nhiên',
            capacity: capacity || '256GB',
            costPrice: Number(costPrice || 0),
            sellingPrice: Number(sellingPrice || 0),
            supplierId,
            supplierName,
            importDate: dateStr,
            status: 'in_stock',
            warrantyMonths: 12,
          },
        });
      }

      // 2. Create Supplier Order record
      const order = await tx.supplierOrder.create({
        data: {
          id: 'ord-' + Date.now(),
          orderCode,
          supplierId,
          supplierName,
          date: dateStr,
          type: 'phones',
          itemsSummary: `Nhập ${imeis.length} cây ${phoneName || 'iPhone'} (${color} - ${capacity})`,
          totalAmount: totalBatchCost,
          paidAmount: paid,
          debtAmount: debtIncrease,
          status: debtIncrease === 0 ? 'completed' : 'partial',
          notes: notes || 'Nhập lô hàng chính ngạch.',
          importedImeis: JSON.stringify(imeis),
        },
      });

      // 3. Update Supplier debt & purchase totals
      if (supplier) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            totalPurchased: supplier.totalPurchased + totalBatchCost,
            currentDebt: supplier.currentDebt + debtIncrease,
          },
        });
      }

      // 4. Auto-generate Cashbook Payment Entry (Phiếu Chi tiền mặt/chuyển khoản)
      let cashbookEntry = null;
      if (paid > 0) {
        const cashCount = await tx.cashbookEntry.count();
        const cashCode = `PC-2608-${String(cashCount + 1).padStart(3, '0')}`;

        cashbookEntry = await tx.cashbookEntry.create({
          data: {
            id: 'cb-' + Date.now(),
            code: cashCode,
            date: dateStr,
            type: 'payment',
            category: 'supplier_restock',
            categoryLabel: 'Nhập hàng nhà cung cấp',
            amount: paid,
            paymentMethod: 'transfer',
            referenceCode: orderCode,
            description: `Thanh toán tiền nhập lô ${imeis.length} máy đơn hàng ${orderCode} cho ${supplierName}`,
            creator: 'Lê Huy Hoàng (Chủ Shop)',
          },
        });
      }

      return { order, cashbookEntry, importedCount: imeis.length };
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: `Đã nhập thành công ${result.importedCount} máy vào CSDL MySQL và tự động hạch toán Sổ Quỹ!`,
      data: result,
    });
  } catch (error: any) {
    console.error('Restock API error:', error);
    return NextResponse.json(
      { error: 'Lỗi thực hiện nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
