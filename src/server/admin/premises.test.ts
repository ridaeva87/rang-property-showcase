import { describe, expect, it } from "vitest";
import {
  isPremiseMediaMimeAllowed,
  hasPremiseMediaSignature,
  normalizePremisePurposes,
  premiseOfferPublication,
} from "./admin.server";
import { documentTarget } from "@/server/portal/portal.server";
import { hasPermission } from "@/server/requests/access";

describe("property and premise administration", () => {
  it("keeps only the selected offer active", () => {
    expect(premiseOfferPublication({ selectedType: "sale", publication: "published" })).toEqual({
      selected: { type: "sale", publication: "published" },
      other: { type: "rent", publication: "archived" },
    });
    expect(premiseOfferPublication({ selectedType: "rent", publication: "archived" }).other).toEqual({
      type: "sale",
      publication: "archived",
    });
  });

  it("normalizes related purposes without duplicates", () => {
    expect(normalizePremisePurposes([" Склад ", "Офис", "Склад", ""])).toEqual([
      "Склад",
      "Офис",
    ]);
  });

  it("accepts only supported photo and video content types", () => {
    expect(isPremiseMediaMimeAllowed("photo", "image/webp")).toBe(true);
    expect(isPremiseMediaMimeAllowed("video", "video/mp4")).toBe(true);
    expect(isPremiseMediaMimeAllowed("photo", "image/svg+xml")).toBe(false);
    expect(isPremiseMediaMimeAllowed("video", "text/html")).toBe(false);
    expect(hasPremiseMediaSignature("photo", Uint8Array.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(hasPremiseMediaSignature("video", Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    expect(hasPremiseMediaSignature("video", Buffer.from("not a video"))).toBe(false);
  });

  it("requires the existing premises permission", () => {
    expect(hasPermission([], ["premises.manage"], "premises.manage")).toBe(true);
    expect(hasPermission([], ["documents.manage"], "premises.manage")).toBe(false);
  });
});

describe("object and premise document targets", () => {
  it("stores exactly one existing relation type", () => {
    expect(documentTarget({ objectId: "object-1" })).toEqual({
      recipientUserId: null,
      premiseId: null,
      objectId: "object-1",
    });
    expect(documentTarget({ premiseId: "premise-1" })).toEqual({
      recipientUserId: null,
      premiseId: "premise-1",
      objectId: null,
    });
  });

  it("rejects missing and ambiguous relations", () => {
    expect(() => documentTarget({})).toThrow("Выберите одного получателя");
    expect(() => documentTarget({ objectId: "object-1", premiseId: "premise-1" })).toThrow(
      "Выберите одного получателя",
    );
  });
});
