import { expect } from "vitest";

type MockInteractiveTransactionOutcome = "committed" | "rolledBack";

export const mockInteractiveTransaction = <TTxClient>(args: {
  // Vitest mock proxy; we keep the type loose to avoid coupling to Prisma's exact
  // (branded) return types (PrismaPromise vs Promise).
  transactionMock: {
    // Prisma's `$transaction` has complex branded return types. We don't need
    // the exact typing here — just that it has `mockImplementation` that
    // accepts an async callback.
    mockImplementation: (impl: (fn: unknown) => Promise<unknown>) => unknown;
  };
  txClient: TTxClient;
  setLastTransactionOutcome?: (
    outcome: MockInteractiveTransactionOutcome | undefined,
  ) => void;
  errorMessage?: string;
}) => {
  args.setLastTransactionOutcome?.(undefined);

  args.transactionMock.mockImplementation(async (fn: unknown) => {
    if (typeof fn !== "function") {
      throw new Error(args.errorMessage ?? "expected interactive $transaction");
    }

    try {
      const value = await (fn as (tx: TTxClient) => unknown)(args.txClient);
      args.setLastTransactionOutcome?.("committed");
      return value;
    } catch (reason) {
      args.setLastTransactionOutcome?.("rolledBack");
      throw reason;
    }
  });
};

export const expectGlobalClientUnused = (...mocks: unknown[]) => {
  for (const mock of mocks) {
    expect(mock).not.toHaveBeenCalled();
  }
};
