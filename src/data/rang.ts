import typeOffice from "@/assets/type-office.jpg";
import typeWarehouse from "@/assets/type-warehouse.jpg";
import typeCombined from "@/assets/type-combined.jpg";
import typeOther from "@/assets/type-other.jpg";
import objAk from "@/assets/object-ak153.jpg";
import obj15 from "@/assets/object-tolbuhina15.jpg";
import obj19 from "@/assets/object-tolbuhina19.jpg";
import objLumumby from "@/assets/object-lumumby.jpg";

export const NAV = [
  { label: "Каталог", href: "/properties" },
  { label: "Аренда", href: "/#rent" },
  { label: "Продажа", href: "/#sale" },
  { label: "Услуги", href: "/#services" },
  { label: "Арендаторам", href: "/#tenants" },
  { label: "О компании", href: "/#about" },
  { label: "Контакты", href: "/#contacts" },
];

export type PropertyObject = {
  id: string;
  name: string;
  location: string;
  info: string;
  image: string;
  parking?: string;
};

export const OBJECTS: PropertyObject[] = [
  {
    id: "adelya-kutuya-153a",
    name: "АК 153А",
    location: "Казань, ул. Аделя Кутуя, 153А",
    info: "Офисно-складской комплекс с закрытой территорией и подъездом для грузового транспорта.",
    image: objAk,
    parking:
      "Парковка предназначена для арендаторов помещений и их гостей. На территории работает автоматизированная система пропуска транспортных средств с распознаванием государственных регистрационных знаков.",
  },
  {
    id: "tolbuhina-15-2",
    name: "Толбухина 15-2",
    location: "Казань, ул. Толбухина, 15, корп. 2",
    info: "Административно-складское здание: офисные и комбинированные помещения.",
    image: obj15,
  },
  {
    id: "tolbuhina-19",
    name: "Толбухина 19",
    location: "Казань, ул. Толбухина, 19",
    info: "Складские помещения различной площади, погрузочная зона.",
    image: obj19,
  },
  {
    id: "patrisa-lumumby-28b",
    name: "Патриса Лумумбы 28Б",
    location: "Казань, ул. Патриса Лумумбы, 28Б",
    info: "Производственно-складская территория с помещениями под разные задачи.",
    image: objLumumby,
  },
];

export const PROPERTY_TYPES = [
  "Офис",
  "Склад",
  "Офис + склад",
  "Другое помещение",
  "Земельный участок",
] as const;

export const PROPERTY_STATUSES = ["Свободно", "В резерве", "Сдано", "Скоро освободится"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type Property = {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  purposes: string[];
  objectId: PropertyObject["id"];
  areaSqm?: number;
  usableAreaSqm?: number;
  rentPricePerSqm?: number;
  totalMonthlyRent?: number;
  utilityCosts?: string;
  status: PropertyStatus;
  expectedRelease?: string;
  ceilingHeight?: string;
  heating?: string;
  electricalSupply?: string;
  has220V?: boolean;
  has380V?: boolean;
  electricPower?: string;
  powerIncrease?: string;
  restroom?: string;
  gates?: {
    count: number;
    widthM?: number;
    heightM?: number;
  };
  airConditioning?: string;
  material?: string;
  accessMode?: string;
  vehicleAccess?: {
    totalLimit?: number;
    tenantLimit?: number;
    guestLimit?: number;
  };
  photos: Array<{ src: string; alt: string }>;
  video?: { url: string; title: string; kind: "file" | "embed"; poster?: string };
  mainFeatures: string[];
  additionalFeatures: string[];
};

export const PROPERTIES: Property[] = [
  {
    id: "property-001",
    slug: "sklad-8-ak-153a",
    title: "Склад №8",
    objectId: "adelya-kutuya-153a",
    type: "Склад",
    purposes: ["Хранение", "Комплектация", "Отгрузка"],
    areaSqm: 133,
    rentPricePerSqm: 1260,
    utilityCosts: "По приборам учёта (ПУ)",
    status: "Свободно",
    ceilingHeight: "6,09 м",
    heating: "Тепловентилятор",
    has220V: true,
    electricPower: "5 (единица измерения не указана в источнике)",
    powerIncrease: "10 (значение и единица измерения требуют уточнения)",
    restroom: "Отсутствует",
    gates: { count: 1, widthM: 3.8, heightM: 3.8 },
    material: "Бетон",
    accessMode: "По графику базы",
    vehicleAccess: { totalLimit: 4 },
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-002",
    slug: "ofis-2-14-tolbuhina-15-2",
    title: "Офис 2.14",
    objectId: "tolbuhina-15-2",
    type: "Офис",
    purposes: ["Рабочее пространство"],
    areaSqm: 48,
    status: "Свободно",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-003",
    slug: "ofis-sklad-3-tolbuhina-19",
    title: "Офис + склад №3",
    objectId: "tolbuhina-19",
    type: "Офис + склад",
    purposes: ["Офис", "Хранение"],
    areaSqm: 212,
    status: "Свободно",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-004",
    slug: "pomeshchenie-5-lumumby-28b",
    title: "Помещение №5",
    objectId: "patrisa-lumumby-28b",
    type: "Другое помещение",
    purposes: ["Другое назначение"],
    areaSqm: 76,
    status: "Свободно",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-005",
    slug: "sklad-12-tolbuhina-19",
    title: "Склад №12",
    objectId: "tolbuhina-19",
    type: "Склад",
    purposes: ["Хранение", "Комплектация", "Отгрузка"],
    areaSqm: 150,
    status: "Скоро освободится",
    expectedRelease: "1 октября",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-006",
    slug: "ofis-1-05-ak-153a",
    title: "Офис 1.05",
    objectId: "adelya-kutuya-153a",
    type: "Офис",
    purposes: ["Рабочее пространство"],
    areaSqm: 64,
    status: "Скоро освободится",
    expectedRelease: "В ноябре",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-007",
    slug: "ofis-sklad-7-tolbuhina-15-2",
    title: "Офис + склад №7",
    objectId: "tolbuhina-15-2",
    type: "Офис + склад",
    purposes: ["Офис", "Хранение"],
    areaSqm: 185,
    status: "Скоро освободится",
    photos: [],
    mainFeatures: [],
    additionalFeatures: [],
  },
];

export const PREMISE_TYPES = [
  { type: "Офис", title: "Офисы", text: "Помещения для команд разного размера", image: typeOffice },
  {
    type: "Склад",
    title: "Склады",
    text: "Хранение, комплектация, отгрузка",
    image: typeWarehouse,
  },
  {
    type: "Офис + склад",
    title: "Офис + склад",
    text: "Один адрес для офиса и склада",
    image: typeCombined,
  },
  {
    type: "Другое помещение",
    title: "Другие помещения",
    text: "Под задачи вашего направления",
    image: typeOther,
  },
  {
    type: "Земельный участок",
    title: "Земельные участки",
    text: "Варианты для задач вашего бизнеса",
    image: objLumumby,
  },
] satisfies Array<{ type: PropertyType; title: string; text: string; image: string }>;

export type PropertyFilters = {
  type: string;
  areaFrom: string;
  areaTo: string;
  object: string;
  cost: "all" | "up-to-1000" | "not-specified";
  purpose: string;
  accessMode: string;
  feature: string;
  status: string;
};

export const INITIAL_PROPERTY_FILTERS: PropertyFilters = {
  type: "",
  areaFrom: "",
  areaTo: "",
  object: "",
  cost: "all",
  purpose: "",
  accessMode: "",
  feature: "",
  status: "",
};

export function getPropertyBySlug(slug: string) {
  return PROPERTIES.find((property) => property.slug === slug);
}

export function getPropertyObject(property: Pick<Property, "objectId">) {
  return OBJECTS.find((object) => object.id === property.objectId);
}

export function getPropertiesByIds(ids: string[]) {
  const idSet = new Set(ids);
  return PROPERTIES.filter((property) => idSet.has(property.id));
}

export const FAQ = [
  {
    q: "Как формируется стоимость аренды?",
    a: "Условия зависят от выбранного помещения. Подробную информацию можно получить у сотрудника компании.",
  },
  {
    q: "Какие документы нужны для заключения договора?",
    a: "Перечень документов зависит от формы вашей организации и выбранного помещения. Точный список подскажет сотрудник компании.",
  },
  {
    q: "Можно ли арендовать часть большого склада?",
    a: "Возможность аренды части помещения рассматривается индивидуально по каждому объекту.",
  },
  {
    q: "Что входит в стоимость аренды?",
    a: "Условия зависят от выбранного помещения. Подробную информацию можно получить у сотрудника компании.",
  },
  {
    q: "Какие электрические мощности доступны?",
    a: "Доступные мощности отличаются по объектам и помещениям. Уточняются при обсуждении конкретного варианта.",
  },
  {
    q: "Можно ли переоборудовать помещение?",
    a: "Для арендаторов предусмотрена возможность оставить заявку на необходимые работы.",
  },
  {
    q: "Какой режим доступа на территорию?",
    a: "Режим доступа зависит от объекта. Подробную информацию можно получить у сотрудника компании.",
  },
  {
    q: "Как расторгнуть договор аренды?",
    a: "Порядок определяется условиями заключённого договора. Детали уточняйте у сотрудника компании.",
  },
];
