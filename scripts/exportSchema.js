const mysql = require('mysql2/promise');
const fs = require('fs');

async function dump() {
  const conn = await mysql.createConnection('mysql://root:@127.0.0.1:3306/ishop_huyhoang');
  const [tables] = await conn.query('SHOW TABLES');

  let sql = `-- iShop Huy Hoàng - MySQL Database Schema & DDL
-- Cơ sở dữ liệu chuẩn hóa Dạng chuẩn 3 (3NF) cho WampServer
-- Ngày xuất: ${new Date().toISOString()}

CREATE DATABASE IF NOT EXISTS \`ishop_huyhoang\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`ishop_huyhoang\`;

SET FOREIGN_KEY_CHECKS = 0;

`;

  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [createRows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    sql += `-- Table structure for table \`${tableName}\`\n`;
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sql += createRows[0]['Create Table'] + ';\n\n';
  }

  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  fs.writeFileSync('database_schema.sql', sql, 'utf8');
  console.log(`Đã xuất thành công database_schema.sql gồm ${tables.length} bảng!`);
  await conn.end();
}

dump().catch(console.error);
