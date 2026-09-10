import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/documents/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { getDocumentForCurrentTenant } = await import("@/server/portal/portal.server");
          const document = await getDocumentForCurrentTenant(params.id);
          let body: BodyInit;
          if (document.storageKey.startsWith("private-documents/")) {
            const { readFile } = await import("node:fs/promises");
            const { resolve, sep } = await import("node:path");
            const root = resolve(process.env["PRIVATE_DOCUMENTS_DIR"] || "/var/lib/rang/documents");
            const path = resolve(root, document.storageKey.slice("private-documents/".length));
            if (!path.startsWith(root + sep)) return new Response("Доступ запрещён", { status: 403 });
            body = await readFile(path);
          } else {
            if (!document.url) return new Response("Документ недоступен", { status: 404 });
            const upstream = await fetch(document.url);
            if (!upstream.ok) return new Response("Документ недоступен", { status: 404 });
            body = await upstream.arrayBuffer();
          }
          return new Response(body, {
            headers: {
              "content-type":
                document.mime || "application/octet-stream",
              "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.title)}`,
              "cache-control": "private, no-store",
              "x-content-type-options": "nosniff",
            },
          });
        } catch {
          return new Response("Доступ запрещён", { status: 403 });
        }
      },
    },
  },
});
