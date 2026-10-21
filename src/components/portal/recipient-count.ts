export type RecipientCountState =
  | { status: "idle"; count: 0 }
  | { status: "loading"; count: 0 }
  | { status: "ready"; count: number }
  | { status: "error"; count: 0 };

export function createRecipientCountController<T>(input: {
  load: (selection: T) => Promise<number>;
  update: (state: RecipientCountState) => void;
}) {
  let latestRequest = 0;

  return {
    async select(selection: T | null) {
      const request = ++latestRequest;
      if (selection === null) {
        input.update({ status: "ready", count: 0 });
        return;
      }

      input.update({ status: "loading", count: 0 });
      try {
        const count = await input.load(selection);
        if (request === latestRequest) input.update({ status: "ready", count });
      } catch {
        if (request === latestRequest) input.update({ status: "error", count: 0 });
      }
    },
    cancel() {
      latestRequest++;
    },
  };
}
