import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PROPERTIES } from "../../data/rang";
import * as schema from "../db/schema";
import { seedPublicCatalog } from "../db/public-catalog-seed";
import { DEMO_PREMISE_IDS, EXCEL_PREMISE_IDENTITIES } from "../import/excel-premise-identities";
import {
  applyConfirmedOfficialImport,
  buildOfficialImportPlan,
  parseOfficialExcel,
  readExistingCatalogState,
  stage5BaselineState,
  type ImportDatabase,
} from "../import/official-excel-import";
import { CatalogRepository } from "./catalog.repository";
import { catalogFilterSchema, slugInputSchema } from "./contracts";

const client = new PGlite();
const db = drizzle(client, { schema }) as unknown as ImportDatabase;
let fixturePath = "";
let fixtureSha256 = "";
let parsed: Awaited<ReturnType<typeof parseOfficialExcel>>;

async function createOfficialWorkbookFixture() {
  const workbook = new ExcelJS.Workbook();
  for (const sheetName of ["АК 153А", "Толбухина 15-2", "Толбухина 19", "П Лумумбы 28Б"] as const) {
    const worksheet = workbook.addWorksheet(sheetName);
    const identities = EXCEL_PREMISE_IDENTITIES.filter((item) => item.sheet === sheetName);
    let rowNumber = sheetName === "АК 153А" ? 4 : 2;
    identities.forEach((identity, index) => {
      if (sheetName === "АК 153А") {
        const combined =
          identity.sourceTitle.includes("Склад") && identity.sourceTitle.includes("Офис");
        worksheet.getCell(rowNumber, 1).value = combined
          ? "офис-склад"
          : identity.sourceTitle.includes("Офис")
            ? "офис"
            : "склад";
        worksheet.getCell(rowNumber, 2).value = "1";
        worksheet.getCell(rowNumber, 3).value = identity.sourceTitle;
        worksheet.getCell(rowNumber, 4).value = identity.id === "property-001" ? 133 : 100 + index;
        worksheet.getCell(rowNumber, 5).value = identity.id === "property-001" ? 1260 : 900;
        worksheet.getCell(rowNumber, 6).value = 3;
        worksheet.getCell(rowNumber, 7).value = "+";
        worksheet.getCell(rowNumber, 9).value = "радиатор";
        worksheet.getCell(rowNumber, 13).value = "общий";
        worksheet.getCell(rowNumber, 14).value = "кирпич";
        worksheet.getCell(rowNumber, 18).value = "график базы";
        if (identity.componentRows) {
          worksheet.getCell(rowNumber + 1, 1).value = "офис";
          worksheet.getCell(rowNumber + 1, 2).value = "1+2";
          worksheet.getCell(rowNumber + 1, 4).value = 140;
          worksheet.getCell(rowNumber + 1, 5).value = 945;
          worksheet.getCell(rowNumber + 1, 9).value = "радиатор";
          worksheet.getCell(rowNumber + 1, 13).value = "отдельный";
          worksheet.getCell(rowNumber + 1, 14).value = "кирпич";
          rowNumber += 2;
        } else {
          rowNumber += 1;
        }
      } else {
        worksheet.getCell(rowNumber, 1).value = identity.sourceTitle;
        worksheet.getCell(rowNumber, 2).value = index === 0 ? "39/26,1" : 20 + index;
        worksheet.getCell(rowNumber, 3).value = 800;
        worksheet.getCell(rowNumber, 4).value = 3000;
        worksheet.getCell(rowNumber, 5).value = "радиатор";
        worksheet.getCell(rowNumber, 6).value = "24/7";
        worksheet.getCell(rowNumber, 7).value = "общий";
        worksheet.getCell(rowNumber, 8).value = "-";
        worksheet.getCell(rowNumber, 9).value = "бетон/кирпич";
        rowNumber += 1;
      }
    });
  }
  const directory = await mkdtemp(join(tmpdir(), "rang-excel-test-"));
  const path = join(directory, "official.xlsx");
  await workbook.xlsx.writeFile(path);
  const bytes = await readFile(path);
  return { path, sha256: createHash("sha256").update(bytes).digest("hex") };
}

beforeAll(async () => {
  const migrationFiles = (await readdir(resolve("drizzle")))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();
  for (const file of migrationFiles) {
    const migration = await readFile(resolve("drizzle", file), "utf8");
    await client.exec(migration.replaceAll("--> statement-breakpoint", ""));
  }
  await seedPublicCatalog(db);
  const fixture = await createOfficialWorkbookFixture();
  fixturePath = fixture.path;
  fixtureSha256 = fixture.sha256;
  parsed = await parseOfficialExcel(fixturePath, { expectedSha256: fixtureSha256 });
});

afterAll(async () => client.close());

describe("RANG official Excel catalog migration", () => {
  it("keeps only the confirmed static fallback and declares all 63 stable identities", () => {
    expect(PROPERTIES).toEqual([]);
    expect(EXCEL_PREMISE_IDENTITIES).toHaveLength(63);
    expect(new Set(EXCEL_PREMISE_IDENTITIES.map((item) => item.id)).size).toBe(63);
    expect(new Set(EXCEL_PREMISE_IDENTITIES.map((item) => item.slug)).size).toBe(63);
    expect(PROPERTIES.some((property) => DEMO_PREMISE_IDS.includes(property.id as never))).toBe(
      false,
    );
  });

  it("parses the combined Avsp premise as one premise with two components", () => {
    expect(parsed.records).toHaveLength(63);
    expect(parsed.sourceSha256).toBe(fixtureSha256);
    const combined = parsed.records.find(
      (record) => record.id === "premise-ak153a-avsp-warehouse-2-3-office-2",
    );
    expect(combined).toMatchObject({ typeId: "office-warehouse", components: [{}, {}] });
    expect(combined?.components.map((component) => component.componentType)).toEqual([
      "warehouse",
      "office",
    ]);
    expect(parsed.records.find((record) => record.id === "property-001")).toMatchObject({
      areaSqm: "133",
      rentPricePerSqm: "1260",
      externalId: "rang-excel:ak153a:a1:warehouse:8",
    });
  });

  it("plans the complete Stage 5 replacement", () => {
    const plan = buildOfficialImportPlan(parsed, stage5BaselineState());
    expect(plan).toMatchObject({
      sourcePremises: 63,
      insert: 62,
      update: 1,
      delete: 6,
      conflict: 0,
    });
    expect(plan.deleteIds).toEqual([...DEMO_PREMISE_IDS]);
  });

  it("detects an external ID already assigned to a different premise", () => {
    const confirmed = parsed.records[0]!;
    const plan = buildOfficialImportPlan(parsed, {
      premises: [{ id: "unexpected-premise", externalId: confirmed.externalId }],
      mappings: [],
    });
    expect(plan.items.find((item) => item.id === confirmed.id)).toMatchObject({
      operation: "conflict",
    });
  });

  it("imports confirmed rows idempotently and exposes them through the repository", async () => {
    const firstPlan = await applyConfirmedOfficialImport(db, parsed, { deleteDemo: true });
    expect(firstPlan).toMatchObject({ insert: 63, update: 0, delete: 0, conflict: 0 });

    const repository = new CatalogRepository(db);
    const properties = await repository.listProperties({ offerType: "rent" });
    expect(properties).toHaveLength(63);
    expect(await repository.getPropertyBySlug("sklad-8-ak-153a")).toMatchObject({
      id: "property-001",
      areaSqm: 133,
      rentPricePerSqm: 1260,
    });
    const components = await db.select().from(schema.premiseComponents);
    expect(components).toHaveLength(2);
    expect(components.map((component) => component.componentType)).toEqual(["warehouse", "office"]);

    const secondPlan = buildOfficialImportPlan(parsed, await readExistingCatalogState(db));
    expect(secondPlan).toMatchObject({
      insert: 0,
      update: 0,
      unchanged: 63,
      delete: 0,
      conflict: 0,
    });
    await applyConfirmedOfficialImport(db, parsed, { deleteDemo: true });
    expect(await repository.listProperties({ offerType: "rent" })).toHaveLength(63);
  });

  it("validates server input", () => {
    expect(() => slugInputSchema.parse({ slug: "../../etc/passwd" })).toThrow();
    expect(() => catalogFilterSchema.parse({ areaFrom: 200, areaTo: 100 })).toThrow();
  });
});
