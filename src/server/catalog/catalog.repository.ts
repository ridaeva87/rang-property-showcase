import { and, asc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import type { CatalogFilter, CatalogObject, CatalogProperty, CatalogService } from "./contracts";

export type RangDatabase = NodePgDatabase<typeof schema>;

const numberValue = (value: string | null) => (value === null ? undefined : Number(value));

export class CatalogRepository {
  constructor(private readonly db: RangDatabase) {}

  async listProperties(filter: CatalogFilter): Promise<CatalogProperty[]> {
    const conditions: SQL[] = [
      eq(schema.premises.publicationStatus, "published"),
      eq(schema.propertyOffers.publicationStatus, "published"),
      eq(schema.propertyOffers.type, filter.offerType),
    ];
    if (filter.type) conditions.push(eq(schema.premiseTypes.name, filter.type));
    if (filter.objectId) conditions.push(eq(schema.premises.objectId, filter.objectId));
    if (filter.status) conditions.push(eq(schema.premiseStatuses.name, filter.status));
    if (filter.areaFrom !== undefined)
      conditions.push(gte(schema.premises.areaSqm, String(filter.areaFrom)));
    if (filter.areaTo !== undefined)
      conditions.push(lte(schema.premises.areaSqm, String(filter.areaTo)));

    const rows = await this.db
      .select({
        id: schema.premises.id,
        slug: schema.premises.slug,
        title: schema.premises.title,
        objectId: schema.premises.objectId,
        objectName: schema.propertyObjects.name,
        objectAddress: schema.propertyObjects.address,
        type: schema.premiseTypes.name,
        status: schema.premiseStatuses.name,
        areaSqm: schema.premises.areaSqm,
        expectedRelease: schema.premises.expectedReleaseLabel,
        offerType: schema.propertyOffers.type,
        rentPricePerSqm: schema.propertyOffers.rentPricePerSqm,
        totalMonthlyRent: schema.propertyOffers.totalMonthlyRent,
        salePrice: schema.propertyOffers.salePrice,
        purchaseTerms: schema.propertyOffers.purchaseTerms,
        utilityCosts: schema.propertyOffers.utilityCosts,
      })
      .from(schema.premises)
      .innerJoin(schema.propertyObjects, eq(schema.premises.objectId, schema.propertyObjects.id))
      .innerJoin(schema.premiseTypes, eq(schema.premises.typeId, schema.premiseTypes.id))
      .leftJoin(schema.premiseStatuses, eq(schema.premises.statusId, schema.premiseStatuses.id))
      .innerJoin(schema.propertyOffers, eq(schema.premises.id, schema.propertyOffers.premiseId))
      .where(and(...conditions))
      .orderBy(asc(schema.premises.title));

    return this.hydrateProperties(rows);
  }

  async getPropertyBySlug(slug: string): Promise<CatalogProperty | undefined> {
    const row = (
      await this.db
        .select({
          id: schema.premises.id,
          slug: schema.premises.slug,
          title: schema.premises.title,
          objectId: schema.premises.objectId,
          objectName: schema.propertyObjects.name,
          objectAddress: schema.propertyObjects.address,
          type: schema.premiseTypes.name,
          status: schema.premiseStatuses.name,
          areaSqm: schema.premises.areaSqm,
          expectedRelease: schema.premises.expectedReleaseLabel,
          offerType: schema.propertyOffers.type,
          rentPricePerSqm: schema.propertyOffers.rentPricePerSqm,
          totalMonthlyRent: schema.propertyOffers.totalMonthlyRent,
          salePrice: schema.propertyOffers.salePrice,
          purchaseTerms: schema.propertyOffers.purchaseTerms,
          utilityCosts: schema.propertyOffers.utilityCosts,
        })
        .from(schema.premises)
        .innerJoin(schema.propertyObjects, eq(schema.premises.objectId, schema.propertyObjects.id))
        .innerJoin(schema.premiseTypes, eq(schema.premises.typeId, schema.premiseTypes.id))
        .leftJoin(schema.premiseStatuses, eq(schema.premises.statusId, schema.premiseStatuses.id))
        .innerJoin(schema.propertyOffers, eq(schema.premises.id, schema.propertyOffers.premiseId))
        .where(
          and(
            eq(schema.premises.slug, slug),
            eq(schema.premises.publicationStatus, "published"),
            eq(schema.propertyOffers.publicationStatus, "published"),
          ),
        )
        .limit(1)
    )[0];
    return row ? this.hydrateProperty(row) : undefined;
  }

  async listObjects(): Promise<CatalogObject[]> {
    const rows = await this.db
      .select()
      .from(schema.propertyObjects)
      .where(eq(schema.propertyObjects.publicationStatus, "published"))
      .orderBy(asc(schema.propertyObjects.name));
    return Promise.all(rows.map((row) => this.hydrateObject(row)));
  }

  async getObjectBySlug(slug: string): Promise<CatalogObject | undefined> {
    const row = (
      await this.db
        .select()
        .from(schema.propertyObjects)
        .where(
          and(
            eq(schema.propertyObjects.slug, slug),
            eq(schema.propertyObjects.publicationStatus, "published"),
          ),
        )
        .limit(1)
    )[0];
    return row ? this.hydrateObject(row) : undefined;
  }

  async listServices(): Promise<CatalogService[]> {
    return (
      await this.db
        .select()
        .from(schema.additionalServices)
        .where(eq(schema.additionalServices.publicationStatus, "published"))
        .orderBy(asc(schema.additionalServices.title))
    ).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      price: row.priceDescription ?? undefined,
      terms: row.terms ?? undefined,
    }));
  }

  private async hydrateProperty(row: {
    id: string;
    slug: string;
    title: string;
    objectId: string;
    objectName: string;
    objectAddress: string;
    type: string;
    status: string | null;
    areaSqm: string | null;
    expectedRelease: string | null;
    offerType: "rent" | "sale";
    rentPricePerSqm: string | null;
    totalMonthlyRent: string | null;
    salePrice: string | null;
    purchaseTerms: string | null;
    utilityCosts: string | null;
  }): Promise<CatalogProperty> {
    return (await this.hydrateProperties([row]))[0]!;
  }

  private async hydrateProperties(
    rows: Array<{
      id: string;
      slug: string;
      title: string;
      objectId: string;
      objectName: string;
      objectAddress: string;
      type: string;
      status: string | null;
      areaSqm: string | null;
      expectedRelease: string | null;
      offerType: "rent" | "sale";
      rentPricePerSqm: string | null;
      totalMonthlyRent: string | null;
      salePrice: string | null;
      purchaseTerms: string | null;
      utilityCosts: string | null;
    }>,
  ): Promise<CatalogProperty[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const [purposes, characteristics, media] = await Promise.all([
      this.db
        .select({
          premiseId: schema.premisePurposes.premiseId,
          purpose: schema.premisePurposes.purpose,
        })
        .from(schema.premisePurposes)
        .where(inArray(schema.premisePurposes.premiseId, ids))
        .orderBy(asc(schema.premisePurposes.premiseId), asc(schema.premisePurposes.purpose)),
      this.db
        .select()
        .from(schema.premiseCharacteristics)
        .where(inArray(schema.premiseCharacteristics.premiseId, ids))
        .orderBy(
          asc(schema.premiseCharacteristics.premiseId),
          asc(schema.premiseCharacteristics.sortOrder),
        ),
      this.db
        .select({
          premiseId: schema.premiseMedia.premiseId,
          id: schema.mediaAssets.id,
          kind: schema.mediaAssets.kind,
          publicUrl: schema.mediaAssets.publicUrl,
          storageKey: schema.mediaAssets.storageKey,
          title: schema.mediaAssets.title,
          alt: schema.mediaAssets.altText,
          metadata: schema.mediaAssets.metadata,
          sortOrder: schema.premiseMedia.sortOrder,
        })
        .from(schema.premiseMedia)
        .innerJoin(schema.mediaAssets, eq(schema.premiseMedia.mediaId, schema.mediaAssets.id))
        .where(inArray(schema.premiseMedia.premiseId, ids))
        .orderBy(asc(schema.premiseMedia.premiseId), asc(schema.premiseMedia.sortOrder)),
    ]);

    return rows.map((row) => {
      const rowPurposes = purposes.filter((item) => item.premiseId === row.id);
      const rowCharacteristics = characteristics.filter((item) => item.premiseId === row.id);
      const rowMedia = media.filter((item) => item.premiseId === row.id);
      return {
        ...row,
        status: row.status ?? undefined,
        areaSqm: numberValue(row.areaSqm),
        expectedRelease: row.expectedRelease ?? undefined,
        rentPricePerSqm: numberValue(row.rentPricePerSqm),
        totalMonthlyRent: numberValue(row.totalMonthlyRent),
        salePrice: numberValue(row.salePrice),
        purchaseTerms: row.purchaseTerms ?? undefined,
        utilityCosts: row.utilityCosts ?? undefined,
        purposes: rowPurposes.map((item) => item.purpose),
        characteristics: rowCharacteristics.map((item) => ({
          key: item.key,
          label: item.label,
          value: item.valueText ?? item.valueNumber ?? "",
          unit: item.unit ?? undefined,
          group: item.groupName ?? undefined,
          sortOrder: item.sortOrder,
        })),
        media: rowMedia.map((item) => ({
          id: item.id,
          kind: item.kind,
          url: item.publicUrl ?? item.storageKey,
          title: item.title ?? undefined,
          alt: item.alt ?? undefined,
          srcSet: Array.isArray(item.metadata["variants"])
            ? (item.metadata["variants"] as Array<{ url: string; width: number }>)
                .map((variant) => `${variant.url} ${variant.width}w`)
                .join(", ")
            : undefined,
          sortOrder: item.sortOrder,
        })),
      };
    });
  }

  private async hydrateObject(
    row: typeof schema.propertyObjects.$inferSelect,
  ): Promise<CatalogObject> {
    const media = await this.db
      .select({
        id: schema.mediaAssets.id,
        kind: schema.mediaAssets.kind,
        publicUrl: schema.mediaAssets.publicUrl,
        storageKey: schema.mediaAssets.storageKey,
        title: schema.mediaAssets.title,
        alt: schema.mediaAssets.altText,
        metadata: schema.mediaAssets.metadata,
        sortOrder: schema.objectMedia.sortOrder,
      })
      .from(schema.objectMedia)
      .innerJoin(schema.mediaAssets, eq(schema.objectMedia.mediaId, schema.mediaAssets.id))
      .where(eq(schema.objectMedia.objectId, row.id))
      .orderBy(asc(schema.objectMedia.sortOrder));
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      address: row.address,
      description: row.description ?? undefined,
      parking: row.parking ?? undefined,
      accessMode: row.accessMode ?? undefined,
      territoryFeatures: row.territoryFeatures,
      media: media.map((item) => ({
        id: item.id,
        kind: item.kind,
        url: item.publicUrl ?? item.storageKey,
        title: item.title ?? undefined,
        alt: item.alt ?? undefined,
        srcSet: Array.isArray(item.metadata["variants"])
          ? (item.metadata["variants"] as Array<{ url: string; width: number }>)
              .map((variant) => `${variant.url} ${variant.width}w`)
              .join(", ")
          : undefined,
        sortOrder: item.sortOrder,
      })),
    };
  }
}
