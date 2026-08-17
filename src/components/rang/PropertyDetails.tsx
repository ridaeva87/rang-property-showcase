import type { ReactNode } from "react";
import { getPropertyObject, type Property } from "@/data/rang";

type DetailItem = { label: string; value: ReactNode };

export function PropertyDetails({ property }: { property: Property }) {
  const object = getPropertyObject(property);
  const main: DetailItem[] = compact([
    object && { label: "Объект", value: object.name },
    object && { label: "Адрес", value: object.address },
    property.areaSqm !== undefined && { label: "Общая площадь", value: `${property.areaSqm} м²` },
    property.usableAreaSqm !== undefined && {
      label: "Полезная площадь",
      value: `${property.usableAreaSqm} м²`,
    },
    { label: "Тип помещения", value: property.type },
    property.purposes.length > 0 && {
      label: "Назначение",
      value: property.purposes.join(", "),
    },
    property.rentPricePerSqm !== undefined && {
      label: "Ставка аренды",
      value: `${formatNumber(property.rentPricePerSqm)} ₽/м²`,
    },
    property.totalMonthlyRent !== undefined && {
      label: "Полная стоимость аренды",
      value: `${formatNumber(property.totalMonthlyRent)} ₽/месяц`,
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
    property.heating && { label: "Отопление", value: property.heating },
    property.electricalSupply && {
      label: "Электроснабжение",
      value: property.electricalSupply,
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
      value: property.powerIncrease,
    },
    property.restroom && { label: "Санузел", value: property.restroom },
    property.gates && {
      label: "Ворота",
      value: formatGates(property.gates),
    },
    property.airConditioning && {
      label: "Кондиционирование",
      value: property.airConditioning,
    },
    property.material && { label: "Материал помещения", value: property.material },
  ]);

  const access: DetailItem[] = compact([
    property.accessMode && { label: "Режим доступа", value: property.accessMode },
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
    object?.parking && { label: "Парковка", value: object.parking },
  ]);

  return (
    <div className="space-y-10">
      <DetailGroup title="Основная информация" items={main} />
      <DetailGroup title="Технические характеристики" items={technical} />
      <DetailGroup title="Доступ и территория" items={access} />
      {(property.mainFeatures.length > 0 || property.additionalFeatures.length > 0) && (
        <section>
          <h2 className="text-2xl font-semibold">Дополнительные характеристики</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[...property.mainFeatures, ...property.additionalFeatures].map((feature) => (
              <li key={feature} className="flex items-start gap-3 bg-card p-4 text-sm">
                <span className="mt-2 size-1.5 shrink-0 bg-accent" />
                {feature}
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
