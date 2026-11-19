import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidAmount, sanitizeString, normalizePhone, getCashbookCategoryLabel } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const suppliers = await db.query('SELECT * FROM supplier ORDER BY createdAt DESC');

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
    if (body.action === 'create' || (body.name && !body.supplierId)) {
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
      await db.execute(
        `INSERT INTO supplier
         (id, name, phone, email, address, contactPerson, totalPurchased, currentDebt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, name, phone || '0900000000', email, address, contactPerson, Number(body.totalPurchased || 0), Math.max(0, currentDebt)]
      );

      const created = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [id]);

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

    const supplier = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [supplierId]);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Không tìm thấy nhà cung cấp' },
        { status: 404 }
      );
    }

    const result = await db.transaction(async (conn) => {
      const newDebt = Math.max(0, Number(supplier.currentDebt || 0) - payAmount);
      await conn.execute('UPDATE supplier SET currentDebt = ?, updatedAt = NOW() WHERE id = ?', [newDebt, supplierId]);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const [countRows]: any = await conn.query('SELECT COUNT(*) as cnt FROM cashbookentry');
      const cashCount = countRows[0]?.cnt || 0;
      const code = `PC-NCC-${dateStr.replace(/-/g, '').slice(2)}-${String(cashCount + 1).padStart(3, '0')}`;
      const cashId = 'cb-' + Date.now();

      await conn.execute(
        `INSERT INTO cashbookentry
         (id, code, date, type, category, amount, paymentMethod, referenceCode, description, creator, createdAt, updatedAt)
         VALUES (?, ?, ?, 'payment', 'supplier_restock', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          cashId,
          code,
          dateStr,
          payAmount,
          paymentMethod === 'cash' ? 'cash' : 'transfer',
          supplier.id,
          `Trả nợ nhà cung cấp ${supplier.name} - ${notes || 'Chuyển khoản/tiền mặt thanh toán công nợ'}`,
          sanitizeString(creator || 'Quản lý cửa hàng', 100),
        ]
      );

      const [updatedSup]: any = await conn.query('SELECT * FROM supplier WHERE id = ?', [supplierId]);
      const [cashEntry]: any = await conn.query('SELECT * FROM cashbookentry WHERE id = ?', [cashId]);

      return {
        supplier: updatedSup[0],
        cashbook: cashEntry[0]
          ? { ...cashEntry[0], categoryLabel: getCashbookCategoryLabel(cashEntry[0].category, cashEntry[0].type) }
          : null,
      };
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

    const setClauses: string[] = [];
    const params: any[] = [];

    if (name) {
      setClauses.push('name = ?');
      params.push(sanitizeString(name, 150));
    }
    if (phone) {
      setClauses.push('phone = ?');
      params.push(normalizePhone(phone));
    }
    if (email) {
      setClauses.push('email = ?');
      params.push(sanitizeString(email, 100).toLowerCase());
    }
    if (address) {
      setClauses.push('address = ?');
      params.push(sanitizeString(address, 191));
    }
    if (contactPerson) {
      setClauses.push('contactPerson = ?');
      params.push(sanitizeString(contactPerson, 100));
    }
    if (currentDebt !== undefined) {
      setClauses.push('currentDebt = ?');
      params.push(Math.max(0, Number(currentDebt)));
    }

    if (setClauses.length > 0) {
      setClauses.push('updatedAt = NOW()');
      params.push(id);
      await db.execute(`UPDATE supplier SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const updated = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [id]);

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

    const existing = await db.queryOne('SELECT * FROM supplier WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy nhà cung cấp' }, { status: 404 });
    }

    const phoneCountRow = await db.queryOne('SELECT COUNT(*) as cnt FROM phonestock WHERE supplierId = ?', [id]);
    const orderCountRow = await db.queryOne('SELECT COUNT(*) as cnt FROM supplierorder WHERE supplierId = ?', [id]);
    const phoneCount = phoneCountRow?.cnt || 0;
    const orderCount = orderCountRow?.cnt || 0;

    if (phoneCount > 0 || orderCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa nhà cung cấp đã có ${phoneCount} máy trong kho hoặc ${orderCount} đơn nhập` },
        { status: 400 }
      );
    }

    await db.execute('DELETE FROM supplier WHERE id = ?', [id]);

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
