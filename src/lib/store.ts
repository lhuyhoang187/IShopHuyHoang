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
  StaffUser,
  CustomerUser,
  PermissionItem,
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

import { getTierByPoints } from './loyalty';

export const defaultPermissions: PermissionItem[] = [
  {
    id: 'pos',
    module: 'Bán Hàng POS & In Bill Nhiệt K80/A5',
    category: 'bán hàng',
    description: 'Tạo đơn bán lẻ, quét mã barcode, in hóa đơn K80/A5 và bảo hành điện tử',
    admin: true,
    tech: false,
    cashier: true,
  },
  {
    id: 'pos_discount',
    module: 'Chỉnh Sửa Chiết Khấu / Giảm Giá POS',
    category: 'bán hàng',
    description: 'Cho phép nhân viên tự điều chỉnh % chiết khấu đơn hàng ngoài mức mặc định của hạng thẻ thành viên',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'repairs',
    module: 'Tiếp Nhận Sửa Chữa & Xuất Kho Linh Kiện',
    category: 'kỹ thuật',
    description: 'Quy trình tiếp nhận máy, điều phối kỹ thuật viên, xuất linh kiện thay thế',
    admin: true,
    tech: true,
    cashier: false,
  },
  {
    id: 'cost_price',
    module: 'Xem Giá Vốn Máy Mới & Linh Kiện',
    category: 'kho & mua hàng',
    description: 'Hiển thị giá nhập gốc trên bảng tồn kho, hóa đơn và chi tiết sản phẩm',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'profit_report',
    module: 'Xem Báo Cáo Lợi Nhuận Gộp 3 Mảng',
    category: 'kế toán & báo cáo',
    description: 'Phân tích doanh thu, tỷ suất lợi nhuận mảng Máy mới, Cũ 99% và Dịch vụ sửa chữa',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'restock',
    module: 'Nhập Lô IMEI Từ Nhà Cung Cấp & Ghi Nợ',
    category: 'kho & mua hàng',
    description: 'Tạo phiếu nhập kho NCC, nhập dải IMEI hàng loạt, ghi nhận công nợ phải trả',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'cashbook',
    module: 'Quản Lý Sổ Quỹ Thu - Chi Toàn Cửa Hàng',
    category: 'kế toán & báo cáo',
    description: 'Lập phiếu thu/chi, chốt quỹ tiền mặt ca làm việc, đối soát tài khoản ngân hàng',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'settings',
    module: 'Chỉnh Sửa Cấu Hình & Mẫu In Bill',
    category: 'hệ thống',
    description: 'Cấu hình thông tin cửa hàng, mẫu in K80, kết nối webhook và phân quyền RBAC',
    admin: true,
    tech: false,
    cashier: false,
  },
  {
    id: 'partners',
    module: 'Quản Lý Danh Bạ Đối Tác & Khách Hàng',
    category: 'bán hàng',
    description: 'Xem thông tin khách hàng thân thiết, tích điểm và thông tin nhà cung cấp',
    admin: true,
    tech: false,
    cashier: true,
  },
  {
    id: 'staff_management',
    module: 'Phê Duyệt & Quản Lý Nhân Sự',
    category: 'hệ thống',
    description: 'Duyệt tài khoản nhân viên mới, phân bổ chức vụ và giám sát hoạt động',
    admin: true,
    tech: false,
    cashier: false,
  },
];

export const IShopStore = {
  // Roles & RBAC Matrix
  getPermissionMatrix(): PermissionItem[] {
    const stored = getStorage<PermissionItem[]>('permission_matrix', defaultPermissions);
    const existingIds = new Set(stored.map((s) => s.id));
    const missing = defaultPermissions.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setStorage('permission_matrix', merged);
      return merged;
    }
    return stored;
  },
  setPermissionMatrix(matrix: PermissionItem[]) {
    setStorage('permission_matrix', matrix);
  },
  resetPermissionMatrix(): PermissionItem[] {
    setStorage('permission_matrix', defaultPermissions);
    return defaultPermissions;
  },
  updatePermission(id: string, role: 'admin' | 'tech' | 'cashier', value: boolean) {
    const list = this.getPermissionMatrix();
    const updated = list.map((item) => (item.id === id ? { ...item, [role]: value } : item));
    setStorage('permission_matrix', updated);
  },
  hasPermission(role: Role, permissionId: string): boolean {
    if (role === 'admin') return true;
    if (role === 'pending') return false;
    const list = this.getPermissionMatrix();
    const perm = list.find((p) => p.id === permissionId);
    if (!perm) return false;
    if (role === 'technician') return perm.tech;
    if (role === 'cashier') return perm.cashier;
    return false;
  },

  getRole(): Role {
    const staff = this.getStaffUser();
    if (staff) return staff.role;
    return getStorage<Role>('current_role', 'admin');
  },
  setRole(role: Role) {
    setStorage('current_role', role);
  },

  // Staff Authentication & Avatars
  getStaffAvatar(username: string): string | undefined {
    if (!username) return undefined;
    const avatars = getStorage<Record<string, string>>('staff_avatars', {});
    return avatars[username.toLowerCase().trim()];
  },
  setStaffAvatar(username: string, avatarUrl: string | null) {
    if (!username) return;
    const avatars = getStorage<Record<string, string>>('staff_avatars', {});
    const key = username.toLowerCase().trim();
    if (avatarUrl) {
      avatars[key] = avatarUrl;
    } else {
      delete avatars[key];
    }
    setStorage('staff_avatars', avatars);
  },
  getStaffUser(): StaffUser | null {
    return getStorage<StaffUser | null>('staff_user', null);
  },
  setStaffUser(user: StaffUser | null) {
    if (user) {
      const cachedAvatar = user.username && this.getStaffAvatar(user.username);
      if (!user.avatar && cachedAvatar) {
        user.avatar = cachedAvatar;
      }
      if (user.avatar && user.username) {
        this.setStaffAvatar(user.username, user.avatar);
      }
    }
    setStorage('staff_user', user);
    if (user) {
      setStorage('current_role', user.role);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
  },
  updateStaffUser(data: Partial<StaffUser>): StaffUser | null {
    const current = this.getStaffUser();
    if (!current) return null;
    const updated: StaffUser = { ...current, ...data };
    if (updated.avatar !== undefined && updated.username) {
      this.setStaffAvatar(updated.username, updated.avatar || null);
    }
    this.setStaffUser(updated);
    return updated;
  },
  logoutStaff() {
    setStorage('staff_user', null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
  },

  // Customer Authentication & Avatars
  getCustomerAvatar(phoneOrEmailOrId: string): string | undefined {
    if (!phoneOrEmailOrId) return undefined;
    const avatars = getStorage<Record<string, string>>('customer_avatars', {});
    return avatars[phoneOrEmailOrId.toLowerCase().trim()];
  },
  setCustomerAvatar(phoneOrEmailOrId: string, avatarUrl: string | null) {
    if (!phoneOrEmailOrId) return;
    const avatars = getStorage<Record<string, string>>('customer_avatars', {});
    const key = phoneOrEmailOrId.toLowerCase().trim();
    if (avatarUrl) {
      avatars[key] = avatarUrl;
    } else {
      delete avatars[key];
    }
    setStorage('customer_avatars', avatars);
  },
  getCustomerUser(): CustomerUser | null {
    return getStorage<CustomerUser | null>('customer_user', null);
  },
  setCustomerUser(user: CustomerUser | null) {
    if (user) {
      let cachedAvatar =
        (user.phone && this.getCustomerAvatar(user.phone)) ||
        (user.email && this.getCustomerAvatar(user.email)) ||
        (user.id && this.getCustomerAvatar(user.id));

      if (!cachedAvatar) {
        const custs = this.getCustomers();
        const matched = custs.find(
          (c) =>
            (user.phone && c.phone.trim() === user.phone.trim()) ||
            (user.email && c.email && c.email.trim().toLowerCase() === user.email.trim().toLowerCase())
        );
        if (matched?.avatar) {
          cachedAvatar = matched.avatar;
        }
      }

      if (!user.avatar && cachedAvatar) {
        user.avatar = cachedAvatar;
      }
      if (user.avatar) {
        if (user.phone) this.setCustomerAvatar(user.phone, user.avatar);
        if (user.email) this.setCustomerAvatar(user.email, user.avatar);
        if (user.id) this.setCustomerAvatar(user.id, user.avatar);
      }
    }
    setStorage('customer_user', user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
  },
  updateCustomerUser(data: Partial<CustomerUser>): CustomerUser | null {
    const current = this.getCustomerUser();
    if (!current) return null;
    const updated: CustomerUser = { ...current, ...data };

    if (updated.avatar !== undefined) {
      if (updated.phone) this.setCustomerAvatar(updated.phone, updated.avatar || null);
      if (updated.email) this.setCustomerAvatar(updated.email, updated.avatar || null);
      if (updated.id) this.setCustomerAvatar(updated.id, updated.avatar || null);
    }

    setStorage('customer_user', updated);

    // Đồng bộ vào danh bạ khách hàng
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(
      (c) => (updated.phone && c.phone === updated.phone) || (current.id && c.id === current.id)
    );
    if (existingIndex >= 0) {
      customers[existingIndex] = {
        ...customers[existingIndex],
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        birthday: updated.birthday,
        city: updated.city,
        avatar: updated.avatar,
        membershipTier: updated.membershipTier || customers[existingIndex].membershipTier,
      };
      setStorage('customers', customers);
    } else {
      const newCustomer: Customer = {
        id: updated.id || 'cust-' + Date.now(),
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        birthday: updated.birthday,
        city: updated.city,
        avatar: updated.avatar,
        points: updated.points || 100,
        totalSpent: 0,
        purchaseCount: 0,
        repairCount: 0,
        membershipTier: updated.membershipTier || 'Thành viên mới',
        createdAt: updated.createdAt || new Date().toISOString().split('T')[0],
      };
      customers.unshift(newCustomer);
      setStorage('customers', customers);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
    return updated;
  },
  logoutCustomer() {
    setStorage('customer_user', null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
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
    this.recordCustomerPurchase(
      newInvoice.customerName,
      newInvoice.customerPhone,
      newInvoice.totalAmount,
      newInvoice.pointsEarned
    );

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
  addCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    const existing = list.find((c) => c.phone === customer.phone || c.id === customer.id);
    let updated: Customer[];
    if (existing) {
      updated = list.map((c) => (c.id === existing.id ? { ...c, ...customer } : c));
    } else {
      updated = [customer, ...list];
    }
    setStorage('customers', updated);
    return customer;
  },
  updateCustomer(id: string, data: Partial<Customer>): Customer | null {
    const list = this.getCustomers();
    const existing = list.find((c) => c.id === id);
    if (!existing) return null;
    const updatedCustomer = { ...existing, ...data };
    const updated = list.map((c) => (c.id === id ? updatedCustomer : c));
    setStorage('customers', updated);
    return updatedCustomer;
  },
  deleteCustomer(id: string) {
    const list = this.getCustomers();
    const updated = list.filter((c) => c.id !== id);
    setStorage('customers', updated);
  },
  getCustomerByPhone(phone: string): Customer | undefined {
    if (!phone) return undefined;
    const list = this.getCustomers();
    return list.find((c) => c.phone.trim() === phone.trim());
  },
  recordCustomerPurchase(name: string, phone: string, amount: number, customEarnedPoints?: number) {
    if (!phone) return;
    const customers = this.getCustomers();
    const existing = customers.find((c) => c.phone.trim() === phone.trim());
    const earnedPoints =
      typeof customEarnedPoints === 'number' && customEarnedPoints >= 0
        ? customEarnedPoints
        : Math.floor(amount / 100000); // Mặc định 100k = 1 điểm nếu không có điểm sản phẩm

    if (existing) {
      const updatedPoints = (existing.points || 0) + earnedPoints;
      const updatedTier = getTierByPoints(updatedPoints).tier;
      const updated = customers.map((c) =>
        c.phone.trim() === phone.trim()
          ? {
              ...c,
              totalSpent: (c.totalSpent || 0) + amount,
              points: updatedPoints,
              membershipTier: updatedTier,
              purchaseCount: (c.purchaseCount || 0) + 1,
            }
          : c
      );
      setStorage('customers', updated);
    } else {
      const initialPoints = earnedPoints;
      const initialTier = getTierByPoints(initialPoints).tier;
      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: name || 'Khách hàng',
        phone: phone.trim(),
        totalSpent: amount,
        points: initialPoints,
        membershipTier: initialTier,
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
