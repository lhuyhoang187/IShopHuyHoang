import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

const SELECT_SETTING_SQL = `
  SELECT MaCauHinh AS id, TenCuaHang AS storeName, DuongDayNong AS hotline, DiaChi AS address, Email AS email,
         MaNganHang AS bankId, SoTaiKhoan AS bankAccountNo, TenTaiKhoan AS bankAccountName,
         GhiChuBaoHanhMacDinh AS defaultWarrantyNote, ChinhSachDoiTra AS returnPolicy,
         ChanTrangHoaDon AS receiptFooter, DuyetGiamGiaBanHang AS posDiscountRequiresApproval,
         NgayCapNhat AS updatedAt
  FROM CauHinhCuaHang
  WHERE MaCauHinh = ?
`;

export async function GET(request: NextRequest) {
  try {
    let settings = await db.queryOne(SELECT_SETTING_SQL, ['default']);

    if (!settings) {
      await db.execute(
        `INSERT INTO CauHinhCuaHang
         (MaCauHinh, TenCuaHang, DuongDayNong, DiaChi, Email, MaNganHang, SoTaiKhoan, TenTaiKhoan, GhiChuBaoHanhMacDinh, ChinhSachDoiTra, ChanTrangHoaDon, DuyetGiamGiaBanHang, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          'default',
          'iShop Huy Hoàng - Apple & Smartphone Premium',
          '0909.123.456',
          '45 Lê Văn Việt, TP. Thủ Đức, TP.HCM',
          'contact@ishophuyhoang.vn',
          'MB',
          '0988888999',
          'NGUYEN HUY HOANG',
          'Bảo hành điện tử chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
          'Bảo hành 12 tháng máy mới / 1 đổi 1 trong 30 ngày đầu.',
          'Cảm ơn quý khách đã tin tưởng và ủng hộ iShop Huy Hoàng!',
          1,
        ]
      );
      settings = await db.queryOne(SELECT_SETTING_SQL, ['default']);
    }

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      data: settings,
    });
  } catch (error: any) {
    console.error('Settings API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn cấu hình cửa hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeName,
      hotline,
      address,
      email,
      bankId,
      bankAccountNo,
      bankAccountName,
      defaultWarrantyNote,
      returnPolicy,
      receiptFooter,
      posDiscountRequiresApproval,
    } = body;

    const existing = await db.queryOne(SELECT_SETTING_SQL, ['default']);

    if (!existing) {
      await db.execute(
        `INSERT INTO CauHinhCuaHang
         (MaCauHinh, TenCuaHang, DuongDayNong, DiaChi, Email, MaNganHang, SoTaiKhoan, TenTaiKhoan, GhiChuBaoHanhMacDinh, ChinhSachDoiTra, ChanTrangHoaDon, DuyetGiamGiaBanHang, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          'default',
          sanitizeString(storeName || 'iShop Huy Hoàng', 150),
          sanitizeString(hotline || '0909.123.456', 20),
          sanitizeString(address || '45 Lê Văn Việt, TP. Thủ Đức', 191),
          sanitizeString(email || 'contact@ishophuyhoang.vn', 100).toLowerCase(),
          sanitizeString(bankId || 'MB', 20),
          sanitizeString(bankAccountNo || '0988888999', 50),
          sanitizeString(bankAccountName || 'NGUYEN HUY HOANG', 100),
          sanitizeString(defaultWarrantyNote || 'Bảo hành chính hãng 12 tháng.', 500),
          sanitizeString(returnPolicy || 'Bảo hành 12 tháng máy mới.', 500),
          sanitizeString(receiptFooter || 'Cảm ơn quý khách!', 500),
          posDiscountRequiresApproval !== undefined ? (posDiscountRequiresApproval ? 1 : 0) : 1,
        ]
      );
    } else {
      const newStoreName = storeName ? sanitizeString(storeName, 150) : existing.storeName;
      const newHotline = hotline ? sanitizeString(hotline, 20) : existing.hotline;
      const newAddress = address ? sanitizeString(address, 191) : existing.address;
      const newEmail = email ? sanitizeString(email, 100).toLowerCase() : existing.email;
      const newBankId = bankId ? sanitizeString(bankId, 20) : existing.bankId;
      const newBankAccountNo = bankAccountNo ? sanitizeString(bankAccountNo, 50) : existing.bankAccountNo;
      const newBankAccountName = bankAccountName ? sanitizeString(bankAccountName, 100) : existing.bankAccountName;
      const newDefaultWarrantyNote = defaultWarrantyNote ? sanitizeString(defaultWarrantyNote, 500) : existing.defaultWarrantyNote;
      const newReturnPolicy = returnPolicy ? sanitizeString(returnPolicy, 500) : existing.returnPolicy;
      const newReceiptFooter = receiptFooter ? sanitizeString(receiptFooter, 500) : existing.receiptFooter;
      const newPosDiscountRequiresApproval =
        posDiscountRequiresApproval !== undefined ? (posDiscountRequiresApproval ? 1 : 0) : existing.posDiscountRequiresApproval;

      await db.execute(
        `UPDATE CauHinhCuaHang SET
           TenCuaHang = ?, DuongDayNong = ?, DiaChi = ?, Email = ?, MaNganHang = ?, SoTaiKhoan = ?,
           TenTaiKhoan = ?, GhiChuBaoHanhMacDinh = ?, ChinhSachDoiTra = ?, ChanTrangHoaDon = ?,
           DuyetGiamGiaBanHang = ?, NgayCapNhat = NOW()
         WHERE MaCauHinh = ?`,
        [
          newStoreName,
          newHotline,
          newAddress,
          newEmail,
          newBankId,
          newBankAccountNo,
          newBankAccountName,
          newDefaultWarrantyNote,
          newReturnPolicy,
          newReceiptFooter,
          newPosDiscountRequiresApproval,
          'default',
        ]
      );
    }

    const updated = await db.queryOne(SELECT_SETTING_SQL, ['default']);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình cửa hàng thành công vào CSDL',
      data: updated,
    });
  } catch (error: any) {
    console.error('Settings API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình cửa hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
