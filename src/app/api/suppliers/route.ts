import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAmount, sanitizeString, normalizePhone, isValidPhone } from '@/lib/validation';

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

    // 1. Create Supplier Action
    if (body.action === 'create' || body.name) {
      const name = sanitizeString(body.name, 150);
      const phone = normalizePhone(body.phone || '');
      const email = body.email ? sanitizeString(body.email, 100).toLowerCase() : 'ncc@ishophuyhoang.vn';
      const address = sanitizeString(body.address || 'Hà Nội / TP.HCM', 191);
      const contactPerson = sanitizeString(body.contactPerson || name, 100);
      const currentDebt = Number(body.currentDebt || 0);

      if (!name || name.length < 2) {
        return NextResponse.json(
          { error: 'Tên nhà cung cấp không được để trống (tối thiểu 2 ký tự)' },
          { status: 400 }
        );
      }

      const id = body.id || 'sup-' + Date.now();
      const created = await prisma.supplier.create({
        data: {
          id,
          name,
          phone: phone || '0900000000',
          email,
          address,
          contactPerson,
          totalPurchased: Number(body.totalPurchased || 0),
          currentDebt: Math.max(0, currentDebt),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã tạo mới nhà cung cấp thành công',
        data: created,
      });
    }

    // 2. Pay Debt Action
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
      { error: 'Lỗi thực hiện thao tác NCC: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, email, address, contactPerson, currentDebt } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vui lòng cung cấp ID nhà cung cấp' }, { status: 400 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name ? { name: sanitizeString(name, 150) } : {}),
        ...(phone ? { phone: normalizePhone(phone) } : {}),
        ...(email ? { email: sanitizeString(email, 100).toLowerCase() } : {}),
        ...(address ? { address: sanitizeString(address, 191) } : {}),
        ...(contactPerson ? { contactPerson: sanitizeString(contactPerson, 100) } : {}),
        ...(currentDebt !== undefined ? { currentDebt: Math.max(0, Number(currentDebt)) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật thông tin nhà cung cấp thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('Suppliers API PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật nhà cung cấp: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();

    if (!id) {
      return NextResponse.json({ error: 'Vui lòng cung cấp ID nhà cung cấp cần xóa' }, { status: 400 });
    }

    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { phoneStocks: true, orders: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy nhà cung cấp' }, { status: 404 });
    }

    if (existing._count.phoneStocks > 0 || existing._count.orders > 0) {
      return NextResponse.json(
        { error: `Không thể xóa nhà cung cấp đã có ${existing._count.phoneStocks} máy trong kho hoặc ${existing._count.orders} đơn nhập` },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Đã xóa nhà cung cấp ${existing.name} thành công`,
    });
  } catch (error: any) {
    console.error('Suppliers API DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa nhà cung cấp: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
