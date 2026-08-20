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

const premiseRows = [
  {
    id: "property-001",
    slug: "sklad-8-ak-153a",
    title: "Склад №8",
    objectId: "adelya-kutuya-153a",
    typeId: "warehouse",
    statusId: "available",
    areaSqm: "133",
    publicationStatus: "published" as const,
  },
  {
    id: "property-002",
    slug: "ofis-2-14-tolbuhina-15-2",
    title: "Офис 2.14",
    objectId: "tolbuhina-15-2",
    typeId: "office",
    statusId: "available",
    areaSqm: "48",
    publicationStatus: "published" as const,
  },
  {
    id: "property-003",
    slug: "ofis-sklad-3-tolbuhina-19",
    title: "Офис + склад №3",
    objectId: "tolbuhina-19",
    typeId: "office-warehouse",
    statusId: "available",
    areaSqm: "212",
    publicationStatus: "published" as const,
  },
  {
    id: "property-004",
    slug: "pomeshchenie-5-lumumby-28b",
    title: "Помещение №5",
    objectId: "patrisa-lumumby-28b",
    typeId: "other",
    statusId: "available",
    areaSqm: "76",
    publicationStatus: "published" as const,
  },
  {
    id: "property-005",
    slug: "sklad-12-tolbuhina-19",
    title: "Склад №12",
    objectId: "tolbuhina-19",
    typeId: "warehouse",
    statusId: "coming-soon",
    areaSqm: "150",
    expectedReleaseLabel: "1 октября",
    publicationStatus: "published" as const,
  },
  {
    id: "property-006",
    slug: "ofis-1-05-ak-153a",
    title: "Офис 1.05",
    objectId: "adelya-kutuya-153a",
    typeId: "office",
    statusId: "coming-soon",
    areaSqm: "64",
    expectedReleaseLabel: "В ноябре",
    publicationStatus: "published" as const,
  },
  {
    id: "property-007",
    slug: "ofis-sklad-7-tolbuhina-15-2",
    title: "Офис + склад №7",
    objectId: "tolbuhina-15-2",
    typeId: "office-warehouse",
    statusId: "coming-soon",
    areaSqm: "185",
    publicationStatus: "published" as const,
  },
];

const purposes: Record<string, string[]> = {
  "property-001": ["Хранение", "Комплектация", "Отгрузка"],
  "property-002": ["Рабочее пространство"],
  "property-003": ["Офис", "Хранение"],
  "property-004": ["Другое назначение"],
  "property-005": ["Хранение", "Комплектация", "Отгрузка"],
  "property-006": ["Рабочее пространство"],
  "property-007": ["Офис", "Хранение"],
};

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
    await tx.insert(schema.premises).values(premiseRows).onConflictDoNothing();
    await tx
      .insert(schema.propertyOffers)
      .values(
        premiseRows.map((premise) => ({
          id: `offer-${premise.id}`,
          premiseId: premise.id,
          type: "rent" as const,
          rentPricePerSqm: premise.id === "property-001" ? "1260" : null,
          utilityCosts: premise.id === "property-001" ? "По приборам учёта (ПУ)" : null,
          publicationStatus: "published" as const,
        })),
      )
      .onConflictDoNothing();
    await tx
      .insert(schema.premisePurposes)
      .values(
        Object.entries(purposes).flatMap(([premiseId, values]) =>
          values.map((purpose) => ({ premiseId, purpose })),
        ),
      )
      .onConflictDoNothing();
    await tx
      .insert(schema.premiseCharacteristics)
      .values(
        (
          [
            ["ceiling-height", "Высота потолка", "6,09 м", "Основные"],
            ["heating", "Отопление", "Тепловентилятор", "Инженерные системы"],
            ["power-220", "Электроснабжение 220 В", "Есть", "Инженерные системы"],
            [
              "electric-power",
              "Электрическая мощность",
              "5 (единица измерения не указана в источнике)",
              "Инженерные системы",
            ],
            [
              "power-increase",
              "Увеличение мощности",
              "10 (значение и единица измерения требуют уточнения)",
              "Инженерные системы",
            ],
            ["restroom", "Санузел", "Отсутствует", "Удобства"],
            ["gates", "Ворота", "1 шт., 3,8 × 3,8 м", "Доступ"],
            ["material", "Материал", "Бетон", "Конструкция"],
            ["access-mode", "Режим доступа", "По графику базы", "Доступ"],
            ["vehicle-access", "Допуск автомобилей", "До 4", "Доступ"],
          ] as const
        ).map(([key, label, valueText, groupName], sortOrder) => ({
          id: `property-001-${key}`,
          premiseId: "property-001",
          key,
          label,
          valueText,
          groupName,
          sortOrder,
        })),
      )
      .onConflictDoNothing();
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
  premises: premiseRows.length,
  services: services.length,
};
