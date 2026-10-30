import { describe, expect, it } from "vitest";
import { buildSeoHead, buildSitemapXml, SEO_MANAGE_PERMISSION, slugFromSeoPath } from "./seo";
import { hasPermission } from "@/server/requests/access";

describe("basic SEO management", () => {
  it("uses saved metadata while preserving the existing canonical route", () => {
    const head = buildSeoHead({ title: "Default", description: "Default description", path: "/rent" }, {
      title: "Saved", description: "Saved description", ogTitle: "OG", ogDescription: null, ogImageUrl: "https://rangpro.ru/image.jpg",
    });
    expect(head.meta).toContainEqual({ title: "Saved" });
    expect(head.meta).toContainEqual({ property: "og:description", content: "Saved description" });
    expect(head.links).toEqual([{ rel: "canonical", href: "https://rangpro.ru/rent" }]);
  });

  it("accepts only an existing object or premise route format", () => {
    expect(slugFromSeoPath("object", "/objects/adelya-153a")).toBe("adelya-153a");
    expect(slugFromSeoPath("premise", "/properties/sklad-8")).toBe("sklad-8");
    expect(() => slugFromSeoPath("premise", "/objects/sklad-8")).toThrow();
    expect(() => slugFromSeoPath("object", "/objects/Объект")).toThrow();
  });

  it("builds a deduplicated XML sitemap and escapes URLs", () => {
    const xml = buildSitemapXml(["/", "/objects/a&b", "/"]);
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).toContain("https://rangpro.ru/objects/a&amp;b");
  });

  it("uses the existing content-management permission", () => {
    expect(SEO_MANAGE_PERMISSION).toBe("services.manage");
    expect(hasPermission([], ["services.manage"], SEO_MANAGE_PERMISSION)).toBe(true);
    expect(hasPermission([], ["requests.manage"], SEO_MANAGE_PERMISSION)).toBe(false);
  });
});
