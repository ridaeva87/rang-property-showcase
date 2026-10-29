import { describe, expect, it } from "vitest";
import { serviceEditScrollOptions } from "./AdminOperationsPage";

describe("additional service edit navigation", () => {
  it("scrolls the existing form into view only for additional services", () => {
    expect(serviceEditScrollOptions("services")).toEqual({ top: 0, behavior: "smooth" });
    expect(serviceEditScrollOptions("leads")).toBeNull();
    expect(serviceEditScrollOptions("ads")).toBeNull();
  });
});
