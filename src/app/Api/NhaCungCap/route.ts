import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { isValidAmount, sanitizeString, getCashbookCategoryLabel } from '@/ThuVien/KiemTraHopLe';

const SUPPLIER_SELECT = `
  MaNhaCungCap AS id,
  TenNhaCungCap AS name,
  SoDienThoai AS phone,
  Email AS email,
  DiaChi AS address,
  NguoiLienHe AS contactPerson,
  TongGiaTriNhap AS totalPurchased,
  CongNoHienTai AS currentDebt,
  NgayTao AS createdAt,
  NgayCapNhat AS updatedAt
`;

const CASHBOOK_SELECT = `
  MaPhieu AS id,
  MaCodePhieu AS code,
  NgayGiaoDich AS date,
  LoaiPhieu AS type,
  HangMuc AS category,
  SoTien AS amount,
  PhuongThucThanhToan AS paymentMethod,
  MaThamChieu AS referenceCode,
  MoTa AS description,
  NguoiTao AS creator,
  NgayTao AS createdAt,
  NgayCapNhat AS updatedAt
`;

export async function GET(request: NextRequest) {
  try {
    const suppliers = await db.query(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap ORDER BY NgayTao DESC`);

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

    if (body.action === 'create' || (body.name && !body.supplierId)) {
      const name = sanitizeString(body.name, 150);
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

      const rawPhone = String(body.phone || '').trim();
      const digitsOnly = rawPhone.replace(/\D/g, '');
      if (!/^[0-9]{10}$/.test(digitsOnly)) {
        return NextResponse.json(
          {
            error:
              digitsOnly.length > 10
                ? 'Số điện thoại hotline gồm 10 số, không thể nhập thêm'
                : 'Số điện thoại hotline phải gồm đúng 10 số',
          },
          { status: 400 }
        );
      }

      const id = body.id || 'sup-' + Date.now();
      await db.execute(
        `INSERT INTO NhaCungCap
         (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, DiaChi, NguoiLienHe, TongGiaTriNhap, CongNoHienTai, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, name, digitsOnly, email, address, contactPerson, Number(body.totalPurchased || 0), Math.max(0, currentDebt)]
      );

      const created = await db.queryOne(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap WHERE MaNhaCungCap = ?`, [id]);

      return NextResponse.json({
        success: true,
        message: 'Đã tạo mới nhà cung cấp thành công',
        data: created,
      });
    }

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

    const supplier = await db.queryOne(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap WHERE MaNhaCungCap = ?`, [supplierId]);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Không tìm thấy nhà cung cấp' },
        { status: 404 }
      );
    }

    const result = await db.transaction(async (conn) => {
      const newDebt = Math.max(0, Number(supplier.currentDebt || 0) - payAmount);
      await conn.execute('UPDATE NhaCungCap SET CongNoHienTai = ?, NgayCapNhat = NOW() WHERE MaNhaCungCap = ?', [
        newDebt,
        supplierId,
      ]);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const [countRows]: any = await conn.query('SELECT COUNT(*) as cnt FROM SoQuy');
      const cashCount = countRows[0]?.cnt || 0;
      const code = `PC-NCC-${dateStr.replace(/-/g, '').slice(2)}-${String(cashCount + 1).padStart(3, '0')}`;
      const cashId = 'cb-' + Date.now();

      await conn.execute(
        `INSERT INTO SoQuy
         (MaPhieu, MaCodePhieu, NgayGiaoDich, LoaiPhieu, HangMuc, SoTien, PhuongThucThanhToan, MaThamChieu, MoTa, NguoiTao, NgayTao, NgayCapNhat)
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

      const [updatedSup]: any = await conn.query(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap WHERE MaNhaCungCap = ?`, [
        supplierId,
      ]);
      const [cashEntry]: any = await conn.query(`SELECT ${CASHBOOK_SELECT} FROM SoQuy WHERE MaPhieu = ?`, [cashId]);

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
      setClauses.push('TenNhaCungCap = ?');
      params.push(sanitizeString(name, 150));
    }
    if (phone !== undefined) {
      const digitsOnly = String(phone || '').replace(/\D/g, '');
      if (!/^[0-9]{10}$/.test(digitsOnly)) {
        return NextResponse.json(
          {
            error:
              digitsOnly.length > 10
                ? 'Số điện thoại hotline gồm 10 số, không thể nhập thêm'
                : 'Số điện thoại hotline phải gồm đúng 10 số',
          },
          { status: 400 }
        );
      }
      setClauses.push('SoDienThoai = ?');
      params.push(digitsOnly);
    }
    if (email) {
      setClauses.push('Email = ?');
      params.push(sanitizeString(email, 100).toLowerCase());
    }
    if (address) {
      setClauses.push('DiaChi = ?');
      params.push(sanitizeString(address, 191));
    }
    if (contactPerson) {
      setClauses.push('NguoiLienHe = ?');
      params.push(sanitizeString(contactPerson, 100));
    }
    if (currentDebt !== undefined) {
      setClauses.push('CongNoHienTai = ?');
      params.push(Math.max(0, Number(currentDebt)));
    }

    if (setClauses.length > 0) {
      setClauses.push('NgayCapNhat = NOW()');
      params.push(id);
      await db.execute(`UPDATE NhaCungCap SET ${setClauses.join(', ')} WHERE MaNhaCungCap = ?`, params);
    }

    const updated = await db.queryOne(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap WHERE MaNhaCungCap = ?`, [id]);

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

    const existing = await db.queryOne(`SELECT ${SUPPLIER_SELECT} FROM NhaCungCap WHERE MaNhaCungCap = ?`, [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy nhà cung cấp' }, { status: 404 });
    }

    const phoneCountRow = await db.queryOne('SELECT COUNT(*) as cnt FROM KhoDienThoai WHERE MaNhaCungCap = ?', [id]);
    const orderCountRow = await db.queryOne('SELECT COUNT(*) as cnt FROM DonNhapHang WHERE MaNhaCungCap = ?', [id]);
    const phoneCount = phoneCountRow?.cnt || 0;
    const orderCount = orderCountRow?.cnt || 0;

    if (phoneCount > 0 || orderCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa nhà cung cấp đã có ${phoneCount} máy trong kho hoặc ${orderCount} đơn nhập` },
        { status: 400 }
      );
    }

    await db.execute('DELETE FROM NhaCungCap WHERE MaNhaCungCap = ?', [id]);

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
