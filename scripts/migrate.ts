import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDatabase, closeDatabasePool } from "../src/server/db/client";

try {
  await migrate(getDatabase(), { migrationsFolder: "drizzle" });
  console.log("RANG database migrations applied successfully");
} finally {
  await closeDatabasePool();
}
