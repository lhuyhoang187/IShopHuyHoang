'use client';

import {
  PhoneProduct,
  PhoneStockItem,
  AccessoryProduct,
  SparePartItem,
  RepairTicket,
  RepairStatus,
  Customer,
  Supplier,
  CashbookEntry,
  Invoice,
  CartItem,
  Role,
} from './types';
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

const STORAGE_PREFIX = 'ishop_huyhoang_';

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error('Error reading localStorage', err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new Event('ishop_data_changed'));
  } catch (err) {
    console.error('Error writing localStorage', err);
  }
}

export interface RecentItem {
  id: string;
  code: string;
  type: 'invoice' | 'repair' | 'phone';
  title: string;
  url: string;
  time: string;
}

export const IShopStore = {
  // Roles
  getRole(): Role {
    return getStorage<Role>('current_role', 'admin');
  },
  setRole(role: Role) {
    setStorage('current_role', role);
  },

  // Phones catalog
  getPhones(): PhoneProduct[] {
    return getStorage<PhoneProduct[]>('phones', initialPhones);
  },
  getPhoneBySlug(slug: string): PhoneProduct | undefined {
    return this.getPhones().find((p) => p.slug === slug);
  },

  // Phone stock (IMEIs)
  getPhoneStock(): PhoneStockItem[] {
    return getStorage<PhoneStockItem[]>('phone_stock', initialPhoneStock);
  },
  getAvailablePhones(): PhoneStockItem[] {
    return this.getPhoneStock().filter((item) => item.status === 'in_stock');
  },
  lookupImei(imei: string): PhoneStockItem | undefined {
    const clean = imei.trim();
    return this.getPhoneStock().find((item) => item.imei === clean);
  },

  // Accessories
  getAccessories(): AccessoryProduct[] {
    return getStorage<AccessoryProduct[]>('accessories', initialAccessories);
  },
  getAccessoryBySlug(slug: string): AccessoryProduct | undefined {
    return this.getAccessories().find((a) => a.slug === slug);
  },
  getAccessoryByBarcode(barcode: string): AccessoryProduct | undefined {
    return this.getAccessories().find((a) => a.barcode === barcode.trim());
  },

  // Spare parts
  getSpareParts(): SparePartItem[] {
    return getStorage<SparePartItem[]>('spare_parts', initialSpareParts);
  },

  // Repairs
  getRepairs(): RepairTicket[] {
    return getStorage<RepairTicket[]>('repairs', initialRepairTickets);
  },
  getRepairByCode(code: string): RepairTicket | undefined {
    const clean = code.trim().toUpperCase();
    return this.getRepairs().find(
      (r) => r.ticketCode.toUpperCase() === clean || r.customerPhone === clean || r.imeiOrSerial === clean
    );
  },
  createRepairTicket(
    data: Omit<RepairTicket, 'id' | 'ticketCode' | 'statusHistory' | 'partsUsed' | 'totalAmount'>
  ): RepairTicket {
    const repairs = this.getRepairs();
    const count = repairs.length + 1;
    const ticketCode = `SC-2608-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newTicket: RepairTicket = {
      ...data,
      id: 'rep-' + Date.now(),
      ticketCode,
      statusHistory: [
        {
          step: 'received',
          label: 'Tiếp nhận máy tại quầy',
          time: now,
          note: 'Biên nhận sửa chữa K80 được tạo tự động.',
          actor: 'Lễ tân tiếp nhận',
        },
      ],
      partsUsed: [],
      totalAmount: data.laborFee || 0,
    };

    setStorage('repairs', [newTicket, ...repairs]);
    this.addRecentItem({
      id: newTicket.id,
      code: newTicket.ticketCode,
      type: 'repair',
      title: `${newTicket.ticketCode} - ${newTicket.customerName}`,
      url: `/admin/repairs`,
      time: 'Vừa xong',
    });

    return newTicket;
  },

  updateRepairStatus(
    ticketId: string,
    newStatus: RepairStatus,
    note?: string,
    actor: string = 'Kỹ thuật viên'
  ) {
    const repairs = this.getRepairs();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const statusLabels: Record<RepairStatus, string> = {
      received: 'Tiếp nhận máy',
      inspecting: 'Kiểm tra kỹ thuật & Báo giá',
      repairing: 'Đang tiến hành sửa chữa',
      qc_checking: 'Kiểm tra QC xuất xưởng',
      ready_for_pickup: 'Sẵn sàng giao cho khách',
      delivered: 'Đã bàn giao máy cho khách',
      cancelled: 'Hủy sửa chữa',
    };

    const updated = repairs.map((t) => {
      if (t.id === ticketId) {
        const history = [
          ...t.statusHistory,
          {
            step: newStatus,
            label: statusLabels[newStatus] || newStatus,
            time: now,
            note: note || `Chuyển trạng thái sang: ${statusLabels[newStatus]}`,
            actor,
          },
        ];
        return {
          ...t,
          status: newStatus,
          statusHistory: history,
          deliveredAt: newStatus === 'delivered' ? now : t.deliveredAt,
        };
      }
      return t;
    });

    setStorage('repairs', updated);

    // If delivered, record cashbook entry if totalAmount > 0
    if (newStatus === 'delivered') {
      const ticket = repairs.find((r) => r.id === ticketId);
      if (ticket && ticket.totalAmount > 0) {
        this.addCashbookEntry({
          type: 'receipt',
          category: 'repair_service',
          categoryLabel: 'Dịch vụ sửa chữa',
          amount: ticket.totalAmount,
          paymentMethod: 'cash',
          referenceCode: ticket.ticketCode,
          description: `Thu tiền sửa chữa máy ${ticket.deviceModel} (${ticket.ticketCode})`,
          creator: actor,
        });
      }
    }
  },

  useSparePart(ticketId: string, partId: string, quantity: number = 1) {
    const parts = this.getSpareParts();
    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart || targetPart.stock < quantity) {
      throw new Error('Linh kiện không đủ số lượng tồn kho!');
    }

    // Deduct stock
    const updatedParts = parts.map((p) =>
      p.id === partId ? { ...p, stock: p.stock - quantity } : p
    );
    setStorage('spare_parts', updatedParts);

    // Add to ticket
    const repairs = this.getRepairs();
    const updatedRepairs = repairs.map((t) => {
      if (t.id === ticketId) {
        const existingPart = t.partsUsed.find((p) => p.partId === partId);
        let newPartsUsed = [...t.partsUsed];
        if (existingPart) {
          newPartsUsed = newPartsUsed.map((p) =>
            p.partId === partId
              ? { ...p, quantity: p.quantity + quantity }
              : p
          );
        } else {
          newPartsUsed.push({
            partId,
            partName: targetPart.name,
            quantity,
            costPrice: targetPart.costPrice,
            unitPrice: targetPart.retailRepairPrice,
          });
        }
        const newTotal = newPartsUsed.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          t.laborFee || 0
        );
        return {
          ...t,
          partsUsed: newPartsUsed,
          totalAmount: newTotal,
        };
      }
      return t;
    });

    setStorage('repairs', updatedRepairs);
  },

  // Invoices & POS
  getInvoices(): Invoice[] {
    return getStorage<Invoice[]>('invoices', initialInvoices);
  },
  createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceCode' | 'createdAt'>): Invoice {
    const invoices = this.getInvoices();
    const count = invoices.length + 1;
    const invoiceCode = `HD-2608-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv-' + Date.now(),
      invoiceCode,
      createdAt: now,
    };

    // Update phone stock for any phone sold
    const phoneStock = this.getPhoneStock();
    const soldImeis = new Set<string>();
    invoiceData.items.forEach((item) => {
      if (item.type === 'phone' && item.imei) {
        soldImeis.add(item.imei);
      }
    });

    if (soldImeis.size > 0) {
      const updatedPhoneStock = phoneStock.map((unit) => {
        if (soldImeis.has(unit.imei)) {
          return {
            ...unit,
            status: 'sold' as const,
            soldAt: now.substring(0, 10),
            soldToCustomerName: invoiceData.customerName,
            soldToCustomerPhone: invoiceData.customerPhone,
            soldInvoiceId: invoiceCode,
          };
        }
        return unit;
      });
      setStorage('phone_stock', updatedPhoneStock);
    }

    // Deduct accessory stock
    const accessories = this.getAccessories();
    const updatedAccessories = accessories.map((acc) => {
      const item = invoiceData.items.find(
        (i) => i.type === 'accessory' && (i.id === acc.id || i.barcode === acc.barcode)
      );
      if (item) {
        return { ...acc, stock: Math.max(0, acc.stock - item.quantity) };
      }
      return acc;
    });
    setStorage('accessories', updatedAccessories);

    // Save invoice
    setStorage('invoices', [newInvoice, ...invoices]);

    // Record cashbook entry
    const hasPhone = invoiceData.items.some((i) => i.type === 'phone');
    this.addCashbookEntry({
      type: 'receipt',
      category: hasPhone ? 'sale_phone' : 'sale_accessory',
      categoryLabel: hasPhone ? 'Bán điện thoại mới' : 'Bán phụ kiện',
      amount: newInvoice.totalAmount,
      paymentMethod: newInvoice.paymentMethod === 'vietqr' ? 'transfer' : 'cash',
      referenceCode: invoiceCode,
      description: `Bán hàng cho ${newInvoice.customerName} (${invoiceData.items.length} món)`,
      creator: newInvoice.cashierName,
    });

    // Update or add customer points
    this.recordCustomerPurchase(newInvoice.customerName, newInvoice.customerPhone, newInvoice.totalAmount);

    // Add recent item
    this.addRecentItem({
      id: newInvoice.id,
      code: newInvoice.invoiceCode,
      type: 'invoice',
      title: `${newInvoice.invoiceCode} - ${newInvoice.customerName}`,
      url: `/admin/pos`,
      time: 'Vừa xong',
    });

    return newInvoice;
  },

  // Supplier Inbound Restock
  importPhoneBatch(
    supplierId: string,
    phoneId: string,
    color: string,
    capacity: string,
    costPrice: number,
    sellingPrice: number,
    imeis: string[],
    paidAmount: number
  ) {
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = supplier?.name || 'Nhà Cung Cấp';
    const phones = this.getPhones();
    const phone = phones.find((p) => p.id === phoneId);
    const phoneName = phone ? `${phone.name} ${capacity}` : 'Điện thoại';
    const now = new Date().toISOString().substring(0, 10);

    const currentStock = this.getPhoneStock();
    const newItems: PhoneStockItem[] = imeis.map((imei) => ({
      imei: imei.trim(),
      phoneId,
      phoneName,
      color,
      capacity,
      costPrice,
      sellingPrice,
      supplierId,
      supplierName,
      importDate: now,
      status: 'in_stock',
      warrantyMonths: 12,
    }));

    setStorage('phone_stock', [...newItems, ...currentStock]);

    const totalBatchCost = costPrice * imeis.length;
    const debtIncrease = Math.max(0, totalBatchCost - paidAmount);

    // Update supplier stats
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id === supplierId) {
        return {
          ...s,
          totalPurchased: s.totalPurchased + totalBatchCost,
          currentDebt: s.currentDebt + debtIncrease,
        };
      }
      return s;
    });
    setStorage('suppliers', updatedSuppliers);

    // Add cashbook payment if paid amount > 0
    if (paidAmount > 0) {
      this.addCashbookEntry({
        type: 'payment',
        category: 'supplier_restock',
        categoryLabel: 'Trả tiền hàng NCC',
        amount: paidAmount,
        paymentMethod: 'transfer',
        description: `Thanh toán nhập lô ${imeis.length} máy ${phoneName} cho ${supplierName}`,
        creator: 'Admin',
      });
    }
  },

  // Cashbook
  getCashbook(): CashbookEntry[] {
    return getStorage<CashbookEntry[]>('cashbook', initialCashbook);
  },
  addCashbookEntry(entry: Omit<CashbookEntry, 'id' | 'code' | 'date'>) {
    const entries = this.getCashbook();
    const prefix = entry.type === 'receipt' ? 'PT' : 'PC';
    const count = entries.length + 1;
    const code = `${prefix}-2608-${String(count).padStart(3, '0')}`;
    const date = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newEntry: CashbookEntry = {
      ...entry,
      id: 'cb-' + Date.now(),
      code,
      date,
    };

    setStorage('cashbook', [newEntry, ...entries]);
    return newEntry;
  },

  // Customers & Suppliers
  getCustomers(): Customer[] {
    return getStorage<Customer[]>('customers', initialCustomers);
  },
  recordCustomerPurchase(name: string, phone: string, amount: number) {
    if (!phone) return;
    const customers = this.getCustomers();
    const existing = customers.find((c) => c.phone === phone);
    const earnedPoints = Math.floor(amount / 100000); // 100k = 1 point

    if (existing) {
      const updated = customers.map((c) =>
        c.phone === phone
          ? {
              ...c,
              totalSpent: c.totalSpent + amount,
              points: c.points + earnedPoints,
              purchaseCount: c.purchaseCount + 1,
            }
          : c
      );
      setStorage('customers', updated);
    } else {
      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: name || 'Khách hàng',
        phone,
        totalSpent: amount,
        points: earnedPoints,
        createdAt: new Date().toISOString().substring(0, 10),
        purchaseCount: 1,
        repairCount: 0,
      };
      setStorage('customers', [newCust, ...customers]);
    }
  },

  getSuppliers(): Supplier[] {
    return getStorage<Supplier[]>('suppliers', initialSuppliers);
  },
  paySupplierDebt(supplierId: string, amount: number, paymentMethod: 'cash' | 'transfer' = 'transfer') {
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const updated = suppliers.map((s) =>
      s.id === supplierId
        ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) }
        : s
    );
    setStorage('suppliers', updated);

    this.addCashbookEntry({
      type: 'payment',
      category: 'supplier_restock',
      categoryLabel: 'Trả tiền nợ NCC',
      amount,
      paymentMethod,
      description: `Thanh toán công nợ cho nhà cung cấp: ${supplier.name}`,
      creator: 'Admin',
    });
  },

  // Recent items ("Xem cuối: SP.xxxxx")
  getRecentItems(): RecentItem[] {
    return getStorage<RecentItem[]>('recent_items', [
      {
        id: '1',
        code: 'HD-2608-001',
        type: 'invoice',
        title: 'HD-2608-001 (Bảo)',
        url: '/admin/pos',
        time: 'Hôm qua',
      },
      {
        id: '2',
        code: 'SC-2608-001',
        type: 'repair',
        title: 'SC-2608-001 (Hùng)',
        url: '/admin/repairs',
        time: 'Sáng nay',
      },
    ]);
  },
  addRecentItem(item: RecentItem) {
    const items = this.getRecentItems().filter((i) => i.code !== item.code);
    setStorage('recent_items', [item, ...items].slice(0, 6));
  },

  // Cart (Customer Portal)
  getCart(): CartItem[] {
    return getStorage<CartItem[]>('cart', []);
  },
  addToCart(item: Omit<CartItem, 'id'>) {
    const cart = this.getCart();
    const key = `${item.productId}_${item.color || ''}_${item.capacity || ''}`;
    const existing = cart.find((i) => i.id === key);

    if (existing) {
      const updated = cart.map((i) =>
        i.id === key ? { ...i, quantity: i.quantity + item.quantity } : i
      );
      setStorage('cart', updated);
    } else {
      setStorage('cart', [...cart, { ...item, id: key }]);
    }
  },
  updateCartQuantity(cartItemId: string, quantity: number) {
    const cart = this.getCart();
    if (quantity <= 0) {
      setStorage('cart', cart.filter((i) => i.id !== cartItemId));
    } else {
      setStorage(
        'cart',
        cart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
      );
    }
  },
  clearCart() {
    setStorage('cart', []);
  },

  // Compare List (Customer Portal)
  getComparisonList(): string[] {
    return getStorage<string[]>('comparison_ids', ['p-1', 'p-3']); // Default compare iPhone 16 Pro Max vs S24 Ultra!
  },
  toggleComparison(phoneId: string) {
    const list = this.getComparisonList();
    if (list.includes(phoneId)) {
      setStorage(
        'comparison_ids',
        list.filter((id) => id !== phoneId)
      );
    } else {
      if (list.length >= 3) {
        // limit to 3 phones
        setStorage('comparison_ids', [...list.slice(1), phoneId]);
      } else {
        setStorage('comparison_ids', [...list, phoneId]);
      }
    }
  },
  clearComparison() {
    setStorage('comparison_ids', []);
  },

  // Reset to default data
  resetAllData() {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    window.dispatchEvent(new Event('ishop_data_changed'));
  },
};
