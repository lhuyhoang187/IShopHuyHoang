import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import {
  normalizePhone,
  isValidPhone,
  isValidAmount,
  sanitizeString,
  VALID_PAYMENT_METHODS,
  ValidPaymentMethod,
} from '@/ThuVien/KiemTraHopLe';
import { getTierByPoints } from '@/ThuVien/TichDiem';

const INVOICE_SELECT = `
  i.MaHoaDon AS id,
  i.SoHoaDon AS invoiceCode,
  i.MaKhachHang AS customerId,
  i.TamTinh AS subtotal,
  i.GiamGia AS discount,
  i.TongTien AS totalAmount,
  i.PhuongThucThanhToan AS paymentMethod,
  i.TienKhachDua AS cashReceived,
  i.TienThua AS cashChange,
  i.TenThuNgan AS cashierName,
  i.GhiChuBaoHanh AS warrantyNote,
  i.GhiChuDuyet AS adminApprovalNote,
  i.NgayDuyet AS approvedAt,
  i.NguoiDuyet AS approvedBy,
  i.TienCoc AS depositAmount,
  i.PhanTramCoc AS depositPercent,
  i.NgayGiaoDuKien AS estimatedDeliveryDate,
  i.LaDonLon AS isLargeOrder,
  i.LaDonDatTruoc AS isPreOrder,
  i.DiemTichDuoc AS pointsEarned,
  i.TienConLai AS remainingBalance,
  i.TrangThai AS status,
  i.NgayTao AS createdAt,
  i.NgayCapNhat AS updatedAt,
  c.HoTen AS customerName,
  c.SoDienThoai AS customerPhone,
  c.Email AS customerEmail,
  c.HangThanhVien AS customerTier
`;

const ITEM_SELECT = `
  MaChiTiet AS id,
  SoHoaDon AS invoiceCode,
  LoaiSanPham AS itemType,
  MaSanPham AS productId,
  TenSanPham AS productName,
  SoIMEI AS imei,
  MauSac AS color,
  DungLuong AS capacity,
  DonGia AS unitPrice,
  GiaVon AS costPrice,
  SoLuong AS quantity,
  GiamGia AS discount,
  ThanhTien AS subtotal,
  SoThangBaoHanh AS warrantyMonths,
  NgayTao AS createdAt,
  NgayCapNhat AS updatedAt
`;

function mapInvoiceRow(inv: any) {
  return {
    ...inv,
    subtotal: Number(inv.subtotal || 0),
    discount: Number(inv.discount || 0),
    totalAmount: Number(inv.totalAmount || 0),
    pointsEarned: Number(inv.pointsEarned || 0),
    depositAmount: inv.depositAmount != null ? Number(inv.depositAmount) : undefined,
    depositPercent: inv.depositPercent != null ? Number(inv.depositPercent) : undefined,
    remainingBalance: inv.remainingBalance != null ? Number(inv.remainingBalance) : undefined,
    isLargeOrder: Boolean(inv.isLargeOrder),
    isPreOrder: Boolean(inv.isPreOrder),
  };
}

function mapInvoiceItemToUi(it: any) {
  const variant =
    it.color && it.capacity
      ? `${it.color} / ${it.capacity}`
      : it.color || it.capacity || undefined;
  return {
    id: it.productId || it.id,
    itemId: it.id,
    type: it.itemType || (it.imei ? 'phone' : 'accessory'),
    name: it.productName,
    variant,
    color: it.color || undefined,
    capacity: it.capacity || undefined,
    imei: it.imei || undefined,
    quantity: Number(it.quantity || 1),
    unitPrice: Number(it.unitPrice || 0),
    costPrice: Number(it.costPrice || 0),
    discount: Number(it.discount || 0),
    total: Number(it.subtotal || 0),
    subtotal: Number(it.subtotal || 0),
    warrantyMonths: Number(it.warrantyMonths || 12),
  };
}

function parseColorAndCapacity(item: any): { color: string | null; capacity: string | null } {
  let color: string | null = item.color ? String(item.color).trim() : null;
  let capacity: string | null = item.capacity ? String(item.capacity).trim() : null;

  if ((!color || !capacity) && typeof item.variant === 'string' && item.variant.trim()) {
    const raw = item.variant.trim();
    const parts = raw.includes('/')
      ? raw.split('/')
      : raw.includes(' - ')
      ? raw.split(' - ')
      : null;
    if (parts && parts.length >= 2) {
      if (!color) color = parts[0].trim() || null;
      if (!capacity) capacity = parts[1].trim() || null;
    } else if (!color) {
      color = raw;
    }
  }
  return { color, capacity };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      const cleanCode = code.trim();
      const normalizedPhone = normalizePhone(cleanCode);

      const invoice = await db.queryOne(
        `SELECT ${INVOICE_SELECT}
         FROM HoaDon i
         LEFT JOIN KhachHang c ON i.MaKhachHang = c.MaKhachHang
         WHERE i.SoHoaDon = ? OR c.SoDienThoai = ? OR c.SoDienThoai = ?
         LIMIT 1`,
        [cleanCode, cleanCode, normalizedPhone || cleanCode]
      );

      if (invoice) {
        const items = await db.query(
          `SELECT ${ITEM_SELECT} FROM ChiTietHoaDon WHERE SoHoaDon = ?`,
          [invoice.invoiceCode]
        );
        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...mapInvoiceRow(invoice),
            items: items.map(mapInvoiceItemToUi),
            invoiceItems: items,
          },
        });
      }

      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    const invoices = await db.query(
      `SELECT ${INVOICE_SELECT}
       FROM HoaDon i
       LEFT JOIN KhachHang c ON i.MaKhachHang = c.MaKhachHang
       ORDER BY i.NgayTao DESC`
    );
    const allItems = await db.query(`SELECT ${ITEM_SELECT} FROM ChiTietHoaDon ORDER BY NgayTao ASC`);

    const itemsByInvoice: Record<string, any[]> = {};
    for (const it of allItems) {
      if (!itemsByInvoice[it.invoiceCode]) itemsByInvoice[it.invoiceCode] = [];
      itemsByInvoice[it.invoiceCode].push(it);
    }

    const parsed = invoices.map((inv) => {
      const rawItems = itemsByInvoice[inv.invoiceCode] || [];
      return {
        ...mapInvoiceRow(inv),
        items: rawItems.map(mapInvoiceItemToUi),
        invoiceItems: rawItems,
      };
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn đơn hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerName = sanitizeString(body.customerName, 100);
    const rawPhone = String(body.customerPhone || '');
    const customerPhone = normalizePhone(rawPhone);

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ (cần đúng 10 số đầu 03, 05, 07, 08, 09)' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Đơn hàng phải chứa ít nhất 1 sản phẩm' },
        { status: 400 }
      );
    }

    const totalAmount = Number(body.totalAmount ?? 0);
    const subtotal = Number(body.subtotal ?? totalAmount);
    const discount = Number(body.discount ?? 0);

    if (!isValidAmount(totalAmount) || !isValidAmount(subtotal) || !isValidAmount(discount)) {
      return NextResponse.json(
        { error: 'Số tiền thanh toán, tạm tính hoặc giảm giá không hợp lệ (không được âm)' },
        { status: 400 }
      );
    }

    if (discount > subtotal) {
      return NextResponse.json(
        { error: 'Số tiền giảm giá không thể lớn hơn tổng tạm tính của đơn hàng' },
        { status: 400 }
      );
    }

    const paymentMethod: ValidPaymentMethod = VALID_PAYMENT_METHODS.includes(body.paymentMethod)
      ? body.paymentMethod
      : 'vietqr';

    const phoneQtyTotal = body.items
      .filter((it: any) => (it.type || (it.imei ? 'phone' : 'accessory')) === 'phone')
      .reduce((sum: number, it: any) => sum + Math.max(1, Number(it.quantity) || 1), 0);

    const isLargeOrder =
      body.isLargeOrder !== undefined
        ? Boolean(body.isLargeOrder)
        : totalAmount >= 100000000 || phoneQtyTotal >= 5;

    const isPreOrder = Boolean(body.isPreOrder);
    const depositPercent = isPreOrder
      ? Number(body.depositPercent ?? body.depositPercentage ?? 10)
      : null;
    const depositAmount = isPreOrder
      ? Number(body.depositAmount ?? Math.round(totalAmount * ((depositPercent || 10) / 100)))
      : null;
    const remainingBalance = isPreOrder
      ? Number(body.remainingBalance ?? Math.max(0, totalAmount - (depositAmount || 0)))
      : null;
    const estimatedDeliveryDate = body.estimatedDeliveryDate
      ? sanitizeString(body.estimatedDeliveryDate, 50)
      : null;

    const validStatuses = ['completed', 'pending_admin_approval', 'approved', 'rejected'];
    const orderStatus = validStatuses.includes(body.status)
      ? body.status
      : isLargeOrder
      ? 'pending_admin_approval'
      : 'completed';

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM HoaDon');
    const count = Number(countRow?.cnt || 0);
    const invoiceCode = `HD-2608-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const earnedPoints =
      typeof body.earnedPoints === 'number' && body.earnedPoints >= 0
        ? Math.floor(Number(body.earnedPoints))
        : typeof body.pointsEarned === 'number' && body.pointsEarned >= 0
        ? Math.floor(Number(body.pointsEarned))
        : Math.floor(totalAmount / 10000);

    const invId = 'inv-' + Date.now();

    const newInvoice = await db.transaction(async (conn) => {
      // 1. Validate explicit IMEIs & check accessory stock availability
      const allocatedImeis = new Set<string>();
      for (const item of body.items) {
        if (item.imei) {
          const imeiStr = String(item.imei).trim();
          if (allocatedImeis.has(imeiStr)) {
            throw new Error(`Số IMEI ${imeiStr} bị trùng lặp trong cùng đơn hàng!`);
          }
          allocatedImeis.add(imeiStr);

          const [stockRows]: any = await conn.query(
            `SELECT ps.TrangThai AS status, p.TenDienThoai AS phoneName
             FROM KhoDienThoai ps
             LEFT JOIN SanPhamDienThoai p ON ps.MaDienThoai = p.MaDienThoai
             WHERE ps.SoIMEI = ?`,
            [imeiStr]
          );
          const stockItem = stockRows[0];
          if (stockItem && stockItem.status === 'sold') {
            throw new Error(`Điện thoại IMEI ${imeiStr} (${stockItem.phoneName || 'Máy'}) đã được bán trước đó!`);
          }
        }
      }

      // 2. Upsert Customer and upgrade HangThanhVien based on new DiemTichLuy
      const [custRows]: any = await conn.query(
        'SELECT MaKhachHang AS id, DiemTichLuy AS points FROM KhachHang WHERE SoDienThoai = ?',
        [customerPhone]
      );
      let customerId: string;
      if (custRows.length > 0) {
        customerId = custRows[0].id;
        const nextPoints = Number(custRows[0].points || 0) + earnedPoints;
        const nextTier = getTierByPoints(nextPoints).tier;
        await conn.execute(
          `UPDATE KhachHang SET
             HoTen = ?, TongChiTieu = TongChiTieu + ?, SoLanMua = SoLanMua + 1,
             DiemTichLuy = ?, HangThanhVien = ?, NgayCapNhat = NOW()
           WHERE MaKhachHang = ?`,
          [customerName, totalAmount, nextPoints, nextTier, customerId]
        );
      } else {
        customerId = 'cust-' + Date.now();
        const initialTier = getTierByPoints(earnedPoints).tier;
        await conn.execute(
          `INSERT INTO KhachHang
           (MaKhachHang, HoTen, SoDienThoai, Email, DiemTichLuy, TongChiTieu, SoLanMua, SoLanSuaChua, HangThanhVien, LoaiKhachHang, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, 'Khách lẻ', NOW(), NOW())`,
          [
            customerId,
            customerName,
            customerPhone,
            body.customerEmail ? sanitizeString(body.customerEmail, 100).toLowerCase() : null,
            earnedPoints,
            totalAmount,
            initialTier,
          ]
        );
      }

      // 3. Insert Invoice into HoaDon with full pre-order & large-order fields
      await conn.execute(
        `INSERT INTO HoaDon
         (MaHoaDon, SoHoaDon, MaKhachHang, TamTinh, GiamGia, TongTien, PhuongThucThanhToan,
          TienKhachDua, TienThua, TenThuNgan, DiemTichDuoc, GhiChuBaoHanh,
          LaDonLon, LaDonDatTruoc, TienCoc, PhanTramCoc, TienConLai, NgayGiaoDuKien, TrangThai,
          NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          invId,
          invoiceCode,
          customerId,
          subtotal,
          discount,
          totalAmount,
          paymentMethod,
          body.cashReceived !== undefined && body.cashReceived !== null ? Number(body.cashReceived) : null,
          body.cashChange !== undefined && body.cashChange !== null ? Number(body.cashChange) : null,
          sanitizeString(body.cashierName || 'Website Online Order', 100),
          earnedPoints,
          sanitizeString(body.warrantyNote || 'Bảo hành điện tử 12 tháng theo IMEI/Hóa đơn.', 500),
          isLargeOrder ? 1 : 0,
          isPreOrder ? 1 : 0,
          depositAmount,
          depositPercent,
          remainingBalance,
          estimatedDeliveryDate,
          orderStatus,
        ]
      );

      // 4. Insert ChiTietHoaDon & mark KhoDienThoai sold / deduct SanPhamPhuKien stock
      const persistedItems: any[] = [];
      for (const item of body.items) {
        const itemType = item.type || (item.imei ? 'phone' : 'accessory');
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const unitPrice = Number(item.unitPrice ?? item.price) || 0;
        const itemDiscount = Number(item.discount) || 0;
        const { color, capacity } = parseColorAndCapacity(item);
        const productId = item.productId || item.id || null;

        // If online phone order without explicit IMEIs, allocate distinct matching in_stock IMEIs
        if (itemType === 'phone' && !item.imei && productId) {
          const [candidates]: any = await conn.query(
            `SELECT SoIMEI AS imei, GiaVon AS costPrice, MauSac AS color, DungLuong AS capacity
             FROM KhoDienThoai
             WHERE MaDienThoai = ? AND TrangThai = 'in_stock'
             ORDER BY NgayTao ASC`,
            [productId]
          );
          const matching = candidates.filter((c: any) => {
            if (allocatedImeis.has(c.imei)) return false;
            const matchColor = !color || String(c.color || '').toLowerCase().trim() === color.toLowerCase().trim();
            const matchCap =
              !capacity ||
              String(c.capacity || '').toLowerCase().replace(/\s+/g, '') ===
                capacity.toLowerCase().replace(/\s+/g, '');
            return matchColor && matchCap;
          });
          const picked = matching.slice(0, qty);

          if (picked.length > 0) {
            for (const unit of picked) {
              allocatedImeis.add(unit.imei);
              const itemId = 'ii_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
              const unitCost = Number(unit.costPrice || item.costPrice || 0);
              const lineTotal = Math.max(0, unitPrice - Math.round(itemDiscount / picked.length));
              await conn.execute(
                `INSERT INTO ChiTietHoaDon
                 (MaChiTiet, SoHoaDon, LoaiSanPham, MaSanPham, TenSanPham, SoIMEI, MauSac, DungLuong, DonGia, GiaVon, SoLuong, GiamGia, ThanhTien, SoThangBaoHanh, NgayTao, NgayCapNhat)
                 VALUES (?, ?, 'phone', ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 12, NOW(), NOW())`,
                [
                  itemId,
                  invoiceCode,
                  productId,
                  sanitizeString(item.name || 'Sản phẩm', 191),
                  unit.imei,
                  unit.color || color,
                  unit.capacity || capacity,
                  unitPrice,
                  unitCost,
                  Math.round(itemDiscount / picked.length),
                  lineTotal,
                ]
              );
              await conn.execute(
                `UPDATE KhoDienThoai SET TrangThai = 'sold', NgayBan = ?, SoHoaDonBan = ?, NgayCapNhat = NOW()
                 WHERE SoIMEI = ?`,
                [now, invoiceCode, unit.imei]
              );
              persistedItems.push({
                ...item,
                imei: unit.imei,
                color: unit.color || color,
                capacity: unit.capacity || capacity,
                quantity: 1,
                unitPrice,
                costPrice: unitCost,
                total: lineTotal,
              });
            }
            // If pre-order or remaining qty had no physical IMEI yet, store remaining qty row
            const leftoverQty = qty - picked.length;
            if (leftoverQty > 0) {
              const itemId = 'ii_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
              await conn.execute(
                `INSERT INTO ChiTietHoaDon
                 (MaChiTiet, SoHoaDon, LoaiSanPham, MaSanPham, TenSanPham, SoIMEI, MauSac, DungLuong, DonGia, GiaVon, SoLuong, GiamGia, ThanhTien, SoThangBaoHanh, NgayTao, NgayCapNhat)
                 VALUES (?, ?, 'phone', ?, ?, NULL, ?, ?, ?, ?, ?, 0, ?, 12, NOW(), NOW())`,
                [
                  itemId,
                  invoiceCode,
                  productId,
                  sanitizeString(item.name || 'Sản phẩm', 191),
                  color,
                  capacity,
                  unitPrice,
                  Number(item.costPrice || 0),
                  leftoverQty,
                  unitPrice * leftoverQty,
                ]
              );
            }
            continue;
          }
        }

        // Standard single item insert (phone with explicit IMEI, pre-order phone, or accessory)
        const itemId = 'ii_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        let costPrice = Number(item.costPrice || 0);
        if (!costPrice && item.imei) {
          const [psCost]: any = await conn.query('SELECT GiaVon AS costPrice FROM KhoDienThoai WHERE SoIMEI = ?', [
            item.imei,
          ]);
          costPrice = Number(psCost[0]?.costPrice || 0);
        } else if (!costPrice && (item.accessoryId || item.id) && itemType === 'accessory') {
          const [accCost]: any = await conn.query(
            'SELECT GiaVon AS costPrice FROM SanPhamPhuKien WHERE MaPhuKien = ?',
            [item.accessoryId || item.id]
          );
          costPrice = Number(accCost[0]?.costPrice || 0);
        }

        const lineSubtotal =
          item.subtotal !== undefined
            ? Number(item.subtotal)
            : item.total !== undefined
            ? Number(item.total)
            : Math.max(0, unitPrice * qty - itemDiscount);

        await conn.execute(
          `INSERT INTO ChiTietHoaDon
           (MaChiTiet, SoHoaDon, LoaiSanPham, MaSanPham, TenSanPham, SoIMEI, MauSac, DungLuong, DonGia, GiaVon, SoLuong, GiamGia, ThanhTien, SoThangBaoHanh, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 12, NOW(), NOW())`,
          [
            itemId,
            invoiceCode,
            itemType,
            productId,
            sanitizeString(item.name || 'Sản phẩm', 191),
            item.imei || null,
            color,
            capacity,
            unitPrice,
            costPrice,
            qty,
            itemDiscount,
            lineSubtotal,
          ]
        );

        if (item.imei) {
          await conn.execute(
            `UPDATE KhoDienThoai SET
               TrangThai = 'sold', NgayBan = ?, SoHoaDonBan = ?, NgayCapNhat = NOW()
             WHERE SoIMEI = ?`,
            [now, invoiceCode, item.imei]
          );
        }

        const accessoryId = item.accessoryId || item.id;
        if (accessoryId && itemType === 'accessory') {
          await conn.execute(
            'UPDATE SanPhamPhuKien SET TonKho = GREATEST(0, TonKho - ?), NgayCapNhat = NOW() WHERE MaPhuKien = ?',
            [qty, accessoryId]
          );
        }
        persistedItems.push({ ...item, color, capacity, costPrice, total: lineSubtotal });
      }

      // 5. Record Cashbook Receipt (for pre-orders, record actual deposit paid now)
      const cashReceivedNow = isPreOrder && depositAmount != null ? depositAmount : totalAmount;
      if (cashReceivedNow > 0) {
        const [cashCountRow]: any = await conn.query('SELECT COUNT(*) as cnt FROM SoQuy');
        const cashCount = Number(cashCountRow[0]?.cnt || 0);
        const cashbookEntryCode = `PT-2608-${String(cashCount + 1).padStart(3, '0')}`;
        const hasPhone = body.items.some((it: any) => (it.type || (it.imei ? 'phone' : 'accessory')) === 'phone');
        await conn.execute(
          `INSERT INTO SoQuy
           (MaPhieu, MaCodePhieu, NgayGiaoDich, LoaiPhieu, HangMuc, SoTien, PhuongThucThanhToan, MaThamChieu, MoTa, NguoiTao, NgayTao, NgayCapNhat)
           VALUES (?, ?, ?, 'receipt', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            'cb-' + Date.now(),
            cashbookEntryCode,
            now.split(' ')[0],
            hasPhone ? 'sale_phone' : 'sale_accessory',
            cashReceivedNow,
            paymentMethod === 'cash' ? 'cash' : 'transfer',
            invoiceCode,
            isPreOrder
              ? `Thu tiền cọc đơn đặt trước ${invoiceCode} (${depositPercent}%) - Khách ${customerName} (${customerPhone})`
              : `Thu tiền đơn hàng ${invoiceCode} - Khách ${customerName} (${customerPhone})`,
            sanitizeString(body.cashierName || 'Thu ngân Website', 100),
          ]
        );
      }

      const [invRows]: any = await conn.query(
        `SELECT ${INVOICE_SELECT}
         FROM HoaDon i
         LEFT JOIN KhachHang c ON i.MaKhachHang = c.MaKhachHang
         WHERE i.MaHoaDon = ?`,
        [invId]
      );
      return { invoice: mapInvoiceRow(invRows[0]), items: persistedItems };
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Đặt hàng thành công và đã hạch toán vào CSDL',
        data: {
          ...newInvoice.invoice,
          items: newInvoice.items,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi đặt hàng và thanh toán' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, invoiceCode, status, approvedBy, adminApprovalNote } = body;
    const identifier = id || invoiceCode;

    if (!identifier) {
      return NextResponse.json(
        { error: 'Thiếu mã hóa đơn cần cập nhật trạng thái' },
        { status: 400 }
      );
    }

    const validStatuses = ['completed', 'pending_admin_approval', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái hóa đơn không hợp lệ' },
        { status: 400 }
      );
    }

    const existing = await db.queryOne(
      'SELECT MaHoaDon AS id, SoHoaDon AS invoiceCode FROM HoaDon WHERE MaHoaDon = ? OR SoHoaDon = ?',
      [identifier, identifier]
    );
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hóa đơn trong CSDL' }, { status: 404 });
    }

    await db.execute(
      `UPDATE HoaDon SET
         TrangThai = ?,
         NguoiDuyet = ?,
         NgayDuyet = NOW(),
         GhiChuDuyet = ?,
         NgayCapNhat = NOW()
       WHERE MaHoaDon = ?`,
      [
        status,
        sanitizeString(approvedBy || 'Chủ cửa hàng', 100),
        adminApprovalNote ? sanitizeString(adminApprovalNote, 1000) : null,
        existing.id,
      ]
    );

    const updated = await db.queryOne(
      `SELECT ${INVOICE_SELECT}
       FROM HoaDon i
       LEFT JOIN KhachHang c ON i.MaKhachHang = c.MaKhachHang
       WHERE i.MaHoaDon = ?`,
      [existing.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng vào CSDL thành công',
      data: updated ? mapInvoiceRow(updated) : null,
    });
  } catch (error: any) {
    console.error('Orders PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật trạng thái đơn hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
