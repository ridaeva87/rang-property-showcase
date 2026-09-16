import { describe, expect, it } from "vitest";
import { formatMeasurement, formatNumericValue } from "./rang";

describe("public characteristic formatting", () => {
  it("removes insignificant decimal zeroes and uses a comma", () => {
    expect(formatNumericValue("2.0000")).toBe("2");
    expect(formatNumericValue("32.8000")).toBe("32,8");
  });

  it("adds a missing unit without duplicating an existing one", () => {
    expect(formatMeasurement("6.09", "м")).toBe("6,09 м");
    expect(formatMeasurement("15 кВт", "кВт")).toBe("15 кВт");
  });
});
