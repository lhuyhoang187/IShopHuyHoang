const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    users,
    customers,
    suppliers,
    brands,
    phones,
    variants,
    stock,
    accCats,
    accessories,
    partCats,
    parts,
    repServices,
    repairs,
    repairParts,
    repairHistory,
    invoices,
    invoiceItems,
    cashbook,
    orders,
    orderItems,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.phoneBrand.count(),
    prisma.phoneProduct.count(),
    prisma.phoneVariant.count(),
    prisma.phoneStock.count(),
    prisma.accessoryCategory.count(),
    prisma.accessoryProduct.count(),
    prisma.sparePartCategory.count(),
    prisma.sparePart.count(),
    prisma.repairService.count(),
    prisma.repairTicket.count(),
    prisma.repairTicketPart.count(),
    prisma.repairStatusHistory.count(),
    prisma.invoice.count(),
    prisma.invoiceItem.count(),
    prisma.cashbookEntry.count(),
    prisma.supplierOrder.count(),
    prisma.supplierOrderItem.count(),
  ]);

  console.log('=== REAL DATA COUNTS IN MYSQL ===');
  console.log('Users:', users);
  console.log('Customers:', customers);
  console.log('Suppliers:', suppliers);
  console.log('Phone Brands:', brands);
  console.log('Phone Products:', phones);
  console.log('Phone Variants (3NF):', variants);
  console.log('Phone Stock IMEIs:', stock);
  console.log('Accessory Categories:', accCats);
  console.log('Accessory Products:', accessories);
  console.log('Spare Part Categories:', partCats);
  console.log('Spare Parts:', parts);
  console.log('Repair Services:', repServices);
  console.log('Repair Tickets:', repairs);
  console.log('Repair Ticket Parts (3NF):', repairParts);
  console.log('Repair Status History (3NF):', repairHistory);
  console.log('Invoices:', invoices);
  console.log('Invoice Items (3NF):', invoiceItems);
  console.log('Cashbook Entries:', cashbook);
  console.log('Supplier Restock Orders:', orders);
  console.log('Supplier Order Items (3NF):', orderItems);
}

main().catch(console.error).finally(() => prisma.$disconnect());

