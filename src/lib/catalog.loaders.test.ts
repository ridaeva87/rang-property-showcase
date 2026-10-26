import { describe, expect, it } from "vitest";
import { catalogPropertyToViewModel } from "./catalog.loaders";
import type { CatalogProperty } from "@/server/catalog/contracts";

describe("public property media", () => {
  it("passes existing usable area and video to the public card", () => {
    const property: CatalogProperty = {
      id: "premise-1",
      slug: "premise-1",
      title: "Склад №1",
      offerType: "rent",
      type: "Склад",
      objectId: "object-1",
      objectName: "Объект",
      objectAddress: "Адрес",
      areaSqm: 120,
      usableAreaSqm: 110,
      purposes: [],
      characteristics: [],
      media: [
        {
          id: "video-1",
          kind: "video",
          url: "https://media.example.test/premise.mp4",
          title: "Обзор",
          sortOrder: 1,
        },
      ],
    };

    const view = catalogPropertyToViewModel(property);

    expect(view.usableAreaSqm).toBe(110);
    expect(view.video).toEqual({
      url: "https://media.example.test/premise.mp4",
      title: "Обзор",
      kind: "file",
    });
  });
});
