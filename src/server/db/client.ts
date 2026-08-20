import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | undefined;

export function getDatabase() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("RANG database is not configured");

  pool ??= new Pool({
    connectionString,
    max: Number(process.env["DATABASE_POOL_MAX"] ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: "rang-web",
  });
  return drizzle(pool, { schema });
}

export async function checkDatabaseConnection() {
  const db = getDatabase();
  await db.execute("select 1 as ok");
  return { ok: true as const };
}

export async function closeDatabasePool() {
  await pool?.end();
  pool = undefined;
}
