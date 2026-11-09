import {
  INITIAL_PROPERTY_FILTERS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertyFilters,
} from "@/data/rang";

export type PropertyCatalogSearch = Record<string, unknown>;

const textFilterKeys = ["object", "purpose", "accessMode", "feature"] as const;

function nonNegativeNumber(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? value : "";
}

export function propertyFiltersFromSearch(search: PropertyCatalogSearch): PropertyFilters {
  const filters = { ...INITIAL_PROPERTY_FILTERS };
  if (typeof search["type"] === "string" && PROPERTY_TYPES.includes(search["type"] as (typeof PROPERTY_TYPES)[number]))
    filters.type = search["type"];
  if (typeof search["status"] === "string" && PROPERTY_STATUSES.includes(search["status"] as (typeof PROPERTY_STATUSES)[number]))
    filters.status = search["status"];
  if (["all", "up-to-1000", "not-specified"].includes(String(search["cost"])))
    filters.cost = search["cost"] as PropertyFilters["cost"];
  filters.areaFrom = nonNegativeNumber(search["areaFrom"]);
  filters.areaTo = nonNegativeNumber(search["areaTo"]);
  for (const key of textFilterKeys) {
    if (typeof search[key] === "string") filters[key] = search[key];
  }
  return filters;
}

export function propertyCatalogUrl(filters: PropertyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value || (key === "cost" && value === "all")) continue;
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `/properties?${query}` : "/properties";
}
