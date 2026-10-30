import { z } from "zod";

export const SEO_MANAGE_PERMISSION = "services.manage";
export const SITE_ORIGIN = "https://rangpro.ru";

export const STATIC_SEO_PAGES = [
  { key: "static:home", name: "Главная", path: "/", title: "РАНГ — аренда офисов и складов в Казани с 1993 года", description: "Коммерческие помещения в Казани: офисы, склады и помещения «офис + склад» в аренду и на продажу. Свободные помещения, объекты компании и услуги для арендаторов." },
  { key: "static:rent", name: "Аренда", path: "/rent", title: "Аренда коммерческих помещений — РАНГ", description: "Долгосрочная и краткосрочная аренда офисов, складов и других коммерческих помещений компании «РАНГ» в Казани." },
  { key: "static:sale", name: "Продажа", path: "/sale", title: "Недвижимость на продажу — РАНГ", description: "Объекты недвижимости компании «РАНГ», доступные для покупки в Казани." },
  { key: "static:objects", name: "Объекты", path: "/objects", title: "Объекты компании РАНГ — Казань", description: "Объекты коммерческой недвижимости компании РАНГ и помещения внутри каждого объекта." },
  { key: "static:properties", name: "Каталог помещений", path: "/properties", title: "Каталог коммерческих помещений — РАНГ", description: "Свободные и скоро освобождающиеся офисы, склады и комбинированные помещения компании «РАНГ» в Казани." },
  { key: "static:services", name: "Дополнительные услуги", path: "/services", title: "Дополнительные услуги — РАНГ", description: "Структура дополнительных работ для помещений РАНГ. Перечень, стоимость и условия уточняются компанией." },
  { key: "static:about", name: "О компании", path: "/about", title: "История компании РАНГ — с 1993 года", description: "История компании РАНГ, архивные материалы и историческая лицензия 1994 года." },
  { key: "static:businesses", name: "Бизнесы арендаторов", path: "/businesses", title: "Бизнесы наших арендаторов — РАНГ", description: "Товары, услуги и специальные предложения арендаторов РАНГ." },
  { key: "static:privacy", name: "Политика конфиденциальности", path: "/privacy-policy", title: "Политика конфиденциальности — РАНГ", description: "Политика конфиденциальности ЗАО «РАНГ»." },
  { key: "static:personal-data-consent", name: "Согласие на обработку персональных данных", path: "/personal-data-consent", title: "Согласие на обработку персональных данных — РАНГ", description: "Согласие на обработку персональных данных ЗАО «РАНГ»." },
] as const;

export type SeoOverrides = {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
};

export const seoInputSchema = z.object({
  pageKey: z.string().min(1),
  path: z.string().trim().startsWith("/").max(300),
  title: z.string().trim().max(300),
  description: z.string().trim().max(1000),
  ogTitle: z.string().trim().max(300),
  ogDescription: z.string().trim().max(1000),
  ogImageUrl: z.string().trim().url("Укажите полный URL изображения").optional().or(z.literal("")),
});

const nullable = (value: string) => value.trim() || null;

export function normalizeSeoInput(input: z.infer<typeof seoInputSchema>) {
  return {
    title: nullable(input.title),
    description: nullable(input.description),
    ogTitle: nullable(input.ogTitle),
    ogDescription: nullable(input.ogDescription),
    ogImageUrl: nullable(input.ogImageUrl || ""),
  };
}

export function slugFromSeoPath(kind: "object" | "premise", path: string) {
  const prefix = kind === "object" ? "/objects/" : "/properties/";
  if (!path.startsWith(prefix)) throw new Error("URL не соответствует типу страницы");
  const slug = path.slice(prefix.length);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("URL должен содержать только латинские буквы, цифры и дефисы");
  return slug;
}

export function buildSeoHead(defaults: { title: string; description: string; path: string; image?: string }, overrides?: SeoOverrides | null) {
  const title = overrides?.title || defaults.title;
  const description = overrides?.description || defaults.description;
  const ogTitle = overrides?.ogTitle || title;
  const ogDescription = overrides?.ogDescription || description;
  const image = overrides?.ogImageUrl || defaults.image;
  const canonical = `${SITE_ORIGIN}${defaults.path === "/" ? "" : defaults.path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical },
      ...(image ? [{ property: "og:image", content: image }] : []),
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!);

export function buildSitemapXml(paths: string[]) {
  const uniquePaths = [...new Set(paths)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniquePaths.map((path) => `  <url><loc>${escapeXml(`${SITE_ORIGIN}${path === "/" ? "" : path}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
}
