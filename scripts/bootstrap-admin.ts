import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDatabase, closeDatabasePool } from "../src/server/db/client";
import * as schema from "../src/server/db/schema";
import { createOpaqueToken, hashToken } from "../src/server/portal/security";

const email = process.argv[2]?.trim().toLowerCase();
const name = process.argv[3]?.trim() || "Администратор RANG";
if (!email) throw new Error("Usage: tsx scripts/bootstrap-admin.ts admin@example.ru [name]");
const db = getDatabase();
const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
const userId = existing[0]?.id || randomUUID();
const token = createOpaqueToken();
await db.transaction(async (tx) => {
  if (!existing[0])
    await tx
      .insert(schema.users)
      .values({ id: userId, kind: "employee", email, displayName: name, isActive: true });
  await tx.insert(schema.userRoles).values({ userId, roleId: "role-admin" }).onConflictDoNothing();
  await tx.insert(schema.userAccessTokens).values({
    id: randomUUID(),
    userId,
    purpose: "activation",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 2 * 3600000),
  });
});
console.log(`https://rangpro.ru/account/activate?token=${token}`);
await closeDatabasePool();
