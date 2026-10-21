import { describe, expect, it, vi } from "vitest";
import { createRecipientCountController, type RecipientCountState } from "./recipient-count";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

describe("automatic recipient count", () => {
  it("shows loading and then the current count", async () => {
    const states: RecipientCountState[] = [];
    const controller = createRecipientCountController({ load: async () => 12, update: (state) => states.push(state) });
    await controller.select({ scope: "all" });
    expect(states).toEqual([{ status: "loading", count: 0 }, { status: "ready", count: 12 }]);
  });

  it("shows zero without a request until a required segment is selected", async () => {
    const states: RecipientCountState[] = [];
    const load = vi.fn(async () => 3);
    const controller = createRecipientCountController({ load, update: (state) => states.push(state) });
    await controller.select(null);
    expect(load).not.toHaveBeenCalled();
    expect(states.at(-1)).toEqual({ status: "ready", count: 0 });
  });

  it("shows a safe error state when counting fails", async () => {
    const states: RecipientCountState[] = [];
    const controller = createRecipientCountController({
      load: async () => { throw new Error("unavailable"); },
      update: (state) => states.push(state),
    });
    await controller.select({ scope: "all" });
    expect(states.at(-1)).toEqual({ status: "error", count: 0 });
  });

  it("ignores a stale response after a fast segment switch", async () => {
    const first = deferred<number>(), second = deferred<number>();
    const states: RecipientCountState[] = [];
    const controller = createRecipientCountController({
      load: (selection: { id: string }) => selection.id === "first" ? first.promise : second.promise,
      update: (state) => states.push(state),
    });

    const firstRequest = controller.select({ id: "first" });
    const secondRequest = controller.select({ id: "second" });
    second.resolve(2);
    await secondRequest;
    first.resolve(9);
    await firstRequest;

    expect(states.at(-1)).toEqual({ status: "ready", count: 2 });
    expect(states).not.toContainEqual({ status: "ready", count: 9 });
  });
});
