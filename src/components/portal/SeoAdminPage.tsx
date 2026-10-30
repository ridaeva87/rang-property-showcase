import { useState, type FormEvent } from "react";
import { AdminShell } from "./AdminShell";
import { savePageSeo } from "@/lib/seo.functions";

type SeoEntry = {
  key: string;
  kind: "static" | "object" | "premise";
  name: string;
  path: string;
  title: string;
  description: string;
  publicationStatus: string;
  seo: null | {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageUrl: string | null;
  };
};

export function SeoAdminPage({ nav, pages }: { nav: readonly (readonly [string, string, string])[]; pages: SeoEntry[] }) {
  const [selectedKey, setSelectedKey] = useState(pages[0]?.key || "");
  const [message, setMessage] = useState("");
  const selected = pages.find((page) => page.key === selectedKey);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await savePageSeo({ data: {
        pageKey: selected.key,
        path: String(form.get("path") || ""),
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        ogTitle: String(form.get("ogTitle") || ""),
        ogDescription: String(form.get("ogDescription") || ""),
        ogImageUrl: String(form.get("ogImageUrl") || ""),
      } });
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить SEO-настройки");
    }
  }

  return <AdminShell title="SEO страниц" sections={nav}>
    {!pages.length ? <p>Страницы не найдены.</p> : <>
      <label className="grid gap-2 text-sm font-medium">
        Страница
        <select value={selectedKey} onChange={(event) => { setSelectedKey(event.target.value); setMessage(""); }} className="border bg-background p-3">
          {pages.map((page) => <option key={page.key} value={page.key}>{page.name} · {page.publicationStatus}</option>)}
        </select>
      </label>
      {selected && <form key={selected.key} onSubmit={submit} className="mt-5 grid gap-4 border bg-background p-5">
        <label className="grid gap-2 text-sm font-medium">Человекопонятный URL
          <input name="path" required defaultValue={selected.path} readOnly={selected.kind === "static"} className="border p-3 read-only:bg-muted" />
          {selected.kind === "static" && <span className="text-xs font-normal text-muted-foreground">URL системной страницы закреплён существующим маршрутом.</span>}
        </label>
        <label className="grid gap-2 text-sm font-medium">Title
          <input name="title" defaultValue={selected.seo?.title || selected.title} maxLength={300} className="border p-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Description
          <textarea name="description" defaultValue={selected.seo?.description || selected.description} maxLength={1000} className="min-h-24 border p-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Open Graph title
          <input name="ogTitle" defaultValue={selected.seo?.ogTitle || ""} maxLength={300} placeholder="Если пусто, используется Title" className="border p-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Open Graph description
          <textarea name="ogDescription" defaultValue={selected.seo?.ogDescription || ""} maxLength={1000} placeholder="Если пусто, используется Description" className="min-h-24 border p-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Open Graph изображение
          <input name="ogImageUrl" type="url" defaultValue={selected.seo?.ogImageUrl || ""} placeholder="https://…" className="border p-3" />
        </label>
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <button className="w-fit bg-primary px-5 py-3 font-medium text-primary-foreground">Сохранить</button>
      </form>}
    </>}
  </AdminShell>;
}
