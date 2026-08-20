import { getDatabase } from "../db/client";
import { CatalogRepository } from "./catalog.repository";
import { catalogFilterSchema, slugInputSchema } from "./contracts";

export class CatalogService {
  constructor(private readonly repository = new CatalogRepository(getDatabase())) {}
  listProperties(input: unknown) {
    return this.repository.listProperties(catalogFilterSchema.parse(input));
  }
  getProperty(input: unknown) {
    return this.repository.getPropertyBySlug(slugInputSchema.parse(input).slug);
  }
  listObjects() {
    return this.repository.listObjects();
  }
  getObject(input: unknown) {
    return this.repository.getObjectBySlug(slugInputSchema.parse(input).slug);
  }
  listServices() {
    return this.repository.listServices();
  }
}
