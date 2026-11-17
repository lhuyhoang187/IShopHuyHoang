import mysql from 'mysql2/promise';

// Global singleton pool for Next.js hot reload in development
const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function getPoolConfig(): mysql.PoolOptions {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/ishop_huyhoang';
  try {
    const u = new URL(dbUrl);
    return {
      host: u.hostname || '127.0.0.1',
      port: u.port ? parseInt(u.port, 10) : 3306,
      user: decodeURIComponent(u.username) || 'root',
      password: decodeURIComponent(u.password) || '',
      database: u.pathname ? u.pathname.replace(/^\//, '') : 'ishop_huyhoang',
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true, // Returns date as 'YYYY-MM-DD HH:mm:ss' string without UTC distortion
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'ishop_huyhoang',
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      dateStrings: true,
    };
  }
}

export const pool = globalForDb.mysqlPool ?? mysql.createPool(getPoolConfig());

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = pool;
}

/**
 * Execute a SELECT query and return rows array
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/**
 * Execute a SELECT query and return the first row, or null if empty
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query and return affectedRows / insertId
 */
export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ affectedRows: number; insertId: number }> {
  const [result] = await pool.execute(sql, params);
  const r = result as mysql.ResultSetHeader;
  return {
    affectedRows: r.affectedRows || 0,
    insertId: r.insertId || 0,
  };
}

/**
 * Run operations inside a managed SQL transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Generate unique IDs for entities
 */
export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`;
}

export const db = {
  query,
  queryOne,
  execute,
  transaction,
  generateId,
  pool,
};

export default db;
