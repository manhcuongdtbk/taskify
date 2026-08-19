import { expect } from "vitest";

export const expectLockedRow = (args: {
  // `$queryRaw` mock produced by our `mockDeep<Prisma.TransactionClient>()`.
  queryRaw: { mock: { calls: unknown[][] } };
  table: "Board" | "List";
  id: unknown;
}) => {
  const { queryRaw, table, id } = args;

  expect(queryRaw).toHaveBeenCalledOnce();

  const [query, ...values] = queryRaw.mock.calls[0] ?? [];
  const sql = Array.isArray(query) ? query.join("?") : String(query ?? "");

  expect(sql).toContain(`FROM "${table}"`);
  expect(sql).toContain("FOR UPDATE");
  expect(values).toStrictEqual([id]);
};
