import type { ReactNode } from "react";
import { formatCharacteristicValue, getPropertyObject, type Property } from "@/data/rang";

type DetailItem = { label: string; value: ReactNode };

export function PropertyDetails({ property }: { property: Property }) {
  const object = getPropertyObject(property);
  const isSale = property.offerType === "sale";
  const main: DetailItem[] = compact([
    (property.objectName || object) && {
      label: "Объект",
      value: property.objectName ?? object!.name,
    },
    (property.objectAddress || object) && {
      label: "Адрес",
      value: property.objectAddress ?? object!.address,
    },
    property.areaSqm !== undefined && { label: "Общая площадь", value: `${property.areaSqm} м²` },
    property.usableAreaSqm !== undefined && {
      label: "Полезная площадь",
      value: `${property.usableAreaSqm} м²`,
    },
    { label: "Тип помещения", value: property.type },
    property.purposes.length > 0 && {
      label: "Назначение",
      value: formatCharacteristicValue(property.purposes.join(", ")),
    },
    (property.rentPricePerSqmLabel || property.rentPricePerSqm !== undefined) && {
      label: "Ставка аренды",
      value: `${property.rentPricePerSqmLabel ?? formatNumber(property.rentPricePerSqm!)} ₽/м²`,
    },
    property.totalMonthlyRent !== undefined && {
      label: "Полная стоимость аренды",
      value: `${formatNumber(property.totalMonthlyRent)} ₽/месяц`,
    },
    property.salePrice !== undefined && {
      label: "Цена",
      value: `${formatNumber(property.salePrice)} ₽`,
    },
    property.pricePerSqm !== undefined && {
      label: "Цена за м²",
      value: `${formatNumber(property.pricePerSqm)} ₽/м²`,
    },
    property.utilityCosts && { label: "Коммунальные расходы", value: property.utilityCosts },
    property.status && { label: "Статус аренды", value: property.status },
    property.status === "Скоро освободится" &&
      property.expectedRelease && {
        label: "Предполагаемое освобождение",
        value: property.expectedRelease,
      },
  ]);

  const technical: DetailItem[] = compact([
    property.ceilingHeight && { label: "Высота потолков", value: property.ceilingHeight },
    property.heating && { label: "Отопление", value: formatCharacteristicValue(property.heating) },
    property.electricalSupply && {
      label: "Электроснабжение",
      value: formatCharacteristicValue(property.electricalSupply),
    },
    property.has220V !== undefined && {
      label: "Розетки 220 В",
      value: property.has220V ? "Есть" : "Нет",
    },
    property.has380V !== undefined && {
      label: "Розетки 380 В",
      value: property.has380V ? "Есть" : "Нет",
    },
    property.electricPower && {
      label: "Электрическая мощность",
      value: property.electricPower,
    },
    property.powerIncrease && {
      label: "Возможность увеличения мощности",
      value: formatCharacteristicValue(property.powerIncrease),
    },
    property.restroom && {
      label: "Санузел",
      value: formatCharacteristicValue(property.restroom),
    },
    property.gates && {
      label: "Ворота",
      value: formatGates(property.gates),
    },
    property.airConditioning && {
      label: "Кондиционирование",
      value: formatCharacteristicValue(property.airConditioning),
    },
    property.material && {
      label: "Материал помещения",
      value: formatCharacteristicValue(property.material),
    },
  ]);

  const access: DetailItem[] = compact([
    property.accessMode && {
      label: "Режим доступа",
      value: formatCharacteristicValue(property.accessMode),
    },
    property.vehicleAccess?.totalLimit !== undefined && {
      label: "Лимит автомобилей",
      value: `${property.vehicleAccess.totalLimit}`,
    },
    property.vehicleAccess?.tenantLimit !== undefined && {
      label: "Автомобили арендатора",
      value: `${property.vehicleAccess.tenantLimit}`,
    },
    property.vehicleAccess?.guestLimit !== undefined && {
      label: "Гостевые автомобили",
      value: `${property.vehicleAccess.guestLimit}`,
    },
    object?.parking && { label: "Парковка", value: formatCharacteristicValue(object.parking) },
  ]);
  const grouped = new Map<string, DetailItem[]>();
  for (const item of property.characteristics) {
    if (["price-per-sqm", "floor"].includes(item.key)) continue;
    const group = item.group ?? "Характеристики";
    const items = grouped.get(group) ?? [];
    items.push({
      label: item.label,
      value: `${formatCharacteristicValue(item.value)}${item.unit ? ` ${item.unit}` : ""}`,
    });
    grouped.set(group, items);
  }

  return (
    <div className="space-y-10">
      <DetailGroup title="Основная информация" items={main} />
      {property.description && (
        <section>
          <h2 className="text-2xl font-semibold">Описание</h2>
          <p className="mt-5 max-w-4xl whitespace-pre-line text-muted-foreground">
            {property.description}
          </p>
        </section>
      )}
      {isSale ? (
        [...grouped].map(([title, items]) => (
          <DetailGroup key={title} title={title} items={items} />
        ))
      ) : (
        <>
          <DetailGroup title="Технические характеристики" items={technical} />
          <DetailGroup title="Доступ и территория" items={access} />
        </>
      )}
      {(property.mainFeatures.length > 0 || property.additionalFeatures.length > 0) && (
        <section>
          <h2 className="text-2xl font-semibold">Дополнительные характеристики</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[...property.mainFeatures, ...property.additionalFeatures].map((feature) => (
              <li key={feature} className="flex items-start gap-3 bg-card p-4 text-sm">
                <span className="mt-2 size-1.5 shrink-0 bg-accent" />
                {formatCharacteristicValue(feature)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DetailGroup({ title, items }: { title: string; items: DetailItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 border border-border bg-card p-5">
            <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="mt-2 break-words font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function compact(items: Array<DetailItem | false | "" | null | undefined>) {
  return items.filter((item): item is DetailItem => Boolean(item));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}

function formatGates(gates: NonNullable<Property["gates"]>) {
  const dimensions =
    gates.widthM !== undefined && gates.heightM !== undefined
      ? `, ${formatNumber(gates.widthM)} × ${formatNumber(gates.heightM)} м`
      : "";
  return `${gates.count} шт.${dimensions}`;
}
