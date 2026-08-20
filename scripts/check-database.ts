import { checkDatabaseConnection, closeDatabasePool } from "../src/server/db/client";

try {
  console.log(await checkDatabaseConnection());
} finally {
  await closeDatabasePool();
}
