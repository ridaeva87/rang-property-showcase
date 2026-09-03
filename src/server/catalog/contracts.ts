import { z } from "zod";

export const catalogFilterSchema = z
  .object({
    offerType: z.enum(["rent", "sale"]).default("rent"),
    type: z.string().trim().max(80).optional(),
    objectId: z.string().trim().max(100).optional(),
    status: z.string().trim().max(80).optional(),
    areaFrom: z.coerce.number().nonnegative().max(1_000_000).optional(),
    areaTo: z.coerce.number().nonnegative().max(1_000_000).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.areaFrom !== undefined &&
      value.areaTo !== undefined &&
      value.areaFrom > value.areaTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["areaTo"],
        message: "areaTo must be greater than or equal to areaFrom",
      });
    }
  });

export const slugInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/),
});

export type CatalogFilter = z.infer<typeof catalogFilterSchema>;

export type CatalogProperty = {
  id: string;
  slug: string;
  title: string;
  offerType: "rent" | "sale";
  type: string;
  status?: string | undefined;
  objectId: string;
  objectName: string;
  objectAddress: string;
  areaSqm?: number | undefined;
  rentPricePerSqm?: number | undefined;
  totalMonthlyRent?: number | undefined;
  salePrice?: number | undefined;
  purchaseTerms?: string | undefined;
  utilityCosts?: string | undefined;
  expectedRelease?: string | undefined;
  purposes: string[];
  characteristics: Array<{
    key: string;
    label: string;
    value: string;
    unit?: string | undefined;
    group?: string | undefined;
    sortOrder: number;
  }>;
  media: Array<{
    id: string;
    kind: "image" | "video" | "document";
    url: string;
    title?: string | undefined;
    alt?: string | undefined;
    srcSet?: string | undefined;
    sortOrder: number;
  }>;
};

export type CatalogObject = {
  id: string;
  slug: string;
  name: string;
  address: string;
  description?: string | undefined;
  parking?: string | undefined;
  accessMode?: string | undefined;
  territoryFeatures: string[];
  media: CatalogProperty["media"];
};

export type CatalogService = {
  id: string;
  title: string;
  description?: string | undefined;
  price?: string | undefined;
  terms?: string | undefined;
};
