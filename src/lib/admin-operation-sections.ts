import { z } from "zod";

export const legacyAdminOperationSectionSchema = z.enum(["leads", "services", "ads"]);

export const adminOperationReadSectionSchema = z.enum([
  "leads", "mailings", "announcements", "services", "ads", "support", "statistics",
]);

export const adminOperationDeleteSectionSchema = z.enum([
  "leads", "mailings", "announcements", "services", "ads",
]);

const readPermissions: Record<z.infer<typeof adminOperationReadSectionSchema>, string> = {
  leads: "leads.manage",
  mailings: "mailings.manage",
  announcements: "announcements.manage",
  services: "services.manage",
  ads: "ads.manage",
  support: "support.manage",
  statistics: "statistics.view",
};

const deletePermissions: Record<z.infer<typeof adminOperationDeleteSectionSchema>, string> = {
  leads: "leads.manage",
  mailings: "mailings.manage",
  announcements: "announcements.manage",
  services: "services.manage",
  ads: "ads.manage",
};

export function adminOperationReadPermission(section: string) {
  const parsed = adminOperationReadSectionSchema.safeParse(section);
  if (!parsed.success) throw new Error("Недопустимый административный раздел");
  return readPermissions[parsed.data];
}

export function adminOperationDeletePermission(section: string) {
  const parsed = adminOperationDeleteSectionSchema.safeParse(section);
  if (!parsed.success) throw new Error("Удаление в этом административном разделе запрещено");
  return deletePermissions[parsed.data];
}

export function assertLegacyAdminOperationSection(section: string): asserts section is z.infer<typeof legacyAdminOperationSectionSchema> {
  if (!legacyAdminOperationSectionSchema.safeParse(section).success)
    throw new Error("Этот раздел нельзя изменять через старый административный обработчик");
}
