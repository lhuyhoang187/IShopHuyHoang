const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection('mysql://root:@127.0.0.1:3306/ishop_huyhoang');

  const [tables] = await conn.query('SHOW TABLE STATUS');
  const [fks] = await conn.query(`
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, COLUMN_NAME
  `);

  console.log(`=== ISHOP HUY HOANG - 3NF MYSQL AUDIT (${tables.length} TABLES, ${fks.length} FOREIGN KEYS) ===`);
  for (const t of tables) {
    const [[cnt]] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t.Name}\``);
    console.log(`${t.Name.padEnd(26)} | Engine: ${(t.Engine || '').padEnd(6)} | Rows: ${cnt.cnt}`);
  }
  console.log('===================================================================');

  await conn.end();
}

main().catch(console.error);
