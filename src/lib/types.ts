export type Role = 'admin' | 'technician' | 'cashier' | 'pending';

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  email?: string;
  bio?: string;
  department?: string;
  birthday?: string;
  address?: string;
  createdAt?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points?: number;
  address?: string;
  birthday?: string;
  city?: string;
  gender?: string;
  membershipTier?: string;
  avatar?: string;
  password?: string;
  createdAt?: string;
}

export interface PhoneSpec {
  screen: string;
  chip: string;
  ram: string;
  storage: string;
  rearCamera: string;
  frontCamera: string;
  battery: string;
  charging: string;
  os: string;
  sim: string;
  waterResistant: string;
  weight: string;
}

export interface PhoneColor {
  id: string;
  name: string;
  hex: string;
  imageUrl: string;
}

export interface PhoneCapacity {
  size: string; // '128GB' | '256GB' | '512GB' | '1TB'
  price: number;
  originalPrice: number;
}

export interface PhoneProduct {
  id: string;
  name: string;
  slug: string;
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'OPPO';
  description: string;
  rating: number;
  reviewCount: number;
  isHot?: boolean;
  isNew?: boolean;
  colors: PhoneColor[];
  capacities: PhoneCapacity[];
  specs: PhoneSpec;
  warrantyInfo: string;
}

export interface PhoneStockItem {
  imei: string;
  phoneId: string;
  phoneName: string;
  color: string;
  capacity: string;
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  importDate: string;
  status: 'in_stock' | 'sold' | 'reserved';
  warrantyMonths: number;
  soldAt?: string;
  soldToCustomerName?: string;
  soldToCustomerPhone?: string;
  soldInvoiceId?: string;
  rewardPoints?: number;
}

export interface AccessoryProduct {
  id: string;
  name: string;
  slug: string;
  category: 'charger' | 'cable' | 'powerbank' | 'case' | 'screen_protector' | 'audio' | 'other';
  categoryName: string;
  barcode: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  originalPrice: number;
  stock: number;
  minStockAlert: number;
  imageUrl: string;
  description: string;
  specs: string;
  compatibleWith: string;
  discountWhenBoughtWithPhone: number; // e.g. 15 for 15% off
  rewardPoints?: number;
  pointsToRedeem?: number; // Số điểm thưởng cần thiết để đổi phụ kiện này (VD: 390 pts)
}

export interface SparePartItem {
  id: string;
  name: string;
  category: 'screen' | 'battery' | 'camera' | 'back_glass' | 'charge_port' | 'motherboard' | 'other';
  categoryName: string;
  barcode: string;
  compatibleModels: string[];
  costPrice: number;
  retailRepairPrice: number;
  stock: number;
  unit: string; // 'cái', 'bộ'
  warrantyMonths: number;
}

export type RepairStatus =
  | 'received'         // Tiếp nhận
  | 'inspecting'       // Kiểm tra & Báo giá
  | 'repairing'        // Đang sửa chữa
  | 'qc_checking'      // Kiểm tra chất lượng QC
  | 'ready_for_pickup' // Sẵn sàng bàn giao
  | 'delivered'        // Đã bàn giao
  | 'cancelled';       // Hủy sửa

export interface RepairStepHistory {
  step: RepairStatus;
  label: string;
  time: string;
  note?: string;
  actor: string;
}

export interface RepairPartUsed {
  partId: string;
  partName: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
}

export interface RepairTicket {
  id: string;
  ticketCode: string; // e.g. SC-2608-001
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deviceModel: string;
  imeiOrSerial: string;
  unlockPasscode: string;
  appearanceCondition: string; // Móp viền, xước kính...
  accessoriesIncluded: string; // SIM, thẻ nhớ, ốp...
  issueDescription: string;
  technicianNotes?: string;
  status: RepairStatus;
  statusHistory: RepairStepHistory[];
  partsUsed: RepairPartUsed[];
  laborFee: number;
  totalAmount: number;
  estimatedDeliveryDate: string;
  receivedAt: string;
  deliveredAt?: string;
  technicianId?: string;
  technicianName?: string;
  warrantyPeriod: string;
}

export interface InvoiceItem {
  type: 'phone' | 'accessory' | 'repair';
  id: string;
  name: string;
  variant?: string; // Color/Capacity
  imei?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
  rewardPoints?: number;
}

export interface Invoice {
  id: string;
  invoiceCode: string; // e.g. HD-2608-001
  customerName: string;
  customerPhone: string;
  customerTier?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  pointsEarned?: number;
  paymentMethod: 'cash' | 'vietqr' | 'card';
  cashReceived?: number;
  cashChange?: number;
  cashierName: string;
  createdAt: string;
  warrantyNote: string;
  // Trạng thái đơn hàng & Phê duyệt đơn hàng lớn (>100 triệu)
  status?: 'completed' | 'pending_admin_approval' | 'approved' | 'rejected';
  isLargeOrder?: boolean; // Đơn hàng > 100.000.000 VNĐ hoặc số lượng lớn
  adminApprovalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  // Đặt trước (Pre-order) & Đặt cọc % giá trị
  isPreOrder?: boolean;
  depositPercent?: number; // Ví dụ 10% hoặc 20%
  depositAmount?: number; // Số tiền cọc đã trả
  remainingBalance?: number; // Số tiền còn lại thanh toán khi nhận máy
  estimatedDeliveryDate?: string;
  customerEmail?: string;
}

export interface SupplierOrder {
  id: string;
  orderCode: string; // e.g. NH-2608-001
  supplierId: string;
  supplierName: string;
  date: string;
  type: 'phones' | 'accessories_parts';
  itemsSummary: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'completed' | 'partial';
  notes: string;
  importedImeis?: string[];
}

export interface CashbookEntry {
  id: string;
  code: string;
  date: string;
  type: 'receipt' | 'payment'; // Thu hoặc Chi
  category: 'sale_phone' | 'sale_accessory' | 'repair_service' | 'supplier_restock' | 'rent_utilities' | 'salary' | 'other';
  categoryLabel: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  referenceCode?: string; // Mã HD hoặc Phiếu sửa hoặc Phiếu nhập
  description: string;
  creator: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  points: number;
  createdAt: string;
  purchaseCount: number;
  repairCount: number;
  customerType?: string; // 'Khách lẻ' | 'Khách thợ' | 'Khách buôn' | 'Doanh nghiệp'
  membershipTier?: string; // 'Thẻ Bạch Kim' | 'Thẻ Vàng' | 'Thẻ Bạc' | 'Thẻ Đồng' | 'Thành viên mới'
  taxCode?: string;
  birthday?: string;
  city?: string;
  avatar?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  totalPurchased: number;
  currentDebt: number;
}

export interface CartItem {
  id: string; // Unique cart item key
  productId: string;
  type: 'phone' | 'accessory';
  name: string;
  slug: string;
  imageUrl: string;
  color?: string;
  capacity?: string;
  price: number;
  originalPrice: number;
  quantity: number;
  isComboDiscount?: boolean;
  isPreOrder?: boolean;
  depositPercent?: number; // Tỷ lệ cọc (10%, 20%, 100%)
  depositAmount?: number; // Số tiền cọc cần thanh toán trước
}

export interface PermissionItem {
  id: string;
  module: string;
  category: 'bán hàng' | 'kỹ thuật' | 'kho & mua hàng' | 'kế toán & báo cáo' | 'hệ thống';
  description?: string;
  admin: boolean;
  tech: boolean;
  cashier: boolean;
}

// 1. Mã QR Khuyến Mãi có thời gian bắt đầu, kết thúc & đếm ngược hiệu lực
export interface PromoQRCode {
  id: string;
  code: string; // VD: FLASH-APPLE-500K, TECHFEST-10
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number; // 10 (%) hoặc 500.000 (VND)
  minOrderValue: number; // Đơn tối thiểu áp dụng
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
  qrPayload: string; // Dữ liệu mã hóa trong QR
  bannerColor?: string;
}

// 1.1 Chiến Dịch Khuyến Mãi & Flash Sale Cửa Hàng
export interface PromotionCampaign {
  id: string;
  title: string;
  description: string;
  badgeText?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number; // 15 (%) hoặc 1.000.000 (VND)
  startDate: string; // ISO string
  endDate: string; // ISO string
  isActive: boolean;
  targetCategory: 'all' | 'phones' | 'accessories' | 'repairs';
  bannerGradient?: string;
}


// 2. Hệ Thống Thông Báo Email Khách Hàng (Tất cả dịch vụ)
export interface EmailNotification {
  id: string;
  toEmail: string;
  customerName: string;
  customerPhone?: string;
  subject: string;
  type:
    | 'deposit_invoice'        // Hóa đơn đặt cọc Pre-order
    | 'purchase_invoice'       // Hóa đơn mua hàng điện tử
    | 'repair_receipt'         // Hóa đơn/biên nhận sửa chữa iCare
    | 'repair_status_update'   // Cập nhật tiến độ sửa chữa máy
    | 'reward_redeem';         // Thông báo đổi phụ kiện từ điểm thưởng
  title: string;
  contentSummary: string;
  htmlContent: string;
  sentAt: string;
  referenceCode: string; // Mã HD-xxx hoặc SC-xxx
  isRead?: boolean;
}

// 3. Quản Lý Mã Sản Phẩm / Thiết Bị Vòng Đời Thống Nhất (Chung mã IMEI khi mua và khi sửa)
export interface RegisteredDevice {
  id: string;
  imei: string; // Mã IMEI/Serial thống nhất xuyên suốt (mua & sửa)
  productName: string;
  phoneId?: string;
  color?: string;
  capacity?: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  purchaseInvoiceCode: string; // Mã hóa đơn mua
  purchaseDate: string;
  warrantyExpiryDate: string;
  purchasePrice: number;
  repairHistoryCodes: string[]; // Danh sách mã phiếu SC-xxx đã sửa chữa chiếc máy này
}

// 4. Danh Sách Quà / Phụ Kiện Đã Đổi Bằng Điểm Thưởng
export interface RedeemedGiftItem {
  id: string;
  giftCode: string; // VD: GIFT-2608-001
  customerId: string;
  customerPhone: string;
  customerName: string;
  accessoryId: string;
  accessoryName: string;
  accessoryImage: string;
  pointsRedeemed: number; // Số điểm đã trừ
  redeemedAt: string;
  status: 'active' | 'used' | 'delivered';
}

