import { describe, expect, it } from "vitest";
import { draftEditUrl, parseDraftSearch, parseMailingSearch, savedDraftId } from "./communication-drafts";

describe("mailing draft lifecycle", () => {
  it("opens an existing draft from the route search parameter", () => {
    expect(parseDraftSearch({ draft: "draft-1" })).toEqual({ draft: "draft-1" });
    expect(parseDraftSearch({ draft: 42 })).toEqual({ draft: undefined });
  });

  it("builds a stable edit link for the saved draft", () => {
    expect(draftEditUrl("/admin/mailings", "draft id/1")).toBe("/admin/mailings?draft=draft%20id%2F1");
  });

  it("keeps view and edit links as separate safe modes", () => {
    expect(parseMailingSearch({ draft: "draft-1" })).toEqual({ draft: "draft-1", view: undefined });
    expect(parseMailingSearch({ view: "sent-1" })).toEqual({ draft: undefined, view: "sent-1" });
  });

  it("keeps the ID returned by the first save for later edits", () => {
    let currentId: string | undefined;
    currentId = savedDraftId(currentId, "created-id");
    expect(currentId).toBe("created-id");
    expect(savedDraftId(currentId, "unexpected-new-id")).toBe("created-id");
  });

  it("updates one draft instead of creating duplicates", () => {
    const drafts = new Map<string, string>();
    let currentId: string | undefined;
    const save = (body: string) => {
      const returnedId = currentId || "created-id";
      drafts.set(returnedId, body);
      currentId = savedDraftId(currentId, returnedId);
    };

    save("Первый текст");
    save("Отредактированный текст");

    expect(drafts.size).toBe(1);
    expect(drafts.get("created-id")).toBe("Отредактированный текст");
  });
});
