import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { seedPublicCatalog } from "../db/public-catalog-seed";
import { CatalogRepository, type RangDatabase } from "./catalog.repository";
import { catalogFilterSchema, slugInputSchema } from "./contracts";

const client = new PGlite();
const db = drizzle(client, { schema }) as unknown as RangDatabase;

beforeAll(async () => {
  const migration = await readFile(resolve("drizzle/0000_narrow_bulldozer.sql"), "utf8");
  await client.exec(migration.replaceAll("--> statement-breakpoint", ""));
  await seedPublicCatalog(db);
});

afterAll(async () => client.close());

describe("RANG database migration and catalog layer", () => {
  const repository = new CatalogRepository(db);

  it("applies the initial migration and seeds every current public premise", async () => {
    const properties = await repository.listProperties({ offerType: "rent" });
    expect(properties).toHaveLength(7);
    expect(properties.find((property) => property.id === "property-001")).toMatchObject({
      slug: "sklad-8-ak-153a",
      areaSqm: 133,
      rentPricePerSqm: 1260,
      purposes: ["Комплектация", "Отгрузка", "Хранение"],
    });
  });

  it("returns one property, objects and services through repository boundaries", async () => {
    expect((await repository.getPropertyBySlug("sklad-8-ak-153a"))?.characteristics).toHaveLength(
      10,
    );
    expect(await repository.listObjects()).toHaveLength(4);
    expect(await repository.listServices()).toHaveLength(8);
    expect((await repository.getObjectBySlug("adelya-kutuya-153a"))?.parking).toContain("Парковка");
  });

  it("filters on normalized relations and numeric area", async () => {
    const properties = await repository.listProperties({
      offerType: "rent",
      type: "Склад",
      areaFrom: 140,
    });
    expect(properties.map((property) => property.id)).toEqual(["property-005"]);
  });

  it("rejects malformed server input", () => {
    expect(() => slugInputSchema.parse({ slug: "../../etc/passwd" })).toThrow();
    expect(() => catalogFilterSchema.parse({ areaFrom: 200, areaTo: 100 })).toThrow();
  });
});
