import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  isValidImei,
  isValidAmount,
  sanitizeString,
  getCashbookCategoryLabel,
} from '@/ThuVien/KiemTraHopLe';

const ORDER_SELECT = `
  so.MaDonNhap AS id,
  so.SoDonNhap AS orderCode,
  so.MaNhaCungCap AS supplierId,
  so.NgayNhap AS date,
  so.LoaiNhap AS type,
  so.TomTatSanPham AS itemsSummary,
  so.TongTien AS totalAmount,
  so.DaThanhToan AS paidAmount,
  so.ConNo AS debtAmount,
  so.TrangThai AS status,
  so.GhiChu AS notes,
  so.NgayTao AS createdAt,
  so.NgayCapNhat AS updatedAt,
  s.TenNhaCungCap AS supplierName
`;

export async function GET() {
  try {
    const orders = await db.query(
      `SELECT ${ORDER_SELECT}
       FROM DonNhapHang so
       LEFT JOIN NhaCungCap s ON so.MaNhaCungCap = s.MaNhaCungCap
       ORDER BY so.NgayTao DESC`
    );
    const items = await db.query(
      `SELECT MaChiTietNhap AS id, SoDonNhap AS orderCode, LoaiSanPham AS itemType,
              MaSanPham AS productId, TenSanPham AS productName, MauSac AS color,
              DungLuong AS capacity, SoLuong AS quantity, DonGiaNhap AS unitCost,
              ThanhTien AS totalCost, SoIMEI AS imei, NgayTao AS createdAt
       FROM ChiTietDonNhapHang
       ORDER BY NgayTao ASC`
    );

    const itemsByOrder: Record<string, any[]> = {};
    for (const it of items) {
      if (!itemsByOrder[it.orderCode]) itemsByOrder[it.orderCode] = [];
      itemsByOrder[it.orderCode].push(it);
    }

    const mapped = orders.map((ord) => {
      const ordItems = itemsByOrder[ord.orderCode] || [];
      return {
        ...ord,
        items: ordItems,
        importedImeis: ordItems.map((x) => x.imei).filter(Boolean),
      };
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: mapped.length,
      data: mapped,
    });
  } catch (error: any) {
    console.error('Restock GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn lịch sử nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      supplierId,
      phoneId,
      phoneName,
      color,
      colorHex,
      imageUrl,
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

    const rawImeis: string[] = imeis.map((im: any) => String(im).trim()).filter(Boolean);
    const uniqueImeis = Array.from(new Set(rawImeis));

    if (uniqueImeis.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách IMEI không chứa mã IMEI hợp lệ' },
        { status: 400 }
      );
    }

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

    const supplier = await db.queryOne(
      'SELECT MaNhaCungCap AS id, TenNhaCungCap AS name FROM NhaCungCap WHERE MaNhaCungCap = ?',
      [supplierId]
    );
    if (!supplier) {
      return NextResponse.json(
        { error: `Không tìm thấy nhà cung cấp với mã ID: ${supplierId}` },
        { status: 404 }
      );
    }

    const supplierName = supplier.name;

    let resolvedPhoneId = phoneId ? sanitizeString(phoneId, 191) : null;
    let resolvedPhoneName = sanitizeString(phoneName || '', 191);
    if (resolvedPhoneId) {
      const existsPhone = await db.queryOne(
        'SELECT MaDienThoai AS id, TenDienThoai AS name FROM SanPhamDienThoai WHERE MaDienThoai = ?',
        [resolvedPhoneId]
      );
      if (existsPhone) {
        resolvedPhoneName = resolvedPhoneName || existsPhone.name;
      } else {
        resolvedPhoneId = null;
      }
    }
    if (!resolvedPhoneId) {
      const firstPhone = await db.queryOne('SELECT MaDienThoai AS id, TenDienThoai AS name FROM SanPhamDienThoai LIMIT 1');
      if (!firstPhone) {
        return NextResponse.json(
          { error: 'Chưa có dòng máy nào trong CSDL. Vui lòng thêm dòng máy trước khi nhập IMEI!' },
          { status: 400 }
        );
      }
      resolvedPhoneId = firstPhone.id;
      resolvedPhoneName = resolvedPhoneName || firstPhone.name;
    }

    const totalBatchCost = costNum * uniqueImeis.length;
    const paid = Math.min(paidNum, totalBatchCost);
    const debtIncrease = Math.max(0, totalBatchCost - paid);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.split(' ')[0];

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM DonNhapHang');
    const orderCount = countRow?.cnt || 0;
    const orderCode = `NH-2608-${String(orderCount + 1).padStart(3, '0')}`;

    const result = await db.transaction(async (conn) => {
      const cleanColorName = sanitizeString(color || 'Đen (Black)', 100);
      const cleanCapacity = sanitizeString(capacity || '256GB', 50);
      const uploadedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';

      const [exColRows]: any = await conn.query(
        'SELECT MaMauSac AS id, HinhAnh AS imageUrl FROM MauSacDienThoai WHERE MaDienThoai = ? AND LOWER(TenMau) = LOWER(?) LIMIT 1',
        [resolvedPhoneId, cleanColorName]
      );
      let variantColorId = exColRows[0]?.id;
      if (!variantColorId) {
        let resolvedHex = typeof colorHex === 'string' && colorHex.trim() ? sanitizeString(colorHex.trim(), 30) : '#222222';
        try {
          const [catRows]: any = await conn.query(
            'SELECT MaMauHex AS hex FROM DanhMucMauSac WHERE LOWER(TenMau) = LOWER(?) LIMIT 1',
            [cleanColorName]
          );
          if (catRows[0]?.hex) resolvedHex = catRows[0].hex;
        } catch {}
        const [cntCols]: any = await conn.query(
          'SELECT COUNT(*) AS cnt FROM MauSacDienThoai WHERE MaDienThoai = ?',
          [resolvedPhoneId]
        );
        variantColorId = 'pc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO MauSacDienThoai (MaMauSac, MaDienThoai, TenMau, MaMauHex, HinhAnh, ThuTuHienThi, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [variantColorId, resolvedPhoneId, cleanColorName, resolvedHex, uploadedImageUrl, Number(cntCols[0]?.cnt || 0)]
        );
      } else if (uploadedImageUrl) {
        await conn.execute(
          `UPDATE MauSacDienThoai SET HinhAnh = ?, NgayCapNhat = NOW() WHERE MaMauSac = ?`,
          [uploadedImageUrl, variantColorId]
        );
      }

      const [exVarRows]: any = await conn.query(
        'SELECT MaBienThe AS id, GiaGoc AS originalPrice FROM BienTheDienThoai WHERE MaMauSac = ? AND DungLuong = ? LIMIT 1',
        [variantColorId, cleanCapacity]
      );
      if (exVarRows[0]?.id) {
        const nextOrig =
          Number(exVarRows[0].originalPrice || 0) > sellNum ? Number(exVarRows[0].originalPrice) : sellNum;
        await conn.execute(
          `UPDATE BienTheDienThoai SET GiaBan = ?, GiaGoc = ?, HetHang = 0, NgayCapNhat = NOW() WHERE MaBienThe = ?`,
          [sellNum, nextOrig, exVarRows[0].id]
        );
      } else {
        const varId = 'var_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO BienTheDienThoai (MaBienThe, MaMauSac, DungLuong, GiaBan, GiaGoc, HetHang, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [varId, variantColorId, cleanCapacity, sellNum, sellNum]
        );
      }

      for (const imei of uniqueImeis) {
        await conn.execute(
          `INSERT INTO KhoDienThoai
           (SoIMEI, MaDienThoai, MauSac, DungLuong, GiaVon, GiaBan, MaNhaCungCap, NgayNhap, TrangThai, SoThangBaoHanh, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_stock', 12, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             MaDienThoai = VALUES(MaDienThoai),
             MauSac = VALUES(MauSac),
             DungLuong = VALUES(DungLuong),
             GiaVon = VALUES(GiaVon),
             GiaBan = VALUES(GiaBan),
             MaNhaCungCap = VALUES(MaNhaCungCap),
             TrangThai = 'in_stock',
             NgayCapNhat = NOW()`,
          [
            imei,
            resolvedPhoneId,
            cleanColorName,
            cleanCapacity,
            costNum,
            sellNum,
            supplierId,
            dateStr,
          ]
        );
      }

      const orderId = 'ord-' + Date.now();
      await conn.execute(
        `INSERT INTO DonNhapHang
         (MaDonNhap, SoDonNhap, MaNhaCungCap, NgayNhap, LoaiNhap, TomTatSanPham, TongTien, DaThanhToan, ConNo, TrangThai, GhiChu, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, 'phones', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          orderCode,
          supplierId,
          dateStr,
          `Nhập ${uniqueImeis.length} máy ${resolvedPhoneName} (${color || 'Titan'} - ${capacity || '256GB'})`,
          totalBatchCost,
          paid,
          debtIncrease,
          debtIncrease === 0 ? 'completed' : 'partial',
          sanitizeString(notes || 'Nhập lô hàng chính ngạch.', 1000),
        ]
      );

      for (const imei of uniqueImeis) {
        const itemId = 'soi_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        await conn.execute(
          `INSERT INTO ChiTietDonNhapHang
           (MaChiTietNhap, SoDonNhap, LoaiSanPham, MaSanPham, TenSanPham, MauSac, DungLuong, SoLuong, DonGiaNhap, ThanhTien, SoIMEI, NgayTao)
           VALUES (?, ?, 'phone', ?, ?, ?, ?, 1, ?, ?, ?, NOW())`,
          [
            itemId,
            orderCode,
            resolvedPhoneId,
            resolvedPhoneName,
            sanitizeString(color || 'Titan', 100),
            sanitizeString(capacity || '256GB', 50),
            costNum,
            costNum,
            imei,
          ]
        );
      }

      await conn.execute(
        `UPDATE NhaCungCap SET
           TongGiaTriNhap = TongGiaTriNhap + ?,
           CongNoHienTai = CongNoHienTai + ?,
           NgayCapNhat = NOW()
         WHERE MaNhaCungCap = ?`,
        [totalBatchCost, debtIncrease, supplierId]
      );

      let cashbookEntry = null;
      if (paid > 0) {
        const [cashCountRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM SoQuy');
        const cashCount = cashCountRow[0]?.cnt || 0;
        const cashCode = `PC-2608-${String(cashCount + 1).padStart(3, '0')}`;
        const cashId = 'cb-' + Date.now();

        await conn.execute(
          `INSERT INTO SoQuy
           (MaPhieu, MaCodePhieu, NgayGiaoDich, LoaiPhieu, HangMuc, SoTien, PhuongThucThanhToan, MaThamChieu, MoTa, NguoiTao, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, 'payment', 'supplier_restock', ?, 'transfer', ?, ?, 'Lê Huy Hoàng (Chủ Shop)', NOW(), NOW())`,
          [
            cashId,
            cashCode,
            dateStr,
            paid,
            orderCode,
            `Thanh toán tiền nhập lô ${uniqueImeis.length} máy đơn hàng ${orderCode} cho ${supplierName}`,
          ]
        );

        const [cashRows]: any = await conn.query(
          `SELECT MaPhieu AS id, MaCodePhieu AS code, NgayGiaoDich AS date, LoaiPhieu AS type,
                  HangMuc AS category, SoTien AS amount, PhuongThucThanhToan AS paymentMethod,
                  MaThamChieu AS referenceCode, MoTa AS description, NguoiTao AS creator,
                  NgayTao AS createdAt, NgayCapNhat AS updatedAt
           FROM SoQuy WHERE MaPhieu = ?`,
          [cashId]
        );
        cashbookEntry = cashRows[0]
          ? { ...cashRows[0], categoryLabel: getCashbookCategoryLabel(cashRows[0].category, cashRows[0].type) }
          : null;
      }

      const [orderRows]: any = await conn.query(
        `SELECT ${ORDER_SELECT}
         FROM DonNhapHang so
         LEFT JOIN NhaCungCap s ON so.MaNhaCungCap = s.MaNhaCungCap
         WHERE so.MaDonNhap = ?`,
        [orderId]
      );

      return {
        order: orderRows[0] ? { ...orderRows[0], importedImeis: uniqueImeis } : null,
        cashbookEntry,
        importedCount: uniqueImeis.length,
      };
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
