import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/documents/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { getDocumentForCurrentTenant } = await import("@/server/portal/portal.server");
          const document = await getDocumentForCurrentTenant(params.id);
          const upstream = await fetch(document.url);
          if (!upstream.ok || !upstream.body)
            return new Response("Документ недоступен", { status: 404 });
          return new Response(upstream.body, {
            headers: {
              "content-type":
                document.mime || upstream.headers.get("content-type") || "application/octet-stream",
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
