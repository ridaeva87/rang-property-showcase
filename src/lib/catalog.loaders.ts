import type { Property, PropertyStatus, PropertyType } from "@/data/rang";
import {
  getCatalogObject,
  getCatalogProperty,
  listCatalogObjects,
  listCatalogProperties,
} from "./catalog.functions";
import type { CatalogObject, CatalogProperty } from "@/server/catalog/contracts";

const propertyTypes = new Set<PropertyType>([
  "Офис",
  "Склад",
  "Офис + склад",
  "Другое помещение",
  "Земельный участок",
]);
const propertyStatuses = new Set<PropertyStatus>([
  "Свободно",
  "В резерве",
  "Сдано",
  "Скоро освободится",
]);

const characteristic = (property: CatalogProperty, key: string) =>
  property.characteristics.find((item) => item.key === key)?.value;

export function catalogPropertyToViewModel(property: CatalogProperty): Property {
  const gatesCount = Number(characteristic(property, "gates-count"));
  const gatesWidth = Number(characteristic(property, "gates-width"));
  const gatesHeight = Number(characteristic(property, "gates-height"));
  const status = property.status as PropertyStatus | undefined;
  const ceilingHeight = characteristic(property, "ceiling-height");
  const heating = characteristic(property, "heating");
  const electricPower = characteristic(property, "electric-power");
  const powerIncrease = characteristic(property, "power-increase");
  const restroom = characteristic(property, "restroom");
  const airConditioning = characteristic(property, "air-conditioning");
  const material = characteristic(property, "material");
  const accessMode = characteristic(property, "access-mode");
  return {
    id: property.id,
    slug: property.slug,
    title: property.title,
    offerType: property.offerType,
    type: propertyTypes.has(property.type as PropertyType)
      ? (property.type as PropertyType)
      : "Другое помещение",
    purposes: property.purposes,
    objectId: property.objectId,
    ...(property.areaSqm !== undefined ? { areaSqm: property.areaSqm } : {}),
    ...(property.rentPricePerSqm !== undefined
      ? { rentPricePerSqm: property.rentPricePerSqm }
      : {}),
    ...(property.totalMonthlyRent !== undefined
      ? { totalMonthlyRent: property.totalMonthlyRent }
      : {}),
    ...(property.salePrice !== undefined ? { salePrice: property.salePrice } : {}),
    ...(property.purchaseTerms ? { purchaseTerms: property.purchaseTerms } : {}),
    ...(property.utilityCosts ? { utilityCosts: property.utilityCosts } : {}),
    ...(status && propertyStatuses.has(status) ? { status } : {}),
    ...(property.expectedRelease ? { expectedRelease: property.expectedRelease } : {}),
    ...(ceilingHeight ? { ceilingHeight } : {}),
    ...(heating ? { heating } : {}),
    ...(characteristic(property, "power-220") === "Есть" ? { has220V: true } : {}),
    ...(characteristic(property, "power-380") === "Есть" ? { has380V: true } : {}),
    ...(electricPower ? { electricPower } : {}),
    ...(powerIncrease ? { powerIncrease } : {}),
    ...(restroom ? { restroom } : {}),
    ...(Number.isFinite(gatesCount) && gatesCount > 0
      ? {
          gates: {
            count: gatesCount,
            ...(Number.isFinite(gatesWidth) ? { widthM: gatesWidth } : {}),
            ...(Number.isFinite(gatesHeight) ? { heightM: gatesHeight } : {}),
          },
        }
      : {}),
    ...(airConditioning ? { airConditioning } : {}),
    ...(material ? { material } : {}),
    ...(accessMode ? { accessMode } : {}),
    photos: property.media
      .filter((item) => item.kind === "image")
      .map((item) => ({
        src: item.srcSet?.split(",")[0]?.trim().split(" ")[0] ?? item.url,
        alt: item.alt ?? property.title,
        ...(item.srcSet ? { srcSet: item.srcSet } : {}),
      })),
    mainFeatures: [],
    additionalFeatures: [],
  };
}

export const catalogObjectToViewModel = (object: CatalogObject) => ({
  id: object.id,
  slug: object.slug,
  name: object.name,
  address: object.address,
  ...(object.description ? { description: object.description } : {}),
  photos: object.media
    .filter((item) => item.kind === "image")
    .map((item) => ({
      src: item.srcSet?.split(",")[0]?.trim().split(" ")[0] ?? item.url,
      alt: item.alt ?? object.name,
      ...(item.srcSet ? { srcSet: item.srcSet } : {}),
    })),
  territoryFeatures: object.territoryFeatures,
  ...(object.parking ? { parking: object.parking } : {}),
  ...(object.accessMode ? { accessMode: object.accessMode } : {}),
});

export async function loadCatalogProperties(input: {
  offerType?: "rent" | "sale";
  objectId?: string;
}) {
  const properties = await listCatalogProperties({ data: input });
  return properties.map(catalogPropertyToViewModel);
}

export async function loadCatalogProperty(slug: string) {
  const property = await getCatalogProperty({ data: { slug } });
  return property ? catalogPropertyToViewModel(property) : undefined;
}

export async function loadCatalogObjects() {
  return (await listCatalogObjects()).map(catalogObjectToViewModel);
}

export async function loadCatalogObject(slug: string) {
  const object = await getCatalogObject({ data: { slug } });
  return object ? catalogObjectToViewModel(object) : undefined;
}
