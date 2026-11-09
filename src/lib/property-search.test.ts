import { describe, expect, it } from "vitest";
import { INITIAL_PROPERTY_FILTERS } from "@/data/rang";
import { propertyCatalogUrl, propertyFiltersFromSearch } from "./property-search";

describe("home property search", () => {
  it("passes every selected home filter to the catalog, including status", () => {
    const url = propertyCatalogUrl({
      ...INITIAL_PROPERTY_FILTERS,
      type: "Склад",
      areaFrom: "100",
      areaTo: "500",
      object: "tolbuhina-19",
      cost: "up-to-1000",
      status: "Скоро освободится",
    });
    const search = new URL(url, "https://rangpro.ru").searchParams;
    expect(Object.fromEntries(search)).toEqual({
      type: "Склад",
      areaFrom: "100",
      areaTo: "500",
      object: "tolbuhina-19",
      cost: "up-to-1000",
      status: "Скоро освободится",
    });
  });

  it("uses all statuses and other defaults when the home filters are reset", () => {
    expect(propertyCatalogUrl(INITIAL_PROPERTY_FILTERS)).toBe("/properties");
    expect(propertyFiltersFromSearch({})).toEqual(INITIAL_PROPERTY_FILTERS);
  });

  it("initializes the existing catalog filters from valid search parameters", () => {
    expect(propertyFiltersFromSearch({
      type: "Офис",
      status: "В резерве",
      areaFrom: "25",
      areaTo: "200",
      object: "adelya-kutuya-153a",
      cost: "not-specified",
    })).toEqual({
      ...INITIAL_PROPERTY_FILTERS,
      type: "Офис",
      status: "В резерве",
      areaFrom: "25",
      areaTo: "200",
      object: "adelya-kutuya-153a",
      cost: "not-specified",
    });
  });
});
