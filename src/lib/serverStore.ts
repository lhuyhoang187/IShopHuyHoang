import {
  initialPhones,
  initialPhoneStock,
  initialAccessories,
  initialSpareParts,
  initialRepairTickets,
  initialCustomers,
  initialSuppliers,
  initialCashbook,
  initialInvoices,
} from './initialData';
import {
  Invoice,
  RepairTicket,
  PhoneStockItem,
  CashbookEntry,
} from './types';

// In-memory server state for API routes
class ServerStoreManager {
  private invoices: Invoice[] = [...initialInvoices];
  private repairs: RepairTicket[] = [...initialRepairTickets];
  private phoneStock: PhoneStockItem[] = [...initialPhoneStock];
  private cashbook: CashbookEntry[] = [...initialCashbook];

  // Invoices API
  getInvoices(): Invoice[] {
    return this.invoices;
  }

  getInvoiceByCode(code: string): Invoice | undefined {
    return this.invoices.find(
      (inv) => inv.invoiceCode.toLowerCase() === code.trim().toLowerCase()
    );
  }

  createInvoice(payload: {
    customerName: string;
    customerPhone: string;
    items: any[];
    subtotal: number;
    discount?: number;
    totalAmount: number;
    paymentMethod: 'cash' | 'vietqr' | 'card';
    cashierName?: string;
  }): Invoice {
    const count = this.invoices.length + 1;
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const code = `HD-${dateStr}-${String(count).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceCode: code,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      items: payload.items || [],
      subtotal: payload.subtotal,
      discount: payload.discount || 0,
      totalAmount: payload.totalAmount,
      paymentMethod: payload.paymentMethod,
      cashierName: payload.cashierName || 'Website Online',
      createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
      warrantyNote: 'Bảo hành chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
    };

    this.invoices.unshift(newInvoice);

    // Ghi nhận tự động vào sổ quỹ nếu thanh toán xong
    this.cashbook.unshift({
      id: `cb-${Date.now()}`,
      code: `PT-${dateStr}-${String(this.cashbook.length + 1).padStart(3, '0')}`,
      date: now.toISOString().replace('T', ' ').slice(0, 19),
      type: 'receipt',
      category: 'sale_phone',
      categoryLabel: 'Bán hàng Online / POS',
      amount: newInvoice.totalAmount,
      paymentMethod: newInvoice.paymentMethod === 'vietqr' ? 'transfer' : 'cash',
      referenceCode: newInvoice.invoiceCode,
      description: `Thu tiền đơn hàng ${newInvoice.invoiceCode} - KH ${newInvoice.customerName}`,
      creator: newInvoice.cashierName,
    });

    return newInvoice;
  }

  // Repairs API
  getRepairs(): RepairTicket[] {
    return this.repairs;
  }

  getRepairByCode(code: string): RepairTicket | undefined {
    return this.repairs.find(
      (r) =>
        r.ticketCode.toLowerCase() === code.trim().toLowerCase() ||
        r.customerPhone.trim() === code.trim() ||
        (r.imeiOrSerial && r.imeiOrSerial.trim() === code.trim())
    );
  }

  createRepair(payload: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    deviceModel: string;
    imeiOrSerial?: string;
    unlockPasscode?: string;
    issueDescription: string;
    laborFee?: number;
  }): RepairTicket {
    const count = this.repairs.length + 1;
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const code = `SC-${dateStr}-${String(count).padStart(3, '0')}`;

    const newTicket: RepairTicket = {
      id: `rep-${Date.now()}`,
      ticketCode: code,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerAddress: payload.customerAddress,
      deviceModel: payload.deviceModel,
      imeiOrSerial: payload.imeiOrSerial || '',
      unlockPasscode: payload.unlockPasscode || 'Không có',
      appearanceCondition: 'Nguyên vẹn, tiếp nhận qua API/Web',
      accessoriesIncluded: 'Thân máy',
      issueDescription: payload.issueDescription,
      status: 'received',
      statusHistory: [
        {
          step: 'received',
          label: 'Tiếp nhận thiết bị',
          time: now.toISOString().replace('T', ' ').slice(0, 19),
          note: 'Khách hàng đặt lịch hẹn thành công qua hệ thống trực tuyến',
          actor: 'Hệ thống iCare Online',
        },
      ],
      partsUsed: [],
      laborFee: payload.laborFee || 150000,
      totalAmount: payload.laborFee || 150000,
      estimatedDeliveryDate: 'Trong ngày (30 - 60 phút)',
      receivedAt: now.toISOString().replace('T', ' ').slice(0, 19),
      warrantyPeriod: 'Bảo hành 06 tháng linh kiện chính hãng',
    };

    this.repairs.unshift(newTicket);
    return newTicket;
  }

  // Warranty API
  checkWarranty(imei: string) {
    const cleanImei = imei.trim();
    const phone = this.phoneStock.find((p) => p.imei === cleanImei);

    if (!phone) {
      return {
        found: false,
        message: 'Không tìm thấy thông tin số IMEI này trong hệ thống iShop Huy Hoàng.',
      };
    }

    const isSold = phone.status === 'sold';
    const importDate = new Date(phone.importDate);
    const expireDate = new Date(importDate);
    expireDate.setMonth(expireDate.getMonth() + (phone.warrantyMonths || 12));

    const today = new Date();
    const isExpired = today > expireDate;
    const daysLeft = Math.max(0, Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      found: true,
      imei: phone.imei,
      phoneName: phone.phoneName,
      color: phone.color,
      capacity: phone.capacity,
      status: phone.status,
      condition: 'Mới 100% Nguyên Seal Phân Phối Chính Hãng',
      warrantyMonths: phone.warrantyMonths || 12,
      soldToCustomerName: phone.soldToCustomerName || 'Chưa kích hoạt',
      soldToCustomerPhone: phone.soldToCustomerPhone || 'N/A',
      soldAt: phone.soldAt || 'Chưa bán',
      warrantyExpiryDate: expireDate.toLocaleDateString('vi-VN'),
      isExpired,
      daysLeft,
      serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, P.12, Q.10, TP.HCM',
    };
  }

  // VietQR Webhook Processor
  processVietQRWebhook(payload: {
    gateway?: string;
    transactionDate?: string;
    accountNumber?: string;
    transferType?: string; // 'in'
    transferAmount?: number;
    content?: string;
    referenceCode?: string;
  }) {
    const content = (payload.content || '').toUpperCase();
    const amount = Number(payload.transferAmount || 0);

    // Tìm mã HD-xxxx hoặc SC-xxxx trong nội dung
    const invoiceMatch = content.match(/HD[-_]?\d+[-_]?\d+/i);
    const repairMatch = content.match(/SC[-_]?\d+[-_]?\d+/i);

    let matchedTarget: any = null;
    let type: 'invoice' | 'repair' | 'unknown' = 'unknown';

    if (invoiceMatch) {
      const code = invoiceMatch[0].replace(/_/g, '-');
      const inv = this.invoices.find((i) => i.invoiceCode.toUpperCase().includes(code.toUpperCase()));
      if (inv) {
        matchedTarget = inv;
        type = 'invoice';
      }
    } else if (repairMatch) {
      const code = repairMatch[0].replace(/_/g, '-');
      const rep = this.repairs.find((r) => r.ticketCode.toUpperCase().includes(code.toUpperCase()));
      if (rep) {
        matchedTarget = rep;
        type = 'repair';
      }
    }

    // Ghi nhận giao dịch vào sổ quỹ
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const entry: CashbookEntry = {
      id: `cb-webhook-${Date.now()}`,
      code: `PT-NAPAS-${dateStr}-${String(this.cashbook.length + 1).padStart(3, '0')}`,
      date: now.toISOString().replace('T', ' ').slice(0, 19),
      type: 'receipt',
      category: type === 'repair' ? 'repair_service' : 'sale_phone',
      categoryLabel: 'VietQR Napas 247 Webhook',
      amount: amount,
      paymentMethod: 'transfer',
      referenceCode: matchedTarget?.invoiceCode || matchedTarget?.ticketCode || payload.referenceCode || 'WEBHOOK',
      description: `[Tự Động Napas 247] Nhận ${amount.toLocaleString('vi-VN')}đ. Nội dung: ${payload.content}`,
      creator: 'Hệ Thống Webhook Tự Động',
    };
    this.cashbook.unshift(entry);

    return {
      success: true,
      matched: !!matchedTarget,
      type,
      targetCode: matchedTarget?.invoiceCode || matchedTarget?.ticketCode || null,
      amountReceived: amount,
      cashbookEntryCode: entry.code,
    };
  }
}

export const ServerStore = new ServerStoreManager();
