import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { DEMO_PREMISE_IDS, EXCEL_PREMISE_IDENTITIES } from "./excel-premise-identities";

export const OFFICIAL_EXCEL_SHA256 =
  "633448dcec71ed67427eb4100ef637305112f21ec0174ffe90d8283ebc0e415b";

export type ImportDatabase = NodePgDatabase<typeof schema>;
export type ImportOperation = "insert" | "update" | "unchanged" | "conflict";

type Characteristic = {
  key: string;
  label: string;
  valueText: string;
  groupName: string;
  sortOrder: number;
};

export type OfficialPremiseRecord = {
  sheet: string;
  sourceRows: number[];
  sourceTitle: string;
  id: string;
  slug: string;
  externalId: string;
  objectId: string;
  buildingId: string;
  buildingCode: string;
  typeId: "office" | "warehouse" | "office-warehouse";
  areaSqm?: string | undefined;
  usableAreaSqm?: string | undefined;
  rentPricePerSqm?: string | undefined;
  utilityCosts?: string | undefined;
  purposes: string[];
  characteristics: Characteristic[];
  components: Array<{
    id: string;
    componentType: "warehouse" | "office";
    title: string;
    floor?: string | undefined;
    areaSqm?: string | undefined;
    rentPricePerSqm?: string | undefined;
    utilityCosts?: string | undefined;
    ceilingHeight?: string | undefined;
    heating?: string | undefined;
    material?: string | undefined;
    characteristics: Characteristic[];
    sourceRow: number;
    sortOrder: number;
  }>;
  payloadHash: string;
};

export type ImportPlan = {
  sourceSha256: string;
  sourcePremises: number;
  insert: number;
  update: number;
  unchanged: number;
  delete: number;
  conflict: number;
  items: Array<{
    id: string;
    title: string;
    operation: ImportOperation;
    reason?: string;
  }>;
  deleteIds: string[];
};

export type ExistingCatalogState = {
  premises: Array<{ id: string; externalId: string | null }>;
  mappings: Array<{ entityId: string; externalId: string; payloadHash: string | null }>;
};

const objectBySheet = {
  "АК 153А": "adelya-kutuya-153a",
  "Толбухина 15-2": "tolbuhina-15-2",
  "Толбухина 19": "tolbuhina-19",
  "П Лумумбы 28Б": "patrisa-lumumby-28b",
} as const;

const objectKeyBySheet = {
  "АК 153А": "ak153a",
  "Толбухина 15-2": "tol15k2",
  "Толбухина 19": "tol19",
  "П Лумумбы 28Б": "pl28b",
} as const;

const expectedCounts = {
  "АК 153А": 32,
  "Толбухина 15-2": 12,
  "Толбухина 19": 17,
  "П Лумумбы 28Б": 2,
} as const;

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const identityText = (value: string) =>
  clean(value)
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е")
    .replace(/№/g, "")
    .replace(/пом\.\s*/g, "пом ")
    .replace(/\s*\/\s*/g, "/");

const cellText = (sheet: ExcelJS.Worksheet, row: number, column: number) =>
  clean(sheet.getCell(row, column).text);

const decimal = (value: string) => {
  const normalized = value.replaceAll(" ", "").replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalized) ? normalized : undefined;
};

const area = (value: string) => {
  const [total, usable] = value.split("/").map((part) => decimal(part));
  return { areaSqm: total, usableAreaSqm: usable };
};

const displayFlag = (value: string) => {
  if (value === "+") return "Есть";
  if (value === "-") return "Нет";
  return value;
};

const characteristic = (
  values: Characteristic[],
  key: string,
  label: string,
  value: string,
  groupName: string,
) => {
  if (!value) return;
  values.push({
    key,
    label,
    valueText: displayFlag(value),
    groupName,
    sortOrder: values.length,
  });
};

const hashPayload = (payload: unknown) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

function parseAkRow(sheet: ExcelJS.Worksheet, row: number) {
  const typeSource = cellText(sheet, row, 1).toLocaleLowerCase("ru");
  const typeId =
    typeSource === "офис"
      ? ("office" as const)
      : typeSource === "склад"
        ? ("warehouse" as const)
        : ("office-warehouse" as const);
  const parsedArea = area(cellText(sheet, row, 4));
  const characteristics: Characteristic[] = [];
  characteristic(characteristics, "floor", "Этаж", cellText(sheet, row, 2), "Основные");
  characteristic(
    characteristics,
    "ceiling-height",
    "Высота потолка",
    cellText(sheet, row, 6),
    "Основные",
  );
  characteristic(
    characteristics,
    "power-220",
    "Электроснабжение 220 В",
    cellText(sheet, row, 7),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "power-380",
    "Электроснабжение 380 В",
    cellText(sheet, row, 8),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "heating",
    "Отопление",
    cellText(sheet, row, 9),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "gates-count",
    "Ворота — количество",
    cellText(sheet, row, 10),
    "Доступ",
  );
  characteristic(
    characteristics,
    "gates-width",
    "Ворота — ширина",
    cellText(sheet, row, 11),
    "Доступ",
  );
  characteristic(
    characteristics,
    "gates-height",
    "Ворота — высота",
    cellText(sheet, row, 12),
    "Доступ",
  );
  characteristic(characteristics, "restroom", "Санузел", cellText(sheet, row, 13), "Удобства");
  characteristic(characteristics, "material", "Материал", cellText(sheet, row, 14), "Конструкция");
  characteristic(
    characteristics,
    "electric-power",
    "Электрическая мощность",
    cellText(sheet, row, 15),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "power-increase",
    "Увеличение мощности",
    cellText(sheet, row, 16),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "air-conditioning",
    "Подготовка под кондиционер",
    cellText(sheet, row, 17),
    "Удобства",
  );
  characteristic(
    characteristics,
    "access-mode",
    "Режим доступа",
    cellText(sheet, row, 18),
    "Доступ",
  );
  return {
    typeId,
    ...parsedArea,
    rentPricePerSqm: decimal(cellText(sheet, row, 5)),
    characteristics,
  };
}

function parseOfficeRow(sheet: ExcelJS.Worksheet, row: number) {
  const parsedArea = area(cellText(sheet, row, 2));
  const characteristics: Characteristic[] = [];
  characteristic(
    characteristics,
    "heating",
    "Отопление",
    cellText(sheet, row, 5),
    "Инженерные системы",
  );
  characteristic(
    characteristics,
    "access-mode",
    "Режим доступа",
    cellText(sheet, row, 6),
    "Доступ",
  );
  characteristic(characteristics, "restroom", "Санузел", cellText(sheet, row, 7), "Удобства");
  characteristic(
    characteristics,
    "air-conditioning",
    "Подготовка под кондиционер",
    cellText(sheet, row, 8),
    "Удобства",
  );
  characteristic(characteristics, "material", "Материал", cellText(sheet, row, 9), "Конструкция");
  return {
    typeId: "office" as const,
    ...parsedArea,
    rentPricePerSqm: decimal(cellText(sheet, row, 3)),
    utilityCosts: cellText(sheet, row, 4) || undefined,
    characteristics,
  };
}

const purposesFor = (typeId: OfficialPremiseRecord["typeId"]) =>
  typeId === "office"
    ? ["Рабочее пространство"]
    : typeId === "warehouse"
      ? ["Хранение"]
      : ["Рабочее пространство", "Хранение"];

const characteristicValue = (items: Characteristic[], key: string) =>
  items.find((item) => item.key === key)?.valueText;

function parseCombinedComponents(sheet: ExcelJS.Worksheet, sourceRow: number, premiseId: string) {
  return (["warehouse", "office"] as const).map((componentType, sortOrder) => {
    const row = sourceRow + sortOrder;
    const parsed = parseAkRow(sheet, row);
    return {
      id: `${premiseId}-component-${componentType}`,
      componentType,
      title: componentType === "warehouse" ? "Склад №2/3" : "Офис №2",
      floor: characteristicValue(parsed.characteristics, "floor"),
      areaSqm: parsed.areaSqm,
      rentPricePerSqm: parsed.rentPricePerSqm,
      ceilingHeight: characteristicValue(parsed.characteristics, "ceiling-height"),
      heating: characteristicValue(parsed.characteristics, "heating"),
      material: characteristicValue(parsed.characteristics, "material"),
      characteristics: parsed.characteristics,
      sourceRow: row,
      sortOrder,
    };
  });
}

export async function parseOfficialExcel(
  filePath: string,
  options: { expectedSha256?: string } = {},
): Promise<{
  sourceSha256: string;
  records: OfficialPremiseRecord[];
}> {
  const source = await readFile(filePath);
  const sourceSha256 = createHash("sha256").update(source).digest("hex");
  const expectedSha256 = options.expectedSha256 ?? OFFICIAL_EXCEL_SHA256;
  if (sourceSha256 !== expectedSha256) {
    throw new Error(
      `Official Excel checksum mismatch: expected ${expectedSha256}, received ${sourceSha256}`,
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(source as never);
  const records: OfficialPremiseRecord[] = [];

  for (const [sheetName, expectedCount] of Object.entries(expectedCounts)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Required worksheet is missing: ${sheetName}`);
    const identities = EXCEL_PREMISE_IDENTITIES.filter((item) => item.sheet === sheetName);
    if (identities.length !== expectedCount) {
      throw new Error(`Identity manifest count mismatch for ${sheetName}`);
    }

    for (const identity of identities) {
      let sourceRow = 0;
      sheet.eachRow((row, rowNumber) => {
        const titleColumn = sheetName === "АК 153А" ? 3 : 1;
        if (identityText(row.getCell(titleColumn).text) === identityText(identity.sourceTitle)) {
          sourceRow = rowNumber;
        }
      });
      if (!sourceRow)
        throw new Error(`Excel premise not found: ${sheetName} / ${identity.sourceTitle}`);

      const parsedRow =
        sheetName === "АК 153А" ? parseAkRow(sheet, sourceRow) : parseOfficeRow(sheet, sourceRow);
      const components = identity.componentRows
        ? parseCombinedComponents(sheet, sourceRow, identity.id)
        : [];
      const parsed = identity.componentRows
        ? {
            typeId: "office-warehouse" as const,
            purposes: purposesFor("office-warehouse"),
            characteristics: [] as Characteristic[],
          }
        : { ...parsedRow, purposes: purposesFor(parsedRow.typeId) };
      const sourceRows = identity.componentRows ? [sourceRow, sourceRow + 1] : [sourceRow];
      const objectId = objectBySheet[sheetName as keyof typeof objectBySheet];
      const buildingId = `building-${objectKeyBySheet[sheetName as keyof typeof objectKeyBySheet]}-${identity.buildingCode}`;
      const payload = {
        sheet: sheetName,
        sourceRows,
        sourceTitle: identity.sourceTitle,
        id: identity.id,
        slug: identity.slug,
        externalId: identity.externalKey,
        objectId,
        buildingId,
        buildingCode: identity.buildingCode,
        ...parsed,
        components,
      };
      records.push({ ...payload, payloadHash: hashPayload(payload) });
    }
  }

  if (records.length !== 63)
    throw new Error(`Expected 63 official premises, received ${records.length}`);
  if (new Set(records.map((item) => item.id)).size !== 63) throw new Error("Duplicate premise IDs");
  if (new Set(records.map((item) => item.slug)).size !== 63)
    throw new Error("Duplicate premise slugs");
  if (new Set(records.map((item) => item.externalId)).size !== 63)
    throw new Error("Duplicate Excel external IDs");
  return { sourceSha256, records };
}

export function stage5BaselineState(): ExistingCatalogState {
  return {
    premises: ["property-001", ...DEMO_PREMISE_IDS].map((id) => ({ id, externalId: null })),
    mappings: [],
  };
}

export async function readExistingCatalogState(db: ImportDatabase): Promise<ExistingCatalogState> {
  const [premises, mappings] = await Promise.all([
    db
      .select({ id: schema.premises.id, externalId: schema.premises.externalId })
      .from(schema.premises),
    db
      .select({
        entityId: schema.integrationMappings.entityId,
        externalId: schema.integrationMappings.externalId,
        payloadHash: schema.integrationMappings.payloadHash,
      })
      .from(schema.integrationMappings)
      .where(
        and(
          eq(schema.integrationMappings.system, "excel"),
          eq(schema.integrationMappings.entityType, "premise"),
        ),
      ),
  ]);
  return { premises, mappings };
}

export function buildOfficialImportPlan(
  parsed: Awaited<ReturnType<typeof parseOfficialExcel>>,
  state: ExistingCatalogState,
): ImportPlan {
  const ids = new Set(state.premises.map((item) => item.id));
  const premiseExternalIds = new Map(
    state.premises
      .filter((item): item is { id: string; externalId: string } => Boolean(item.externalId))
      .map((item) => [item.externalId, item.id]),
  );
  const mappings = new Map(state.mappings.map((item) => [item.externalId, item]));
  const items = parsed.records.map((record) => {
    const mapping = mappings.get(record.externalId);
    const premiseIdForExternalId = premiseExternalIds.get(record.externalId);
    if (premiseIdForExternalId && premiseIdForExternalId !== record.id) {
      return {
        id: record.id,
        title: record.sourceTitle,
        operation: "conflict" as const,
        reason: `External ID is already assigned to premise ${premiseIdForExternalId}`,
      };
    }
    if (mapping?.entityId && mapping.entityId !== record.id) {
      return {
        id: record.id,
        title: record.sourceTitle,
        operation: "conflict" as const,
        reason: `External ID is already mapped to ${mapping.entityId}`,
      };
    }
    if (!ids.has(record.id)) {
      return { id: record.id, title: record.sourceTitle, operation: "insert" as const };
    }
    if (mapping?.payloadHash === record.payloadHash) {
      return { id: record.id, title: record.sourceTitle, operation: "unchanged" as const };
    }
    return { id: record.id, title: record.sourceTitle, operation: "update" as const };
  });
  const deleteIds = DEMO_PREMISE_IDS.filter((id) => ids.has(id));
  return {
    sourceSha256: parsed.sourceSha256,
    sourcePremises: parsed.records.length,
    insert: items.filter((item) => item.operation === "insert").length,
    update: items.filter((item) => item.operation === "update").length,
    unchanged: items.filter((item) => item.operation === "unchanged").length,
    delete: deleteIds.length,
    conflict: items.filter((item) => item.operation === "conflict").length,
    items,
    deleteIds: [...deleteIds],
  };
}

const buildingName = (code: string) =>
  code === "main" ? "Основное здание" : `Литер ${code.toLocaleUpperCase("ru")}`;

export async function applyConfirmedOfficialImport(
  db: ImportDatabase,
  parsed: Awaited<ReturnType<typeof parseOfficialExcel>>,
  options: { deleteDemo: boolean },
) {
  const state = await readExistingCatalogState(db);
  const plan = buildOfficialImportPlan(parsed, state);
  const conflicts = plan.items.filter((item) => item.operation === "conflict");
  if (conflicts.length) {
    throw new Error(`Import blocked by ${conflicts.length} external ID conflict(s)`);
  }
  const operationById = new Map(plan.items.map((item) => [item.id, item.operation]));
  const actionable = parsed.records.filter(
    (record) =>
      operationById.get(record.id) === "insert" || operationById.get(record.id) === "update",
  );

  await db.transaction(async (tx) => {
    const buildingRows = [
      ...new Map(parsed.records.map((record) => [record.buildingId, record] as const)).values(),
    ].map((record) => ({
      id: record.buildingId,
      objectId: record.objectId,
      code: record.buildingCode,
      name: buildingName(record.buildingCode),
      sourceSystem: "excel" as const,
      externalId: `rang-excel-building:${record.buildingId}`,
    }));
    if (buildingRows.length) {
      await tx.insert(schema.propertyBuildings).values(buildingRows).onConflictDoNothing();
    }

    for (const record of actionable) {
      await tx
        .insert(schema.premises)
        .values({
          id: record.id,
          objectId: record.objectId,
          buildingId: record.buildingId,
          typeId: record.typeId,
          statusId: null,
          slug: record.slug,
          title: record.sourceTitle,
          areaSqm: record.areaSqm,
          usableAreaSqm: record.usableAreaSqm,
          publicationStatus: "published",
          sourceSystem: "excel",
          externalId: record.externalId,
        })
        .onConflictDoUpdate({
          target: schema.premises.id,
          set: {
            objectId: record.objectId,
            buildingId: record.buildingId,
            typeId: record.typeId,
            statusId: null,
            slug: record.slug,
            title: record.sourceTitle,
            areaSqm: record.areaSqm,
            usableAreaSqm: record.usableAreaSqm,
            publicationStatus: "published",
            sourceSystem: "excel",
            externalId: record.externalId,
            updatedAt: new Date(),
          },
        });
      await tx
        .insert(schema.propertyOffers)
        .values({
          id: `offer-${record.id}`,
          premiseId: record.id,
          type: "rent",
          rentPricePerSqm: record.rentPricePerSqm,
          utilityCosts: record.utilityCosts,
          publicationStatus: "published",
        })
        .onConflictDoUpdate({
          target: [schema.propertyOffers.premiseId, schema.propertyOffers.type],
          set: {
            rentPricePerSqm: record.rentPricePerSqm,
            utilityCosts: record.utilityCosts,
            publicationStatus: "published",
            updatedAt: new Date(),
          },
        });
      await tx
        .delete(schema.premisePurposes)
        .where(eq(schema.premisePurposes.premiseId, record.id));
      await tx
        .insert(schema.premisePurposes)
        .values(record.purposes.map((purpose) => ({ premiseId: record.id, purpose })));
      await tx
        .delete(schema.premiseCharacteristics)
        .where(eq(schema.premiseCharacteristics.premiseId, record.id));
      if (record.characteristics.length) {
        await tx.insert(schema.premiseCharacteristics).values(
          record.characteristics.map((item) => ({
            id: `${record.id}-${item.key}`,
            premiseId: record.id,
            ...item,
          })),
        );
      }
      await tx
        .delete(schema.premiseComponents)
        .where(eq(schema.premiseComponents.premiseId, record.id));
      if (record.components.length) {
        await tx.insert(schema.premiseComponents).values(
          record.components.map((component) => ({
            ...component,
            premiseId: record.id,
          })),
        );
      }
      await tx
        .insert(schema.integrationMappings)
        .values({
          id: `excel-premise-${record.id}`,
          system: "excel",
          entityType: "premise",
          entityId: record.id,
          externalId: record.externalId,
          payloadHash: record.payloadHash,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            schema.integrationMappings.system,
            schema.integrationMappings.entityType,
            schema.integrationMappings.externalId,
          ],
          set: {
            entityId: record.id,
            payloadHash: record.payloadHash,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          },
        });
    }
    if (options.deleteDemo && plan.deleteIds.length) {
      await tx.delete(schema.premises).where(inArray(schema.premises.id, plan.deleteIds));
    }
  });
  return plan;
}
