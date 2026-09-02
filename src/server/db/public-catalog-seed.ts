import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

const objectRows = [
  {
    id: "adelya-kutuya-153a",
    slug: "adelya-kutuya-153a",
    name: "АК 153А",
    address: "Казань, ул. Аделя Кутуя, 153А",
    description:
      "Офисно-складской комплекс с закрытой территорией и подъездом для грузового транспорта.",
    parking:
      "Парковка предназначена для арендаторов помещений и их гостей. На территории работает автоматизированная система пропуска транспортных средств с распознаванием государственных регистрационных знаков.",
    territoryFeatures: [],
    publicationStatus: "published" as const,
  },
  {
    id: "tolbuhina-15-2",
    slug: "tolbuhina-15-2",
    name: "Толбухина 15-2",
    address: "Казань, ул. Толбухина, 15, корп. 2",
    description: "Административно-складское здание: офисные и комбинированные помещения.",
    territoryFeatures: [],
    publicationStatus: "published" as const,
  },
  {
    id: "tolbuhina-19",
    slug: "tolbuhina-19",
    name: "Толбухина 19",
    address: "Казань, ул. Толбухина, 19",
    description: "Складские помещения различной площади, погрузочная зона.",
    territoryFeatures: [],
    publicationStatus: "published" as const,
  },
  {
    id: "patrisa-lumumby-28b",
    slug: "patrisa-lumumby-28b",
    name: "Патриса Лумумбы 28Б",
    address: "Казань, ул. Патриса Лумумбы, 28Б",
    description: "Производственно-складская территория с помещениями под разные задачи.",
    territoryFeatures: [],
    publicationStatus: "published" as const,
  },
];

const typeRows = [
  { id: "office", code: "office", name: "Офис" },
  { id: "warehouse", code: "warehouse", name: "Склад" },
  { id: "office-warehouse", code: "office-warehouse", name: "Офис + склад" },
  { id: "other", code: "other", name: "Другое помещение" },
  { id: "land", code: "land", name: "Земельный участок" },
];
const statusRows = [
  { id: "available", code: "available", name: "Свободно", isAvailable: true },
  { id: "reserved", code: "reserved", name: "В резерве", isAvailable: false },
  { id: "leased", code: "leased", name: "Сдано", isAvailable: false },
  { id: "coming-soon", code: "coming-soon", name: "Скоро освободится", isAvailable: false },
];

const services = [
  "Переоборудование помещения",
  "Технические работы",
  "Электромонтажные работы",
  "Сантехнические работы",
  "Установка дополнительного оборудования",
  "Изменение или увеличение электрической мощности",
  "Погрузочно-разгрузочные работы",
  "Другое",
];

export async function seedPublicCatalog(db: Db) {
  await db.transaction(async (tx) => {
    await tx.insert(schema.propertyObjects).values(objectRows).onConflictDoNothing();
    await tx.insert(schema.premiseTypes).values(typeRows).onConflictDoNothing();
    await tx.insert(schema.premiseStatuses).values(statusRows).onConflictDoNothing();
    const serviceIds = [
      "refit",
      "technical",
      "electrical",
      "plumbing",
      "equipment",
      "power",
      "loading",
      "other",
    ] as const;
    await tx
      .insert(schema.additionalServices)
      .values(
        services.map((title, index) => ({
          id: serviceIds[index]!,
          title,
          publicationStatus: "published" as const,
        })),
      )
      .onConflictDoNothing();
  });
}

export const publicCatalogSeedCounts = {
  objects: objectRows.length,
  premises: 0,
  services: services.length,
};
