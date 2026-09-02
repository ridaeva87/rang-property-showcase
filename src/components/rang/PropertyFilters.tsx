import {
  INITIAL_PROPERTY_FILTERS,
  OBJECTS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Property,
  type PropertyFilters as PropertyFiltersValue,
} from "@/data/rang";

export function PropertyFilters({
  filters,
  properties,
  onChange,
  onReset,
}: {
  filters: PropertyFiltersValue;
  properties: Property[];
  onChange: (filters: PropertyFiltersValue) => void;
  onReset: () => void;
}) {
  const update = <K extends keyof PropertyFiltersValue>(key: K, value: PropertyFiltersValue[K]) =>
    onChange({ ...filters, [key]: value });
  const objects = OBJECTS.filter((object) =>
    properties.some((property) => property.objectId === object.id),
  );
  const statuses = PROPERTY_STATUSES.filter((status) =>
    properties.some((property) => property.status === status),
  );
  const purposes = uniqueValues(properties.flatMap((property) => property.purposes));
  const accessModes = uniqueValues(
    properties.flatMap((property) => (property.accessMode ? [property.accessMode] : [])),
  );
  const features = uniqueValues(
    properties.flatMap((property) => [...property.mainFeatures, ...property.additionalFeatures]),
  );

  return (
    <div className="border border-border bg-card p-5 shadow-card lg:p-7">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FilterField label="Тип помещения">
          <select
            value={filters.type}
            onChange={(event) => update("type", event.target.value)}
            className="filter-control"
          >
            <option value="">Все типы</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Площадь, м²">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="От"
              value={filters.areaFrom}
              onChange={(event) => update("areaFrom", event.target.value)}
              className="filter-control"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="number"
              min="0"
              placeholder="До"
              value={filters.areaTo}
              onChange={(event) => update("areaTo", event.target.value)}
              className="filter-control"
            />
          </div>
        </FilterField>

        <FilterField label="Стоимость">
          <select
            value={filters.cost}
            onChange={(event) => update("cost", event.target.value as PropertyFiltersValue["cost"])}
            className="filter-control"
          >
            <option value="all">Любая стоимость</option>
            <option value="up-to-1000">До 1 000 ₽/м²</option>
            <option value="not-specified">Стоимость не указана</option>
          </select>
        </FilterField>

        <FilterField label="Объект / адрес">
          <select
            value={filters.object}
            onChange={(event) => update("object", event.target.value)}
            className="filter-control"
          >
            <option value="">Все объекты</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.name} — {object.address}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Назначение">
          <select
            value={filters.purpose}
            onChange={(event) => update("purpose", event.target.value)}
            className="filter-control"
          >
            <option value="">Любое назначение</option>
            {purposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </FilterField>

        {accessModes.length > 0 && (
          <FilterField label="Режим доступа">
            <select
              value={filters.accessMode}
              onChange={(event) => update("accessMode", event.target.value)}
              className="filter-control"
            >
              <option value="">Любой режим</option>
              {accessModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </FilterField>
        )}

        {features.length > 0 && (
          <FilterField label="Характеристика">
            <select
              value={filters.feature}
              onChange={(event) => update("feature", event.target.value)}
              className="filter-control"
            >
              <option value="">Любая характеристика</option>
              {features.map((feature) => (
                <option key={feature} value={feature}>
                  {feature}
                </option>
              ))}
            </select>
          </FilterField>
        )}

        <FilterField label="Статус">
          <select
            value={filters.status}
            onChange={(event) => update("status", event.target.value)}
            className="filter-control"
          >
            <option value="">Все статусы</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterField>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => {
            onChange(INITIAL_PROPERTY_FILTERS);
            onReset();
          }}
          className="border border-border px-5 py-3 text-sm font-semibold text-primary"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "ru"));
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
