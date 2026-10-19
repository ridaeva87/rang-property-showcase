import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { requestIdempotencyDigest } from "./intake.server";

describe("atomic request idempotency", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE TABLE requests (id text PRIMARY KEY, subject text NOT NULL);
      CREATE TABLE request_events (id text PRIMARY KEY, request_id text NOT NULL);
      CREATE TABLE analytics_events (id text PRIMARY KEY, request_id text NOT NULL);
    `);
    const migration = await readFile(new URL("../../../drizzle/0019_request_idempotency.sql", import.meta.url), "utf8");
    await db.exec(migration);
  });

  afterEach(async () => db.close());

  async function submit(scope: string, rawKey: string, subject = "Одинаковый текст") {
    const idempotencyKey = requestIdempotencyDigest(scope, rawKey);
    const id = randomUUID();
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO requests (id, subject, idempotency_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [id, subject, idempotencyKey],
    );
    if (inserted.rows[0]) {
      await db.query("INSERT INTO request_events (id, request_id) VALUES ($1, $2)", [randomUUID(), id]);
      await db.query("INSERT INTO analytics_events (id, request_id) VALUES ($1, $2)", [randomUUID(), id]);
      return { id, created: true };
    }
    const existing = await db.query<{ id: string }>("SELECT id FROM requests WHERE idempotency_key = $1", [idempotencyKey]);
    return { id: existing.rows[0]!.id, created: false };
  }

  async function count(table: "requests" | "request_events" | "analytics_events") {
    const result = await db.query<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`);
    return result.rows[0]!.count;
  }

  it("creates one request, history event and analytics event for parallel retries", async () => {
    const key = randomUUID();
    const results = await Promise.all(Array.from({ length: 8 }, () => submit("public:contact:service", key)));
    expect(new Set(results.map((result) => result.id))).toHaveLength(1);
    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(await count("requests")).toBe(1);
    expect(await count("request_events")).toBe(1);
    expect(await count("analytics_events")).toBe(1);

    const retry = await submit("public:contact:service", key);
    expect(retry).toEqual({ id: results[0]!.id, created: false });
    expect(await count("request_events")).toBe(1);
    expect(await count("analytics_events")).toBe(1);
  });

  it("allows two intentional requests with identical content and different keys", async () => {
    const first = await submit("public:contact:service", randomUUID());
    const second = await submit("public:contact:service", randomUUID());
    expect(first.id).not.toBe(second.id);
    expect(await count("requests")).toBe(2);
  });

  it("namespaces the same raw key by authenticated requester", async () => {
    const key = randomUUID();
    const tenantA = await submit("user:tenant-a:portal-request", key);
    const tenantB = await submit("user:tenant-b:portal-request", key);
    expect(tenantA.id).not.toBe(tenantB.id);
    expect(await count("requests")).toBe(2);
  });
});
