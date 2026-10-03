/**
 * Tiện ích xuất dữ liệu báo cáo ra file Excel / CSV chuẩn UTF-8 (BOM)
 * Đảm bảo hiển thị đúng 100% tiếng Việt có dấu khi mở bằng Microsoft Excel
 */

import { Invoice, PhoneStockItem, RepairTicket, CashbookEntry } from './types';

export function downloadCsv(filename: string, csvContent: string) {
  // Thêm BOM (Byte Order Mark) để Microsoft Excel nhận diện UTF-8 chuẩn
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Xuất danh sách Hóa đơn POS & Bán hàng Online
 */
export function exportInvoicesCsv(invoices: Invoice[]) {
  const headers = [
    'Mã Hóa Đơn',
    'Ngày Tạo',
    'Khách Hàng',
    'Số Điện Thoại',
    'Thu Ngân',
    'Hình Thức',
    'Tổng Tiền (VNĐ)',
    'Giảm Giá (VNĐ)',
    'Khách Trả (VNĐ)',
    'Chi Tiết Mặt Hàng',
  ];

  const rows = invoices.map((inv) => {
    const itemsSummary = inv.items
      .map((i) => `${i.name} (${i.variant || ''}) x${i.quantity}${i.imei ? ' [IMEI: ' + i.imei + ']' : ''}`)
      .join('; ');

    return [
      inv.invoiceCode,
      inv.createdAt,
      inv.customerName,
      inv.customerPhone,
      inv.cashierName,
      inv.paymentMethod === 'vietqr' ? 'VietQR Napas 247' : 'Tiền Mặt',
      inv.subtotal,
      inv.discount,
      inv.totalAmount,
      itemsSummary,
    ].map(escapeCsvCell);
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`IShop_Hoa_Don_Ban_Hang_${dateStr}.csv`, csvContent);
}

/**
 * Xuất danh sách Tồn kho máy theo số IMEI
 */
export function exportPhoneStockCsv(phones: PhoneStockItem[]) {
  const headers = [
    'Số IMEI (15 số)',
    'Tên Sản Phẩm',
    'Màu Sắc',
    'Dung Lượng',
    'Tình Trạng Kho',
    'Giá Vốn (VNĐ)',
    'Giá Bán (VNĐ)',
    'Nhà Cung Cấp',
    'Ngày Nhập Kho',
  ];

  const rows = phones.map((p) => {
    const statusLabel =
      p.status === 'in_stock'
        ? 'Còn trong kho'
        : p.status === 'sold'
        ? 'Đã bán'
        : 'Đã đặt trước';

    return [
      `'${p.imei}`, // Thêm dấu ' để Excel không chuyển sang dạng scientific notation 1.23E+14
      p.phoneName,
      p.color,
      p.capacity,
      statusLabel,
      p.costPrice,
      p.sellingPrice,
      p.supplierName,
      p.importDate,
    ].map(escapeCsvCell);
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`IShop_Ton_Kho_IMEI_${dateStr}.csv`, csvContent);
}

/**
 * Xuất danh sách Phiếu sửa chữa iCare
 */
export function exportRepairsCsv(repairs: RepairTicket[]) {
  const headers = [
    'Mã Phiếu',
    'Khách Hàng',
    'Số Điện Thoại',
    'Thiết Bị / Model',
    'Mã IMEI/Seri',
    'Tình Trạng Lỗi',
    'Kỹ Thuật Viên',
    'Trạng Thái',
    'Tiền Công Kỹ Thuật',
    'Tổng Tiền (VNĐ)',
    'Ngày Tiếp Nhận',
  ];

  const statusMap: Record<string, string> = {
    received: 'Tiếp nhận',
    inspecting: 'Kiểm tra / Báo giá',
    repairing: 'Đang sửa chữa',
    qc_checking: 'Kiểm tra QC',
    ready_for_pickup: 'Sẵn sàng bàn giao',
    delivered: 'Đã hoàn tất bàn giao',
    cancelled: 'Đã hủy',
  };

  const rows = repairs.map((r) => {
    return [
      r.ticketCode,
      r.customerName,
      r.customerPhone,
      r.deviceModel,
      r.imeiOrSerial ? `'${r.imeiOrSerial}` : '',
      r.issueDescription,
      r.technicianName || '',
      statusMap[r.status] || r.status,
      r.laborFee,
      r.totalAmount,
      r.receivedAt,
    ].map(escapeCsvCell);
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`IShop_So_Sua_Chua_iCare_${dateStr}.csv`, csvContent);
}

/**
 * Xuất Sổ quỹ Thu - Chi
 */
export function exportCashbookCsv(entries: CashbookEntry[]) {
  const headers = [
    'Mã Chứng Từ',
    'Thời Gian',
    'Loại Phiếu',
    'Phân Loại',
    'Mô Tả / Diễn Giải',
    'Số Tiền (VNĐ)',
    'Phương Thức',
    'Người Thực Hiện',
  ];

  const rows = entries.map((e) => {
    return [
      e.code,
      e.date,
      e.type === 'receipt' ? 'Thu' : 'Chi',
      e.categoryLabel,
      e.description,
      e.amount,
      e.paymentMethod === 'transfer' ? 'Chuyển Khoản' : 'Tiền Mặt',
      e.creator,
    ].map(escapeCsvCell);
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`IShop_So_Quy_Thu_Chi_${dateStr}.csv`, csvContent);
}
