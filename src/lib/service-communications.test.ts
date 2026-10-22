import { describe, expect, it } from "vitest";
import { assertServiceCommunicationBasis } from "./service-communications";

describe("service communication basis", () => {
  it("allows a mass operational message with an approved existing category", () => {
    expect(() => assertServiceCommunicationBasis({
      category: "Плановые работы",
      audience: { scope: "all" },
    })).not.toThrow();
  });

  it("rejects a mass message without a verified operational basis", () => {
    expect(() => assertServiceCommunicationBasis({
      audience: { scope: "object" },
    })).toThrow("подтверждённую категорию");
  });

  it("does not treat a general announcement label as a service basis", () => {
    expect(() => assertServiceCommunicationBasis({
      category: "Общие объявления",
      audience: { scope: "all" },
    })).toThrow("подтверждённую категорию");
  });

  it("allows an individual work message to a selected tenant", () => {
    expect(() => assertServiceCommunicationBasis({
      audience: { scope: "tenant" },
    })).not.toThrow();
  });

  it("preserves system-linked waitlist notifications", () => {
    expect(() => assertServiceCommunicationBasis({
      audience: { scope: "tenant" },
      systemLinkedRecipient: true,
    })).not.toThrow();
  });
});
