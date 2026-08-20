import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { catalogFilterSchema, slugInputSchema } from "./contracts";

const safeError = (error: unknown) => {
  console.error("Catalog server operation failed", error);
  throw new Error("Не удалось получить данные каталога");
};

export const listCatalogProperties = createServerFn({ method: "GET" })
  .inputValidator(catalogFilterSchema)
  .handler(async ({ data }) => {
    try {
      const { CatalogService } = await import("./catalog.service");
      return await new CatalogService().listProperties(data);
    } catch (error) {
      return safeError(error);
    }
  });

export const getCatalogProperty = createServerFn({ method: "GET" })
  .inputValidator(slugInputSchema)
  .handler(async ({ data }) => {
    try {
      const { CatalogService } = await import("./catalog.service");
      return await new CatalogService().getProperty(data);
    } catch (error) {
      return safeError(error);
    }
  });

export const listCatalogObjects = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { CatalogService } = await import("./catalog.service");
    return await new CatalogService().listObjects();
  } catch (error) {
    return safeError(error);
  }
});

export const getCatalogObject = createServerFn({ method: "GET" })
  .inputValidator(slugInputSchema)
  .handler(async ({ data }) => {
    try {
      const { CatalogService } = await import("./catalog.service");
      return await new CatalogService().getObject(data);
    } catch (error) {
      return safeError(error);
    }
  });

export const listCatalogServices = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { CatalogService } = await import("./catalog.service");
    return await new CatalogService().listServices();
  } catch (error) {
    return safeError(error);
  }
});

export const catalogApiVersion = createServerFn({ method: "GET" })
  .inputValidator(z.object({}))
  .handler(() => ({ version: 1 as const }));
