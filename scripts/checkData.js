const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection('mysql://root:@127.0.0.1:3306/ishop_huyhoang');

  async function getCount(table) {
    try {
      const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      return rows[0].cnt;
    } catch {
      return 0;
    }
  }

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
    getCount('user'),
    getCount('customer'),
    getCount('supplier'),
    getCount('phonebrand'),
    getCount('phoneproduct'),
    getCount('phonevariant'),
    getCount('phonestock'),
    getCount('accessorycategory'),
    getCount('accessoryproduct'),
    getCount('sparepartcategory'),
    getCount('sparepart'),
    getCount('repairservice'),
    getCount('repairticket'),
    getCount('repairticketpart'),
    getCount('repairstatushistory'),
    getCount('invoice'),
    getCount('invoiceitem'),
    getCount('cashbookentry'),
    getCount('supplierorder'),
    getCount('supplierorderitem'),
  ]);

  console.log('=== REAL DATA COUNTS IN MYSQL (via mysql2) ===');
  console.log('Users:', users);
  console.log('Customers:', customers);
  console.log('Suppliers:', suppliers);
  console.log('Phone Brands:', brands);
  console.log('Phone Products:', phones);
  console.log('Phone Variants (3NF):', variants);
  console.log('Phone Stock Units (IMEI):', stock);
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
  console.log('Supplier Orders:', orders);
  console.log('Supplier Order Items (3NF):', orderItems);
  console.log('==============================================');

  await conn.end();
}

main().catch(console.error);
