import { describe, expect, it } from "vitest";
import { formatPremiseGroupAddress, groupPremisesByAddress } from "./GroupedPremiseOptions";

describe("admin premise grouping", () => {
  it("groups by object and keeps premise labels separate from the address", () => {
    const groups = groupPremisesByAddress([
      { id: "2", title: "ЛИТЕР А Офис №2/3", address: "Казань, ул. Аделя Кутуя, 153А", objectId: "ak" },
      { id: "1", title: "ЛИТЕР А Офис №1", address: "Казань, ул. Аделя Кутуя, 153А", objectId: "ak" },
      { id: "3", title: "Офис 1", address: "Казань, ул. Толбухина, 19", objectId: "t19" },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.address).toBe("Аделя Кутуя, 153А");
    expect(groups[0]?.premises.map((p) => p.id)).toEqual(["1", "2"]);
    expect(groups[0]?.premises[0]?.title).toBe("ЛИТЕР А Офис №1");
  });

  it("normalizes the displayed address without changing its source value", () => {
    const address = "г. Казань, ул. Толбухина, д. 15, корпус 2";
    expect(formatPremiseGroupAddress(address)).toBe("Толбухина, 15 корп. 2");
    expect(address).toBe("г. Казань, ул. Толбухина, д. 15, корпус 2");
  });
});
