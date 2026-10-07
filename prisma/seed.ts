import { PrismaClient } from '@prisma/client';
import {
  initialPhones,
  initialAccessories,
  initialPhoneStock,
  initialSpareParts,
  initialRepairTickets,
  initialInvoices,
  initialCashbook,
  initialSuppliers,
  initialCustomers,
} from '../src/lib/initialData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seeding) cho iShop Huy Hoàng (MySQL)...');

  // 1. Seed Users (Tài khoản nhân sự & Kỹ thuật viên)
  console.log('1. Seeding Users (Nhân sự & KTV)...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Lê Huy Hoàng',
      role: 'admin',
    },
    create: {
      id: 'admin-1',
      username: 'admin',
      password: 'password123',
      name: 'Lê Huy Hoàng',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {
      name: 'Nguyễn Thị Mai',
      role: 'cashier',
    },
    create: {
      id: 'cashier-1',
      username: 'cashier',
      password: 'password123',
      name: 'Nguyễn Thị Mai',
      role: 'cashier',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { username: 'technician' },
    update: {
      name: 'Trần Trọng Nghĩa',
      role: 'technician',
    },
    create: {
      id: 'ktv-1',
      username: 'technician',
      password: 'password123',
      name: 'Trần Trọng Nghĩa',
      role: 'technician',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { username: 'ktv_minh' },
    update: {
      name: 'Vũ Hoàng Minh',
      role: 'technician',
    },
    create: {
      id: 'ktv-2',
      username: 'ktv_minh',
      password: 'password123',
      name: 'Vũ Hoàng Minh',
      role: 'technician',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
  });

  // 2. Seed Customers (Phải nạp trước Hóa đơn và Phiếu sửa chữa để đảm bảo toàn vẹn khóa ngoại)
  console.log('2. Seeding Customers (Khách hàng)...');
  for (const cust of initialCustomers) {
    await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: {
        name: cust.name,
        email: cust.email || null,
        address: cust.address || null,
        totalSpent: cust.totalSpent,
        points: cust.points,
        purchaseCount: cust.purchaseCount,
        repairCount: cust.repairCount,
      },
      create: {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email || null,
        address: cust.address || null,
        totalSpent: cust.totalSpent,
        points: cust.points,
        purchaseCount: cust.purchaseCount,
        repairCount: cust.repairCount,
        createdAt: new Date(cust.createdAt),
      },
    });
  }

  // Khách lẻ vãng lai chuẩn cho hóa đơn bán lẻ trực tiếp tại quầy POS
  await prisma.customer.upsert({
    where: { phone: '0944332211' },
    update: {},
    create: {
      id: 'cust-walkin',
      name: 'Khách lẻ vãng lai',
      phone: '0944332211',
      totalSpent: 1540000,
      points: 15,
      purchaseCount: 1,
      repairCount: 0,
      createdAt: new Date('2026-08-25'),
    },
  });

  // 3. Seed Suppliers (Nhà cung cấp - Khóa ngoại cho PhoneStock & Đơn nhập)
  console.log('3. Seeding Suppliers (Nhà cung cấp)...');
  for (const sup of initialSuppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: {
        name: sup.name,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        contactPerson: sup.contactPerson,
        totalPurchased: sup.totalPurchased,
        currentDebt: sup.currentDebt,
      },
      create: {
        id: sup.id,
        name: sup.name,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        contactPerson: sup.contactPerson,
        totalPurchased: sup.totalPurchased,
        currentDebt: sup.currentDebt,
      },
    });
  }

  // 4. Seed Phone Products (Danh mục điện thoại master)
  console.log('4. Seeding Phone Products...');
  for (const phone of initialPhones) {
    await prisma.phoneProduct.upsert({
      where: { id: phone.id },
      update: {
        name: phone.name,
        slug: phone.slug,
        brand: phone.brand,
        description: phone.description,
        rating: phone.rating,
        reviewCount: phone.reviewCount,
        isHot: phone.isHot || false,
        isNew: phone.isNew || false,
        colors: JSON.stringify(phone.colors),
        capacities: JSON.stringify(phone.capacities),
        specs: JSON.stringify(phone.specs),
        warrantyInfo: phone.warrantyInfo,
      },
      create: {
        id: phone.id,
        name: phone.name,
        slug: phone.slug,
        brand: phone.brand,
        description: phone.description,
        rating: phone.rating,
        reviewCount: phone.reviewCount,
        isHot: phone.isHot || false,
        isNew: phone.isNew || false,
        colors: JSON.stringify(phone.colors),
        capacities: JSON.stringify(phone.capacities),
        specs: JSON.stringify(phone.specs),
        warrantyInfo: phone.warrantyInfo,
      },
    });
  }

  // 5. Seed Accessories (Phụ kiện điện thoại)
  console.log('5. Seeding Accessories...');
  for (const acc of initialAccessories) {
    await prisma.accessoryProduct.upsert({
      where: { id: acc.id },
      update: {
        name: acc.name,
        slug: acc.slug,
        category: acc.category,
        categoryName: acc.categoryName,
        barcode: acc.barcode,
        brand: acc.brand,
        costPrice: acc.costPrice,
        sellingPrice: acc.sellingPrice,
        originalPrice: acc.originalPrice,
        stock: acc.stock,
        minStockAlert: acc.minStockAlert,
        imageUrl: acc.imageUrl,
        description: acc.description,
        specs: acc.specs,
        compatibleWith: acc.compatibleWith,
        discountWhenBoughtWithPhone: acc.discountWhenBoughtWithPhone,
      },
      create: {
        id: acc.id,
        name: acc.name,
        slug: acc.slug,
        category: acc.category,
        categoryName: acc.categoryName,
        barcode: acc.barcode,
        brand: acc.brand,
        costPrice: acc.costPrice,
        sellingPrice: acc.sellingPrice,
        originalPrice: acc.originalPrice,
        stock: acc.stock,
        minStockAlert: acc.minStockAlert,
        imageUrl: acc.imageUrl,
        description: acc.description,
        specs: acc.specs,
        compatibleWith: acc.compatibleWith,
        discountWhenBoughtWithPhone: acc.discountWhenBoughtWithPhone,
      },
    });
  }

  // 6. Seed Spare Parts (Linh kiện sửa chữa)
  console.log('6. Seeding Spare Parts...');
  for (const part of initialSpareParts) {
    await prisma.sparePart.upsert({
      where: { id: part.id },
      update: {
        name: part.name,
        category: part.category,
        categoryName: part.categoryName,
        barcode: part.barcode,
        compatibleModels: JSON.stringify(part.compatibleModels),
        costPrice: part.costPrice,
        retailRepairPrice: part.retailRepairPrice,
        stock: part.stock,
        unit: part.unit,
        warrantyMonths: part.warrantyMonths,
      },
      create: {
        id: part.id,
        name: part.name,
        category: part.category,
        categoryName: part.categoryName,
        barcode: part.barcode,
        compatibleModels: JSON.stringify(part.compatibleModels),
        costPrice: part.costPrice,
        retailRepairPrice: part.retailRepairPrice,
        stock: part.stock,
        unit: part.unit,
        warrantyMonths: part.warrantyMonths,
      },
    });
  }

  // 7. Seed Invoices (Nạp trước PhoneStock để PhoneStock liên kết soldInvoiceId)
  console.log('7. Seeding Invoices (Hóa đơn bán hàng)...');
  for (const inv of initialInvoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {
        invoiceCode: inv.invoiceCode,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        items: JSON.stringify(inv.items),
        subtotal: inv.subtotal,
        discount: inv.discount,
        totalAmount: inv.totalAmount,
        paymentMethod: inv.paymentMethod,
        cashReceived: inv.cashReceived || null,
        cashChange: inv.cashChange || null,
        cashierName: inv.cashierName,
        createdAt: new Date(inv.createdAt),
        warrantyNote: inv.warrantyNote,
      },
      create: {
        id: inv.id,
        invoiceCode: inv.invoiceCode,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        items: JSON.stringify(inv.items),
        subtotal: inv.subtotal,
        discount: inv.discount,
        totalAmount: inv.totalAmount,
        paymentMethod: inv.paymentMethod,
        cashReceived: inv.cashReceived || null,
        cashChange: inv.cashChange || null,
        cashierName: inv.cashierName,
        createdAt: new Date(inv.createdAt),
        warrantyNote: inv.warrantyNote,
      },
    });
  }

  // 8. Seed Phone Stock (Kho IMEI có ràng buộc khóa ngoại tới PhoneProduct, Supplier và Invoice)
  console.log('8. Seeding Phone Stock (Kho IMEI)...');
  for (const item of initialPhoneStock) {
    await prisma.phoneStock.upsert({
      where: { imei: item.imei },
      update: {
        phoneId: item.phoneId,
        phoneName: item.phoneName,
        color: item.color,
        capacity: item.capacity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        importDate: item.importDate,
        status: item.status,
        warrantyMonths: item.warrantyMonths,
        soldAt: item.soldAt || null,
        soldToCustomerName: item.soldToCustomerName || null,
        soldToCustomerPhone: item.soldToCustomerPhone || null,
        soldInvoiceId: item.soldInvoiceId || null,
      },
      create: {
        imei: item.imei,
        phoneId: item.phoneId,
        phoneName: item.phoneName,
        color: item.color,
        capacity: item.capacity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        importDate: item.importDate,
        status: item.status,
        warrantyMonths: item.warrantyMonths,
        soldAt: item.soldAt || null,
        soldToCustomerName: item.soldToCustomerName || null,
        soldToCustomerPhone: item.soldToCustomerPhone || null,
        soldInvoiceId: item.soldInvoiceId || null,
      },
    });
  }

  // 9. Seed Repair Tickets (Phiếu sửa chữa liên kết với Customer và Technician User)
  console.log('9. Seeding Repair Tickets (Phiếu sửa chữa)...');
  for (const ticket of initialRepairTickets) {
    await prisma.repairTicket.upsert({
      where: { id: ticket.id },
      update: {
        ticketCode: ticket.ticketCode,
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone,
        customerAddress: ticket.customerAddress || null,
        deviceModel: ticket.deviceModel,
        imeiOrSerial: ticket.imeiOrSerial,
        unlockPasscode: ticket.unlockPasscode,
        appearanceCondition: ticket.appearanceCondition,
        accessoriesIncluded: ticket.accessoriesIncluded,
        issueDescription: ticket.issueDescription,
        technicianNotes: ticket.technicianNotes || null,
        status: ticket.status,
        statusHistory: JSON.stringify(ticket.statusHistory),
        partsUsed: JSON.stringify(ticket.partsUsed),
        laborFee: ticket.laborFee,
        totalAmount: ticket.totalAmount,
        estimatedDeliveryDate: ticket.estimatedDeliveryDate,
        receivedAt: ticket.receivedAt,
        deliveredAt: ticket.deliveredAt || null,
        technicianId: ticket.technicianId || null,
        technicianName: ticket.technicianName || null,
        warrantyPeriod: ticket.warrantyPeriod,
      },
      create: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone,
        customerAddress: ticket.customerAddress || null,
        deviceModel: ticket.deviceModel,
        imeiOrSerial: ticket.imeiOrSerial,
        unlockPasscode: ticket.unlockPasscode,
        appearanceCondition: ticket.appearanceCondition,
        accessoriesIncluded: ticket.accessoriesIncluded,
        issueDescription: ticket.issueDescription,
        technicianNotes: ticket.technicianNotes || null,
        status: ticket.status,
        statusHistory: JSON.stringify(ticket.statusHistory),
        partsUsed: JSON.stringify(ticket.partsUsed),
        laborFee: ticket.laborFee,
        totalAmount: ticket.totalAmount,
        estimatedDeliveryDate: ticket.estimatedDeliveryDate,
        receivedAt: ticket.receivedAt,
        deliveredAt: ticket.deliveredAt || null,
        technicianId: ticket.technicianId || null,
        technicianName: ticket.technicianName || null,
        warrantyPeriod: ticket.warrantyPeriod,
      },
    });
  }

  // 10. Seed Cashbook Entries (Sổ quỹ Thu / Chi)
  console.log('10. Seeding Cashbook Entries (Sổ quỹ)...');
  for (const entry of initialCashbook) {
    await prisma.cashbookEntry.upsert({
      where: { id: entry.id },
      update: {
        code: entry.code,
        date: entry.date,
        type: entry.type,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        amount: entry.amount,
        paymentMethod: entry.paymentMethod,
        referenceCode: entry.referenceCode || null,
        description: entry.description,
        creator: entry.creator,
      },
      create: {
        id: entry.id,
        code: entry.code,
        date: entry.date,
        type: entry.type,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        amount: entry.amount,
        paymentMethod: entry.paymentMethod,
        referenceCode: entry.referenceCode || null,
        description: entry.description,
        creator: entry.creator,
      },
    });
  }

  // 11. Seed Store Setting (Cấu hình hệ thống cửa hàng & VietQR mặc định)
  console.log('11. Seeding Store Settings...');
  await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'iShop Huy Hoàng - Chuỗi Bán Lẻ & Bảo Hành Công Nghệ',
      hotline: '0909.123.456',
      address: '45 Lê Văn Việt, TP. Thủ Đức & 128 Nguyễn Trãi, Quận 1, TP.HCM',
      email: 'contact@ishophuyhoang.vn',
      bankId: 'MB',
      bankAccountNo: '0988888999',
      bankAccountName: 'NGUYEN HUY HOANG',
      defaultWarrantyNote: 'Bảo hành điện tử chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
    },
  });

  console.log('✅ Hoàn tất nạp dữ liệu mẫu với các ràng buộc quan hệ toàn vẹn!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
