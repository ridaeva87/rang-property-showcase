import { getDatabase, closeDatabasePool } from "../src/server/db/client";
import { seedPublicCatalog, publicCatalogSeedCounts } from "../src/server/db/public-catalog-seed";

try {
  await seedPublicCatalog(getDatabase());
  console.log("Public catalog seed completed", publicCatalogSeedCounts);
} finally {
  await closeDatabasePool();
}
