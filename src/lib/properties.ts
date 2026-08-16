import {
  INITIAL_PROPERTY_FILTERS,
  PROPERTIES,
  type Property,
  type PropertyFilters,
} from "@/data/rang";

export function filterProperties(
  properties: Property[] = PROPERTIES,
  filters: PropertyFilters = INITIAL_PROPERTY_FILTERS,
) {
  const areaFrom = filters.areaFrom ? Number(filters.areaFrom) : 0;
  const areaTo = filters.areaTo ? Number(filters.areaTo) : Number.POSITIVE_INFINITY;
  const hasAreaFilter = Boolean(filters.areaFrom || filters.areaTo);

  return properties.filter((property) => {
    const matchesCost =
      filters.cost === "all" ||
      (filters.cost === "up-to-1000" &&
        property.rentPricePerSqm !== undefined &&
        property.rentPricePerSqm <= 1000) ||
      (filters.cost === "on-request" && property.rentPricePerSqm === undefined);
    const features = [...property.mainFeatures, ...property.additionalFeatures];

    return (
      (!filters.type || property.type === filters.type) &&
      (!hasAreaFilter ||
        (property.areaSqm !== undefined &&
          property.areaSqm >= areaFrom &&
          property.areaSqm <= areaTo)) &&
      (!filters.object || property.object === filters.object) &&
      (!filters.purpose || property.purposes.includes(filters.purpose)) &&
      (!filters.accessMode || property.accessMode === filters.accessMode) &&
      (!filters.feature || features.includes(filters.feature)) &&
      (!filters.status || property.status === filters.status) &&
      matchesCost
    );
  });
}

export function hasActivePropertyFilters(filters: PropertyFilters) {
  return Object.entries(filters).some(([key, value]) =>
    key === "cost" ? value !== "all" : Boolean(value),
  );
}

export function uniquePropertyValues(select: (property: Property) => string[]) {
  return [...new Set(PROPERTIES.flatMap(select))].sort((a, b) => a.localeCompare(b, "ru"));
}

export const PROPERTY_FILTER_OPTIONS = {
  purposes: uniquePropertyValues((property) => property.purposes),
  accessModes: uniquePropertyValues((property) =>
    property.accessMode ? [property.accessMode] : [],
  ),
  features: uniquePropertyValues((property) => [
    ...property.mainFeatures,
    ...property.additionalFeatures,
  ]),
};
