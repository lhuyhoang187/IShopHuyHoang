import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
} from '@/lib/validation';

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

    // Clean and deduplicate IMEIs in the incoming batch
    const rawImeis: string[] = imeis.map((im: any) => String(im).trim()).filter(Boolean);
    const uniqueImeis = Array.from(new Set(rawImeis));

    if (uniqueImeis.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách IMEI không chứa mã IMEI hợp lệ' },
        { status: 400 }
      );
    }

    // Validate each IMEI
    for (const imei of uniqueImeis) {
      if (!isValidImei(imei)) {
        return NextResponse.json(
          { error: `Số IMEI "${imei}" không đúng định dạng hợp lệ (8 - 25 ký tự chữ và số)` },
          { status: 400 }
        );
      }
    }

    const costNum = Number(costPrice || 0);
    const sellNum = Number(sellingPrice || 0);
    const paidNum = Number(paidAmount || 0);

    if (!isValidAmount(costNum, true) || !isValidAmount(sellNum, true) || !isValidAmount(paidNum, true)) {
      return NextResponse.json(
        { error: 'Giá vốn, giá bán hoặc số tiền thanh toán không được âm' },
        { status: 400 }
      );
    }

    // Resolve Supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: `Không tìm thấy nhà cung cấp với mã ID: ${supplierId}` },
        { status: 404 }
      );
    }

    const supplierName = supplier.name;

    // Resolve PhoneProduct foreign key
    let resolvedPhoneId = phoneId ? sanitizeString(phoneId, 50) : null;
    if (resolvedPhoneId) {
      const existsPhone = await prisma.phoneProduct.findUnique({ where: { id: resolvedPhoneId } });
      if (!existsPhone) resolvedPhoneId = null;
    }
    if (!resolvedPhoneId) {
      const firstPhone = await prisma.phoneProduct.findFirst({ select: { id: true } });
      resolvedPhoneId = firstPhone ? firstPhone.id : 'p-1';
    }

    const totalBatchCost = costNum * uniqueImeis.length;
    const paid = Math.min(paidNum, totalBatchCost);
    const debtIncrease = Math.max(0, totalBatchCost - paid);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.split(' ')[0];

    const orderCount = await prisma.supplierOrder.count();
    const orderCode = `NH-2608-${String(orderCount + 1).padStart(3, '0')}`;

    // Execute in Prisma Transaction for full atomic data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Insert/Update PhoneStock for each IMEI
      for (const imei of uniqueImeis) {
        await tx.phoneStock.upsert({
          where: { imei },
          update: {
            phoneId: resolvedPhoneId!,
            phoneName: sanitizeString(phoneName || 'iPhone Mới Nhập', 191),
            color: sanitizeString(color || 'Titan Tự Nhiên', 100),
            capacity: sanitizeString(capacity || '256GB', 50),
            costPrice: costNum,
            sellingPrice: sellNum,
            supplierId,
            supplierName,
            status: 'in_stock',
          },
          create: {
            imei,
            phoneId: resolvedPhoneId!,
            phoneName: sanitizeString(phoneName || 'iPhone Mới Nhập', 191),
            color: sanitizeString(color || 'Titan Tự Nhiên', 100),
            capacity: sanitizeString(capacity || '256GB', 50),
            costPrice: costNum,
            sellingPrice: sellNum,
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
          itemsSummary: `Nhập ${uniqueImeis.length} cây ${phoneName || 'iPhone'} (${color || 'Titan'} - ${capacity || '256GB'})`,
          totalAmount: totalBatchCost,
          paidAmount: paid,
          debtAmount: debtIncrease,
          status: debtIncrease === 0 ? 'completed' : 'partial',
          notes: sanitizeString(notes || 'Nhập lô hàng chính ngạch.', 1000),
          importedImeis: JSON.stringify(uniqueImeis),
        },
      });

      // 3. Update Supplier debt & purchase totals
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          totalPurchased: { increment: totalBatchCost },
          currentDebt: { increment: debtIncrease },
        },
      });

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
            description: `Thanh toán tiền nhập lô ${uniqueImeis.length} máy đơn hàng ${orderCode} cho ${supplierName}`,
            creator: 'Lê Huy Hoàng (Chủ Shop)',
          },
        });
      }

      return { order, cashbookEntry, importedCount: uniqueImeis.length };
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
