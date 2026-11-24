const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const PASCAL_TABLE_MAP = {
  bienthedienthoai: 'BienTheDienThoai',
  cauhinhcuahang: 'CauHinhCuaHang',
  chitietdonnhaphang: 'ChiTietDonNhapHang',
  chitiethoadon: 'ChiTietHoaDon',
  danhmuclinhkien: 'DanhMucLinhKien',
  danhmucmausac: 'DanhMucMauSac',
  danhmucphukien: 'DanhMucPhuKien',
  dichvusuachua: 'DichVuSuaChua',
  donnhaphang: 'DonNhapHang',
  hoadon: 'HoaDon',
  khachhang: 'KhachHang',
  khodienthoai: 'KhoDienThoai',
  khuyenmai: 'KhuyenMai',
  lichhensuachua: 'LichHenSuaChua',
  lichsutrangthaisuachua: 'LichSuTrangThaiSuaChua',
  linhkienphieusuachua: 'LinhKienPhieuSuaChua',
  linhkiensuachua: 'LinhKienSuaChua',
  mausacdienthoai: 'MauSacDienThoai',
  nguoidung: 'NguoiDung',
  nhacungcap: 'NhaCungCap',
  phanquyenvaitro: 'PhanQuyenVaiTro',
  phieusuachua: 'PhieuSuaChua',
  sanphamdienthoai: 'SanPhamDienThoai',
  sanphamphukien: 'SanPhamPhuKien',
  soquy: 'SoQuy',
  thuonghieudienthoai: 'ThuongHieuDienThoai',
  tuongthichlinhkien: 'TuongThichLinhKien',
  tuychondatlichsuachua: 'TuyChonDatLichSuaChua',
};

const FK_LABELS = {
  'ThuongHieuDienThoai->SanPhamDienThoai.MaThuongHieu': 'sở hữu dòng máy (MaThuongHieu)',
  'SanPhamDienThoai->MauSacDienThoai.MaDienThoai': 'có các màu sắc (MaDienThoai)',
  'MauSacDienThoai->BienTheDienThoai.MaMauSac': 'có dung lượng & giá (MaMauSac)',
  'SanPhamDienThoai->KhoDienThoai.MaDienThoai': 'quản lý theo IMEI (MaDienThoai)',
  'DanhMucPhuKien->SanPhamPhuKien.MaDanhMuc': 'phân loại phụ kiện (MaDanhMuc)',
  'DanhMucLinhKien->LinhKienSuaChua.MaDanhMuc': 'phân loại linh kiện (MaDanhMuc)',
  'LinhKienSuaChua->TuongThichLinhKien.MaLinhKien': 'tương thích dòng máy (MaLinhKien)',
  'NhaCungCap->DonNhapHang.MaNhaCungCap': 'cung cấp đơn nhập (MaNhaCungCap)',
  'DonNhapHang->ChiTietDonNhapHang.SoDonNhap': 'gồm chi tiết nhập (SoDonNhap)',
  'NhaCungCap->KhoDienThoai.MaNhaCungCap': 'nhập kho từ NCC (MaNhaCungCap)',
  'KhachHang->HoaDon.MaKhachHang': 'mua hàng (MaKhachHang)',
  'HoaDon->ChiTietHoaDon.SoHoaDon': 'gồm sản phẩm (SoHoaDon)',
  'HoaDon->KhoDienThoai.SoHoaDonBan': 'xuất bán IMEI (SoHoaDonBan)',
  'KhachHang->PhieuSuaChua.MaKhachHang': 'gửi sửa chữa (MaKhachHang)',
  'NguoiDung->PhieuSuaChua.MaKyThuatVien': 'phụ trách KTV (MaKyThuatVien)',
  'PhieuSuaChua->LichSuTrangThaiSuaChua.SoPhieuSuaChua': 'theo dõi tiến độ (SoPhieuSuaChua)',
  'PhieuSuaChua->LinhKienPhieuSuaChua.SoPhieuSuaChua': 'sử dụng linh kiện (SoPhieuSuaChua)',
  'LinhKienSuaChua->LinhKienPhieuSuaChua.MaLinhKien': 'xuất kho linh kiện (MaLinhKien)',
  'KhachHang->LichHenSuaChua.MaKhachHang': 'đặt lịch hẹn (MaKhachHang)',
  'PhieuSuaChua->LichHenSuaChua.SoPhieuSuaChua': 'liên kết phiếu sửa (SoPhieuSuaChua)',
  'ThuongHieuDienThoai->DichVuSuaChua.MaThuongHieu': 'áp dụng bảng giá (MaThuongHieu)',
  'ThuongHieuDienThoai->TuyChonDatLichSuaChua.MaThuongHieu': 'tùy chọn đặt lịch (MaThuongHieu)',
};

const MODULE_GROUPS = [
  {
    title: '1. PHÂN HỆ SẢN PHẨM ĐIỆN THOẠI & KHO IMEI',
    tables: ['ThuongHieuDienThoai', 'SanPhamDienThoai', 'MauSacDienThoai', 'BienTheDienThoai', 'KhoDienThoai', 'DanhMucMauSac'],
  },
  {
    title: '2. PHÂN HỆ PHỤ KIỆN & LINH KIỆN SỬA CHỮA',
    tables: ['DanhMucPhuKien', 'SanPhamPhuKien', 'DanhMucLinhKien', 'LinhKienSuaChua', 'TuongThichLinhKien'],
  },
  {
    title: '3. PHÂN HỆ NHÀ CUNG CẤP & NHẬP KHO',
    tables: ['NhaCungCap', 'DonNhapHang', 'ChiTietDonNhapHang'],
  },
  {
    title: '4. PHÂN HỆ KHÁCH HÀNG, BÁN HÀNG (POS) & SỔ QUỸ',
    tables: ['KhachHang', 'HoaDon', 'ChiTietHoaDon', 'SoQuy', 'KhuyenMai'],
  },
  {
    title: '5. PHÂN HỆ DỊCH VỤ SỬA CHỮA iCARE',
    tables: ['PhieuSuaChua', 'LichSuTrangThaiSuaChua', 'LinhKienPhieuSuaChua', 'LichHenSuaChua', 'DichVuSuaChua', 'TuyChonDatLichSuaChua'],
  },
  {
    title: '6. PHÂN HỆ NHÂN SỰ, PHÂN QUYỀN & CẤU HÌNH HỆ THỐNG',
    tables: ['NguoiDung', 'PhanQuyenVaiTro', 'CauHinhCuaHang'],
  },
];

function toPascal(tableName) {
  return PASCAL_TABLE_MAP[tableName.toLowerCase()] || tableName;
}

function simplifyDataType(dataType) {
  const t = String(dataType || 'varchar').toLowerCase();
  if (['varchar', 'char'].includes(t)) return 'varchar';
  if (['int', 'bigint', 'smallint', 'mediumint'].includes(t)) return 'int';
  if (t === 'tinyint') return 'boolean';
  if (['double', 'float', 'decimal'].includes(t)) return 'double';
  if (['datetime', 'timestamp', 'date'].includes(t)) return 'datetime';
  if (['text', 'mediumtext', 'longtext'].includes(t)) return t;
  return t;
}

async function generateErd() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ishop_huyhoang',
  });

  const dbName = process.env.DB_NAME || 'ishop_huyhoang';

  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    [dbName]
  );

  const [cols] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [dbName]
  );

  const [fks] = await conn.query(
    `SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
            r.DELETE_RULE, r.UPDATE_RULE
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
     JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
       ON k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
      AND k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
      AND k.TABLE_NAME = r.TABLE_NAME
     WHERE k.TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY k.REFERENCED_TABLE_NAME, k.TABLE_NAME, k.COLUMN_NAME`,
    [dbName]
  );

  const [uks] = await conn.query(
    `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND NON_UNIQUE = 0 AND INDEX_NAME != 'PRIMARY'`,
    [dbName]
  );

  const fkColSet = new Set(fks.map((f) => `${f.TABLE_NAME.toLowerCase()}.${f.COLUMN_NAME}`));
  const ukColSet = new Set(uks.map((u) => `${u.TABLE_NAME.toLowerCase()}.${u.COLUMN_NAME}`));
  const colNullableMap = new Map(cols.map((c) => [`${c.TABLE_NAME.toLowerCase()}.${c.COLUMN_NAME}`, c.IS_NULLABLE === 'YES']));

  const colsByTable = new Map();
  for (const c of cols) {
    const tPascal = toPascal(c.TABLE_NAME);
    if (!colsByTable.has(tPascal)) colsByTable.set(tPascal, []);
    colsByTable.get(tPascal).push(c);
  }

  const lines = [];
  lines.push('erDiagram');
  lines.push('    %% =====================================================================');
  lines.push(`    %% iShop Huy Hoàng - Sơ Đồ Quan Hệ Cơ Sở Dữ Liệu 3NF (${tables.length} Bảng, ${cols.length} Cột, ${fks.length} Khóa Ngoại)`);
  lines.push('    %% Đồng bộ trực tiếp từ MySQL ishop_huyhoang - Tiếng Việt PascalCase');
  lines.push('    %% Ký hiệu: ||--o{ (Bắt buộc 1-N) | |o--o{ (Tùy chọn 0..1-N)');
  lines.push('    %% =====================================================================');
  lines.push('');

  for (const fk of fks) {
    const parent = toPascal(fk.REFERENCED_TABLE_NAME);
    const child = toPascal(fk.TABLE_NAME);
    const isNullable = colNullableMap.get(`${fk.TABLE_NAME.toLowerCase()}.${fk.COLUMN_NAME}`);
    const connector = isNullable ? '|o--o{' : '||--o{';
    const key = `${parent}->${child}.${fk.COLUMN_NAME}`;
    const label = FK_LABELS[key] || fk.COLUMN_NAME;
    lines.push(`    ${parent} ${connector} ${child} : "${label}"`);
  }

  lines.push('');
  lines.push('    %% =====================================================================');
  lines.push(`    %% CHI TIẾT ${tables.length} THỰC THỂ CHUẨN HÓA 3NF THEO 6 PHÂN HỆ`);
  lines.push('    %% =====================================================================');

  const emitted = new Set();

  function emitTable(tPascal) {
    const tCols = colsByTable.get(tPascal);
    if (!tCols || emitted.has(tPascal)) return;
    emitted.add(tPascal);
    lines.push('');
    lines.push(`    ${tPascal} {`);
    for (const c of tCols) {
      const lowKey = `${c.TABLE_NAME.toLowerCase()}.${c.COLUMN_NAME}`;
      const tags = [];
      if (c.COLUMN_KEY === 'PRI') tags.push('PK');
      if (fkColSet.has(lowKey)) tags.push('FK');
      if (ukColSet.has(lowKey) && c.COLUMN_KEY !== 'PRI') tags.push('UK');
      const tagStr = tags.length > 0 ? ' ' + tags.join(',') : '';
      lines.push(`        ${simplifyDataType(c.DATA_TYPE)} ${c.COLUMN_NAME}${tagStr}`);
    }
    lines.push('    }');
  }

  for (const group of MODULE_GROUPS) {
    lines.push('');
    lines.push(`    %% --- ${group.title} ---`);
    for (const tPascal of group.tables) {
      emitTable(tPascal);
    }
  }

  // Emit any remaining tables not explicitly grouped
  for (const t of tables) {
    emitTable(toPascal(t.TABLE_NAME));
  }

  const outPath = path.join(process.cwd(), 'SoDoER_IShopHuyHoang.mmd');
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Đã xuất thành công ${outPath} (${tables.length} bảng, ${cols.length} cột, ${fks.length} khóa ngoại)!`);

  await conn.end();
}

generateErd().catch((err) => {
  console.error('Lỗi xuất sơ đồ ERD:', err);
  process.exit(1);
});
