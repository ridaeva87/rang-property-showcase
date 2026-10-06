import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const askRangAssistant = createServerFn({ method: "POST" })
  .validator(z.object({
    question: z.string().trim().min(2).max(1000),
    premiseId: z.string().optional(),
    objectId: z.string().optional(),
    source: z.enum(["public", "tenant_portal"]).default("public"),
  }))
  .handler(async ({ data }) => (await import("@/server/assistant/assistant.server")).answerAssistant(data));

export const transferRangAssistantQuestion = createServerFn({ method: "POST" })
  .validator(z.object({
    question: z.string().trim().min(2).max(2000),
    context: z.string().max(3000).optional(),
    premiseId: z.string().optional(),
    objectId: z.string().optional(),
    serviceId: z.string().optional(),
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().email().optional().or(z.literal("")),
    source: z.enum(["public", "tenant_portal"]).default("public"),
  }))
  .handler(async ({ data }) => (await import("@/server/assistant/assistant.server")).transferAssistantQuestion(data));
