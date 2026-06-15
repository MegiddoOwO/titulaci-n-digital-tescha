import mysql from "mysql2/promise";
import { env } from "./env";

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      waitForConnections: true,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  return getPool().getConnection();
}

export async function transaction<T>(fn: (query: (sql: string, params?: unknown[]) => Promise<unknown>) => Promise<T>): Promise<T> {
  const conn = await getConnection();
  await conn.beginTransaction();
  try {
    const queryOnConn = async (sql: string, params?: unknown[]): Promise<unknown> => {
      const [rows] = await conn.execute(sql, params);
      return rows;
    };
    const result = await fn(queryOnConn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
