import { z } from "zod";

export const legacyAdminOperationSectionSchema = z.enum(["leads", "services", "ads"]);

export function assertLegacyAdminOperationSection(section: string): asserts section is z.infer<typeof legacyAdminOperationSectionSchema> {
  if (!legacyAdminOperationSectionSchema.safeParse(section).success)
    throw new Error("Этот раздел нельзя изменять через старый административный обработчик");
}
