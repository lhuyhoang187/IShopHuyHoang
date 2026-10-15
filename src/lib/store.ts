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
  PromoQRCode,
  PromotionCampaign,
  EmailNotification,
  RegisteredDevice,
  RedeemedGiftItem,
} from './types';
import {
  sendPurchaseInvoiceEmail,
  sendDepositInvoiceEmail,
  sendRepairReceiptEmail,
  sendRepairStatusUpdateEmail,
  sendRewardRedeemEmail,
} from './emailService';
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
    id: 'promotions',
    module: 'Quản Lý Giá & Khuyến Mãi (Flash Sale / QR Code)',
    category: 'bán hàng',
    description: 'Điều chỉnh trực tiếp giá niêm yết sản phẩm, cài đặt thời gian bắt đầu & kết thúc khuyến mãi, quản lý mã QR và điểm đổi phụ kiện',
    admin: true,
    tech: false,
    cashier: true,
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
    const user = getStorage<CustomerUser | null>('customer_user', null);
    if (!user) return null;

    // Tự động đồng bộ điểm tích lũy và hạng thẻ mới nhất từ danh bạ khách hàng
    if (user.phone || user.id) {
      const customers = this.getCustomers();
      const matched = customers.find(
        (c) =>
          (user.phone && c.phone.trim() === user.phone.trim()) ||
          (user.id && c.id === user.id)
      );
      if (matched && typeof matched.points === 'number' && matched.points !== user.points) {
        user.points = matched.points;
        user.membershipTier = matched.membershipTier || user.membershipTier;
        setStorage('customer_user', user);
      }
    }
    return user;
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
  updatePhone(phoneId: string, data: Partial<PhoneProduct>): void {
    const phones = this.getPhones();
    const updated = phones.map((p) => (p.id === phoneId ? { ...p, ...data } : p));
    setStorage('phones', updated);
  },
  updatePhonePrice(phoneId: string, capacitySize: string, newPrice: number, newOriginalPrice?: number): void {
    const phones = this.getPhones();
    let phoneName = '';
    const updatedPhones = phones.map((p) => {
      if (p.id === phoneId) {
        phoneName = p.name;
        const newCapacities = p.capacities.map((cap) => {
          if (cap.size === capacitySize) {
            return {
              ...cap,
              price: newPrice,
              originalPrice: newOriginalPrice !== undefined ? newOriginalPrice : cap.originalPrice,
            };
          }
          return cap;
        });
        return { ...p, capacities: newCapacities };
      }
      return p;
    });
    setStorage('phones', updatedPhones);

    // Đồng bộ giá sang tồn kho máy chưa bán (in_stock)
    const stock = this.getPhoneStock();
    const updatedStock = stock.map((item) => {
      if (
        (item.phoneId === phoneId || item.phoneName === phoneName) &&
        item.capacity === capacitySize &&
        item.status === 'in_stock'
      ) {
        return { ...item, sellingPrice: newPrice };
      }
      return item;
    });
    setStorage('phone_stock', updatedStock);
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
  updatePhoneStockItemPrice(imei: string, newSellingPrice: number): void {
    const stock = this.getPhoneStock();
    const updated = stock.map((item) =>
      item.imei === imei ? { ...item, sellingPrice: newSellingPrice } : item
    );
    setStorage('phone_stock', updated);
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
  updateAccessory(accessoryId: string, data: Partial<AccessoryProduct>): void {
    const accessories = this.getAccessories();
    const updated = accessories.map((a) => (a.id === accessoryId ? { ...a, ...data } : a));
    setStorage('accessories', updated);
  },
  updateAccessoryPrice(
    accessoryId: string,
    newSellingPrice: number,
    newOriginalPrice?: number,
    newCostPrice?: number
  ): void {
    const accessories = this.getAccessories();
    const updated = accessories.map((a) => {
      if (a.id === accessoryId) {
        return {
          ...a,
          sellingPrice: newSellingPrice,
          originalPrice: newOriginalPrice !== undefined ? newOriginalPrice : a.originalPrice,
          costPrice: newCostPrice !== undefined ? newCostPrice : a.costPrice,
        };
      }
      return a;
    });
    setStorage('accessories', updated);
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

    // Thống nhất mã sản phẩm: Tự động liên kết mã phiếu sửa chữa vào đúng mã IMEI của máy đã mua
    if (newTicket.imeiOrSerial) {
      this.linkRepairToDevice(newTicket.imeiOrSerial, newTicket.ticketCode);
    }

    // Tự động gửi Email biên nhận tiếp nhận sửa chữa về mail khách hàng
    try {
      sendRepairReceiptEmail(newTicket);
    } catch (e) {
      console.warn('Lỗi gửi email tiếp nhận sửa chữa:', e);
    }

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

    let targetTicket: RepairTicket | undefined;

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
        const res = {
          ...t,
          status: newStatus,
          statusHistory: history,
          deliveredAt: newStatus === 'delivered' ? now : t.deliveredAt,
        };
        targetTicket = res;
        return res;
      }
      return t;
    });

    setStorage('repairs', updated);

    // Tự động gửi Email cập nhật tiến độ sửa chữa máy hiện tại về hòm thư khách hàng
    if (targetTicket) {
      try {
        sendRepairStatusUpdateEmail(
          targetTicket,
          statusLabels[newStatus] || newStatus,
          note,
          actor
        );
      } catch (e) {
        console.warn('Lỗi gửi email cập nhật tiến độ:', e);
      }
    }

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

  consumeSparePart(ticketId: string, partId: string, quantity: number = 1) {
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

  useSparePart(ticketId: string, partId: string, quantity: number = 1) {
    return this.consumeSparePart(ticketId, partId, quantity);
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
    const calculatedPoints =
      typeof invoiceData.pointsEarned === 'number' && invoiceData.pointsEarned >= 0
        ? invoiceData.pointsEarned
        : Math.floor(invoiceData.totalAmount / 10000);

    const isLarge =
      invoiceData.totalAmount >= 100000000 ||
      invoiceData.items
        .filter((i) => i.type === 'phone')
        .reduce((sum, i) => sum + i.quantity, 0) >= 5;

    const initialStatus = invoiceData.status || (isLarge ? 'pending_admin_approval' : 'completed');

    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv-' + Date.now(),
      invoiceCode,
      createdAt: now,
      pointsEarned: calculatedPoints,
      isLargeOrder: isLarge,
      status: initialStatus,
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

    // Thống nhất mã sản phẩm: Tự động lưu thiết bị máy bán ra vào danh bạ thiết bị của khách hàng
    invoiceData.items.forEach((item) => {
      if (item.type === 'phone' && item.imei) {
        this.registerDevice({
          id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          imei: item.imei,
          productName: item.name,
          phoneId: item.id,
          color: item.variant?.split(' ')[0],
          capacity: item.variant?.split(' ')[1],
          customerPhone: invoiceData.customerPhone,
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail,
          purchaseInvoiceCode: invoiceCode,
          purchaseDate: now.substring(0, 10),
          warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
          purchasePrice: item.unitPrice,
          repairHistoryCodes: [],
        });
      }
    });

    // Record cashbook entry
    const hasPhone = invoiceData.items.some((i) => i.type === 'phone');
    this.addCashbookEntry({
      type: 'receipt',
      category: hasPhone ? 'sale_phone' : 'sale_accessory',
      categoryLabel: hasPhone ? 'Bán điện thoại mới' : 'Bán phụ kiện',
      amount: newInvoice.totalAmount,
      paymentMethod: newInvoice.paymentMethod === 'vietqr' ? 'transfer' : 'cash',
      referenceCode: invoiceCode,
      description: `Bán hàng cho ${newInvoice.customerName} (${invoiceData.items.length} món)${isLarge ? ' [ĐƠN HÀNG LỚN >100TR]' : ''}`,
      creator: newInvoice.cashierName,
    });

    // Update or add customer points
    this.recordCustomerPurchase(
      newInvoice.customerName,
      newInvoice.customerPhone,
      newInvoice.totalAmount,
      newInvoice.pointsEarned
    );

    // Tự động gửi Email thông báo hóa đơn mua hàng hoặc hóa đơn đặt cọc
    try {
      if (newInvoice.isPreOrder) {
        sendDepositInvoiceEmail(newInvoice, newInvoice.customerEmail);
      } else {
        sendPurchaseInvoiceEmail(newInvoice, newInvoice.customerEmail);
      }
    } catch (e) {
      console.warn('Lỗi gửi email hóa đơn khách hàng:', e);
    }

    // Add recent item
    this.addRecentItem({
      id: newInvoice.id,
      code: newInvoice.invoiceCode,
      type: 'invoice',
      title: `${newInvoice.invoiceCode} - ${newInvoice.customerName}${isLarge ? ' (Đơn lớn >100tr)' : ''}`,
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
        : Math.floor(amount / 10000); // Mặc định 100.000đ = 10 điểm (10.000đ = 1 điểm)

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

      // Cập nhật ngay lập tức nếu khách hàng đang đăng nhập tài khoản này
      const currentCustUser = getStorage<CustomerUser | null>('customer_user', null);
      if (currentCustUser && (currentCustUser.phone?.trim() === phone.trim() || currentCustUser.name === existing.name)) {
        currentCustUser.points = updatedPoints;
        currentCustUser.membershipTier = updatedTier;
        setStorage('customer_user', currentCustUser);
      }
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

      // Cập nhật ngay lập tức nếu khách hàng đang đăng nhập tài khoản này
      const currentCustUser = getStorage<CustomerUser | null>('customer_user', null);
      if (currentCustUser && currentCustUser.phone?.trim() === phone.trim()) {
        currentCustUser.points = initialPoints;
        currentCustUser.membershipTier = initialTier;
        setStorage('customer_user', currentCustUser);
      }
    }
  },

  updateCustomerPoints(phone: string, deltaPoints: number): number {
    if (!phone) return 0;
    const cleanPhone = phone.trim();
    const customers = this.getCustomers();
    const existing = customers.find((c) => c.phone.trim() === cleanPhone);
    let newPoints = 0;

    if (existing) {
      newPoints = Math.max(0, (existing.points || 0) + deltaPoints);
      const newTier = getTierByPoints(newPoints).tier;
      const updated = customers.map((c) =>
        c.phone.trim() === cleanPhone
          ? { ...c, points: newPoints, membershipTier: newTier }
          : c
      );
      setStorage('customers', updated);
    }

    const currentCustUser = getStorage<CustomerUser | null>('customer_user', null);
    if (currentCustUser && currentCustUser.phone?.trim() === cleanPhone) {
      newPoints = Math.max(0, (currentCustUser.points || 0) + deltaPoints);
      currentCustUser.points = newPoints;
      currentCustUser.membershipTier = getTierByPoints(newPoints).tier;
      setStorage('customer_user', currentCustUser);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ishop_data_changed'));
    }
    return newPoints;
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

  // Kiểm tra số lượng tồn kho khả dụng hiện tại của sản phẩm (điện thoại hoặc phụ kiện)
  getProductAvailableStock(params: {
    productId: string;
    type?: 'phone' | 'accessory';
    color?: string;
    capacity?: string;
  }): number {
    const { productId, type, color, capacity } = params;

    // Nếu là phụ kiện hoặc không chỉ định nhưng tìm thấy trong phụ kiện
    if (type === 'accessory' || (!type && this.getAccessories().some((a) => a.id === productId))) {
      const accessory = this.getAccessories().find((a) => a.id === productId);
      return accessory ? (accessory.stock ?? 0) : 0;
    }

    // Nếu là điện thoại (quản lý qua danh sách phone_stock có trạng thái in_stock)
    const inStockPhones = this.getAvailablePhones().filter((p) => p.phoneId === productId);

    // Nếu có chọn màu sắc và dung lượng cụ thể, lọc chuẩn xác theo biến thể
    if (color || capacity) {
      const matched = inStockPhones.filter((p) => {
        let matchColor = true;
        let matchCapacity = true;
        if (color) {
          const c1 = p.color.toLowerCase().trim();
          const c2 = color.toLowerCase().trim();
          matchColor = c1.includes(c2) || c2.includes(c1);
        }
        if (capacity) {
          const cap1 = p.capacity.toLowerCase().replace(/\s+/g, '');
          const cap2 = capacity.toLowerCase().replace(/\s+/g, '');
          matchCapacity = cap1 === cap2;
        }
        return matchColor && matchCapacity;
      });

      // Nếu có biến thể cụ thể thì trả về số lượng biến thể đó
      if (matched.length > 0) return matched.length;

      // Nếu không có chính xác biến thể đó nhưng có máy thuộc dòng này
      return matched.length;
    }

    // Trường hợp chung dòng điện thoại
    return inStockPhones.length;
  },

  addToCart(item: Omit<CartItem, 'id'>): { success: boolean; message: string; availableStock: number } {
    const cart = this.getCart();
    const key = `${item.productId}_${item.color || ''}_${item.capacity || ''}`;
    const existing = cart.find((i) => i.id === key);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const requestedTotalQty = currentQtyInCart + item.quantity;

    // Lấy tồn kho thực tế
    const availableStock = this.getProductAvailableStock({
      productId: item.productId,
      type: item.type,
      color: item.color,
      capacity: item.capacity,
    });

    // Ràng buộc số lượng trong kho
    if (requestedTotalQty > availableStock) {
      if (availableStock <= 0) {
        return {
          success: false,
          message: `Sản phẩm "${item.name}" hiện đã hết hàng trong kho!`,
          availableStock: 0,
        };
      }
      return {
        success: false,
        message: `Kho hiện chỉ còn ${availableStock} sản phẩm (bạn đã có ${currentQtyInCart} trong giỏ). Không thể đặt vượt quá tồn kho!`,
        availableStock,
      };
    }

    if (existing) {
      const updated = cart.map((i) =>
        i.id === key ? { ...i, quantity: i.quantity + item.quantity } : i
      );
      setStorage('cart', updated);
    } else {
      setStorage('cart', [...cart, { ...item, id: key }]);
    }

    return {
      success: true,
      message: `Đã thêm ${item.quantity} "${item.name}" vào giỏ hàng thành công!`,
      availableStock,
    };
  },

  updateCartQuantity(
    cartItemId: string,
    quantity: number
  ): { success: boolean; message: string; availableStock: number } {
    const cart = this.getCart();
    const targetItem = cart.find((i) => i.id === cartItemId);

    if (quantity <= 0) {
      setStorage('cart', cart.filter((i) => i.id !== cartItemId));
      return {
        success: true,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng.',
        availableStock: 0,
      };
    }

    if (targetItem) {
      const availableStock = this.getProductAvailableStock({
        productId: targetItem.productId,
        type: targetItem.type,
        color: targetItem.color,
        capacity: targetItem.capacity,
      });

      if (quantity > availableStock) {
        return {
          success: false,
          message: `Kho hiện chỉ còn ${availableStock} sản phẩm. Không thể tăng thêm số lượng!`,
          availableStock,
        };
      }
    }

    setStorage(
      'cart',
      cart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
    );

    return {
      success: true,
      message: 'Đã cập nhật số lượng thành công.',
      availableStock: targetItem ? this.getProductAvailableStock(targetItem) : 0,
    };
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
  // =========================================================================
  // 1. QUẢN LÝ MÃ SẢN PHẨM / THIẾT BỊ VÒNG ĐỜI THỐNG NHẤT (CHUNG MÃ IMEI)
  // =========================================================================
  getRegisteredDevices(phone?: string): RegisteredDevice[] {
    const defaultList: RegisteredDevice[] = [
      {
        id: 'dev-init-1',
        imei: '359144208391001',
        productName: 'iPhone 16 Pro 128GB - Titan Sa Mạc',
        phoneId: 'p-2',
        color: 'Titan Sa Mạc',
        capacity: '128GB',
        customerPhone: '0986898197',
        customerName: 'Lê Huy Hoàng',
        customerEmail: 'huyhoang@gmail.com',
        purchaseInvoiceCode: 'HD-2608-001',
        purchaseDate: '2026-08-25',
        warrantyExpiryDate: '2027-08-25',
        purchasePrice: 28490000,
        repairHistoryCodes: ['SC-2608-001'],
      },
    ];
    const list = getStorage<RegisteredDevice[]>('registered_devices', defaultList);
    if (!phone) return list;
    const cleanPhone = phone.trim();
    return list.filter((d) => d.customerPhone === cleanPhone);
  },

  getDeviceByImei(imei: string): RegisteredDevice | undefined {
    const clean = imei.trim().toUpperCase();
    const list = this.getRegisteredDevices();
    return list.find((d) => d.imei.toUpperCase() === clean);
  },

  registerDevice(device: RegisteredDevice): void {
    const list = this.getRegisteredDevices();
    const cleanImei = device.imei.trim().toUpperCase();
    const exists = list.some((d) => d.imei.toUpperCase() === cleanImei);
    if (exists) {
      const updated = list.map((d) =>
        d.imei.toUpperCase() === cleanImei
          ? {
              ...d,
              ...device,
              repairHistoryCodes: Array.from(new Set([...d.repairHistoryCodes, ...(device.repairHistoryCodes || [])])),
            }
          : d
      );
      setStorage('registered_devices', updated);
    } else {
      setStorage('registered_devices', [device, ...list]);
    }
  },

  linkRepairToDevice(imei: string, repairCode: string): void {
    if (!imei || !repairCode) return;
    const cleanImei = imei.trim().toUpperCase();
    const list = this.getRegisteredDevices();
    const updated = list.map((d) => {
      if (d.imei.toUpperCase() === cleanImei) {
        return {
          ...d,
          repairHistoryCodes: Array.from(new Set([...d.repairHistoryCodes, repairCode])),
        };
      }
      return d;
    });
    setStorage('registered_devices', updated);
  },

  // =========================================================================
  // 2. TÍNH NĂNG KHUYẾN MÃI TÍCH ĐIỂM ĐỔI PHỤ KIỆN
  // =========================================================================
  getRedeemedGifts(customerPhone?: string): RedeemedGiftItem[] {
    const list = getStorage<RedeemedGiftItem[]>('redeemed_gifts', []);
    if (!customerPhone) return list;
    const clean = customerPhone.trim();
    return list.filter((g) => g.customerPhone === clean);
  },

  redeemAccessoryWithPoints(params: {
    customerPhone: string;
    customerName: string;
    accessoryId: string;
  }): { success: boolean; message: string; gift?: RedeemedGiftItem } {
    const accessories = this.getAccessories();
    const targetAcc = accessories.find((a) => a.id === params.accessoryId);
    if (!targetAcc) {
      return { success: false, message: 'Phụ kiện không tồn tại trên hệ thống.' };
    }

    const pointsNeeded = targetAcc.pointsToRedeem || Math.ceil(targetAcc.sellingPrice / 1000);
    if (targetAcc.stock <= 0) {
      return { success: false, message: `Phụ kiện "${targetAcc.name}" hiện đã hết hàng trong kho quà tặng!` };
    }

    // Kiểm tra điểm của khách hàng
    const customer = this.getCustomerByPhone(params.customerPhone);
    const customerUser = this.getCustomerUser();
    const currentPoints = customer?.points ?? (customerUser?.phone === params.customerPhone ? customerUser.points ?? 0 : 0);

    if (currentPoints < pointsNeeded) {
      return {
        success: false,
        message: `Bạn đang có ${currentPoints.toLocaleString('vi-VN')} điểm, còn thiếu ${(pointsNeeded - currentPoints).toLocaleString('vi-VN')} điểm để đổi "${targetAcc.name}"!`,
      };
    }

    // Khấu trừ điểm khách hàng
    this.updateCustomerPoints(params.customerPhone, -pointsNeeded);

    // Giảm tồn kho phụ kiện quà tặng
    const updatedAccessories = accessories.map((a) =>
      a.id === targetAcc.id ? { ...a, stock: Math.max(0, a.stock - 1) } : a
    );
    setStorage('accessories', updatedAccessories);

    // Tạo phiếu nhận quà
    const gifts = this.getRedeemedGifts();
    const giftCode = `GIFT-2608-${String(gifts.length + 1).padStart(3, '0')}`;
    const newGift: RedeemedGiftItem = {
      id: 'gift-' + Date.now(),
      giftCode,
      customerId: customer?.id || 'cust-' + params.customerPhone,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      accessoryId: targetAcc.id,
      accessoryName: targetAcc.name,
      accessoryImage: targetAcc.imageUrl,
      pointsRedeemed: pointsNeeded,
      redeemedAt: new Date().toISOString(),
      status: 'active',
    };

    setStorage('redeemed_gifts', [newGift, ...gifts]);

    // Gửi email xác nhận đổi quà
    try {
      sendRewardRedeemEmail(newGift);
    } catch (e) {
      console.warn('Lỗi gửi email đổi quà:', e);
    }

    return {
      success: true,
      message: `Đổi thành công "${targetAcc.name}" (-${pointsNeeded.toLocaleString('vi-VN')} điểm). Mã nhận quà của bạn: ${giftCode}.`,
      gift: newGift,
    };
  },

  // =========================================================================
  // 3. QR CODE KHUYẾN MÃI (SETUP THỜI GIAN & ĐẾM NGƯỢC HIỆU LỰC CÒN LẠI)
  // =========================================================================
  getPromoQRCodes(): PromoQRCode[] {
    const defaultList: PromoQRCode[] = [
      {
        id: 'qr-promo-1',
        code: 'FLASH-APPLE-500K',
        title: 'Flash Sale Siêu Cấp - Giảm 500.000đ',
        description: 'Áp dụng cho mọi đơn hàng điện thoại Flagship từ 10.000.000đ khi đặt trực tiếp hoặc online.',
        discountType: 'fixed_amount',
        discountValue: 500000,
        minOrderValue: 10000000,
        startDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        endDate: new Date(Date.now() + 3600 * 1000 * 72).toISOString(), // 3 ngày nữa
        isActive: true,
        qrPayload: 'https://ishop.vn/promo/FLASH-APPLE-500K',
        bannerColor: 'from-amber-500 to-orange-600',
      },
      {
        id: 'qr-promo-2',
        code: 'TECHFEST-10',
        title: 'TechFest Phụ Kiện - Giảm 10%',
        description: 'Giảm 10% tối đa 500.000đ cho củ sạc GaN, cáp sạc dù, tai nghe và ốp lưng chính hãng.',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 300000,
        startDate: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        endDate: new Date(Date.now() + 3600 * 1000 * 120).toISOString(), // 5 ngày nữa
        isActive: true,
        qrPayload: 'https://ishop.vn/promo/TECHFEST-10',
        bannerColor: 'from-blue-600 to-indigo-700',
      },
      {
        id: 'qr-promo-3',
        code: 'ICARE-VIP-100K',
        title: 'iCare Trợ Giá Sửa Chữa - Tặng 100.000đ',
        description: 'Trợ giá trực tiếp cho dịch vụ ép kính, thay pin Pisen dung lượng chuẩn hoặc thay màn hình zin.',
        discountType: 'fixed_amount',
        discountValue: 100000,
        minOrderValue: 500000,
        startDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        endDate: new Date(Date.now() + 3600 * 1000 * 168).toISOString(), // 7 ngày nữa
        isActive: true,
        qrPayload: 'https://ishop.vn/promo/ICARE-VIP-100K',
        bannerColor: 'from-emerald-600 to-teal-700',
      },
    ];

    return getStorage<PromoQRCode[]>('promo_qr_codes', defaultList);
  },

  createPromoQRCode(data: Omit<PromoQRCode, 'id'>): PromoQRCode {
    const list = this.getPromoQRCodes();
    const newPromo: PromoQRCode = {
      ...data,
      id: 'qr-promo-' + Date.now(),
    };
    setStorage('promo_qr_codes', [newPromo, ...list]);
    return newPromo;
  },

  updatePromoQRCode(id: string, data: Partial<PromoQRCode>): void {
    const list = this.getPromoQRCodes();
    const updated = list.map((p) => (p.id === id ? { ...p, ...data } : p));
    setStorage('promo_qr_codes', updated);
  },

  deletePromoQRCode(id: string): void {
    const list = this.getPromoQRCodes();
    setStorage('promo_qr_codes', list.filter((p) => p.id !== id));
  },

  // =========================================================================
  // 3.1 CHIẾN DỊCH KHUYẾN MÃI & FLASH SALE (SETUP THỜI GIAN BẮT ĐẦU & KẾT THÚC)
  // =========================================================================
  getPromotionCampaigns(): PromotionCampaign[] {
    const defaultCampaigns: PromotionCampaign[] = [
      {
        id: 'camp-1',
        title: '⚡ Siêu Flash Sale Giờ Vàng 2026',
        description: 'Giảm giá trực tiếp lên đến 15% cho tất cả dòng máy iPhone 16 Series & phụ kiện chính hãng khi mua tại cửa hàng hoặc online.',
        badgeText: 'FLASH SALE',
        discountType: 'percentage',
        discountValue: 15,
        startDate: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        endDate: new Date(Date.now() + 3600 * 1000 * 48).toISOString(), // Còn 2 ngày
        isActive: true,
        targetCategory: 'all',
        bannerGradient: 'from-amber-500 via-orange-500 to-rose-600',
      },
      {
        id: 'camp-2',
        title: '🎧 Tuần Lễ Vàng Phụ Kiện Chính Hãng Anker & Baseus',
        description: 'Trợ giá giảm 20% cho toàn bộ củ sạc nhanh GaN 65W/100W, cáp sạc dù chống đứt và pin dự phòng MagSafe chuẩn Qi2.',
        badgeText: 'GIẢM ĐẾN 20%',
        discountType: 'percentage',
        discountValue: 20,
        startDate: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        endDate: new Date(Date.now() + 3600 * 1000 * 120).toISOString(), // Còn 5 ngày
        isActive: true,
        targetCategory: 'accessories',
        bannerGradient: 'from-emerald-500 via-teal-600 to-cyan-600',
      },
      {
        id: 'camp-3',
        title: '🏆 Lễ Hội Mua Sắm Flagship Trợ Giá Lên Đời',
        description: 'Thu cũ đổi mới trợ giá 1.000.000đ trực tiếp vào giá bán lẻ khi nâng cấp lên Galaxy S24 Ultra hoặc Xiaomi 14 Ultra.',
        badgeText: 'TẶNG 1.000.000Đ',
        discountType: 'fixed_amount',
        discountValue: 1000000,
        startDate: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // Sắp diễn ra
        endDate: new Date(Date.now() + 3600 * 1000 * 240).toISOString(),
        isActive: true,
        targetCategory: 'phones',
        bannerGradient: 'from-blue-600 via-indigo-600 to-purple-600',
      },
    ];

    return getStorage<PromotionCampaign[]>('promotion_campaigns', defaultCampaigns);
  },

  createPromotionCampaign(data: Omit<PromotionCampaign, 'id'>): PromotionCampaign {
    const list = this.getPromotionCampaigns();
    const newCamp: PromotionCampaign = {
      ...data,
      id: 'camp-' + Date.now(),
    };
    setStorage('promotion_campaigns', [newCamp, ...list]);
    return newCamp;
  },

  updatePromotionCampaign(id: string, data: Partial<PromotionCampaign>): void {
    const list = this.getPromotionCampaigns();
    const updated = list.map((c) => (c.id === id ? { ...c, ...data } : c));
    setStorage('promotion_campaigns', updated);
  },

  deletePromotionCampaign(id: string): void {
    const list = this.getPromotionCampaigns();
    setStorage('promotion_campaigns', list.filter((c) => c.id !== id));
  },

  // =========================================================================
  // 4. PHÊ DUYỆT ĐƠN HÀNG LỚN (>100.000.000 VNĐ) BỞI ADMIN
  // =========================================================================
  getPendingLargeOrders(): Invoice[] {
    const invoices = this.getInvoices();
    return invoices.filter(
      (inv) => inv.isLargeOrder && inv.status === 'pending_admin_approval'
    );
  },

  approveLargeOrder(invoiceId: string, adminName: string, note?: string): boolean {
    const invoices = this.getInvoices();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let approved = false;

    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        approved = true;
        return {
          ...inv,
          status: 'approved' as const,
          approvedBy: adminName,
          approvedAt: now,
          adminApprovalNote: note || 'Ban Giám Đốc đã phê duyệt hạn mức và xuất kho thành công.',
        };
      }
      return inv;
    });

    if (approved) {
      setStorage('invoices', updated);
    }
    return approved;
  },

  rejectLargeOrder(invoiceId: string, adminName: string, reason: string): boolean {
    const invoices = this.getInvoices();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let rejected = false;

    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        rejected = true;
        return {
          ...inv,
          status: 'rejected' as const,
          approvedBy: adminName,
          approvedAt: now,
          adminApprovalNote: `Từ chối duyệt đơn: ${reason}`,
        };
      }
      return inv;
    });

    if (rejected) {
      setStorage('invoices', updated);
    }
    return rejected;
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
