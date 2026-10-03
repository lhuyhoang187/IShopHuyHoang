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
  console.log('🌱 Starting database seeding for iShop Huy Hoàng (MySQL)...');

  // 1. Seed Users
  console.log('Seeding Users...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password123',
      name: 'Lê Huy Hoàng',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      password: 'password123',
      name: 'Nguyễn Thị Mai',
      role: 'cashier',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
  });

  await prisma.user.upsert({
    where: { username: 'technician' },
    update: {},
    create: {
      username: 'technician',
      password: 'password123',
      name: 'Trần Trọng Nghĩa',
      role: 'technician',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
  });

  // 2. Seed Phone Products
  console.log('Seeding Phone Products...');
  for (const phone of initialPhones) {
    await prisma.phoneProduct.upsert({
      where: { id: phone.id },
      update: {},
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

  // 3. Seed Phone Stock (IMEIs)
  console.log('Seeding Phone Stock...');
  for (const item of initialPhoneStock) {
    await prisma.phoneStock.upsert({
      where: { imei: item.imei },
      update: {},
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
        soldAt: item.soldAt,
        soldToCustomerName: item.soldToCustomerName,
        soldToCustomerPhone: item.soldToCustomerPhone,
        soldInvoiceId: item.soldInvoiceId,
      },
    });
  }

  // 4. Seed Accessories
  console.log('Seeding Accessories...');
  for (const acc of initialAccessories) {
    await prisma.accessoryProduct.upsert({
      where: { id: acc.id },
      update: {},
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

  // 5. Seed Spare Parts
  console.log('Seeding Spare Parts...');
  for (const part of initialSpareParts) {
    await prisma.sparePart.upsert({
      where: { id: part.id },
      update: {},
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

  // 6. Seed Repair Tickets
  console.log('Seeding Repair Tickets...');
  for (const ticket of initialRepairTickets) {
    await prisma.repairTicket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone,
        customerAddress: ticket.customerAddress,
        deviceModel: ticket.deviceModel,
        imeiOrSerial: ticket.imeiOrSerial,
        unlockPasscode: ticket.unlockPasscode,
        appearanceCondition: ticket.appearanceCondition,
        accessoriesIncluded: ticket.accessoriesIncluded,
        issueDescription: ticket.issueDescription,
        technicianNotes: ticket.technicianNotes,
        status: ticket.status,
        statusHistory: JSON.stringify(ticket.statusHistory),
        partsUsed: JSON.stringify(ticket.partsUsed),
        laborFee: ticket.laborFee,
        totalAmount: ticket.totalAmount,
        estimatedDeliveryDate: ticket.estimatedDeliveryDate,
        receivedAt: ticket.receivedAt,
        deliveredAt: ticket.deliveredAt,
        technicianId: ticket.technicianId,
        technicianName: ticket.technicianName,
        warrantyPeriod: ticket.warrantyPeriod,
      },
    });
  }

  // 7. Seed Invoices
  console.log('Seeding Invoices...');
  for (const inv of initialInvoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
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
        cashReceived: inv.cashReceived,
        cashChange: inv.cashChange,
        cashierName: inv.cashierName,
        createdAt: inv.createdAt,
        warrantyNote: inv.warrantyNote,
      },
    });
  }

  // 8. Seed Cashbook Entries
  console.log('Seeding Cashbook Entries...');
  for (const entry of initialCashbook) {
    await prisma.cashbookEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        code: entry.code,
        date: entry.date,
        type: entry.type,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        amount: entry.amount,
        paymentMethod: entry.paymentMethod,
        referenceCode: entry.referenceCode,
        description: entry.description,
        creator: entry.creator,
      },
    });
  }

  // 9. Seed Suppliers
  console.log('Seeding Suppliers...');
  for (const sup of initialSuppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.id },
      update: {},
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

  // 10. Seed Customers
  console.log('Seeding Customers...');
  for (const cust of initialCustomers) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: {},
      create: {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        totalSpent: cust.totalSpent,
        points: cust.points,
        purchaseCount: cust.purchaseCount,
        repairCount: cust.repairCount,
        createdAt: cust.createdAt,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
