import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  isValidAmount,
  sanitizeString,
  getCashbookCategoryLabel,
} from '@/ThuVien/KiemTraHopLe';

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
    const rawEntries = await db.query(`SELECT ${CASHBOOK_SELECT} FROM SoQuy ORDER BY NgayTao DESC`);

    const entries = rawEntries.map((e) => ({
      ...e,
      categoryLabel: getCashbookCategoryLabel(e.category, e.type),
    }));

    const totalReceipt = entries
      .filter((e) => e.type === 'receipt')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const totalPayment = entries
      .filter((e) => e.type === 'payment')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

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

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM SoQuy');
    const count = countRow?.cnt || 0;
    const prefix = type === 'receipt' ? 'PT' : 'PC';
    const now = new Date();
    const code = `${prefix}-2608-${String(count + 1).padStart(3, '0')}`;
    const dateStr = now.toISOString().split('T')[0];
    const id = body.id || 'cb-' + Date.now();
    const referenceCode = body.referenceCode ? sanitizeString(body.referenceCode, 50) : null;
    const creator = sanitizeString(body.creator || 'Lê Huy Hoàng (Chủ Shop)', 100);

    await db.execute(
      `INSERT INTO SoQuy
       (MaPhieu, MaCodePhieu, NgayGiaoDich, LoaiPhieu, HangMuc, SoTien, PhuongThucThanhToan, MaThamChieu, MoTa, NguoiTao, NgayTao, NgayCapNhat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, code, dateStr, type, category, amount, paymentMethod, referenceCode, description, creator]
    );

    const newEntry = await db.queryOne(`SELECT ${CASHBOOK_SELECT} FROM SoQuy WHERE MaPhieu = ?`, [id]);

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: `Tạo ${type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'} thành công`,
        data: newEntry
          ? { ...newEntry, categoryLabel: getCashbookCategoryLabel(newEntry.category, newEntry.type) }
          : null,
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
