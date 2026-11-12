const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Tables in MySQL ===');
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log(`Found ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));

  console.log('\n=== Migrating PhoneVariants ===');
  const phones = await prisma.phoneProduct.findMany();
  let variantCount = 0;
  for (const phone of phones) {
    let colors = [];
    let caps = [];
    try { colors = JSON.parse(phone.colors || '[]'); } catch {}
    try { caps = JSON.parse(phone.capacities || '[]'); } catch {}

    if (colors.length === 0) {
      colors = [{ name: 'Mặc định', hex: '#000000' }];
    }
    if (caps.length === 0) {
      caps = [{ size: '128GB', price: 20000000 }];
    }

    for (const cap of caps) {
      for (const color of colors) {
        const existing = await prisma.phoneVariant.findFirst({
          where: {
            phoneId: phone.id,
            colorName: color.name || 'Mặc định',
            capacity: cap.size || '128GB'
          }
        });
        if (!existing) {
          await prisma.phoneVariant.create({
            data: {
              phoneId: phone.id,
              colorName: color.name || 'Mặc định',
              colorHex: color.hex || '#333333',
              imageUrl: color.imageUrl || null,
              capacity: cap.size || '128GB',
              price: Number(cap.price) || 20000000,
              originalPrice: cap.originalPrice ? Number(cap.originalPrice) : null,
              isOutOfStock: false,
            }
          });
          variantCount++;
        }
      }
    }
  }
  console.log(`Migrated ${variantCount} PhoneVariant records.`);

  console.log('\n=== Migrating InvoiceItems ===');
  const invoices = await prisma.invoice.findMany();
  let invoiceItemCount = 0;
  for (const inv of invoices) {
    let items = [];
    try { items = JSON.parse(inv.items || '[]'); } catch {}
    for (const item of items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceCode: inv.invoiceCode,
          itemType: item.type || (item.imei ? 'phone' : 'accessory'),
          productId: item.id || null,
          productName: item.name || 'Sản phẩm',
          imei: item.imei || null,
          color: item.color || (item.variant ? item.variant.split('/')[0]?.trim() : null),
          capacity: item.capacity || (item.variant ? item.variant.split('/')[1]?.trim() : null),
          unitPrice: Number(item.unitPrice || item.price) || 0,
          quantity: Number(item.quantity) || 1,
          discount: Number(item.discount) || 0,
          subtotal: Number(item.total || item.unitPrice || item.price) || 0,
          warrantyMonths: 12,
        }
      });
      invoiceItemCount++;
    }
  }
  console.log(`Migrated ${invoiceItemCount} InvoiceItem records.`);

  console.log('\n=== Migrating RepairTicketParts & RepairStatusHistory ===');
  const repairs = await prisma.repairTicket.findMany();
  let partCount = 0;
  let historyCount = 0;
  for (const rep of repairs) {
    let parts = [];
    let history = [];
    try { parts = JSON.parse(rep.partsUsed || '[]'); } catch {}
    try { history = JSON.parse(rep.statusHistory || '[]'); } catch {}

    for (const part of parts) {
      await prisma.repairTicketPart.create({
        data: {
          ticketCode: rep.ticketCode,
          sparePartId: part.partId || null,
          partName: part.partName || 'Linh kiện thay thế',
          quantity: Number(part.quantity) || 1,
          unitPrice: Number(part.unitPrice) || 0,
          warrantyMonths: 6,
        }
      });
      partCount++;
    }

    for (const h of history) {
      await prisma.repairStatusHistory.create({
        data: {
          ticketCode: rep.ticketCode,
          status: h.step || rep.status,
          statusLabel: h.label || 'Cập nhật trạng thái',
          note: h.note || null,
          updatedBy: h.actor || 'Hệ thống',
          createdAt: h.time ? new Date(h.time) : new Date(),
        }
      });
      historyCount++;
    }
  }
  console.log(`Migrated ${partCount} RepairTicketPart and ${historyCount} RepairStatusHistory records.`);

  console.log('\n=== Migrating SupplierOrderItems ===');
  const orders = await prisma.supplierOrder.findMany();
  let orderItemCount = 0;
  for (const ord of orders) {
    let imeis = [];
    try { imeis = JSON.parse(ord.importedImeis || '[]'); } catch {}
    for (const imei of imeis) {
      await prisma.supplierOrderItem.create({
        data: {
          orderCode: ord.orderCode,
          itemType: 'phone',
          productName: ord.itemsSummary || 'Điện thoại nhập kho',
          unitCost: Math.round(ord.totalAmount / (imeis.length || 1)),
          totalCost: Math.round(ord.totalAmount / (imeis.length || 1)),
          quantity: 1,
          imei: imei,
        }
      });
      orderItemCount++;
    }
  }
  console.log(`Migrated ${orderItemCount} SupplierOrderItem records.`);

  console.log('\n=== 3NF DATA MIGRATION COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
