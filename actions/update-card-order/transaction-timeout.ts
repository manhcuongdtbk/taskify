/**
 * Interactive `$transaction` default `timeout` is 5s. Sequential card updates
 * share one adapter-pg connection, so the budget grows with `items.length`.
 * docs/prisma.md
 * https://www.prisma.io/docs/orm/prisma-client/queries/transactions
 */
const INTERACTIVE_TRANSACTION_DEFAULT_TIMEOUT_MS = 5_000;
const CARD_ORDER_COUNT_OVERHEAD_MS = 1_000;
const CARD_ORDER_UPDATE_BUDGET_MS = 250;
const CARD_ORDER_TRANSACTION_TIMEOUT_CEILING_MS = 60_000;

export const cardOrderTransactionTimeoutMs = (itemCount: number) =>
  Math.min(
    CARD_ORDER_TRANSACTION_TIMEOUT_CEILING_MS,
    Math.max(
      INTERACTIVE_TRANSACTION_DEFAULT_TIMEOUT_MS,
      CARD_ORDER_COUNT_OVERHEAD_MS + itemCount * CARD_ORDER_UPDATE_BUDGET_MS,
    ),
  );
