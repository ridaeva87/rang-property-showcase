import {
  applyConfirmedOfficialImport,
  buildOfficialImportPlan,
  parseOfficialExcel,
  readExistingCatalogState,
  stage5BaselineState,
} from "../src/server/import/official-excel-import";

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const filePath = valueAfter("--file");
const applyConfirmed = args.includes("--apply-confirmed");
const deleteDemo = args.includes("--delete-demo");
const stage5Baseline = args.includes("--stage5-baseline");

if (!filePath) {
  throw new Error(
    "Usage: npm run db:import:excel -- --file /secure/path/file.xlsx [--dry-run] [--stage5-baseline] [--apply-confirmed --delete-demo]",
  );
}

if (applyConfirmed && process.env["APP_ENV"] === "production") {
  if (process.env["ALLOW_PRODUCTION_EXCEL_IMPORT"] !== "CONFIRMED_WITH_BACKUP") {
    throw new Error(
      "Production Excel import is locked. A verified backup and explicit ALLOW_PRODUCTION_EXCEL_IMPORT=CONFIRMED_WITH_BACKUP are required.",
    );
  }
}

const parsed = await parseOfficialExcel(filePath);

if (applyConfirmed) {
  if (!process.env["DATABASE_URL"]) throw new Error("DATABASE_URL is required for apply mode");
  const { getDatabase } = await import("../src/server/db/client");
  const plan = await applyConfirmedOfficialImport(getDatabase(), parsed, { deleteDemo });
  console.log(JSON.stringify({ mode: "apply-confirmed", ...plan }, null, 2));
} else {
  let state;
  if (stage5Baseline) {
    state = stage5BaselineState();
  } else if (process.env["DATABASE_URL"]) {
    const { getDatabase } = await import("../src/server/db/client");
    state = await readExistingCatalogState(getDatabase());
  } else {
    throw new Error("Dry-run requires DATABASE_URL or the explicit --stage5-baseline option");
  }
  const plan = buildOfficialImportPlan(parsed, state);
  console.log(
    JSON.stringify(
      { mode: "dry-run", baseline: stage5Baseline ? "stage5" : "database", ...plan },
      null,
      2,
    ),
  );
}
