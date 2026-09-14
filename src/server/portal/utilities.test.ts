import { describe, expect, it } from "vitest";
import { attachMeterReadings, displayReading, validateReading } from "./utilities.server";
describe("meter reading validation", () => {
  it("accepts a valid monotonic reading", () => expect(validateReading(12.5, 10, true)).toBe(12.5));
  it("rejects decreasing monotonic readings", () =>
    expect(() => validateReading(9, 10, true)).toThrow());
  it("allows a reset-capable meter to decrease", () =>
    expect(validateReading(1, 10, false)).toBe(1));
  it.each([NaN, -1, 1_000_000_000_001])("rejects invalid value %s", (value) =>
    expect(() => validateReading(value, null, true)).toThrow(),
  );
});
describe("reading display", () => {
  it("removes technical zeroes", () => {
    expect(displayReading("1000.0000")).toBe("1000");
    expect(displayReading("1000.5000")).toBe("1000,5");
  });
});
describe("independent meters", () => {
  it("never mixes readings between meters in one premise", () => {
    const rows = attachMeterReadings(
      [{ id: "electric" }, { id: "water" }],
      [
        { meterId: "electric", value: 1000 },
        { meterId: "electric", value: 1000.5 },
      ],
    );
    expect(rows[0]?.readings).toHaveLength(2);
    expect(rows[1]?.readings).toHaveLength(0);
    expect(rows[1]?.previous).toBeNull();
  });
});
