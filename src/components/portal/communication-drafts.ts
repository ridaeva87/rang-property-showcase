export function parseDraftSearch(search: Record<string, unknown>) {
  return { draft: typeof search["draft"] === "string" ? search["draft"] : undefined };
}

export function parseMailingSearch(search: Record<string, unknown>) {
  return {
    draft: typeof search["draft"] === "string" ? search["draft"] : undefined,
    view: typeof search["view"] === "string" ? search["view"] : undefined,
  };
}

export function draftEditUrl(pathname: string, id: string) {
  return `${pathname}?draft=${encodeURIComponent(id)}`;
}

export function savedDraftId(currentId: string | undefined, returnedId: string) {
  return currentId || returnedId;
}
