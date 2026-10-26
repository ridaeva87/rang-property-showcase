import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/documents/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const origin = request.headers.get("origin");
          if (
            origin &&
            !["https://rangpro.ru", "https://www.rangpro.ru"].includes(new URL(origin).origin)
          )
            return new Response("Доступ запрещён", { status: 403 });
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) throw new Error("Файл не выбран");
          const { savePrivateDocumentAdmin } = await import("@/server/portal/portal.server");
          const date = String(form.get("date") || "");
          const targetKind = String(form.get("targetKind") || "");
          const targetId = String(form.get("targetId") || "");
          await savePrivateDocumentAdmin({
            ...(targetKind === "tenant"
              ? { userId: targetId }
              : targetKind === "premise"
                ? { premiseId: targetId }
                : targetKind === "object"
                  ? { objectId: targetId }
                  : {}),
            title: String(form.get("title")),
            type: String(form.get("type")),
            ...(date ? { date } : {}),
            file,
          });
          return new Response(null, {
            status: 303,
            headers: { location: "/admin/documents?uploaded=1" },
          });
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Ошибка", { status: 400 });
        }
      },
    },
  },
});
