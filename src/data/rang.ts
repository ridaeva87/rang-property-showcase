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

export const OBJECTS = [
  {
    name: "АК 153А",
    location: "Казань, ул. Академика Королёва, 153А",
    info: "Офисно-складской комплекс с закрытой территорией и подъездом для грузового транспорта.",
    image: objAk,
  },
  {
    name: "Толбухина 15-2",
    location: "Казань, ул. Толбухина, 15, корп. 2",
    info: "Административно-складское здание: офисные и комбинированные помещения.",
    image: obj15,
  },
  {
    name: "Толбухина 19",
    location: "Казань, ул. Толбухина, 19",
    info: "Складские помещения различной площади, погрузочная зона.",
    image: obj19,
  },
  {
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
  object: string;
  address: string;
  areaSqm?: number;
  rentPriceLabel?: string;
  rentPricePerSqm?: number;
  status: PropertyStatus;
  expectedRelease?: string;
  accessMode?: string;
  photos: string[];
  mainFeatures: string[];
  additionalFeatures: string[];
};

export const PROPERTIES: Property[] = [
  {
    id: "property-001",
    slug: "sklad-8-ak-153a",
    title: "Склад №8",
    object: "АК 153А",
    address: "Казань, ул. Академика Королёва, 153А",
    type: "Склад",
    purposes: ["Хранение", "Комплектация", "Отгрузка"],
    areaSqm: 133,
    rentPriceLabel: "от 900 ₽/м²",
    rentPricePerSqm: 900,
    status: "Свободно",
    accessMode: "Круглосуточный доступ",
    photos: [typeWarehouse],
    mainFeatures: ["Отдельный вход", "Подъезд для грузового транспорта"],
    additionalFeatures: [],
  },
  {
    id: "property-002",
    slug: "ofis-2-14-tolbuhina-15-2",
    title: "Офис 2.14",
    object: "Толбухина 15-2",
    address: "Казань, ул. Толбухина, 15, корп. 2",
    type: "Офис",
    purposes: ["Рабочее пространство"],
    areaSqm: 48,
    rentPriceLabel: "Цена по запросу",
    status: "Свободно",
    photos: [typeOffice],
    mainFeatures: ["Отделка выполнена"],
    additionalFeatures: ["Интернет", "Парковка"],
  },
  {
    id: "property-003",
    slug: "ofis-sklad-3-tolbuhina-19",
    title: "Офис + склад №3",
    object: "Толбухина 19",
    address: "Казань, ул. Толбухина, 19",
    type: "Офис + склад",
    purposes: ["Офис", "Хранение"],
    areaSqm: 212,
    rentPriceLabel: "Цена по запросу",
    status: "Свободно",
    photos: [typeCombined],
    mainFeatures: ["Офисный блок", "Складская зона"],
    additionalFeatures: ["Ворота"],
  },
  {
    id: "property-004",
    slug: "pomeshchenie-5-lumumby-28b",
    title: "Помещение №5",
    object: "Патриса Лумумбы 28Б",
    address: "Казань, ул. Патриса Лумумбы, 28Б",
    type: "Другое помещение",
    purposes: ["Другое назначение"],
    areaSqm: 76,
    rentPriceLabel: "Цена по запросу",
    status: "Свободно",
    photos: [typeOther],
    mainFeatures: ["Отдельный вход", "Технические коммуникации"],
    additionalFeatures: ["Закрытая территория"],
  },
  {
    id: "property-005",
    slug: "sklad-12-tolbuhina-19",
    title: "Склад №12",
    object: "Толбухина 19",
    address: "Казань, ул. Толбухина, 19",
    type: "Склад",
    purposes: ["Хранение", "Комплектация", "Отгрузка"],
    areaSqm: 150,
    status: "Скоро освободится",
    expectedRelease: "1 октября",
    photos: [typeWarehouse],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-006",
    slug: "ofis-1-05-ak-153a",
    title: "Офис 1.05",
    object: "АК 153А",
    address: "Казань, ул. Академика Королёва, 153А",
    type: "Офис",
    purposes: ["Рабочее пространство"],
    areaSqm: 64,
    status: "Скоро освободится",
    expectedRelease: "В ноябре",
    photos: [typeOffice],
    mainFeatures: [],
    additionalFeatures: [],
  },
  {
    id: "property-007",
    slug: "ofis-sklad-7-tolbuhina-15-2",
    title: "Офис + склад №7",
    object: "Толбухина 15-2",
    address: "Казань, ул. Толбухина, 15, корп. 2",
    type: "Офис + склад",
    purposes: ["Офис", "Хранение"],
    areaSqm: 185,
    status: "Скоро освободится",
    photos: [typeCombined],
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
  cost: "all" | "up-to-1000" | "on-request";
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
