import { Prisma } from "@/app/generated/prisma/client";
import { type DeepMockProxy, mockDeep } from "vitest-mock-extended";

export const mockTxClient = (): DeepMockProxy<Prisma.TransactionClient> =>
  mockDeep<Prisma.TransactionClient>();
